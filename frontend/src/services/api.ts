import axios from 'axios';
import type {
  ApiResponse,
  User,
  Customer,
  Product,
  StockMovement,
  Challan,
  DashboardStats,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization Bearer token if present in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor for handling 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  register: async (name: string, email: string, password: string, role: string = 'SALES') => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', {
      name,
      email,
      password,
      role,
    });
    return res.data;
  },
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
  updateProfile: async (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => {
    const res = await api.put<ApiResponse<{ token: string; user: User }>>('/auth/profile', data);
    return res.data;
  },
};

// Admin User Management Endpoints
export const userApi = {
  getUsers: async () => {
    const res = await api.get<ApiResponse<User[]>>('/users');
    return res.data;
  },
  createUser: async (data: { name: string; email: string; password: string; role: string }) => {
    const res = await api.post<ApiResponse<User>>('/users', data);
    return res.data;
  },
  resetPassword: async (id: string, newPassword: string) => {
    const res = await api.put<ApiResponse<any>>(`/users/${id}/reset-password`, { newPassword });
    return res.data;
  },
  deleteUser: async (id: string) => {
    const res = await api.delete<ApiResponse<any>>(`/users/${id}`);
    return res.data;
  },
};

// Customer CRM Endpoints
export const customerApi = {
  getCustomers: async (params?: { search?: string; status?: string; customerType?: string; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return res.data;
  },
  getCustomerById: async (id: string) => {
    const res = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return res.data;
  },
  createCustomer: async (data: Partial<Customer>) => {
    const res = await api.post<ApiResponse<Customer>>('/customers', data);
    return res.data;
  },
  updateCustomer: async (id: string, data: Partial<Customer>) => {
    const res = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return res.data;
  },
  deleteCustomer: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/customers/${id}`);
    return res.data;
  },
  addFollowUp: async (id: string, notes: string, followUpDate: string) => {
    const res = await api.post<ApiResponse<any>>(`/customers/${id}/follow-up`, { notes, followUpDate });
    return res.data;
  },
  getFollowUps: async (id: string) => {
    const res = await api.get<ApiResponse<any[]>>(`/customers/${id}/follow-ups`);
    return res.data;
  },
};

// Product & Inventory Endpoints
export const productApi = {
  getProducts: async (params?: { search?: string; category?: string; lowStock?: boolean; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<Product[]>>('/products', { params });
    return res.data;
  },
  getProductById: async (id: string) => {
    const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data;
  },
  createProduct: async (data: Partial<Product>) => {
    const res = await api.post<ApiResponse<Product>>('/products', data);
    return res.data;
  },
  updateProduct: async (id: string, data: Partial<Product>) => {
    const res = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return res.data;
  },
  deleteProduct: async (id: string) => {
    const res = await api.delete<ApiResponse<null>>(`/products/${id}`);
    return res.data;
  },
};

// Stock Movements Endpoints
export const stockApi = {
  getStockMovements: async (params?: { productId?: string; movementType?: string; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<StockMovement[]>>('/stock-movements', { params });
    return res.data;
  },
  adjustStock: async (data: { productId: string; quantity: number; movementType: 'IN' | 'OUT'; reason: string }) => {
    const res = await api.post<ApiResponse<StockMovement>>('/stock-movements', data);
    return res.data;
  },
};

// Challans Endpoints
export const challanApi = {
  getChallans: async (params?: { search?: string; status?: string; customerId?: string; page?: number; limit?: number }) => {
    const res = await api.get<ApiResponse<Challan[]>>('/challans', { params });
    return res.data;
  },
  getChallanById: async (id: string) => {
    const res = await api.get<ApiResponse<Challan>>(`/challans/${id}`);
    return res.data;
  },
  createChallan: async (data: { customerId: string; items: { productId: string; quantity: number }[]; status?: 'DRAFT' | 'CONFIRMED' }) => {
    const res = await api.post<ApiResponse<Challan>>('/challans', data);
    return res.data;
  },
  confirmChallan: async (id: string) => {
    const res = await api.post<ApiResponse<Challan>>(`/challans/${id}/confirm`);
    return res.data;
  },
  cancelChallan: async (id: string) => {
    const res = await api.post<ApiResponse<Challan>>(`/challans/${id}/cancel`);
    return res.data;
  },
};

// Dashboard Endpoints
export const dashboardApi = {
  getStats: async () => {
    const res = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return res.data;
  },
};
