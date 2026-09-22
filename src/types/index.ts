export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  category: string;
  description?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string; // 'pcs' | 'meters' | 'sets' | 'boxes' | 'rolls'
  location?: string; // 'Aisle 3, Rack B'
  supplierId?: string;
  supplierName?: string;
  status: StockStatus;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  totalPurchases: number;
  outstandingBalance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  balanceDue: number;
  paymentTerms?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
  total: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Store Credit';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  taxRate: number; // percentage, e.g. 18 for GST
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  costPrice: number;
  quantity: number;
  unit: string;
  total: number;
}

export type PurchaseStatus = 'Draft' | 'Ordered' | 'Received' | 'Cancelled';

export interface Purchase {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  orderDate: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Showroom Rent'
  | 'Electricity & Utilities'
  | 'Staff Wages'
  | 'Logistics & Freight'
  | 'Marketing & Ads'
  | 'Display & Maintenance'
  | 'Tea & Refreshments'
  | 'Misc Store Supplies';

export interface Expense {
  id: string;
  expenseNumber: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: PaymentMethod;
  paidTo: string;
  date: string;
  notes?: string;
  createdAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'DAMAGE';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType: 'Sale' | 'Purchase' | 'Manual_Audit' | 'Damaged_Stock';
  referenceId: string;
  reason: string;
  date: string;
}

export interface DashboardStats {
  totalInventoryValue: number;
  retailValue: number;
  totalProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  todaySalesTotal: number;
  todayOrdersCount: number;
  monthlySalesTotal: number;
  monthlyExpensesTotal: number;
}

export type UserRole = 'admin' | 'staff';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

export interface UserSession {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  loginTime: string;
}
