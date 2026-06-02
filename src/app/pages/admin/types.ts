import type {
  AdminOrder,
  AdminOrderDetail,
  AdminOrderStatus,
} from '../../services/admin.service';

export type AdminView = 'dashboard' | 'books' | 'promotions' | 'categories' | 'orders' | 'customers' | 'settings';
export type ExistingBookImage = { id?: string; url: string; isPrimary?: boolean };
export type PromotionDraft = { price: string; originalPrice: string; discount: string };
export type BookVisibilityFilter = 'active' | 'deleted' | 'all';
export type BookStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type BookCategoryFilter = 'all' | 'uncategorized' | string;
export type BookPromotionFilter = 'all' | 'discounted' | 'not_discounted';
export type BookPriceFilter = 'all' | 'under_100' | '100_200' | 'over_200';
export type BookSortOption = 'latest' | 'bestseller' | 'stock_low' | 'price_asc' | 'price_desc';
export type PromotionBookStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type PromotionEffectiveStatus = 'all' | 'running' | 'upcoming' | 'ending_soon' | 'expired' | 'inactive';
export type CategoryVisibilityFilter = 'active' | 'deleted' | 'all';
export type CategoryBookFilter = 'all' | 'with_books' | 'empty';
export type UserRoleFilter = 'all' | 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'GUEST';
export type UserLockFilter = 'all' | 'active' | 'locked';
export type UserVerifiedFilter = 'all' | 'verified' | 'unverified';
export type OrderWorkflowTab = 'all' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'cancel_requests';
export type OrderAction =
  | { key: 'confirm'; label: string; group: 'operation'; nextStatus: AdminOrderStatus; variant: 'primary' }
  | { key: 'handover'; label: string; group: 'operation'; nextStatus: AdminOrderStatus; variant: 'primary' }
  | { key: 'complete'; label: string; group: 'operation'; nextStatus: AdminOrderStatus; variant: 'success' }
  | { key: 'print'; label: string; group: 'operation'; variant: 'secondary' }
  | { key: 'approve_cancel'; label: string; group: 'cancel'; variant: 'danger' }
  | { key: 'reject_cancel'; label: string; group: 'cancel'; variant: 'secondary' }
  | { key: 'manual_cancel'; label: string; group: 'cancel'; variant: 'danger' }
  | { key: 'view_cancel'; label: string; group: 'cancel'; variant: 'danger' }
  | { key: 'view'; label: string; group: 'view'; variant: 'icon' };
export type PopupMessage = { type: 'success' | 'error'; text: string } | null;
export type BookImagePreview = { name: string; url: string; size: number };
export type BookModalMode = 'create' | 'edit' | 'detail' | null;
export type PromotionModalMode = 'create' | 'edit' | null;
export type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => Promise<void>;
} | null;
export type CancelDecisionDialog = {
  action: 'approve' | 'reject';
  order: AdminOrder | AdminOrderDetail;
} | null;
