import { getRequiredSupabase } from './supabaseClient';
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

  // Stats & Stock Alerts
  getDashboardStats(): Promise<DashboardStats>;
  getStockAlertCounts(): Promise<{ low: number; out: number }>;
}

// Purge any legacy offline/mock database stores from browser localStorage
try {
  const legacyStoreKeys = [
    'gl_store_products_v2',
    'gl_store_customers_v2',
    'gl_store_suppliers_v2',
    'gl_store_sales_v2',
    'gl_store_purchases_v2',
    'gl_store_expenses_v2',
    'gl_store_movements_v2',
    'gl_ims_products',
    'gl_ims_sales',
    'gl_ims_customers',
    'gl_ims_suppliers',
    'gl_ims_purchases',
    'gl_ims_expenses',
    'gl_ims_inventory_tx'
  ];
  legacyStoreKeys.forEach(k => localStorage.removeItem(k));
} catch {
  // ignore
}

class SupabaseDataServiceImpl implements IDataService {
  /**
   * Enforce authentication gate on every data access route/call.
   */
  private ensureAuthenticated(): void {
    if (!authService.isAuthenticated()) {
      throw new Error('Unauthorized: An active showroom login session is required to access data.');
    }
  }

  private getActiveRole(): 'admin' | 'staff' | null {
    const session = authService.getActiveSession();
    return session?.role || null;
  }

  /**
   * Strict Code-Level Security Gate:
   * Blocks non-admin callers (such as Staff) from viewing or modifying sensitive records.
   */
  private ensureAdminRole(actionDescription: string): void {
    this.ensureAuthenticated();
    const role = this.getActiveRole();
    if (role !== 'admin') {
      throw new Error(`Access Denied: Only showroom administrators are authorized to ${actionDescription}.`);
    }
  }

