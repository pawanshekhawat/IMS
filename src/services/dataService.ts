import { getSupabase } from './supabaseClient';
import { authService } from './authService';
import type { 
  Product, 
  Customer, 
  Supplier, 
  Sale, 
  Purchase, 
  Expense, 
  StockMovement, 
  DashboardStats 
} from '../types';

export interface IDataService {
  // Products
  getProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Product>;
  updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingBalance'>): Promise<Customer>;
  updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;

  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'balanceDue'>): Promise<Supplier>;
  updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier>;
  deleteSupplier(id: string): Promise<void>;

  // Sales & POS
  getSales(): Promise<Sale[]>;
  getSaleById(id: string): Promise<Sale | undefined>;
  createSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber'>): Promise<Sale>;

  // Purchases
  getPurchases(): Promise<Purchase[]>;
  createPurchase(purchaseData: Omit<Purchase, 'id' | 'createdAt' | 'poNumber' | 'status'>): Promise<Purchase>;
  receivePurchase(id: string): Promise<Purchase>;
  updatePurchasePaymentStatus(id: string, paymentStatus: 'Paid' | 'Pending' | 'Partial'): Promise<Purchase>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'expenseNumber'>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  // Stock Adjustments
  getStockMovements(): Promise<StockMovement[]>;
  adjustStock(productId: string, quantityChange: number, type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE', reason: string): Promise<void>;

  // Stats
  getDashboardStats(): Promise<DashboardStats>;
  resetToSampleData(): Promise<void>;
}

// Memory / Local clean store keys for clean 0-state offline fallback
const STORAGE_KEYS = {
  PRODUCTS: 'gl_store_products_v2',
  CUSTOMERS: 'gl_store_customers_v2',
  SUPPLIERS: 'gl_store_suppliers_v2',
  SALES: 'gl_store_sales_v2',
  PURCHASES: 'gl_store_purchases_v2',
  EXPENSES: 'gl_store_expenses_v2',
  MOVEMENTS: 'gl_store_movements_v2',
};

class SupabaseDataServiceImpl implements IDataService {
  /**
   * Enforce authentication gate on every data access route/call.
   * If not logged in, reject access immediately.
   */
  private ensureAuthenticated(): void {
    if (!authService.isAuthenticated()) {
      throw new Error('Unauthorized: An active showroom login session is required to access data.');
    }
  }

