import Dexie, { type Table } from 'dexie';
import type { 
  Product, 
  Customer, 
  Supplier, 
  Sale, 
  Purchase, 
  Expense, 
  StockMovement 
} from '../types';

export class IMSDatabase extends Dexie {
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  suppliers!: Table<Supplier, string>;
  sales!: Table<Sale, string>;
  purchases!: Table<Purchase, string>;
  expenses!: Table<Expense, string>;
  stockMovements!: Table<StockMovement, string>;

  constructor() {
    super('GarhwalLightsIMS');
    this.version(1).stores({
      products: 'id, sku, barcode, name, category, status, supplierId',
      customers: 'id, name, phone, email',
      suppliers: 'id, name, contactPerson, phone',
      sales: 'id, invoiceNumber, customerId, paymentMethod, paymentStatus, createdAt',
      purchases: 'id, poNumber, supplierId, status, createdAt',
      expenses: 'id, expenseNumber, category, date',
      stockMovements: 'id, productId, type, referenceId, date'
    });
  }
}

export const db = new IMSDatabase();
