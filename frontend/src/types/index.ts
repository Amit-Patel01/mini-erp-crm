export type Role = 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
export type CustomerType = 'RETAIL' | 'WHOLESALE' | 'DISTRIBUTOR';
export type CustomerStatus = 'LEAD' | 'ACTIVE' | 'INACTIVE';
export type MovementType = 'IN' | 'OUT';
export type ChallanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
}

export interface FollowUp {
  id: string;
  customerId: string;
  notes: string;
  followUpDate: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  customerName: string;
  mobile: string;
  email?: string | null;
  businessName: string;
  gstNumber?: string | null;
  customerType: CustomerType;
  address: string;
  status: CustomerStatus;
  followUpDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    followUps: number;
    challans: number;
  };
  followUps?: FollowUp[];
  challans?: Challan[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  warehouse: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  movementType: MovementType;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface ChallanItem {
  id?: string;
  challanId?: string;
  productId: string;
  productName: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
    currentStock: number;
  };
}

export interface Challan {
  id: string;
  challanNumber: string;
  customerId: string;
  customer?: {
    id: string;
    customerName: string;
    businessName: string;
    mobile: string;
    email?: string | null;
    address?: string;
    gstNumber?: string | null;
  };
  totalQuantity: number;
  totalAmount: number;
  status: ChallanStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: ChallanItem[];
}

export interface DashboardStats {
  metrics: {
    totalCustomers: number;
    totalProducts: number;
    lowStockCount: number;
    draftChallans: number;
    confirmedChallans: number;
    todayFollowUpsCount: number;
    totalRevenue: number;
  };
  followUpsDueToday: Customer[];
  lowStockProducts: Product[];
  recentChallans: Challan[];
  recentStockMovements: StockMovement[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: Pagination;
  available?: number;
  requested?: number;
}
