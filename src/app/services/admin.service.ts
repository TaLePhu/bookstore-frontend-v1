import api from './api';
import type { ApiBook } from './book.service';

export type AdminOrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED';

export interface AdminDashboardResponse {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalBooks: number;
  };
  revenueData: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  categoryData: Array<{
    name: string;
    value: number;
    count: number;
  }>;
  recentOrders: AdminOrder[];
}

export interface AdminOrder {
  id: string;
  orderCode?: string | null;
  customerName?: string;
  customerEmail?: string | null;
  createdAt: string;
  updatedAt?: string;
  totalItems?: number;
  totalAmount: number;
  status: AdminOrderStatus;
  cancelRequested?: boolean;
}

export interface AdminOrderDetail extends AdminOrder {
  user?: {
    fullName?: string | null;
    userName?: string | null;
    email?: string | null;
  };
  address?: {
    receiverName?: string | null;
    fullName?: string | null;
    phone?: string | null;
    addressLine?: string | null;
    ward?: string | null;
    wardName?: string | null;
    district?: string | null;
    districtName?: string | null;
    city?: string | null;
    provinceName?: string | null;
    country?: string | null;
  } | null;
  items?: Array<{
    id: string;
    quantity: number;
    price: number | string;
    subTotal: number | string;
    book?: ApiBook;
  }>;
  payments?: Array<{
    id: string;
    amount: number | string;
    method: string;
    status: string;
  }>;
  statusLogs?: Array<{
    id: string;
    fromStatus: AdminOrderStatus;
    toStatus: AdminOrderStatus;
    note?: string | null;
    createdAt: string;
    changedByUser?: {
      fullName?: string | null;
      userName?: string | null;
      email?: string | null;
    } | null;
  }>;
}

export interface AdminUser {
  id: string;
  userName: string;
  fullName?: string | null;
  email: string;
  role: string;
  isVerified: boolean;
  isLocked: boolean;
  createdAt: string;
}

export interface AdminCategory {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface AdminCategoryPayload {
  name: string;
  description: string;
}

export interface AdminBookPayload {
  title: string;
  author: string;
  categoryId: string;
  price: string;
  originalPrice: string;
  stock: string;
  isbn: string;
  description: string;
  publisher?: string;
  publishYear?: string;
  pages?: string;
  language?: string;
  releaseDate?: string;
  images?: FileList | File[];
  deleteImageIds?: string[];
}

export const getAdminDashboard = async (): Promise<AdminDashboardResponse> => {
  const res = await api.get('/admin/dashboard');
  return res.data.data;
};

export const getAdminBooks = async (params?: {
  page?: number;
  limit?: number;
  q?: string;
  status?: 'in_stock' | 'out_of_stock';
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}): Promise<{ data: ApiBook[]; total: number }> => {
  const endpoint = params?.q ? '/admin/books/search' : '/admin/books';
  const res = await api.get(endpoint, {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      q: params?.q || undefined,
      status: params?.status,
      include_deleted: params?.includeDeleted ? 'true' : undefined,
      only_deleted: params?.onlyDeleted ? 'true' : undefined,
    },
  });

  return {
    data: res.data.data,
    total: res.data.pagination?.total ?? res.data.data.length,
  };
};

export const getAdminBookDetail = async (id: string): Promise<ApiBook> => {
  const res = await api.get(`/admin/books/${id}`);
  return res.data.data;
};

export const getAdminCategories = async (params?: {
  includeDeleted?: boolean;
  onlyDeleted?: boolean;
}): Promise<AdminCategory[]> => {
  const res = await api.get('/admin/categories', {
    params: {
      include_deleted: params?.includeDeleted ? 'true' : undefined,
      only_deleted: params?.onlyDeleted ? 'true' : undefined,
    },
  });
  return res.data.data;
};

export const createAdminCategory = async (payload: AdminCategoryPayload): Promise<AdminCategory> => {
  const res = await api.post('/admin/categories', payload);
  return res.data.data;
};

export const updateAdminCategory = async (
  id: string,
  payload: AdminCategoryPayload
): Promise<AdminCategory> => {
  const res = await api.put(`/admin/categories/${id}`, payload);
  return res.data.data;
};

