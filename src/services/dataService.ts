import { db } from '../db/localDb';
import { initializeDatabaseSeed } from '../db/seedData';
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

class LocalDataServiceImpl implements IDataService {
  private initialized = false;

  private async ensureInit() {
    if (!this.initialized) {
      await initializeDatabaseSeed();
      this.initialized = true;
    }
  }

  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    await this.ensureInit();
    return await db.products.toArray();
  }

  async getProductById(id: string): Promise<Product | undefined> {
    await this.ensureInit();
    return await db.products.get(id);
  }

  async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Product> {
    await this.ensureInit();
    const id = `prod-${Date.now()}`;
    const now = new Date().toISOString();
    
    let status: Product['status'] = 'in_stock';
    if (data.stockQuantity <= 0) status = 'out_of_stock';
    else if (data.stockQuantity <= data.minStockLevel) status = 'low_stock';

    const product: Product = {
      ...data,
      id,
      status,
      createdAt: now,
      updatedAt: now,
    };

    await db.products.add(product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    await this.ensureInit();
    const existing = await db.products.get(id);
    if (!existing) throw new Error('Product not found');

    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    if (updated.stockQuantity <= 0) updated.status = 'out_of_stock';
    else if (updated.stockQuantity <= updated.minStockLevel) updated.status = 'low_stock';
    else updated.status = 'in_stock';

    await db.products.put(updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.ensureInit();
    await db.products.delete(id);
  }

  // CUSTOMERS
  async getCustomers(): Promise<Customer[]> {
    await this.ensureInit();
    return await db.customers.toArray();
  }

  async createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingBalance'>): Promise<Customer> {
    await this.ensureInit();
    const customer: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      totalPurchases: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
    };
    await db.customers.add(customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    await this.ensureInit();
    const existing = await db.customers.get(id);
    if (!existing) throw new Error('Customer not found');
    const updated = { ...existing, ...updates };
    await db.customers.put(updated);
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await this.ensureInit();
    await db.customers.delete(id);
  }

  // SUPPLIERS
  async getSuppliers(): Promise<Supplier[]> {
    await this.ensureInit();
    return await db.suppliers.toArray();
  }

  async createSupplier(data: Omit<Supplier, 'id' | 'createdAt' | 'balanceDue'>): Promise<Supplier> {
    await this.ensureInit();
    const supplier: Supplier = {
      ...data,
      id: `sup-${Date.now()}`,
      balanceDue: 0,
      createdAt: new Date().toISOString(),
    };
    await db.suppliers.add(supplier);
    return supplier;
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier> {
    await this.ensureInit();
    const existing = await db.suppliers.get(id);
    if (!existing) throw new Error('Supplier not found');
    const updated = { ...existing, ...updates };
    await db.suppliers.put(updated);
    return updated;
  }

  async deleteSupplier(id: string): Promise<void> {
    await this.ensureInit();
    await db.suppliers.delete(id);
  }

  // SALES & POS
  async getSales(): Promise<Sale[]> {
    await this.ensureInit();
    return (await db.sales.toArray()).reverse();
  }

  async getSaleById(id: string): Promise<Sale | undefined> {
    await this.ensureInit();
    return await db.sales.get(id);
  }

  async createSale(data: Omit<Sale, 'id' | 'createdAt' | 'invoiceNumber'>): Promise<Sale> {
    await this.ensureInit();
    const count = await db.sales.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 101).padStart(5, '0')}`;
    const id = `sale-${Date.now()}`;
    const now = new Date().toISOString();

    const sale: Sale = {
      ...data,
      id,
      invoiceNumber,
      createdAt: now,
    };

    // Save Sale
    await db.sales.add(sale);

    // Decrement stock & record movements
    for (const item of sale.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        const prevStock = product.stockQuantity;
        const newStock = Math.max(0, prevStock - item.quantity);
        await this.updateProduct(product.id, { stockQuantity: newStock });

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          type: 'OUT',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: newStock,
          referenceType: 'Sale',
          referenceId: invoiceNumber,
          reason: `Sale to ${sale.customerName}`,
          date: now,
        };
        await db.stockMovements.add(movement);
      }
    }

    // Update customer total purchases
    if (sale.customerId) {
      const customer = await db.customers.get(sale.customerId);
      if (customer) {
        await db.customers.put({
          ...customer,
          totalPurchases: customer.totalPurchases + sale.grandTotal,
        });
      }
    }

    return sale;
  }

  // PURCHASES
  async getPurchases(): Promise<Purchase[]> {
    await this.ensureInit();
    return (await db.purchases.toArray()).reverse();
  }

  async createPurchase(data: Omit<Purchase, 'id' | 'createdAt' | 'poNumber' | 'status'>): Promise<Purchase> {
    await this.ensureInit();
    const count = await db.purchases.count();
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 82).padStart(3, '0')}`;
    const id = `po-${Date.now()}`;
    
    const purchase: Purchase = {
      ...data,
      id,
      poNumber,
      status: 'Ordered',
      createdAt: new Date().toISOString(),
    };

    await db.purchases.add(purchase);
    return purchase;
  }

  async receivePurchase(id: string): Promise<Purchase> {
    await this.ensureInit();
    const purchase = await db.purchases.get(id);
    if (!purchase) throw new Error('Purchase order not found');
    if (purchase.status === 'Received') return purchase;

    const now = new Date().toISOString();
    purchase.status = 'Received';
    purchase.receivedDate = now.split('T')[0];
    await db.purchases.put(purchase);

    // Inward stock into inventory
    for (const item of purchase.items) {
      const product = await db.products.get(item.productId);
      if (product) {
        const prev = product.stockQuantity;
        const next = prev + item.quantity;
        await this.updateProduct(product.id, { stockQuantity: next, costPrice: item.costPrice });

        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          productName: product.name,
          type: 'IN',
          quantity: item.quantity,
          previousStock: prev,
          newStock: next,
          referenceType: 'Purchase',
          referenceId: purchase.poNumber,
          reason: `Stock inward from PO ${purchase.poNumber}`,
          date: now,
        };
        await db.stockMovements.add(movement);
      }
    }

    return purchase;
  }

  // EXPENSES
  async getExpenses(): Promise<Expense[]> {
    await this.ensureInit();
    return (await db.expenses.toArray()).reverse();
  }

  async createExpense(data: Omit<Expense, 'id' | 'createdAt' | 'expenseNumber'>): Promise<Expense> {
    await this.ensureInit();
    const count = await db.expenses.count();
    const expenseNumber = `EXP-${new Date().getFullYear()}-${String(count + 44).padStart(4, '0')}`;
    const id = `exp-${Date.now()}`;

    const expense: Expense = {
      ...data,
      id,
      expenseNumber,
      createdAt: new Date().toISOString(),
    };

    await db.expenses.add(expense);
    return expense;
  }

  async deleteExpense(id: string): Promise<void> {
    await this.ensureInit();
    await db.expenses.delete(id);
  }

  // STOCK ADJUSTMENT
  async getStockMovements(): Promise<StockMovement[]> {
    await this.ensureInit();
    return (await db.stockMovements.toArray()).reverse();
  }

  async adjustStock(productId: string, quantityChange: number, type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE', reason: string): Promise<void> {
    await this.ensureInit();
    const product = await db.products.get(productId);
    if (!product) throw new Error('Product not found');

    const prev = product.stockQuantity;
    let next = prev;
    if (type === 'IN') next = prev + quantityChange;
    else if (type === 'OUT' || type === 'DAMAGE') next = Math.max(0, prev - quantityChange);
    else next = Math.max(0, quantityChange); // exact adjustment

    await this.updateProduct(productId, { stockQuantity: next });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      type,
      quantity: Math.abs(next - prev),
      previousStock: prev,
      newStock: next,
      referenceType: type === 'DAMAGE' ? 'Damaged_Stock' : 'Manual_Audit',
      referenceId: `ADJ-${Date.now().toString().slice(-4)}`,
      reason,
      date: new Date().toISOString(),
    };
    await db.stockMovements.add(movement);
  }

  // DASHBOARD STATS
  async getDashboardStats(): Promise<DashboardStats> {
    await this.ensureInit();
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const expenses = await db.expenses.toArray();

    let totalInventoryValue = 0;
    let retailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalInventoryValue += p.costPrice * p.stockQuantity;
      retailValue += p.sellingPrice * p.stockQuantity;
      if (p.stockQuantity === 0) outOfStockCount++;
      else if (p.stockQuantity <= p.minStockLevel) lowStockCount++;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr));
    const todaySalesTotal = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

    const monthlySalesTotal = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const monthlyExpensesTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

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
    await db.delete();
    await db.open();
    this.initialized = false;
    await this.ensureInit();
  }
}

// Active singleton service
export const dataService: IDataService = new LocalDataServiceImpl();