  // --- Clean local fallbacks (all start at 0 / empty array) ---
  private getLocalList<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveLocalList<T>(key: string, list: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save clean local data', e);
    }
  }

  // ==========================================
  // PRODUCTS
  // ==========================================
  async getProducts(): Promise<Product[]> {
    this.ensureAuthenticated();
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase getProducts error:', error);
        return this.getLocalList<Product>(STORAGE_KEYS.PRODUCTS);
      }

      return (data || []).map(p => this.mapProductFromDb(p));
    }

    return this.getLocalList<Product>(STORAGE_KEYS.PRODUCTS);
  }

  async getProductById(id: string): Promise<Product | undefined> {
    this.ensureAuthenticated();
    const supabase = getSupabase();

    if (supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (!error && data) {
        return this.mapProductFromDb(data);
      }
    }

    const list = this.getLocalList<Product>(STORAGE_KEYS.PRODUCTS);
    return list.find(p => p.id === id);
  }

  async createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Product> {
    this.ensureAuthenticated();
    const now = new Date().toISOString();
    const id = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const status = productData.stockQuantity <= 0 ? 'out_of_stock' : productData.stockQuantity <= productData.minStockLevel ? 'low_stock' : 'in_stock';

    const newProduct: Product = {
      ...productData,
      id,
      status,
      createdAt: now,
      updatedAt: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').insert(this.mapProductToDb(newProduct));
      if (error) {
        console.error('Supabase createProduct error:', error);
      }
    }

    const list = this.getLocalList<Product>(STORAGE_KEYS.PRODUCTS);
    list.unshift(newProduct);
    this.saveLocalList(STORAGE_KEYS.PRODUCTS, list);

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    this.ensureAuthenticated();
    const now = new Date().toISOString();

    const list = this.getLocalList<Product>(STORAGE_KEYS.PRODUCTS);
    const index = list.findIndex(p => p.id === id);
    const existing = index >= 0 ? list[index] : (await this.getProductById(id));

    if (!existing) {
      throw new Error(`Product with ID ${id} not found.`);
    }

    const updatedQty = updates.stockQuantity !== undefined ? updates.stockQuantity : existing.stockQuantity;
    const minStock = updates.minStockLevel !== undefined ? updates.minStockLevel : existing.minStockLevel;
    const status = updatedQty <= 0 ? 'out_of_stock' : updatedQty <= minStock ? 'low_stock' : 'in_stock';

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      status,
      updatedAt: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from('products')
        .update(this.mapProductToDb(updatedProduct))
        .eq('id', id);
      if (error) console.error('Supabase updateProduct error:', error);
    }

    if (index >= 0) {
      list[index] = updatedProduct;
      this.saveLocalList(STORAGE_KEYS.PRODUCTS, list);
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.error('Supabase deleteProduct error:', error);
    }

    const list = this.getLocalList<Product>(STORAGE_KEYS.PRODUCTS);
    this.saveLocalList(STORAGE_KEYS.PRODUCTS, list.filter(p => p.id !== id));
  }

  // ==========================================
  // CUSTOMERS
  // ==========================================
  async getCustomers(): Promise<Customer[]> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(c => this.mapCustomerFromDb(c));
      }
    }
    return this.getLocalList<Customer>(STORAGE_KEYS.CUSTOMERS);
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingBalance'>): Promise<Customer> {
    this.ensureAuthenticated();
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      totalPurchases: 0,
      outstandingBalance: 0,
      createdAt: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('customers').insert(this.mapCustomerToDb(customer));
    }

    const list = this.getLocalList<Customer>(STORAGE_KEYS.CUSTOMERS);
    list.unshift(customer);
    this.saveLocalList(STORAGE_KEYS.CUSTOMERS, list);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    this.ensureAuthenticated();
    const list = this.getLocalList<Customer>(STORAGE_KEYS.CUSTOMERS);
    const existing = list.find(c => c.id === id);
    if (!existing) throw new Error('Customer not found');

    const updated = { ...existing, ...updates };
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('customers').update(this.mapCustomerToDb(updated)).eq('id', id);
    }

    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) list[idx] = updated;
    this.saveLocalList(STORAGE_KEYS.CUSTOMERS, list);
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('customers').delete().eq('id', id);
    }
    const list = this.getLocalList<Customer>(STORAGE_KEYS.CUSTOMERS);
    this.saveLocalList(STORAGE_KEYS.CUSTOMERS, list.filter(c => c.id !== id));
  }

  // ==========================================
  // SUPPLIERS
  // ==========================================
  async getSuppliers(): Promise<Supplier[]> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('suppliers').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(s => this.mapSupplierFromDb(s));
      }
    }
    return this.getLocalList<Supplier>(STORAGE_KEYS.SUPPLIERS);
  }

  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'balanceDue'>): Promise<Supplier> {
    this.ensureAuthenticated();
    const supplier: Supplier = {
      ...data,
      id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('suppliers').insert(this.mapSupplierToDb(supplier));
    }

    const list = this.getLocalList<Supplier>(STORAGE_KEYS.SUPPLIERS);
    list.unshift(supplier);
    this.saveLocalList(STORAGE_KEYS.SUPPLIERS, list);
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    this.ensureAuthenticated();
    const list = this.getLocalList<Supplier>(STORAGE_KEYS.SUPPLIERS);
    const existing = list.find(s => s.id === id);
    if (!existing) throw new Error('Supplier not found');

    const updated = { ...existing, ...updates };
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('suppliers').update(this.mapSupplierToDb(updated)).eq('id', id);
    }

    const idx = list.findIndex(s => s.id === id);
    if (idx >= 0) list[idx] = updated;
    this.saveLocalList(STORAGE_KEYS.SUPPLIERS, list);
    return updated;
  }

  async deleteSupplier(id: string): Promise<void> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('suppliers').delete().eq('id', id);
    }
    const list = this.getLocalList<Supplier>(STORAGE_KEYS.SUPPLIERS);
    this.saveLocalList(STORAGE_KEYS.SUPPLIERS, list.filter(s => s.id !== id));
  }

  // ==========================================
  // SALES & INVOICING
  // ==========================================
  async getSales(): Promise<Sale[]> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('sales').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(s => this.mapSaleFromDb(s));
      }
    }
    return this.getLocalList<Sale>(STORAGE_KEYS.SALES);
  }

  async getSaleById(id: string): Promise<Sale | undefined> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('sales').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return this.mapSaleFromDb(data);
      }
    }
    const list = this.getLocalList<Sale>(STORAGE_KEYS.SALES);
    return list.find(s => s.id === id);
  }

  async createSale(saleData: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber'>): Promise<Sale> {
    this.ensureAuthenticated();
    const now = new Date().toISOString();
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const sale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}`,
      invoiceNumber,
      createdAt: now,
    };

    // 1. Deduct Stock for sold items & log movements
    for (const item of sale.items) {
      await this.adjustStock(
        item.productId,
        -item.quantity,
        'OUT',
        `Sold on Invoice #${invoiceNumber}`
      );
    }

    // 2. Save Sale
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('sales').insert(this.mapSaleToDb(sale));
    }

    const list = this.getLocalList<Sale>(STORAGE_KEYS.SALES);
    list.unshift(sale);
    this.saveLocalList(STORAGE_KEYS.SALES, list);

    // 3. Update customer purchase balance if customerId provided
    if (sale.customerId) {
      try {
        const customer = (await this.getCustomers()).find(c => c.id === sale.customerId);
        if (customer) {
          const outstanding = sale.paymentStatus === 'Pending' ? customer.outstandingBalance + sale.grandTotal : customer.outstandingBalance;
          await this.updateCustomer(customer.id, {
            totalPurchases: customer.totalPurchases + sale.grandTotal,
            outstandingBalance: outstanding,
          });
        }
      } catch (err) {
        console.warn('Failed to update customer purchase totals:', err);
      }
    }

    return sale;
  }

  // ==========================================
  // PURCHASES (INWARD STOCK)
  // ==========================================
  async getPurchases(): Promise<Purchase[]> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('purchases').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(p => this.mapPurchaseFromDb(p));
      }
    }
    return this.getLocalList<Purchase>(STORAGE_KEYS.PURCHASES);
  }

  async createPurchase(data: Omit<Purchase, 'id' | 'createdAt' | 'poNumber' | 'status'>): Promise<Purchase> {
    this.ensureAuthenticated();
    const now = new Date().toISOString();
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const purchase: Purchase = {
      ...data,
      id: `po_${Date.now()}`,
      poNumber,
      status: 'Ordered',
      createdAt: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('purchases').insert(this.mapPurchaseToDb(purchase));
    }

    const list = this.getLocalList<Purchase>(STORAGE_KEYS.PURCHASES);
    list.unshift(purchase);
    this.saveLocalList(STORAGE_KEYS.PURCHASES, list);

    return purchase;
  }

  async receivePurchase(id: string): Promise<Purchase> {
    this.ensureAuthenticated();
    const purchases = await this.getPurchases();
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) throw new Error('Purchase order not found');

    if (purchase.status === 'Received') {
      return purchase;
    }

    // Inward stock adjustment for each item
    for (const item of purchase.items) {
      await this.adjustStock(
        item.productId,
        item.quantity,
        'IN',
        `Stock inward from PO #${purchase.poNumber}`
      );
    }

    const now = new Date().toISOString();
    const updated: Purchase = {
      ...purchase,
      status: 'Received',
      receivedDate: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('purchases').update(this.mapPurchaseToDb(updated)).eq('id', id);
    }

    const list = this.getLocalList<Purchase>(STORAGE_KEYS.PURCHASES);
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) list[idx] = updated;
    this.saveLocalList(STORAGE_KEYS.PURCHASES, list);

    return updated;
  }

  async updatePurchasePaymentStatus(id: string, paymentStatus: 'Paid' | 'Pending' | 'Partial'): Promise<Purchase> {
    this.ensureAuthenticated();
    const purchases = await this.getPurchases();
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) throw new Error('Purchase order not found');

    const updated: Purchase = { ...purchase, paymentStatus };
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('purchases').update({ payment_status: paymentStatus }).eq('id', id);
    }

    const list = this.getLocalList<Purchase>(STORAGE_KEYS.PURCHASES);
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) list[idx] = updated;
    this.saveLocalList(STORAGE_KEYS.PURCHASES, list);

    return updated;
  }

  // ==========================================
  // EXPENSES
  // ==========================================
  async getExpenses(): Promise<Expense[]> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('expenses').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(e => this.mapExpenseFromDb(e));
      }
    }
    return this.getLocalList<Expense>(STORAGE_KEYS.EXPENSES);
  }

  async createExpense(data: Omit<Expense, 'id' | 'createdAt' | 'expenseNumber'>): Promise<Expense> {
    this.ensureAuthenticated();
    const now = new Date().toISOString();
    const expenseNumber = `EXP-${Date.now().toString().slice(-6)}`;
    const expense: Expense = {
      ...data,
      id: `exp_${Date.now()}`,
      expenseNumber,
      createdAt: now,
    };

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('expenses').insert(this.mapExpenseToDb(expense));
    }

    const list = this.getLocalList<Expense>(STORAGE_KEYS.EXPENSES);
    list.unshift(expense);
    this.saveLocalList(STORAGE_KEYS.EXPENSES, list);

    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('expenses').delete().eq('id', id);
    }
    const list = this.getLocalList<Expense>(STORAGE_KEYS.EXPENSES);
    this.saveLocalList(STORAGE_KEYS.EXPENSES, list.filter(e => e.id !== id));
  }

  // ==========================================
  // STOCK ADJUSTMENTS & MOVEMENTS
  // ==========================================
  async getStockMovements(): Promise<StockMovement[]> {
    this.ensureAuthenticated();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('stock_movements').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(m => this.mapMovementFromDb(m));
      }
    }
    return this.getLocalList<StockMovement>(STORAGE_KEYS.MOVEMENTS);
  }

  async adjustStock(
    productId: string,
    quantityChange: number,
    type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE',
    reason: string
  ): Promise<void> {
    this.ensureAuthenticated();
    const product = await this.getProductById(productId);
    if (!product) return;

    const previousStock = product.stockQuantity;
    const newStock = Math.max(0, previousStock + quantityChange);

    await this.updateProduct(productId, { stockQuantity: newStock });

    const movement: StockMovement = {
      id: `mvt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productId,
      productName: product.name,
      type,
      quantity: Math.abs(quantityChange),
      previousStock,
      newStock,
      referenceType: type === 'IN' ? 'Purchase' : type === 'OUT' ? 'Sale' : type === 'DAMAGE' ? 'Damaged_Stock' : 'Manual_Audit',
      referenceId: '',
      reason,
      date: new Date().toISOString(),
    };

    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('stock_movements').insert(this.mapMovementToDb(movement, product.sku));
    }

    const list = this.getLocalList<StockMovement>(STORAGE_KEYS.MOVEMENTS);
    list.unshift(movement);
    this.saveLocalList(STORAGE_KEYS.MOVEMENTS, list);
  }

  // ==========================================
  // DASHBOARD STATS (Clean 0 Baseline)
  // ==========================================
  async getDashboardStats(): Promise<DashboardStats> {
    this.ensureAuthenticated();
    const products = await this.getProducts();
    const sales = await this.getSales();
    const expenses = await this.getExpenses();

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
    const todaySalesTotal = todaySales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);

    const monthlySalesTotal = sales.reduce((acc, s) => acc + (s.grandTotal || 0), 0);
    const monthlyExpensesTotal = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    const totalInventoryValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);
    const retailValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.sellingPrice), 0);

    const outOfStockCount = products.filter(p => p.stockQuantity <= 0).length;
    const lowStockCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length;

    return {
      totalInventoryValue,
      retailValue,
      totalProductsCount: products.length,
      lowStockCount,
      outOfStockCount,
      todaySalesTotal,
      todayOrdersCount: todaySales.length,
      monthlySalesTotal,
      monthlyExpensesTotal,
    };
  }

  async resetToSampleData(): Promise<void> {
    this.ensureAuthenticated();
    // Reset all tables to clean 0
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  }

  // ==========================================
  // DATABASE MAPPER HELPERS (CamelCase <-> Snake_Case)
  // ==========================================
  private mapProductFromDb(row: any): Product {
    const qty = row.stock_quantity ?? 0;
    const min = row.min_stock_threshold ?? 5;
    return {
      id: row.id,
      name: row.name,
      sku: row.sku,
      barcode: row.barcode || '',
      category: row.category || 'General',
      costPrice: Number(row.cost_price || 0),
      sellingPrice: Number(row.selling_price || 0),
      stockQuantity: qty,
      minStockLevel: min,
      unit: 'pcs',
      location: row.shelf_location || '',
      imageUrl: row.photo_url || '',
      status: qty <= 0 ? 'out_of_stock' : qty <= min ? 'low_stock' : 'in_stock',
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  }

  private mapProductToDb(p: Product): any {
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      cost_price: p.costPrice,
      selling_price: p.sellingPrice,
      stock_quantity: p.stockQuantity,
      min_stock_threshold: p.minStockLevel,
      shelf_location: p.location,
      photo_url: p.imageUrl,
      status: p.status === 'out_of_stock' || p.status === 'low_stock' ? 'ACTIVE' : 'ACTIVE',
      updated_at: new Date().toISOString(),
    };
  }

  private mapCustomerFromDb(row: any): Customer {
    return {
      id: row.id,
      name: row.name,
      phone: row.phone || '',
      email: row.email,
      address: row.address,
      gstin: row.gstin,
      totalPurchases: Number(row.total_purchases || 0),
      outstandingBalance: Number(row.outstanding_balance || 0),
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  private mapCustomerToDb(c: Customer): any {
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      gstin: c.gstin,
      total_purchases: c.totalPurchases,
      outstanding_balance: c.outstandingBalance,
    };
  }

  private mapSupplierFromDb(row: any): Supplier {
    return {
      id: row.id,
      name: row.name,
      contactPerson: row.contact_person || '',
      phone: row.phone || '',
      email: row.email,
      address: row.address,
      gstin: row.gstin,
      balanceDue: Number(row.balance_due || 0),
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  private mapSupplierToDb(s: Supplier): any {
    return {
      id: s.id,
      name: s.name,
      contact_person: s.contactPerson,
      phone: s.phone,
      email: s.email,
      address: s.address,
      gstin: s.gstin,
      balance_due: s.balanceDue,
    };
  }

  private mapSaleFromDb(row: any): Sale {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      customerId: row.customer_id,
      customerName: row.customer_name,
      items: Array.isArray(row.items) ? row.items : [],
      subtotal: Number(row.subtotal || 0),
      taxRate: 18,
      taxAmount: Number(row.tax_amount || 0),
      discountAmount: Number(row.discount || 0),
      grandTotal: Number(row.total_amount || 0),
      paymentMethod: row.payment_method || 'UPI',
      paymentStatus: row.payment_status || 'Paid',
      notes: row.notes,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  private mapSaleToDb(s: Sale): any {
    return {
      id: s.id,
      invoice_number: s.invoiceNumber,
      customer_id: s.customerId || null,
      customer_name: s.customerName,
      subtotal: s.subtotal,
      discount: s.discountAmount,
      tax_amount: s.taxAmount,
      total_amount: s.grandTotal,
      payment_method: s.paymentMethod,
      payment_status: s.paymentStatus,
      items: s.items,
      notes: s.notes,
      cashier_name: 'Counter Staff',
    };
  }

  private mapPurchaseFromDb(row: any): Purchase {
    return {
      id: row.id,
      poNumber: row.po_number,
      supplierId: row.supplier_id,
      supplierName: row.supplier_name,
      items: Array.isArray(row.items) ? row.items : [],
      totalAmount: Number(row.total_amount || 0),
      status: row.status === 'RECEIVED' ? 'Received' : 'Ordered',
      paymentStatus: row.payment_status || 'Pending',
      orderDate: row.created_at,
      receivedDate: row.received_at,
      notes: row.notes,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  private mapPurchaseToDb(p: Purchase): any {
    return {
      id: p.id,
      po_number: p.poNumber,
      supplier_id: p.supplierId,
      supplier_name: p.supplierName,
      items: p.items,
      total_amount: p.totalAmount,
      payment_status: p.paymentStatus,
      status: p.status === 'Received' ? 'RECEIVED' : 'ORDERED',
      received_at: p.receivedDate || null,
      notes: p.notes,
    };
  }

  private mapExpenseFromDb(row: any): Expense {
    return {
      id: row.id,
      expenseNumber: row.expense_number,
      title: row.title,
      category: row.category as any,
      amount: Number(row.amount || 0),
      paymentMethod: row.payment_method || 'Cash',
      paidTo: '',
      date: row.date || row.created_at,
      notes: row.notes,
      createdAt: row.created_at || new Date().toISOString(),
    };
  }

  private mapExpenseToDb(e: Expense): any {
    return {
      id: e.id,
      expense_number: e.expenseNumber,
      title: e.title,
      category: e.category,
      amount: e.amount,
      payment_method: e.paymentMethod,
      date: e.date,
      notes: e.notes,
    };
  }

  private mapMovementFromDb(row: any): StockMovement {
    return {
      id: row.id,
      productId: row.product_id,
      productName: row.product_name,
      type: row.type,
      quantity: row.quantity_change,
      previousStock: row.previous_quantity,
      newStock: row.new_quantity,
      referenceType: 'Manual_Audit',
      referenceId: row.reference_id || '',
      reason: row.reason || '',
      date: row.created_at || new Date().toISOString(),
    };
  }

  private mapMovementToDb(m: StockMovement, sku: string = ''): any {
    return {
      id: m.id,
      product_id: m.productId,
      product_name: m.productName,
      product_sku: sku,
      type: m.type,
      quantity_change: m.quantity,
      previous_quantity: m.previousStock,
      new_quantity: m.newStock,
      reference_id: m.referenceId || null,
      reason: m.reason,
    };
  }
}

export const dataService: IDataService = new SupabaseDataServiceImpl();
