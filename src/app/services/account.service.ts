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
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
  wardCode?: string;
  wardName?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface AddressPayload {
  receiverName: string;
  phone: string;
  addressLine: string;
  country: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
  isDefault?: boolean;
}

export interface OrderItemDto {
  id: string;
  quantity: number;
  price: number | string;
  subTotal: number | string;
  bookId: string;
  review?: {
    id: string;
    userId: string;
    bookId: string;
    orderId?: string | null;
    rating: number;
    comment?: string | null;
    createdAt?: string | null;
    user?: {
      userName?: string | null;
      fullName?: string | null;
      email?: string | null;
    } | null;
  } | null;
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
  orderCode?: string | null;
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
  statusLogs?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    note?: string | null;
    createdAt: string;
    changedBy?: string | null;
    changedByUser?: unknown;
  }>;
}

export interface MyOrdersResponse {
  orders: OrderDto[];
  total: number;
  page: number;
  limit: number;
}

export const isCancelRequestLog = (log?: { fromStatus?: string; toStatus?: string; note?: string | null }) =>
  Boolean(
    log?.fromStatus === log?.toStatus &&
      (log.note?.includes('yêu cầu hủy') ||
        log.note?.includes('yĂªu cáº§u há»§y') ||
        log.note?.startsWith('Khách yêu cầu hủy:') ||
        log.note?.startsWith('KhĂ¡ch yĂªu cáº§u há»§y:'))
  );

export const hasPendingCancelRequest = (order?: Pick<OrderDto, 'status' | 'statusLogs'> | null) =>
  getCancelRequestState(order).status === 'pending';

export type OrderStatusLogDto = NonNullable<OrderDto['statusLogs']>[number];
export type CancelRequestState = {
  status: 'none' | 'pending' | 'rejected' | 'cancelled';
  requestLog?: OrderStatusLogDto;
  resolutionLog?: OrderStatusLogDto;
};

const isCustomerCancelRequestLog = (log?: OrderStatusLogDto) =>
  Boolean(
    log?.fromStatus === log?.toStatus &&
      !log.changedBy &&
      !log.changedByUser &&
      (log.note?.includes('yêu cầu hủy') ||
        log.note?.includes('yĂªu cáº§u há»§y') ||
        log.note?.includes('yÄ‚Âªu cĂ¡ÂºÂ§u hĂ¡Â»Â§y') ||
        log.note?.startsWith('Khách yêu cầu hủy:') ||
        log.note?.startsWith('KhĂ¡ch yĂªu cáº§u há»§y:') ||
        log.note?.startsWith('KhÄ‚Â¡ch yÄ‚Âªu cĂ¡ÂºÂ§u hĂ¡Â»Â§y:'))
  );

const isCancelRequestResolvedLog = (log?: OrderStatusLogDto) =>
  Boolean(
    log &&
      (log.toStatus === 'CANCELLED' ||
        (log.fromStatus === log.toStatus &&
          (log.note?.startsWith('Admin từ chối yêu cầu hủy:') ||
            log.note?.startsWith('Admin tu choi yeu cau huy:'))))
  );

export const getCancelRequestState = (order?: Pick<OrderDto, 'status' | 'statusLogs'> | null): CancelRequestState => {
  if (!order) return { status: 'none' };

  const logs = [...(order.statusLogs || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const requestLog = logs.find(isCustomerCancelRequestLog);
  const resolutionLog = logs.find(isCancelRequestResolvedLog);

  if (order.status === 'CANCELLED') {
    return { status: 'cancelled', requestLog, resolutionLog };
  }

  if (!requestLog) {
    return { status: 'none' };
  }

  if (resolutionLog && new Date(resolutionLog.createdAt).getTime() > new Date(requestLog.createdAt).getTime()) {
    return { status: 'rejected', requestLog, resolutionLog };
  }

  return ['PENDING', 'PROCESSING'].includes(order.status)
    ? { status: 'pending', requestLog, resolutionLog }
    : { status: 'none', requestLog, resolutionLog };
};

export const getCancelLogMessage = (log?: { note?: string | null }) =>
  (log?.note || '')
    .replace(/^Khách yêu cầu hủy:\s*/i, '')
    .replace(/^KhĂ¡ch yĂªu cáº§u há»§y:\s*/i, '')
    .replace(/^KhÄ‚Â¡ch yÄ‚Âªu cĂ¡ÂºÂ§u hĂ¡Â»Â§y:\s*/i, '')
    .replace(/^Admin từ chối yêu cầu hủy:\s*/i, '')
    .replace(/^Admin tu choi yeu cau huy:\s*/i, '')
    .trim();

export const getMyProfile = async (): Promise<UserProfile> => {
  const res = await api.get('/users/me');
  return res.data.data;
};

export const updateMyProfile = async (payload: Partial<UserProfile>) => {
  const res = await api.patch('/users/me', payload);
  return res.data.data;
};

export const changeMyPassword = async (payload: { oldPassword: string; newPassword: string }) => {
  const res = await api.put('/users/change-password', payload);
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

export const trackOrderPublic = async (orderCode: string): Promise<OrderDto> => {
  const res = await api.get('/orders/track', {
    params: { orderCode },
  });
  return res.data.data;
};

export const requestCancelOrder = async (orderCode: string, reason: string): Promise<OrderDto> => {
  const res = await api.post('/orders/cancel-request', { orderCode, reason });
  return res.data.data;
};

export const submitOrderReview = async (payload: {
  orderCode: string;
  bookId: string;
  rating: number;
  comment?: string;
}): Promise<{
  review: {
    id: string;
    userId: string;
    bookId: string;
    rating: number;
    comment?: string | null;
    createdAt?: string;
    user?: {
      userName?: string | null;
      fullName?: string | null;
      email?: string | null;
    } | null;
  };
  bookRating: {
    bookId: string;
    rating: number;
    totalReviews: number;
  };
}> => {
  const res = await api.post('/orders/review', payload);
  return res.data.data;
};

export const getMyAddresses = async (): Promise<AddressItem[]> => {
  const res = await api.get('/addresses');
  return res.data.data;
};

export const createMyAddress = async (payload: AddressPayload): Promise<AddressItem> => {
  const res = await api.post('/addresses', payload);
  return res.data.data;
};

export const updateMyAddress = async (id: string, payload: AddressPayload): Promise<AddressItem> => {
  const res = await api.patch(`/addresses/${id}`, payload);
  return res.data.data;
};

export const deleteMyAddress = async (id: string): Promise<void> => {
  await api.delete(`/addresses/${id}`);
};