  // ==========================================
  // PRODUCTS (Live Supabase Cloud Database)
  // ==========================================
  async getProducts(): Promise<Product[]> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getProducts error:', error);
      throw new Error(`Failed to load products from cloud database: ${error.message}`);
    }

    const rawList = (data || []).map(p => this.mapProductFromDb(p));

    // Role-based protection: Redact wholesale cost price from staff
    if (this.getActiveRole() === 'staff') {
      return rawList.map(p => ({
        ...p,
        costPrice: 0,
      }));
    }

    return rawList;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase getProductById error:', error);
      throw new Error(`Failed to load product from cloud database: ${error.message}`);
    }

    if (!data) return undefined;

    const prod = this.mapProductFromDb(data);
    if (this.getActiveRole() === 'staff') {
      return { ...prod, costPrice: 0 };
    }
    return prod;
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

    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('products').insert(this.mapProductToDb(newProduct));
    if (error) {
      console.error('Supabase createProduct error:', error);
      throw new Error(`Failed to create product in cloud database: ${error.message}`);
    }

    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    this.ensureAuthenticated();
    const existing = await this.getProductById(id);
    if (!existing) {
      throw new Error(`Product with ID ${id} not found in cloud database.`);
    }

    const updatedQty = updates.stockQuantity !== undefined ? updates.stockQuantity : existing.stockQuantity;
    const minStock = updates.minStockLevel !== undefined ? updates.minStockLevel : existing.minStockLevel;
    const status = updatedQty <= 0 ? 'out_of_stock' : updatedQty <= minStock ? 'low_stock' : 'in_stock';

    const updatedProduct: Product = {
      ...existing,
      ...updates,
      status,
      updatedAt: new Date().toISOString(),
    };

    const supabase = getRequiredSupabase();
    const { error } = await supabase
      .from('products')
      .update(this.mapProductToDb(updatedProduct))
      .eq('id', id);

    if (error) {
      console.error('Supabase updateProduct error:', error);
      throw new Error(`Failed to update product in cloud database: ${error.message}`);
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteProduct error:', error);
      throw new Error(`Failed to delete product from cloud database: ${error.message}`);
    }
  }

  // ==========================================
  // CUSTOMERS (Live Supabase Cloud Database)
  // ==========================================
  async getCustomers(): Promise<Customer[]> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getCustomers error:', error);
      throw new Error(`Failed to load customers from cloud database: ${error.message}`);
    }

    return (data || []).map(c => this.mapCustomerFromDb(c));
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

    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('customers').insert(this.mapCustomerToDb(customer));
    if (error) {
      console.error('Supabase createCustomer error:', error);
      throw new Error(`Failed to create customer in cloud database: ${error.message}`);
    }

    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();

    const { data: existing, error: getErr } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (getErr || !existing) {
      throw new Error('Customer not found in cloud database.');
    }

    const mapped = this.mapCustomerFromDb(existing);
    const updated = { ...mapped, ...updates };

    const { error } = await supabase
      .from('customers')
      .update(this.mapCustomerToDb(updated))
      .eq('id', id);

    if (error) {
      console.error('Supabase updateCustomer error:', error);
      throw new Error(`Failed to update customer in cloud database: ${error.message}`);
    }

    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteCustomer error:', error);
      throw new Error(`Failed to delete customer from cloud database: ${error.message}`);
    }
  }

  // ==========================================
  // SUPPLIERS (Admin-Only Live Supabase)
  // ==========================================
  async getSuppliers(): Promise<Supplier[]> {
    this.ensureAdminRole('view supplier contacts and trade balances');
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getSuppliers error:', error);
      throw new Error(`Failed to load suppliers from cloud database: ${error.message}`);
    }

    return (data || []).map(s => this.mapSupplierFromDb(s));
  }

  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'balanceDue'>): Promise<Supplier> {
    this.ensureAdminRole('create suppliers');
    const supplier: Supplier = {
      ...data,
      id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
    };

    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('suppliers').insert(this.mapSupplierToDb(supplier));
    if (error) {
      console.error('Supabase createSupplier error:', error);
      throw new Error(`Failed to create supplier in cloud database: ${error.message}`);
    }

    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    this.ensureAdminRole('update supplier profiles');
    const supabase = getRequiredSupabase();

    const { data: existing, error: getErr } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (getErr || !existing) {
      throw new Error('Supplier not found in cloud database.');
    }

    const mapped = this.mapSupplierFromDb(existing);
    const updated = { ...mapped, ...updates };

    const { error } = await supabase
      .from('suppliers')
      .update(this.mapSupplierToDb(updated))
      .eq('id', id);

    if (error) {
      console.error('Supabase updateSupplier error:', error);
      throw new Error(`Failed to update supplier in cloud database: ${error.message}`);
    }

    return updated;
  }

  async deleteSupplier(id: string): Promise<void> {
    this.ensureAdminRole('delete suppliers');
    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteSupplier error:', error);
      throw new Error(`Failed to delete supplier from cloud database: ${error.message}`);
    }
  }

  // ==========================================
  // SALES & POS (Live Supabase Cloud Database)
  // ==========================================
  async getSales(): Promise<Sale[]> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getSales error:', error);
      throw new Error(`Failed to load sales from cloud database: ${error.message}`);
    }

    return (data || []).map(s => this.mapSaleFromDb(s));
  }

  async getSaleById(id: string): Promise<Sale | undefined> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Supabase getSaleById error:', error);
      throw new Error(`Failed to load invoice from cloud database: ${error.message}`);
    }

    return data ? this.mapSaleFromDb(data) : undefined;
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

    const supabase = getRequiredSupabase();

    // 1. Deduct Stock for sold items in Supabase
    for (const item of sale.items) {
      await this.adjustStock(
        item.productId,
        -item.quantity,
        'OUT',
        `Sold on Invoice #${invoiceNumber}`
      );
    }

    // 2. Insert Sale record into Supabase
    const { error } = await supabase.from('sales').insert(this.mapSaleToDb(sale));
    if (error) {
      console.error('Supabase createSale error:', error);
      throw new Error(`Failed to save invoice in cloud database: ${error.message}`);
    }

    // 3. Update customer purchase balance if customerId provided
    if (sale.customerId) {
      try {
        const { data: custRow } = await supabase
          .from('customers')
          .select('*')
          .eq('id', sale.customerId)
          .maybeSingle();

        if (custRow) {
          const customer = this.mapCustomerFromDb(custRow);
          const outstanding = sale.paymentStatus === 'Pending' 
            ? customer.outstandingBalance + sale.grandTotal 
            : customer.outstandingBalance;

          await this.updateCustomer(customer.id, {
            totalPurchases: customer.totalPurchases + sale.grandTotal,
            outstandingBalance: outstanding,
          });
        }
      } catch (err) {
        console.warn('Failed to update customer purchase totals in cloud database:', err);
      }
    }

    return sale;
  }

  // ==========================================
  // PURCHASES (INWARD STOCK - Admin Only)
  // ==========================================
  async getPurchases(): Promise<Purchase[]> {
    this.ensureAdminRole('view supplier purchase orders');
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getPurchases error:', error);
      throw new Error(`Failed to load purchases from cloud database: ${error.message}`);
    }

    return (data || []).map(p => this.mapPurchaseFromDb(p));
  }

  async createPurchase(data: Omit<Purchase, 'id' | 'createdAt' | 'poNumber' | 'status'>): Promise<Purchase> {
    this.ensureAdminRole('create supplier purchase orders');
    const now = new Date().toISOString();
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;
    const purchase: Purchase = {
      ...data,
      id: `po_${Date.now()}`,
      poNumber,
      status: 'Ordered',
      createdAt: now,
    };

    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('purchases').insert(this.mapPurchaseToDb(purchase));
    if (error) {
      console.error('Supabase createPurchase error:', error);
      throw new Error(`Failed to save purchase order in cloud database: ${error.message}`);
    }

    return purchase;
  }

  async receivePurchase(id: string): Promise<Purchase> {
    this.ensureAdminRole('receive inward purchase orders');
    const supabase = getRequiredSupabase();

    const { data: row, error: getErr } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (getErr || !row) {
      throw new Error('Purchase order not found in cloud database.');
    }

    const purchase = this.mapPurchaseFromDb(row);
    if (purchase.status === 'Received') return purchase;

    // Inward stock adjustment for received items in Supabase
    for (const item of purchase.items) {
      await this.adjustStock(
        item.productId,
        item.quantity,
        'IN',
        `Received via Purchase Order #${purchase.poNumber}`
      );
    }

    const updated: Purchase = {
      ...purchase,
      status: 'Received',
      receivedDate: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('purchases')
      .update(this.mapPurchaseToDb(updated))
      .eq('id', id);

    if (error) {
      console.error('Supabase receivePurchase error:', error);
      throw new Error(`Failed to update purchase order in cloud database: ${error.message}`);
    }

    return updated;
  }

  async updatePurchasePaymentStatus(id: string, paymentStatus: 'Paid' | 'Pending' | 'Partial'): Promise<Purchase> {
    this.ensureAdminRole('update purchase order payment statuses');
    const supabase = getRequiredSupabase();

    const { data: row, error: getErr } = await supabase
      .from('purchases')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (getErr || !row) {
      throw new Error('Purchase order not found in cloud database.');
    }

    const purchase = this.mapPurchaseFromDb(row);
    const updated: Purchase = {
      ...purchase,
      paymentStatus,
    };

    const { error } = await supabase
      .from('purchases')
      .update(this.mapPurchaseToDb(updated))
      .eq('id', id);

    if (error) {
      console.error('Supabase updatePurchasePaymentStatus error:', error);
      throw new Error(`Failed to update purchase payment status in cloud database: ${error.message}`);
    }

    return updated;
  }

  // ==========================================
  // EXPENSES (Admin Only - Live Supabase)
  // ==========================================
  async getExpenses(): Promise<Expense[]> {
    this.ensureAdminRole('view showroom expenses');
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getExpenses error:', error);
      throw new Error(`Failed to load expenses from cloud database: ${error.message}`);
    }

    return (data || []).map(e => this.mapExpenseFromDb(e));
  }

  async createExpense(data: Omit<Expense, 'id' | 'createdAt' | 'expenseNumber'>): Promise<Expense> {
    this.ensureAdminRole('record showroom expenses');
    const now = new Date().toISOString();
    const expenseNumber = `EXP-${Date.now().toString().slice(-6)}`;
    const expense: Expense = {
      ...data,
      id: `exp_${Date.now()}`,
      expenseNumber,
      createdAt: now,
    };

    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('expenses').insert(this.mapExpenseToDb(expense));
    if (error) {
      console.error('Supabase createExpense error:', error);
      throw new Error(`Failed to save expense in cloud database: ${error.message}`);
    }

    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    this.ensureAdminRole('delete showroom expenses');
    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteExpense error:', error);
      throw new Error(`Failed to delete expense from cloud database: ${error.message}`);
    }
  }

  // ==========================================
  // STOCK ADJUSTMENTS & MOVEMENTS
  // ==========================================
  async getStockMovements(): Promise<StockMovement[]> {
    this.ensureAuthenticated();
    const supabase = getRequiredSupabase();

    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase getStockMovements error:', error);
      throw new Error(`Failed to load stock movements from cloud database: ${error.message}`);
    }

    return (data || []).map(m => this.mapMovementFromDb(m));
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

    const supabase = getRequiredSupabase();
    const { error } = await supabase.from('stock_movements').insert(this.mapMovementToDb(movement, product.sku));
    if (error) {
      console.warn('Could not record stock movement in cloud database:', error);
    }
  }

  // ==========================================
  // DASHBOARD STATS (Admin Only)
  // ==========================================
  async getDashboardStats(): Promise<DashboardStats> {
    this.ensureAdminRole('view showroom financial dashboard and net profit metrics');
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

  async getStockAlertCounts(): Promise<{ low: number; out: number }> {
    this.ensureAuthenticated();
    const products = await this.getProducts();
    const outCount = products.filter(p => p.stockQuantity <= 0).length;
    const lowCount = products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length;
    return { low: lowCount, out: outCount };
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
      status: 'ACTIVE',
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