export const deleteAdminCategory = async (id: string): Promise<void> => {
  await api.delete(`/admin/categories/${id}`);
};

export const restoreAdminCategory = async (id: string): Promise<void> => {
  await api.patch(`/admin/categories/${id}/restore`);
};

export const hardDeleteAdminCategory = async (id: string): Promise<void> => {
  await api.delete(`/admin/categories/${id}/hard`);
};

const appendBookPayload = (formData: FormData, payload: AdminBookPayload) => {
  const fields: Array<keyof AdminBookPayload> = [
    'title',
    'author',
    'categoryId',
    'price',
    'originalPrice',
    'stock',
    'isbn',
    'description',
    'publisher',
    'publishYear',
    'pages',
    'language',
    'releaseDate',
  ];

  fields.forEach((field) => {
    const value = payload[field];
    if (typeof value === 'string' && value.trim() !== '') {
      formData.append(field, value.trim());
    }
  });

  Array.from(payload.images || []).forEach((file) => {
    formData.append('images', file);
  });

  if (payload.deleteImageIds && payload.deleteImageIds.length > 0) {
    formData.append('deleteImageIds', JSON.stringify(payload.deleteImageIds));
  }
};

export const createAdminBook = async (payload: AdminBookPayload): Promise<ApiBook> => {
  const formData = new FormData();
  appendBookPayload(formData, payload);
  const res = await api.post('/admin/books', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const updateAdminBook = async (id: string, payload: AdminBookPayload): Promise<ApiBook> => {
  const formData = new FormData();
  appendBookPayload(formData, payload);
  const res = await api.put(`/admin/books/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
};

export const deleteAdminBook = async (id: string): Promise<void> => {
  await api.delete(`/admin/books/${id}`);
};

export const restoreAdminBook = async (id: string): Promise<void> => {
  await api.patch(`/admin/books/${id}/restore`);
};

export const hardDeleteAdminBook = async (id: string): Promise<void> => {
  await api.delete(`/admin/books/${id}/hard`);
};

export const getAdminOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: AdminOrderStatus;
}): Promise<{ data: AdminOrder[]; total: number }> => {
  const res = await api.get('/management/orders', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      status: params?.status,
    },
  });

  return {
    data: res.data.data,
    total: res.data.pagination?.total ?? res.data.data.length,
  };
};

export const getAdminOrderDetail = async (id: string): Promise<AdminOrderDetail> => {
  const res = await api.get(`/management/orders/${id}`);
  return res.data.data;
};

export const updateAdminOrderStatus = async (
  id: string,
  status: AdminOrderStatus,
  note?: string
): Promise<AdminOrderDetail> => {
  const res = await api.patch(`/management/orders/${id}/status`, { status, note });
  return res.data.data;
};

export const getAdminCustomers = async (params?: {
  page?: number;
  limit?: number;
  q?: string;
  role?: string;
  isVerified?: boolean;
  isLocked?: boolean;
}): Promise<{ data: AdminUser[]; total: number }> => {
  const res = await api.get('/admin/users', {
    params: {
      role: params?.role || undefined,
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      email: params?.q || undefined,
      full_name: params?.q || undefined,
      is_verified: typeof params?.isVerified === 'boolean' ? String(params.isVerified) : undefined,
      is_locked: typeof params?.isLocked === 'boolean' ? String(params.isLocked) : undefined,
    },
  });

  const payload = res.data.data;
  return {
    data: payload.users,
    total: payload.total,
  };
};

export const updateAdminUserStatus = async (id: string, isLocked: boolean): Promise<AdminUser> => {
  const res = await api.patch(`/admin/users/${id}/status`, { isLocked });
  return res.data.data;
};

export const updateAdminUserRole = async (id: string, role: string): Promise<AdminUser> => {
  const res = await api.patch(`/admin/users/${id}/role`, { role });
  return res.data.data;
};

export const resetAdminUserPassword = async (id: string, newPassword: string): Promise<void> => {
  await api.post(`/admin/users/${id}/reset-password`, { newPassword });
};
