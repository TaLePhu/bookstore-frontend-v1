import type {
  AdminOrderStatus,
  AdminPaymentMethod,
  AdminPaymentStatus,
  AdminUserPayload,
} from '../../services/admin.service';

export const COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#14B8A6'];
export const LOW_STOCK_THRESHOLD = 5;
export const MAX_BOOK_IMAGES = 5;
export const MAX_BOOK_IMAGE_SIZE = 2 * 1024 * 1024;
export const ACCEPTED_BOOK_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const ORDER_STATUS_OPTIONS: AdminOrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
export const ORDER_PAYMENT_METHOD_OPTIONS: AdminPaymentMethod[] = ['COD', 'MOMO'];
export const ORDER_PAYMENT_STATUS_OPTIONS: AdminPaymentStatus[] = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
export const ADMIN_BOOKS_PAGE_SIZE = 10;
export const ADMIN_ORDERS_PAGE_SIZE = 10;
export const EMPTY_ORDER_STATUS_TOTALS: Record<AdminOrderStatus, number> = {
  PENDING: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  COMPLETED: 0,
  CANCELLED: 0,
};
export const emptyUserForm: AdminUserPayload = {
  userName: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'CUSTOMER',
  isVerified: true,
};
