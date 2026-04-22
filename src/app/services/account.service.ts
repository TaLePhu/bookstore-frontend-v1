import api from '../utils/api';

export interface UserProfile {
  id: string;
  userName: string;
  email: string;
  fullName?: string;
  role?: string;
  isVerified?: boolean;
  avatar?: string;
  dob?: string;
  gender?: string;
  phone?: string;
  createdAt?: string;
}

export interface AddressItem {
  id: string;
  receiverName: string;
  phone: string;
  addressLine: string;
  country?: string;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface OrderItemDto {
  id: string;
  quantity: number;
  price: number | string;
  subTotal: number | string;
  bookId: string;
  book?: {
    id: string;
    title: string;
    author: string;
    image?: string;
    images?: Array<string | { imageUrl?: string; url?: string }>;
  };
}

export interface PaymentDto {
  id: string;
  amount: number | string;
  method: string;
  status: string;
}

export interface OrderDto {
  id: string;
  totalAmount: number | string;
  shippingFee: number | string;
  note?: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  address?: AddressItem;
  addressId?: string;
  items: OrderItemDto[];
  payments?: PaymentDto[];
}

export interface MyOrdersResponse {
  orders: OrderDto[];
  total: number;
  page: number;
  limit: number;
}

export const getMyProfile = async (): Promise<UserProfile> => {
  const res = await api.get('/users/me');
  return res.data.data;
};

export const updateMyProfile = async (payload: Partial<UserProfile>) => {
  const res = await api.patch('/users/me', payload);
  return res.data.data;
};

export const getMyOrders = async (page = 1, limit = 10): Promise<MyOrdersResponse> => {
  const res = await api.get('/orders/my', {
    params: { page, limit },
  });
  return res.data.data;
};

export const getOrderById = async (id: string): Promise<OrderDto> => {
  const res = await api.get(`/orders/${id}`);
  return res.data.data;
};

export const getMyAddresses = async (): Promise<AddressItem[]> => {
  const res = await api.get('/addresses');
  return res.data.data;
};
