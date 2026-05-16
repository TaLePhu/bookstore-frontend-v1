import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  ArchiveX,
  BarChart3,
  BookOpen,
  CheckCircle2,
  DollarSign,
  Edit,
  Eye,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Percent,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  createAdminBook,
  createAdminCategory,
  createAdminPromotion,
  createAdminUser,
  deleteAdminBook,
  deleteAdminCategory,
  deleteAdminPromotion,
  getAdminBooks,
  getAdminBookDetail,
  getAdminCategories,
  getAdminCustomers,
  getAdminDashboard,
  getAdminOrderDetail,
  getAdminOrders,
  getAdminPromotions,
  hardDeleteAdminBook,
  hardDeleteAdminCategory,
  restoreAdminBook,
  restoreAdminCategory,
  resetAdminUserPassword,
  rejectAdminCancelRequest,
  updateAdminCategory,
  updateAdminBook,
  updateAdminPromotion,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminOrderStatus,
  type AdminBookPayload,
  type AdminCategory,
  type AdminCategoryPayload,
  type AdminDashboardResponse,
  type AdminOrder,
  type AdminOrderDetail,
  type AdminOrderStatus,
  type AdminPromotion,
  type AdminPromotionPayload,
  type AdminUser,
  type AdminUserPayload,
} from '../services/admin.service';
import type { ApiBook } from '../services/book.service';
import { getBookImage } from '../utils/book-display';
import logoUrl from '../../assets/logo.png';

type AdminView = 'dashboard' | 'books' | 'promotions' | 'categories' | 'orders' | 'customers' | 'settings';
type ExistingBookImage = { id?: string; url: string; isPrimary?: boolean };
type PromotionDraft = { price: string; originalPrice: string; discount: string };
type BookVisibilityFilter = 'active' | 'deleted' | 'all';
type BookStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type BookCategoryFilter = 'all' | 'uncategorized' | string;
type PromotionBookStockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
type CategoryVisibilityFilter = 'active' | 'deleted' | 'all';
type CategoryBookFilter = 'all' | 'with_books' | 'empty';
type UserRoleFilter = 'all' | 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'GUEST';
type UserLockFilter = 'all' | 'active' | 'locked';
type UserVerifiedFilter = 'all' | 'verified' | 'unverified';
type PopupMessage = { type: 'success' | 'error'; text: string } | null;
type BookImagePreview = { name: string; url: string; size: number };
type PromotionModalMode = 'create' | 'edit' | null;
type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => Promise<void>;
} | null;
type CancelDecisionDialog = {
  action: 'approve' | 'reject';
  order: AdminOrderDetail;
} | null;

const COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#14B8A6'];
const LOW_STOCK_THRESHOLD = 5;
const MAX_BOOK_IMAGES = 5;
const MAX_BOOK_IMAGE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_BOOK_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ORDER_STATUS_OPTIONS: AdminOrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const EMPTY_ORDER_STATUS_TOTALS: Record<AdminOrderStatus, number> = {
  PENDING: 0,
  PROCESSING: 0,
  SHIPPED: 0,
  COMPLETED: 0,
  CANCELLED: 0,
};
const emptyUserForm: AdminUserPayload = {
  userName: '',
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'CUSTOMER',
  isVerified: true,
};

const formatCurrency = (value: number | string | null | undefined) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDate = (value?: string | Date | null) => {
  if (!value) return 'Đang cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Đang cập nhật' : date.toLocaleDateString('vi-VN');
};

const getOrderStatusText = (status: AdminOrderStatus) => {
  const labels: Record<AdminOrderStatus, string> = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] || status;
};

const getOrderStatusColor = (status: AdminOrderStatus) => {
  const colors: Record<AdminOrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getNextStatuses = (status: AdminOrderStatus): AdminOrderStatus[] => {
  const transitions: Record<AdminOrderStatus, AdminOrderStatus[]> = {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };
  return transitions[status] || [];
};

const getPaymentMethodText = (method?: string) => {
  const labels: Record<string, string> = {
    COD: 'Thanh toán khi nhận hàng',
    CREDIT_CARD: 'Thẻ tín dụng',
    DEBIT_CARD: 'Thẻ ghi nợ',
    BANK_TRANSFER: 'Chuyển khoản',
    WALLET: 'Ví điện tử',
  };
  return labels[method || ''] || method || 'Đang cập nhật';
};

const getPaymentStatusText = (status?: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Chờ thanh toán',
    COMPLETED: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
  };
  return labels[status || ''] || status || 'Đang cập nhật';
};

const getLatestCancelNote = (order?: AdminOrderDetail | null) =>
  [...(order?.statusLogs || [])]
    .reverse()
    .find(
      (log) =>
        (log.toStatus === 'CANCELLED' && log.note) ||
        (log.fromStatus === log.toStatus && log.note?.includes('yêu cầu hủy'))
    )?.note || '';

const hasCustomerCancelRequest = (order?: Pick<AdminOrderDetail, 'status' | 'statusLogs'> | AdminOrder | null) =>
  Boolean(
    (order as AdminOrder)?.cancelRequested ||
      ((order?.status === 'PENDING' || order?.status === 'PROCESSING') &&
        (order as AdminOrderDetail)?.statusLogs?.some(
          (log) => log.fromStatus === log.toStatus && Boolean(log.note?.includes('yêu cầu hủy'))
        ))
  );

const isCustomerCancelRequestLog = (log: NonNullable<AdminOrderDetail['statusLogs']>[number]) =>
  log.fromStatus === log.toStatus &&
  !log.changedByUser &&
  Boolean(
    log.note?.includes('yêu cầu hủy') ||
      log.note?.includes('yêu cầu hủy') ||
      log.note?.startsWith('Khách yêu cầu hủy:') ||
      log.note?.startsWith('Khách yêu cầu hủy:')
  );

const isCancelRequestResolutionLog = (log: NonNullable<AdminOrderDetail['statusLogs']>[number]) =>
  Boolean(
    log.changedByUser &&
      (log.toStatus === 'CANCELLED' ||
        (log.fromStatus === log.toStatus &&
          (log.note?.startsWith('Admin từ chối yêu cầu hủy:') ||
            log.note?.startsWith('Admin tu choi yeu cau huy:'))))
  );

const hasPendingCustomerCancelRequest = (
  order?: Pick<AdminOrderDetail, 'status' | 'statusLogs'> | AdminOrder | null
) => {
  if (!order || !['PENDING', 'PROCESSING'].includes(order.status)) return false;

  const statusLogs = (order as AdminOrderDetail).statusLogs;
  if (!statusLogs) return Boolean((order as AdminOrder).cancelRequested);

  const sortedLogs = [...statusLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestRequest = sortedLogs.find(isCustomerCancelRequestLog);
  const latestResolution = sortedLogs.find(isCancelRequestResolutionLog);

  return Boolean(
    latestRequest &&
      (!latestResolution ||
        new Date(latestRequest.createdAt).getTime() > new Date(latestResolution.createdAt).getTime())
  );
};

const getBookStatusMeta = (book: ApiBook) => {
  const stock = Number(book.stock || 0);

  if (book.deletedAt || book.status === 'deleted') {
    return {
      label: 'Đã xóa mềm',
      dot: 'bg-gray-400',
      className: 'bg-gray-100 text-gray-700 ring-gray-200',
    };
  }

  if (stock <= 0) {
    return {
      label: 'Hết hàng',
      dot: 'bg-red-500',
      className: 'bg-red-50 text-red-700 ring-red-100',
    };
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: 'Sắp hết hàng',
      dot: 'bg-amber-500',
      className: 'bg-amber-50 text-amber-700 ring-amber-100',
    };
  }

  return {
    label: 'Còn hàng',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  };
};

export function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const bookImageInputRef = useRef<HTMLInputElement | null>(null);
  const promotionBannerInputRef = useRef<HTMLInputElement | null>(null);
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const [currentView, setCurrentView] = useState<AdminView>(isAdmin ? 'dashboard' : 'orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminOrderStatus>('all');
  const [showCancelRequestsOnly, setShowCancelRequestsOnly] = useState(false);
  const [bookVisibilityFilter, setBookVisibilityFilter] = useState<BookVisibilityFilter>('active');
  const [bookStockFilter, setBookStockFilter] = useState<BookStockFilter>('all');
  const [bookCategoryFilter, setBookCategoryFilter] = useState<BookCategoryFilter>('all');
  const [categoryVisibilityFilter, setCategoryVisibilityFilter] = useState<CategoryVisibilityFilter>('active');
  const [categoryBookFilter, setCategoryBookFilter] = useState<CategoryBookFilter>('all');
  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>('CUSTOMER');
  const [userLockFilter, setUserLockFilter] = useState<UserLockFilter>('all');
  const [userVerifiedFilter, setUserVerifiedFilter] = useState<UserVerifiedFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [popupMessage, setPopupMessage] = useState<PopupMessage>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [isConfirmingDialog, setIsConfirmingDialog] = useState(false);
  const [cancelDecisionDialog, setCancelDecisionDialog] = useState<CancelDecisionDialog>(null);
  const [cancelDecisionNote, setCancelDecisionNote] = useState('');
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [orderStatusTotals, setOrderStatusTotals] = useState<Record<AdminOrderStatus, number>>(EMPTY_ORDER_STATUS_TOTALS);
  const [customers, setCustomers] = useState<AdminUser[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState<AdminUserPayload>(emptyUserForm);
  const [savingUser, setSavingUser] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [selectedBook, setSelectedBook] = useState<ApiBook | null>(null);
  const [bookModalMode, setBookModalMode] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<AdminCategory | null>(null);
  const [categoryModalMode, setCategoryModalMode] = useState<'create' | 'edit' | null>(null);
  const [categoryForm, setCategoryForm] = useState<AdminCategoryPayload>({
    name: '',
    description: '',
  });
  const [bookForm, setBookForm] = useState<AdminBookPayload>({
    title: '',
    author: '',
    categoryId: '',
    price: '',
    originalPrice: '',
    discount: '',
    stock: '',
    isbn: '',
    description: '',
    publisher: '',
    publishYear: '',
    pages: '',
    language: 'Tiếng Việt',
    releaseDate: '',
  });
  const [savingBook, setSavingBook] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [bookImagePreviews, setBookImagePreviews] = useState<BookImagePreview[]>([]);
  const [bookFormError, setBookFormError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [promotionDrafts, setPromotionDrafts] = useState<Record<string, PromotionDraft>>({});
  const [updatingPromotionBookId, setUpdatingPromotionBookId] = useState<string | null>(null);
  const [promotionModalMode, setPromotionModalMode] = useState<PromotionModalMode>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<AdminPromotion | null>(null);
  const [savingPromotion, setSavingPromotion] = useState(false);
  const [deletingPromotionId, setDeletingPromotionId] = useState<string | null>(null);
  const [promotionBannerPreview, setPromotionBannerPreview] = useState('');
  const [promotionFormError, setPromotionFormError] = useState('');
  const [promotionBookSearch, setPromotionBookSearch] = useState('');
  const [promotionCategoryFilter, setPromotionCategoryFilter] = useState('all');
  const [promotionStockFilter, setPromotionStockFilter] = useState<PromotionBookStockFilter>('all');
  const [showSelectedPromotionBooksOnly, setShowSelectedPromotionBooksOnly] = useState(false);
  const [promotionForm, setPromotionForm] = useState<AdminPromotionPayload>({
    name: '',
    description: '',
    discountPercent: '10',
    startsAt: '',
    endsAt: '',
    status: 'ACTIVE',
    bookIds: [],
  });

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'promotions' as const, label: 'Khuyến mãi', icon: Percent },
    { id: 'categories' as const, label: 'Danh mục', icon: FolderTree },
    { id: 'books' as const, label: 'Quản lý sách', icon: BookOpen },
    { id: 'orders' as const, label: 'Đơn hàng', icon: ShoppingCart },
    { id: 'customers' as const, label: 'Khách hàng', icon: Users },
    { id: 'settings' as const, label: 'Cài đặt', icon: Settings },
  ];

  const visibleMenuItems = useMemo(
    () => (isAdmin ? menuItems : menuItems.filter((item) => item.id === 'orders')),
    [isAdmin]
  );

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (!isAdmin) {
        const [ordersData, orderStatusResults] = await Promise.all([
          getAdminOrders({
            limit: 50,
            status: statusFilter === 'all' ? undefined : statusFilter,
          }),
          Promise.all(ORDER_STATUS_OPTIONS.map((status) => getAdminOrders({ limit: 1, status }))),
        ]);

        setDashboard(null);
        setBooks([]);
        setPromotions([]);
        setCategories([]);
        setCustomers([]);
        setOrders(ordersData.data);
        setOrderStatusTotals(
          ORDER_STATUS_OPTIONS.reduce(
            (acc, status, index) => ({
              ...acc,
              [status]: orderStatusResults[index]?.total ?? 0,
            }),
            { ...EMPTY_ORDER_STATUS_TOTALS }
          )
        );
        return;
      }

      const [dashboardData, booksData, promotionsData, categoriesData, ordersData, customersData] = await Promise.all([
        getAdminDashboard(),
        getAdminBooks({
          limit: 50,
          includeDeleted: bookVisibilityFilter === 'all' || bookVisibilityFilter === 'deleted',
          onlyDeleted: bookVisibilityFilter === 'deleted',
        }),
        getAdminPromotions(),
        getAdminCategories({ includeDeleted: true }),
        getAdminOrders({
          limit: 50,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        getAdminCustomers({
          limit: 50,
          role: userRoleFilter === 'all' ? undefined : userRoleFilter,
          isLocked: userLockFilter === 'all' ? undefined : userLockFilter === 'locked',
          isVerified: userVerifiedFilter === 'all' ? undefined : userVerifiedFilter === 'verified',
        }),
      ]);
      const orderStatusResults = await Promise.all(
        ORDER_STATUS_OPTIONS.map((status) => getAdminOrders({ limit: 1, status }))
      );

      setDashboard(dashboardData);
      setBooks(booksData.data);
      setPromotions(promotionsData);
      setCategories(categoriesData);
      setOrders(ordersData.data);
      setOrderStatusTotals(
        ORDER_STATUS_OPTIONS.reduce(
          (acc, status, index) => ({
            ...acc,
            [status]: orderStatusResults[index]?.total ?? 0,
          }),
          { ...EMPTY_ORDER_STATUS_TOTALS }
        )
      );
      setCustomers(customersData.data);
    } catch (err: any) {
      console.error('Load admin data error:', err);
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu admin');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, statusFilter, bookVisibilityFilter, userRoleFilter, userLockFilter, userVerifiedFilter]);

  useEffect(() => {
    if (!visibleMenuItems.some((item) => item.id === currentView)) {
      setCurrentView(visibleMenuItems[0].id);
      setSearchQuery('');
    }
  }, [currentView, visibleMenuItems]);

  useEffect(() => {
    setPromotionDrafts((prev) => {
      const next: Record<string, PromotionDraft> = {};
      books.forEach((book) => {
        next[book.id] = prev[book.id] || {
          price: String(book.price ?? ''),
          originalPrice: String(book.originalPrice ?? book.price ?? ''),
          discount: String(book.discount ?? 0),
        };
      });
      return next;
    });
  }, [books]);

  useEffect(() => {
    return () => {
      bookImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [bookImagePreviews]);

  useEffect(() => {
    return () => {
      if (promotionBannerPreview) URL.revokeObjectURL(promotionBannerPreview);
    };
  }, [promotionBannerPreview]);

  const filteredBooks = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    let result = [...books];

    if (bookStockFilter !== 'all') {
      result = result.filter((book) => {
        const stock = Number(book.stock || 0);
        if (bookStockFilter === 'out_of_stock') return stock <= 0;
        if (bookStockFilter === 'low_stock') return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
        return stock > LOW_STOCK_THRESHOLD;
      });
    }

    if (bookCategoryFilter !== 'all') {
      result = result.filter((book) => {
        const categoryId = book.categoryId || book.category?.id || '';
        if (bookCategoryFilter === 'uncategorized') return !categoryId;
        return categoryId === bookCategoryFilter;
      });
    }

    if (currentView !== 'books' || !keyword) return result;
    return result.filter((book) =>
      [book.title, book.author, book.category?.name].filter(Boolean).join(' ').toLowerCase().includes(keyword)
    );
  }, [books, bookCategoryFilter, bookStockFilter, currentView, searchQuery]);

  const filteredPromotionBooks = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const result = books.filter((book) => !Boolean(book.deletedAt || book.status === 'deleted')).filter((book) => {
      if (!keyword) return true;
      return [book.title, book.author, book.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });

    return result.sort((left, right) => Number(right.discount || 0) - Number(left.discount || 0));
  }, [books, searchQuery]);

  const filteredPromotions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (currentView !== 'promotions' || !keyword) return promotions;

    return promotions.filter((promotion) =>
      [
        promotion.name,
        promotion.description,
        promotion.status,
        ...(promotion.books || []).map((book) => book.title),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [currentView, promotions, searchQuery]);

  const filteredOrders = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    let result = showCancelRequestsOnly ? orders.filter((order) => hasPendingCustomerCancelRequest(order)) : orders;
    if (currentView !== 'orders' || !keyword) return result;
    return result.filter((order) =>
      [order.orderCode, order.customerName, order.customerEmail, order.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [orders, currentView, searchQuery, showCancelRequestsOnly]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    let result = [...customers];

    if (userRoleFilter !== 'all') {
      result = result.filter((customer) => customer.role === userRoleFilter);
    }

    if (userLockFilter !== 'all') {
      result = result.filter((customer) => customer.isLocked === (userLockFilter === 'locked'));
    }

    if (userVerifiedFilter !== 'all') {
      result = result.filter((customer) => customer.isVerified === (userVerifiedFilter === 'verified'));
    }

    if (currentView !== 'customers' || !keyword) return result;
    return result.filter((customer) =>
      [customer.fullName, customer.userName, customer.email].filter(Boolean).join(' ').toLowerCase().includes(keyword)
    );
  }, [customers, currentView, searchQuery, userLockFilter, userRoleFilter, userVerifiedFilter]);

  const filteredCategories = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    let result = categories.filter((category) => {
      const deleted = Boolean(category.deletedAt);
      if (categoryVisibilityFilter === 'deleted') return deleted;
      if (categoryVisibilityFilter === 'active') return !deleted;
      return true;
    });

    if (categoryBookFilter !== 'all') {
      result = result.filter((category) => {
        const bookCount = books.filter((book) =>
          !Boolean(book.deletedAt || book.status === 'deleted') &&
          (book.categoryId === category.id || book.category?.id === category.id)
        ).length;

        return categoryBookFilter === 'with_books' ? bookCount > 0 : bookCount === 0;
      });
    }

    if (currentView !== 'categories' || !keyword) return result;
    return result.filter((category) =>
      [category.name, category.description].filter(Boolean).join(' ').toLowerCase().includes(keyword)
    );
  }, [books, categories, categoryBookFilter, categoryVisibilityFilter, currentView, searchQuery]);

  const getCategoryBookCount = (categoryId: string) =>
    books.filter((book) => !isBookDeleted(book) && (book.categoryId === categoryId || book.category?.id === categoryId)).length;

  const isBookDeleted = (book: ApiBook) => Boolean(book.deletedAt || book.status === 'deleted');
  const isCategoryDeleted = (category: AdminCategory) => Boolean(category.deletedAt);
  const activeCategories = categories.filter((category) => !isCategoryDeleted(category));
  const outOfStockBooks = books.filter((book) => !isBookDeleted(book) && Number(book.stock || 0) <= 0);
  const lowStockBooks = books.filter((book) => {
    const stock = Number(book.stock || 0);
    return !isBookDeleted(book) && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  });
  const cancelRequestOrders = orders.filter((order) => hasPendingCustomerCancelRequest(order));
  const orderStatusSummary = ORDER_STATUS_OPTIONS.map((status) => ({
    status,
    label: getOrderStatusText(status),
    count: orderStatusTotals[status] || 0,
    className: getOrderStatusColor(status),
  }));
  const activeUsers = customers.filter((customer) => !customer.isLocked);
  const lockedUsers = customers.filter((customer) => customer.isLocked);
  const verifiedUsers = customers.filter((customer) => customer.isVerified);
  const unverifiedUsers = customers.filter((customer) => !customer.isVerified);
  const promotionBooks = books.filter((book) => !isBookDeleted(book));
  const activePromotionBooks = promotionBooks.filter((book) => Number(book.discount || 0) > 0);
  const maxPromotionDiscount = Math.max(...activePromotionBooks.map((book) => Number(book.discount || 0)), 0);
  const activePromotions = promotions.filter((promotion) => promotion.status === 'ACTIVE');
  const promotionBookTotal = promotions.reduce((sum, promotion) => sum + (promotion.bookCount || promotion.books?.length || 0), 0);
  const getPromotionForBook = (bookId?: string | null) =>
    bookId
      ? promotions.find((promotion) => (promotion.books || []).some((book) => book.id === bookId))
      : undefined;

  const getPromotionStatusLabel = (promotion?: AdminPromotion) => {
    if (!promotion) return '';
    const now = Date.now();
    const startsAt = promotion.startsAt ? new Date(promotion.startsAt).getTime() : null;
    const endsAt = promotion.endsAt ? new Date(promotion.endsAt).getTime() : null;

    if (promotion.status !== 'ACTIVE') return 'Tạm tắt';
    if (startsAt && startsAt > now) return 'Sắp áp dụng';
    if (endsAt && endsAt < now) return 'Đã hết hạn';
    return 'Đang áp dụng';
  };

  const isPromotionCurrentlyActive = (promotion?: AdminPromotion) => getPromotionStatusLabel(promotion) === 'Đang áp dụng';
  const filteredPromotionModalBooks = useMemo(() => {
    const keyword = promotionBookSearch.trim().toLowerCase();

    return promotionBooks.filter((book) => {
      if (showSelectedPromotionBooksOnly && !promotionForm.bookIds.includes(book.id)) return false;
      if (promotionCategoryFilter !== 'all' && (book.categoryId || book.category?.id) !== promotionCategoryFilter) {
        return false;
      }

      const stock = Number(book.stock || 0);
      if (promotionStockFilter === 'in_stock' && stock <= LOW_STOCK_THRESHOLD) return false;
      if (promotionStockFilter === 'low_stock' && (stock <= 0 || stock > LOW_STOCK_THRESHOLD)) return false;
      if (promotionStockFilter === 'out_of_stock' && stock > 0) return false;

      if (!keyword) return true;
      return [book.title, book.author, book.isbn, book.category?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword);
    });
  }, [
    promotionBookSearch,
    promotionBooks,
    promotionCategoryFilter,
    promotionForm.bookIds,
    promotionStockFilter,
    showSelectedPromotionBooksOnly,
  ]);

  useEffect(() => {
    if (showCancelRequestsOnly && cancelRequestOrders.length === 0) {
      setShowCancelRequestsOnly(false);
    }
  }, [cancelRequestOrders.length, showCancelRequestsOnly]);

  const showPopup = (message: Exclude<PopupMessage, null>) => {
    setPopupMessage(message);
    window.setTimeout(() => setPopupMessage(null), 3200);
  };

  const handleConfirmDialog = async () => {
    if (!confirmDialog) return;
    try {
      setIsConfirmingDialog(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } finally {
      setIsConfirmingDialog(false);
    }
  };

  const stats = [
    {
      title: 'Tổng doanh thu',
      value: formatCurrency(dashboard?.stats.totalRevenue || 0),
      icon: DollarSign,
      textColor: 'text-green-600',
      bgLight: 'bg-green-50',
    },
    {
      title: 'Đơn hàng',
      value: (dashboard?.stats.totalOrders || 0).toLocaleString('vi-VN'),
      icon: ShoppingCart,
      textColor: 'text-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Khách hàng',
      value: (dashboard?.stats.totalCustomers || 0).toLocaleString('vi-VN'),
      icon: Users,
      textColor: 'text-purple-600',
      bgLight: 'bg-purple-50',
    },
    {
      title: 'Sản phẩm',
      value: (dashboard?.stats.totalBooks || 0).toLocaleString('vi-VN'),
      icon: Package,
      textColor: 'text-orange-600',
      bgLight: 'bg-orange-50',
    },
  ];

  const openOrderDetail = async (order: AdminOrder) => {
    try {
      const detail = await getAdminOrderDetail(order.id);
      setSelectedOrder(detail);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
    }
  };

  const formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(1)}MB`;

  const clearSelectedBookImages = () => {
    setBookForm((prev) => ({ ...prev, images: undefined }));
    setBookImagePreviews([]);
    if (bookImageInputRef.current) bookImageInputRef.current.value = '';
  };

  const getSelectedBookImageFiles = () => Array.from(bookForm.images || []);

  const getBookImageValidationMessage = (files: File[], existingImageCount = 0) => {
    if (existingImageCount + files.length > MAX_BOOK_IMAGES) {
      return `Mỗi sách chỉ được tối đa ${MAX_BOOK_IMAGES} ảnh. Vui lòng bớt ảnh trước khi lưu.`;
    }

    const invalidType = files.find((file) => !ACCEPTED_BOOK_IMAGE_TYPES.includes(file.type));
    if (invalidType) {
      return `File "${invalidType.name}" không đúng định dạng. Chỉ hỗ trợ JPG, PNG hoặc WEBP.`;
    }

    const invalidSize = files.find((file) => file.size > MAX_BOOK_IMAGE_SIZE);
    if (invalidSize) {
      return `File "${invalidSize.name}" quá lớn (${formatFileSize(invalidSize.size)}). Mỗi ảnh tối đa 2MB.`;
    }

    return '';
  };

  const validateBookForm = () => {
    const requiredFields: Array<[keyof AdminBookPayload, string]> = [
      ['title', 'Tên sách'],
      ['author', 'Tác giả'],
      ['categoryId', 'Danh mục'],
      ['isbn', 'ISBN'],
      ['originalPrice', 'Giá gốc'],
      ['stock', 'Tồn kho'],
      ['description', 'Mô tả'],
    ];
    const missingField = requiredFields.find(([field]) => !String(bookForm[field] || '').trim());
    if (missingField) return `Vui lòng nhập ${missingField[1].toLowerCase()}.`;

    const originalPrice = Number(bookForm.originalPrice);
    if (!Number.isFinite(originalPrice) || originalPrice <= 0) {
      return 'Giá gốc phải là số lớn hơn 0.';
    }

    const stock = Number(bookForm.stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return 'Tồn kho phải là số nguyên không âm.';
    }

    if (bookForm.publishYear) {
      const publishYear = Number(bookForm.publishYear);
      const maxYear = new Date().getFullYear() + 1;
      if (!Number.isInteger(publishYear) || publishYear < 1000 || publishYear > maxYear) {
        return `Năm xuất bản phải nằm trong khoảng 1000-${maxYear}.`;
      }
    }

    if (bookForm.pages) {
      const pages = Number(bookForm.pages);
      if (!Number.isInteger(pages) || pages <= 0) {
        return 'Số trang phải là số nguyên lớn hơn 0.';
      }
    }

    const selectedFiles = getSelectedBookImageFiles();
    const existingImageCount =
      bookModalMode === 'edit' && selectedBook ? getVisibleBookImageItems(selectedBook).length : 0;
    if (bookModalMode === 'create' && selectedFiles.length === 0) {
      return 'Vui lòng chọn ít nhất một ảnh sách.';
    }
    if (bookModalMode === 'edit' && existingImageCount === 0 && selectedFiles.length === 0) {
      return 'Sách cần có ít nhất một ảnh. Hãy upload ảnh mới hoặc hoàn tác xóa ảnh.';
    }

    return getBookImageValidationMessage(selectedFiles, existingImageCount);
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      categoryId: activeCategories[0]?.id || '',
      price: '',
      originalPrice: '',
      discount: '',
      stock: '',
      isbn: '',
      description: '',
      publisher: '',
      publishYear: '',
      pages: '',
      language: 'Tiếng Việt',
      releaseDate: '',
    });
    setSelectedBook(null);
    setDeletedImageIds([]);
    setBookImagePreviews([]);
    setBookFormError('');
  };

  const openCreateBook = () => {
    resetBookForm();
    setBookModalMode('create');
  };

  const closeBookModal = () => {
    setBookModalMode(null);
    resetBookForm();
  };

  const openBookDetail = async (book: ApiBook, mode: 'detail' | 'edit') => {
    try {
      const detail = await getAdminBookDetail(book.id);
      setSelectedBook(detail);
      setBookForm({
        title: detail.title || '',
        author: detail.author || '',
        categoryId: detail.categoryId || detail.category?.id || '',
        price: String(detail.price ?? ''),
        originalPrice: String(detail.originalPrice ?? ''),
        discount: String(detail.discount ?? ''),
        stock: String(detail.stock ?? ''),
        isbn: detail.isbn || '',
        description: detail.description || '',
        publisher: detail.publisher || '',
        publishYear: detail.publishYear ? String(detail.publishYear) : '',
        pages: detail.pages ? String(detail.pages) : '',
        language: detail.language || 'Tiếng Việt',
        releaseDate: detail.releaseDate ? detail.releaseDate.slice(0, 10) : '',
      });
      setDeletedImageIds([]);
      setBookImagePreviews([]);
      setBookFormError('');
      setBookModalMode(mode);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải chi tiết sách');
    }
  };

  const handleBookInput = (field: keyof AdminBookPayload, value: string | FileList) => {
    setBookFormError('');
    setBookForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBookImagesChange = (files: FileList | null) => {
    setBookFormError('');
    if (!files || files.length === 0) {
      clearSelectedBookImages();
      return true;
    }

    const selectedFiles = Array.from(files);
    const existingImageCount =
      bookModalMode === 'edit' && selectedBook ? getVisibleBookImageItems(selectedBook).length : 0;
    const validationMessage = getBookImageValidationMessage(selectedFiles, existingImageCount);
    if (validationMessage) {
      clearSelectedBookImages();
      setBookFormError(validationMessage);
      showPopup({ type: 'error', text: validationMessage });
      return false;
    }

    setBookForm((prev) => ({ ...prev, images: files }));
    setBookImagePreviews(
      selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        url: URL.createObjectURL(file),
      }))
    );
    return true;
  };

  const handleSaveBook = async () => {
    const validationMessage = validateBookForm();
    if (validationMessage) {
      setBookFormError(validationMessage);
      showPopup({ type: 'error', text: validationMessage });
      return;
    }

    try {
      setSavingBook(true);
      const isEditing = bookModalMode === 'edit' && Boolean(selectedBook);
      if (bookModalMode === 'create') {
        await createAdminBook(bookForm);
      } else if (isEditing && selectedBook) {
        await updateAdminBook(selectedBook.id, {
          ...bookForm,
          deleteImageIds: deletedImageIds,
        });
      }
      setBookModalMode(null);
      resetBookForm();
      await loadData();
      showPopup({
        type: 'success',
        text: isEditing ? 'Đã cập nhật sách thành công.' : 'Đã thêm sách mới thành công.',
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể lưu sách';
      setError(message);
      showPopup({ type: 'error', text: message });
    } finally {
      setSavingBook(false);
    }
  };

  const getBookPayloadFromBook = (book: ApiBook, draft?: PromotionDraft): AdminBookPayload => ({
    title: book.title || '',
    author: book.author || '',
    categoryId: book.categoryId || book.category?.id || '',
    price: draft?.price ?? String(book.price ?? ''),
    originalPrice: draft?.originalPrice ?? String(book.originalPrice ?? book.price ?? ''),
    discount: draft?.discount ?? String(book.discount ?? 0),
    stock: String(book.stock ?? 0),
    isbn: book.isbn || '',
    description: book.description || '',
    publisher: book.publisher || '',
    publishYear: book.publishYear ? String(book.publishYear) : '',
    pages: book.pages ? String(book.pages) : '',
    language: book.language || 'Tiếng Việt',
    releaseDate: book.releaseDate ? book.releaseDate.slice(0, 10) : '',
  });

  const handlePromotionDraftChange = (bookId: string, field: keyof PromotionDraft, value: string) => {
    setPromotionDrafts((prev) => ({
      ...prev,
      [bookId]: {
        price: prev[bookId]?.price || '',
        originalPrice: prev[bookId]?.originalPrice || '',
        discount: prev[bookId]?.discount || '0',
        [field]: value,
      },
    }));
  };

  const handleSavePromotion = async (book: ApiBook) => {
    const draft = promotionDrafts[book.id] || {
      price: String(book.price ?? ''),
      originalPrice: String(book.originalPrice ?? book.price ?? ''),
      discount: String(book.discount ?? 0),
    };
    const price = Number(draft.price);
    const originalPrice = Number(draft.originalPrice);
    const discount = Number(draft.discount);

    if (!Number.isFinite(price) || price < 0 || !Number.isFinite(originalPrice) || originalPrice < 0) {
      showPopup({ type: 'error', text: 'Giá bán và giá gốc phải là số không âm.' });
      return;
    }

    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      showPopup({ type: 'error', text: 'Phần trăm giảm phải nằm trong khoảng 0 - 100.' });
      return;
    }

    try {
      setUpdatingPromotionBookId(book.id);
      await updateAdminBook(book.id, getBookPayloadFromBook(book, draft));
      await loadData();
      showPopup({ type: 'success', text: `Đã cập nhật khuyến mãi cho "${book.title}".` });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể cập nhật khuyến mãi.';
      setError(message);
      showPopup({ type: 'error', text: message });
    } finally {
      setUpdatingPromotionBookId(null);
    }
  };

  const handleClearPromotion = async (book: ApiBook) => {
    const draft: PromotionDraft = {
      price: String(book.price ?? ''),
      originalPrice: String(book.price ?? ''),
      discount: '0',
    };
    setPromotionDrafts((prev) => ({ ...prev, [book.id]: draft }));

    try {
      setUpdatingPromotionBookId(book.id);
      await updateAdminBook(book.id, getBookPayloadFromBook(book, draft));
      await loadData();
      showPopup({ type: 'success', text: `Đã tắt khuyến mãi cho "${book.title}".` });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể tắt khuyến mãi.';
      setError(message);
      showPopup({ type: 'error', text: message });
    } finally {
      setUpdatingPromotionBookId(null);
    }
  };

  const resetPromotionForm = () => {
    setSelectedPromotion(null);
    setPromotionBannerPreview('');
    setPromotionFormError('');
    setPromotionBookSearch('');
    setPromotionCategoryFilter('all');
    setPromotionStockFilter('all');
    setShowSelectedPromotionBooksOnly(false);
    if (promotionBannerInputRef.current) promotionBannerInputRef.current.value = '';
    setPromotionForm({
      name: '',
      description: '',
      discountPercent: '10',
      startsAt: '',
      endsAt: '',
      status: 'ACTIVE',
      bookIds: [],
      bannerImage: null,
    });
  };

  const openCreatePromotion = () => {
    resetPromotionForm();
    setPromotionModalMode('create');
  };

  const openEditPromotion = (promotion: AdminPromotion) => {
    setSelectedPromotion(promotion);
    setPromotionForm({
      name: promotion.name || '',
      description: promotion.description || '',
      bannerImageUrl: promotion.bannerImageUrl || undefined,
      discountPercent: String(promotion.discountPercent ?? 10),
      startsAt: promotion.startsAt ? promotion.startsAt.slice(0, 10) : '',
      endsAt: promotion.endsAt ? promotion.endsAt.slice(0, 10) : '',
      status: promotion.status || 'ACTIVE',
      bookIds: (promotion.books || []).map((book) => book.id),
      bannerImage: null,
    });
    setPromotionBannerPreview('');
    setPromotionFormError('');
    setPromotionBookSearch('');
    setPromotionCategoryFilter('all');
    setPromotionStockFilter('all');
    setShowSelectedPromotionBooksOnly(false);
    if (promotionBannerInputRef.current) promotionBannerInputRef.current.value = '';
    setPromotionModalMode('edit');
  };

  const handlePromotionFormInput = (
    field: keyof AdminPromotionPayload,
    value: AdminPromotionPayload[keyof AdminPromotionPayload]
  ) => {
    setPromotionFormError('');
    setPromotionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handlePromotionBannerChange = (fileList: FileList | null) => {
    setPromotionFormError('');
    const file = fileList?.[0];
    if (!file) {
      setPromotionForm((prev) => ({ ...prev, bannerImage: null }));
      setPromotionBannerPreview('');
      return true;
    }

    const message = getBookImageValidationMessage([file]);
    if (message) {
      setPromotionForm((prev) => ({ ...prev, bannerImage: null }));
      setPromotionBannerPreview('');
      setPromotionFormError(message);
      showPopup({ type: 'error', text: message });
      return false;
    }

    setPromotionForm((prev) => ({ ...prev, bannerImage: file, bannerImageUrl: undefined }));
    setPromotionBannerPreview(URL.createObjectURL(file));
    return true;
  };

  const clearPromotionBanner = () => {
    setPromotionForm((prev) => ({ ...prev, bannerImage: null, bannerImageUrl: '' }));
    setPromotionBannerPreview('');
    if (promotionBannerInputRef.current) promotionBannerInputRef.current.value = '';
  };

  const showPromotionFormError = (message: string) => {
    setPromotionFormError(message);
    showPopup({ type: 'error', text: message });
  };

  const parseDateInput = (value?: string) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  };

  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const formatDateInput = (value: Date) => value.toLocaleDateString('vi-VN');

  const getPromotionApiErrorMessage = (err: any) => {
    const responseData = err?.response?.data;
    const validationData = responseData?.data;
    const fallback = responseData?.message || 'Không thể lưu chương trình khuyến mãi.';
    const fieldLabels: Record<string, string> = {
      name: 'Tên chương trình',
      description: 'Mô tả',
      bannerImageUrl: 'Ảnh banner',
      discountPercent: 'Phần trăm giảm',
      startsAt: 'Ngày bắt đầu',
      endsAt: 'Ngày kết thúc',
      status: 'Trạng thái',
      bookIds: 'Sách áp dụng',
    };
    const translateValidationMessage = (message: string) => {
      const translations: Array<[string, string]> = [
        ['name must be a string', 'Tên chương trình không hợp lệ. Vui lòng nhập chữ.'],
        ['discountPercent must not be greater than 100', 'Phần trăm giảm không được lớn hơn 100.'],
        ['discountPercent must not be less than 0', 'Phần trăm giảm không được nhỏ hơn 0.'],
        ['discountPercent must be an integer number', 'Phần trăm giảm phải là số nguyên.'],
        ['discountPercent must be an integer', 'Phần trăm giảm phải là số nguyên.'],
        ['bookIds must be an array', 'Danh sách sách áp dụng không hợp lệ.'],
      ];
      return translations.find(([source]) => message.includes(source))?.[1] || message;
    };

    if (validationData?.bookIds && Array.isArray(validationData.bookIds)) {
      const conflictedBooks = validationData.bookIds
        .map((bookId: string) => books.find((book) => book.id === bookId)?.title || bookId)
        .slice(0, 5);
      return `Một số sách đã thuộc chương trình khuyến mãi khác: ${conflictedBooks.join(', ')}. Vui lòng bỏ các sách này hoặc chỉnh chương trình hiện có.`;
    }

    if (validationData && typeof validationData === 'object') {
      const details = Object.entries(validationData)
        .flatMap(([field, messages]) => {
          const label = fieldLabels[field] || field;
          const list = Array.isArray(messages) ? messages : [String(messages)];
          return list.map((message) => translateValidationMessage(`${message}`)).map((message) => `${label}: ${message}`);
        })
        .filter(Boolean);

      if (details.length > 0) {
        return details.join(' ');
      }
    }

    if (fallback === 'Validation failed') {
      return 'Thông tin chương trình khuyến mãi chưa hợp lệ. Vui lòng kiểm tra tên, phần trăm giảm, ngày áp dụng, ảnh banner và sách đã chọn.';
    }

    return fallback;
  };

  const togglePromotionBook = (bookId: string) => {
    setPromotionForm((prev) => ({
      ...prev,
      bookIds: prev.bookIds.includes(bookId)
        ? prev.bookIds.filter((id) => id !== bookId)
        : [...prev.bookIds, bookId],
    }));
  };

  const handleSavePromotionProgram = async () => {
    const discountPercent = Number(promotionForm.discountPercent);
    const startsAtDate = parseDateInput(promotionForm.startsAt);
    const endsAtDate = parseDateInput(promotionForm.endsAt);
    const todayStart = getTodayStart();
    setPromotionFormError('');
    if (!promotionForm.name.trim()) {
      showPromotionFormError('Vui lòng nhập tên chương trình khuyến mãi.');
      return;
    }
    if (promotionForm.name.trim().length < 3) {
      showPromotionFormError('Tên chương trình khuyến mãi cần ít nhất 3 ký tự.');
      return;
    }
    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      showPromotionFormError('Phần trăm giảm phải là số từ 1 đến 100.');
      return;
    }
    if (
      startsAtDate &&
      endsAtDate &&
      startsAtDate.getTime() > endsAtDate.getTime()
    ) {
      showPromotionFormError('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
      return;
    }
    if (promotionModalMode === 'create' && endsAtDate && endsAtDate.getTime() < todayStart.getTime()) {
      showPromotionFormError(`Ngày kết thúc không được trước hôm nay (${formatDateInput(todayStart)}).`);
      return;
    }
    if (promotionForm.bookIds.length === 0) {
      showPromotionFormError('Vui lòng chọn ít nhất một sách cho chương trình khuyến mãi.');
      return;
    }

    if (promotionModalMode === 'create' && !promotionForm.bannerImage) {
      const message = 'Vui lòng chọn ảnh banner để hiển thị trên slider trang chủ.';
      showPromotionFormError(message);
      return;
    }

    const payload: AdminPromotionPayload = {
      ...promotionForm,
      name: promotionForm.name.trim(),
      description: promotionForm.description?.trim() || '',
      discountPercent,
      startsAt: promotionForm.startsAt || undefined,
      endsAt: promotionForm.endsAt || undefined,
    };

    try {
      setSavingPromotion(true);
      if (promotionModalMode === 'edit' && selectedPromotion) {
        await updateAdminPromotion(selectedPromotion.id, payload);
      } else {
        await createAdminPromotion(payload);
      }
      setPromotionModalMode(null);
      resetPromotionForm();
      await loadData();
      showPopup({
        type: 'success',
        text: promotionModalMode === 'edit'
          ? 'Đã cập nhật chương trình khuyến mãi.'
          : 'Đã tạo chương trình khuyến mãi.',
      });
    } catch (err: any) {
      const message = getPromotionApiErrorMessage(err);
      setError(message);
      showPromotionFormError(message);
    } finally {
      setSavingPromotion(false);
    }
  };

  const handleDeletePromotionProgram = (promotion: AdminPromotion) => {
    setConfirmDialog({
      title: 'Xóa chương trình khuyến mãi?',
      message: `Chương trình "${promotion.name}" sẽ bị xóa và các sách trong chương trình sẽ được trả về giá gốc.`,
      confirmLabel: 'Xóa chương trình',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setDeletingPromotionId(promotion.id);
          await deleteAdminPromotion(promotion.id);
          await loadData();
          showPopup({ type: 'success', text: 'Đã xóa chương trình khuyến mãi.' });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Không thể xóa chương trình khuyến mãi.';
          setError(message);
          showPopup({ type: 'error', text: message });
        } finally {
          setDeletingPromotionId(null);
        }
      },
    });
  };

  const resetCategoryForm = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: '', description: '' });
  };

  const openCreateCategory = () => {
    resetCategoryForm();
    setCategoryModalMode('create');
  };

  const openEditCategory = (category: AdminCategory) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
    });
    setCategoryModalMode('edit');
  };

  const handleCategoryInput = (field: keyof AdminCategoryPayload, value: string) => {
    setCategoryForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveCategory = async () => {
    const payload = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim(),
    };

    if (!payload.name || !payload.description) {
      showPopup({ type: 'error', text: 'Vui lòng nhập đầy đủ tên và mô tả danh mục.' });
      return;
    }

    try {
      setSavingCategory(true);
      const isEditing = categoryModalMode === 'edit' && Boolean(selectedCategory);
      if (isEditing && selectedCategory) {
        await updateAdminCategory(selectedCategory.id, payload);
      } else {
        await createAdminCategory(payload);
      }
      setCategoryModalMode(null);
      resetCategoryForm();
      await loadData();
      showPopup({
        type: 'success',
        text: isEditing ? 'Đã cập nhật danh mục thành công.' : 'Đã thêm danh mục mới thành công.',
      });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể lưu danh mục';
      setError(message);
      showPopup({ type: 'error', text: message });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSoftDeleteCategory = async (category: AdminCategory) => {
    const count = getCategoryBookCount(category.id);
    setConfirmDialog({
      title: 'Xóa mềm danh mục',
      message:
        count > 0
          ? `Xóa mềm danh mục "${category.name}"? Danh mục sẽ bị ẩn khỏi trang bán hàng, nhưng ${count} sách hiện có vẫn còn trong hệ thống.`
          : `Xóa mềm danh mục "${category.name}"? Có thể khôi phục lại sau.`,
      confirmLabel: 'Xóa mềm',
      variant: 'warning',
      onConfirm: async () => {
        try {
          setDeletingCategoryId(category.id);
          await deleteAdminCategory(category.id);
          await loadData();
          showPopup({ type: 'success', text: `Đã xóa mềm danh mục "${category.name}".` });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Không thể xóa mềm danh mục.';
          setError(message);
          showPopup({ type: 'error', text: message });
        } finally {
          setDeletingCategoryId(null);
        }
      },
    });
  };

  const handleRestoreCategory = async (category: AdminCategory) => {
    try {
      setDeletingCategoryId(category.id);
      await restoreAdminCategory(category.id);
      await loadData();
      showPopup({ type: 'success', text: `Đã khôi phục danh mục "${category.name}".` });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể khôi phục danh mục.';
      setError(message);
      showPopup({ type: 'error', text: message });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleHardDeleteCategory = async (category: AdminCategory) => {
    const count = getCategoryBookCount(category.id);
    setConfirmDialog({
      title: 'Xóa cứng danh mục',
      message:
        count > 0
          ? `Danh mục "${category.name}" đang có ${count} sách. Xóa cứng có thể thất bại nếu chưa chuyển sách sang danh mục khác.`
          : `Xóa cứng danh mục "${category.name}"? Thao tác này không thể hoàn tác.`,
      confirmLabel: 'Xóa cứng',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setDeletingCategoryId(category.id);
          await hardDeleteAdminCategory(category.id);
          await loadData();
          showPopup({ type: 'success', text: `Đã xóa cứng danh mục "${category.name}".` });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Không thể xóa cứng danh mục. Hãy chuyển sách sang danh mục khác trước.';
          setError(message);
          showPopup({ type: 'error', text: message });
        } finally {
          setDeletingCategoryId(null);
        }
      },
    });
  };

  const handleSoftDeleteBook = async (book: ApiBook) => {
    setConfirmDialog({
      title: 'Xóa mềm sách',
      message: `Xóa mềm sách "${book.title}"? Sách sẽ bị ẩn khỏi trang bán hàng và có thể khôi phục sau.`,
      confirmLabel: 'Xóa mềm',
      variant: 'warning',
      onConfirm: async () => {
        try {
          setDeletingBookId(book.id);
          await deleteAdminBook(book.id);
          await loadData();
          showPopup({ type: 'success', text: `Đã xóa mềm sách "${book.title}".` });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Không thể xóa mềm sách';
          setError(message);
          showPopup({ type: 'error', text: message });
        } finally {
          setDeletingBookId(null);
        }
      },
    });
  };

  const handleRestoreDeletedBook = async (book: ApiBook) => {
    try {
      setDeletingBookId(book.id);
      await restoreAdminBook(book.id);
      await loadData();
      showPopup({ type: 'success', text: `Đã khôi phục sách "${book.title}".` });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể khôi phục sách';
      setError(message);
      showPopup({ type: 'error', text: message });
    } finally {
      setDeletingBookId(null);
    }
  };

  const handlePermanentDeleteBook = async (book: ApiBook) => {
    setConfirmDialog({
      title: 'Xóa cứng sách',
      message: `Xóa cứng sách "${book.title}"? Thao tác này không thể hoàn tác và chỉ thành công nếu sách chưa phát sinh đơn hàng.`,
      confirmLabel: 'Xóa cứng',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setDeletingBookId(book.id);
          await hardDeleteAdminBook(book.id);
          await loadData();
          showPopup({ type: 'success', text: `Đã xóa cứng sách "${book.title}".` });
        } catch (err: any) {
          const message = err?.response?.data?.message || 'Không thể xóa cứng sách';
          setError(message);
          showPopup({ type: 'error', text: message });
        } finally {
          setDeletingBookId(null);
        }
      },
    });
  };

  const getBookImageItems = (book: ApiBook | null): ExistingBookImage[] => {
    if (!book) return [];
    const images = (book.images || [])
      .map((image) => {
        if (typeof image === 'string') return { url: image };
        return {
          id: image.id,
          url: image.imageUrl || image.url || '',
          isPrimary: image.isPrimary,
        };
      })
      .filter((image) => image.url);

    return images.length > 0 ? images : [{ url: getBookImage(book), isPrimary: true }];
  };

  const getVisibleBookImageItems = (book: ApiBook | null) => {
    return getBookImageItems(book).filter((image) => !image.id || !deletedImageIds.includes(image.id));
  };

  const toggleDeleteImage = (imageId?: string) => {
    if (!imageId) return;
    setDeletedImageIds((prev) =>
      prev.includes(imageId) ? prev.filter((id) => id !== imageId) : [...prev, imageId]
    );
  };

  const handleUpdateStatus = async (status: AdminOrderStatus) => {
    if (!selectedOrder) return;
    if (status === 'CANCELLED') {
      openCancelDecisionDialog('approve');
      return;
    }

    try {
      setUpdatingStatus(true);
      const updatedOrder = await updateAdminOrderStatus(selectedOrder.id, status);
      setSelectedOrder(updatedOrder);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openCancelDecisionDialog = (action: 'approve' | 'reject') => {
    if (!selectedOrder) return;
    setCancelDecisionDialog({ action, order: selectedOrder });
    setCancelDecisionNote(action === 'approve' ? 'Admin duyệt yêu cầu hủy đơn' : '');
  };

  const closeCancelDecisionDialog = () => {
    if (updatingStatus) return;
    setCancelDecisionDialog(null);
    setCancelDecisionNote('');
  };

  const handleCancelDecisionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!cancelDecisionDialog) return;

    const note = cancelDecisionNote.trim();
    if (!note) {
      showPopup({
        type: 'error',
        text:
          cancelDecisionDialog.action === 'approve'
            ? 'Vui lòng nhập lý do hủy đơn hàng.'
            : 'Vui lòng nhập lý do từ chối yêu cầu hủy.',
      });
      return;
    }

    try {
      setUpdatingStatus(true);
      const updatedOrder =
        cancelDecisionDialog.action === 'approve'
          ? await updateAdminOrderStatus(cancelDecisionDialog.order.id, 'CANCELLED', note)
          : await rejectAdminCancelRequest(cancelDecisionDialog.order.id, note);

      setSelectedOrder(updatedOrder);
      setCancelDecisionDialog(null);
      setCancelDecisionNote('');
      await loadData();
      showPopup({
        type: 'success',
        text:
          cancelDecisionDialog.action === 'approve'
            ? 'Đã duyệt yêu cầu hủy đơn hàng.'
            : 'Đã từ chối yêu cầu hủy, đơn hàng tiếp tục được xử lý.',
      });
    } catch (err: any) {
      showPopup({
        type: 'error',
        text: err?.response?.data?.message || 'Không thể xử lý yêu cầu hủy đơn hàng.',
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const resetUserForm = () => {
    setUserForm(emptyUserForm);
  };

  const openCreateUserModal = (role: 'CUSTOMER' | 'STAFF' = 'CUSTOMER') => {
    setUserForm({ ...emptyUserForm, role });
    setShowUserModal(true);
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: AdminUserPayload = {
      ...userForm,
      userName: userForm.userName.trim(),
      fullName: userForm.fullName?.trim() || undefined,
      email: userForm.email.trim(),
      phone: userForm.phone?.trim() || undefined,
      password: userForm.password,
    };

    if (!payload.userName || !payload.email || !payload.password) {
      showPopup({ type: 'error', text: 'Vui lòng nhập đầy đủ tên đăng nhập, email và mật khẩu.' });
      return;
    }

    if (payload.password.length < 8) {
      showPopup({ type: 'error', text: 'Mật khẩu cần ít nhất 8 ký tự.' });
      return;
    }

    try {
      setSavingUser(true);
      const created = await createAdminUser(payload);
      setCustomers((prev) => [created, ...prev]);
      setShowUserModal(false);
      resetUserForm();
      showPopup({ type: 'success', text: `Đã tạo tài khoản ${created.email}.` });
      await loadData();
    } catch (err: any) {
      showPopup({ type: 'error', text: err?.response?.data?.message || 'Không thể tạo tài khoản.' });
    } finally {
      setSavingUser(false);
    }
  };

  const handleToggleUserLock = async (customer: AdminUser) => {
    try {
      setUpdatingUserId(customer.id);
      const updated = await updateAdminUserStatus(customer.id, !customer.isLocked);
      setCustomers((prev) => prev.map((item) => (item.id === customer.id ? updated : item)));
      showPopup({
        type: 'success',
        text: updated.isLocked ? 'Đã khóa tài khoản người dùng.' : 'Đã mở khóa tài khoản người dùng.',
      });
    } catch (err: any) {
      showPopup({ type: 'error', text: err?.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleChangeUserRole = async (customer: AdminUser, role: string) => {
    if (customer.role === role) return;
    try {
      setUpdatingUserId(customer.id);
      const updated = await updateAdminUserRole(customer.id, role);
      setCustomers((prev) => prev.map((item) => (item.id === customer.id ? updated : item)));
      showPopup({ type: 'success', text: `Đã cập nhật quyền ${role} cho tài khoản.` });
    } catch (err: any) {
      showPopup({ type: 'error', text: err?.response?.data?.message || 'Không thể cập nhật quyền tài khoản.' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleResetUserPassword = async (customer: AdminUser) => {
    const newPassword = window.prompt('Nhập mật khẩu mới cho tài khoản này:');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      showPopup({ type: 'error', text: 'Mật khẩu mới cần ít nhất 6 ký tự.' });
      return;
    }

    try {
      setUpdatingUserId(customer.id);
      await resetAdminUserPassword(customer.id, newPassword);
      showPopup({ type: 'success', text: `Đã đặt lại mật khẩu cho ${customer.email}.` });
    } catch (err: any) {
      showPopup({ type: 'error', text: err?.response?.data?.message || 'Không thể đặt lại mật khẩu.' });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAdminLogoClick = () => {
    setCurrentView(isAdmin ? 'dashboard' : 'orders');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <aside className="w-full border-b border-gray-200 bg-white lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:flex-shrink-0 flex flex-col">
        <div className="border-b border-gray-200 p-5">
          <button
            onClick={handleAdminLogoClick}
            className="flex w-full flex-col items-start rounded-xl p-2 text-left transition-colors hover:bg-orange-50"
          >
            <img src={logoUrl} alt="Trạm Sách" className="h-12 max-w-full object-contain" />
            <div className="mt-3 inline-flex rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 ring-1 ring-orange-100">
              {isAdmin ? 'Admin Panel' : 'Staff Panel'}
            </div>
          </button>
        </div>

        <nav className="flex-1 overflow-x-auto p-3 lg:p-4">
          <div className="flex gap-2 lg:block lg:space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSearchQuery('');
                }}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 transition-colors lg:w-full ${
                  isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="mb-3 w-full flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors"
          >
            <Store className="w-4 h-4" />
            <span className="text-sm">Web bán hàng</span>
          </button>
          <div className="flex items-center gap-3 mb-3">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || user?.userName || 'Admin')}&background=F97316&color=fff`}
              alt="Admin"
              className="w-10 h-10 rounded-full"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-800 truncate">{user?.fullName || user?.userName || 'Admin'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {visibleMenuItems.find((item) => item.id === currentView)?.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">Dữ liệu được lấy trực tiếp từ backend</p>
            </div>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {popupMessage && (
            <div className="fixed left-2 right-2 top-3 z-[60] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl sm:left-auto sm:right-6 sm:top-6 sm:max-w-sm">
              <div className="flex items-start gap-3">
                {popupMessage.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
                )}
                <div className="flex-1 text-sm font-medium text-gray-800">{popupMessage.text}</div>
                <button
                  type="button"
                  onClick={() => setPopupMessage(null)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Đóng thông báo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {confirmDialog && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className={`rounded-full p-3 ${confirmDialog.variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{confirmDialog.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{confirmDialog.message}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isConfirmingDialog}
                    onClick={() => setConfirmDialog(null)}
                    className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={isConfirmingDialog}
                    onClick={handleConfirmDialog}
                    className={`rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50 ${
                      confirmDialog.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                  >
                    {isConfirmingDialog ? 'Đang xử lý...' : confirmDialog.confirmLabel}
                  </button>
                </div>
              </div>
            </div>
          )}

          {cancelDecisionDialog && (
            <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4">
              <form
                onSubmit={handleCancelDecisionSubmit}
                className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
              >
                <div
                  className={`px-6 py-5 text-white ${
                    cancelDecisionDialog.action === 'approve' ? 'bg-red-600' : 'bg-orange-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold">
                        {cancelDecisionDialog.action === 'approve'
                          ? 'Duyệt hủy đơn hàng'
                          : 'Từ chối yêu cầu hủy'}
                      </h3>
                      <p className="mt-1 text-sm text-white/90">
                        Đơn {cancelDecisionDialog.order.orderCode || cancelDecisionDialog.order.id.slice(0, 8)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeCancelDecisionDialog}
                      disabled={updatingStatus}
                      className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-50"
                      title="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-800">
                      {cancelDecisionDialog.action === 'approve'
                        ? 'Lý do hủy đơn'
                        : 'Lý do từ chối yêu cầu hủy'}
                    </span>
                    <textarea
                      value={cancelDecisionNote}
                      onChange={(event) => setCancelDecisionNote(event.target.value.slice(0, 500))}
                      rows={4}
                      className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      placeholder={
                        cancelDecisionDialog.action === 'approve'
                          ? 'Nhập lý do hủy đơn hàng...'
                          : 'Nhập lý do từ chối yêu cầu hủy...'
                      }
                    />
                  </label>
                  <div className="text-right text-xs text-gray-500">{cancelDecisionNote.length}/500</div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeCancelDecisionDialog}
                      disabled={updatingStatus}
                      className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      disabled={updatingStatus || cancelDecisionNote.trim().length === 0}
                      className={`rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50 ${
                        cancelDecisionDialog.action === 'approve'
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      {updatingStatus
                        ? 'Đang xử lý...'
                        : cancelDecisionDialog.action === 'approve'
                          ? 'Duyệt hủy'
                          : 'Từ chối yêu cầu'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {isLoading && (
            <div className="mb-6 rounded-xl bg-white p-6 shadow-sm text-gray-600">Đang tải dữ liệu admin...</div>
          )}

          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.title} className="bg-white rounded-xl p-6 shadow-sm">
                      <div className={`w-12 h-12 ${stat.bgLight} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className={`w-6 h-6 ${stat.textColor}`} />
                      </div>
                      <h3 className="text-gray-600 text-sm mb-1">{stat.title}</h3>
                      <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Doanh thu theo tháng</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dashboard?.revenueData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip formatter={(value) => [`${value} triệu`, 'Doanh thu']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#F97316" strokeWidth={3} name="Doanh thu" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Đơn hàng theo tháng</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboard?.revenueData || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orders" fill="#3B82F6" name="Đơn hàng" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Phân bổ danh mục</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={dashboard?.categoryData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {(dashboard?.categoryData || []).map((entry, index) => (
                          <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {(dashboard?.categoryData || []).map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-sm text-gray-600">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm xl:col-span-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Đơn hàng gần đây</h3>
                  <div className="space-y-3">
                    {(dashboard?.recentOrders || []).map((order) => (
                      <button
                        key={order.id}
                        onClick={() => openOrderDetail(order)}
                        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{order.orderCode || order.id.slice(0, 8)}</p>
                            <p className="text-sm text-gray-500">{order.customerName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-800">{formatCurrency(order.totalAmount)}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                            {getOrderStatusText(order.status)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentView === 'books' && (
            <div className="space-y-6">
              {outOfStockBooks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800">Có {outOfStockBooks.length} sách hết hàng</h4>
                    <p className="text-sm text-red-700">{outOfStockBooks.map((book) => book.title).join(', ')}</p>
                  </div>
                </div>
              )}

              {lowStockBooks.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">
                      Có {lowStockBooks.length} sách sắp hết hàng
                    </h4>
                    <p className="text-sm text-yellow-700">
                      {lowStockBooks.map((book) => `${book.title} (${Number(book.stock || 0)} cuốn)`).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm sách theo tên, tác giả, danh mục..." />
                <select
                  value={bookVisibilityFilter}
                  onChange={(event) => setBookVisibilityFilter(event.target.value as BookVisibilityFilter)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="active">Sách đang bán</option>
                  <option value="deleted">Sách đã xóa mềm</option>
                  <option value="all">Tất cả sách</option>
                </select>
                <select
                  value={bookStockFilter}
                  onChange={(event) => setBookStockFilter(event.target.value as BookStockFilter)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả tồn kho</option>
                  <option value="in_stock">Còn hàng</option>
                  <option value="low_stock">Sắp hết hàng</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>
                <select
                  value={bookCategoryFilter}
                  onChange={(event) => setBookCategoryFilter(event.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả danh mục</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                  <option value="uncategorized">Chưa phân loại</option>
                </select>
                <button
                  onClick={openCreateBook}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm sách mới
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-gray-100 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Danh sách sách</h3>
                    <p className="text-sm text-gray-500">
                      {filteredBooks.length.toLocaleString('vi-VN')} mục phù hợp với bộ lọc hiện tại
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
                      Còn hàng: {books.filter((book) => !isBookDeleted(book) && Number(book.stock || 0) > LOW_STOCK_THRESHOLD).length}
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
                      Sắp hết: {lowStockBooks.length}
                    </span>
                    <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
                      Hết hàng: {outOfStockBooks.length}
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-slate-50/80">
                    <tr>
                      <TableHead>Sách</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Tồn kho</TableHead>
                      <TableHead>Đã bán</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead align="right">Thao tác</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBooks.map((book) => {
                      const statusMeta = getBookStatusMeta(book);
                      const stock = Number(book.stock || 0);
                      const bookPromotion = getPromotionForBook(book.id);
                      const promotionActive = isPromotionCurrentlyActive(bookPromotion);
                      const hasDiscount = Number(book.discount || 0) > 0;

                      return (
                      <tr key={book.id} title={statusMeta.label} className={`transition-colors hover:bg-orange-50/30 ${isBookDeleted(book) ? 'bg-gray-50/80' : 'bg-white'}`}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm ring-1 ring-gray-200">
                              <img
                                src={getBookImage(book)}
                                alt={book.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 text-sm font-semibold leading-6 text-gray-950">{book.title}</p>
                              <p className="mt-1 text-sm text-gray-500">{book.author}</p>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                                {book.isbn && (
                                  <span className="rounded-full bg-gray-100 px-2 py-1">ISBN {book.isbn}</span>
                                )}
                                {book.publisher && (
                                  <span className="rounded-full bg-gray-100 px-2 py-1">{book.publisher}</span>
                                )}
                                {bookPromotion && (
                                  <span
                                    className={`rounded-full px-2 py-1 font-semibold ${
                                      promotionActive
                                        ? 'bg-orange-100 text-orange-700'
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    KM {bookPromotion.discountPercent}% - {getPromotionStatusLabel(bookPromotion)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{book.category?.name || 'Chưa phân loại'}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className={`font-semibold ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatCurrency(book.price)}
                            </span>
                            {hasDiscount && (
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-400 line-through">
                                  {formatCurrency(book.originalPrice)}
                                </span>
                                <span className="w-fit rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                                  -{Number(book.discount || 0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${stock <= 0 ? 'text-red-600' : stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-gray-900'}`}>
                            {stock.toLocaleString('vi-VN')}
                          </span>
                        </TableCell>
                        <TableCell>{Number(book.soldCount || 0).toLocaleString('vi-VN')}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {isBookDeleted(book) ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">Đã xóa mềm</span>
                          ) : Number(book.stock || 0) > 0 && Number(book.stock || 0) <= LOW_STOCK_THRESHOLD ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Sắp hết hàng</span>
                          ) : (
                          <span className={`text-xs px-2 py-1 rounded-full ${Number(book.stock || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {Number(book.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openBookDetail(book, 'detail')}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors hover:bg-blue-100"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openBookDetail(book, 'edit')}
                              disabled={isBookDeleted(book)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSoftDeleteBook(book)}
                              disabled={deletingBookId === book.id || isBookDeleted(book)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Xóa mềm: ẩn sách khỏi trang bán hàng"
                            >
                              <ArchiveX className="w-4 h-4" />
                            </button>
                            {isBookDeleted(book) && (
                              <button
                                onClick={() => handleRestoreDeletedBook(book)}
                                disabled={deletingBookId === book.id}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 ring-1 ring-green-100 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Khôi phục sách đã xóa mềm"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handlePermanentDeleteBook(book)}
                              disabled={deletingBookId === book.id}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                              title="Xóa cứng vĩnh viễn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
                </div>
                {filteredBooks.length === 0 && <EmptyState text="Không có sách phù hợp." />}
              </div>
            </div>
          )}

          {currentView === 'promotions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Chương trình</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{promotions.length}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Đang áp dụng</p>
                  <p className="mt-2 text-3xl font-bold text-orange-600">{activePromotions.length}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Sách trong chương trình</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{promotionBookTotal}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm chương trình hoặc sách..." />
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => navigate('/promotions')} className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 font-semibold text-orange-700 transition-colors hover:bg-orange-100">
                    Xem trang khuyến mãi
                  </button>
                  <button onClick={openCreatePromotion} className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600">
                    <Plus className="h-5 w-5" />
                    Tạo chương trình
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {filteredPromotions.map((promotion) => (
                  <div key={promotion.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-gray-900">{promotion.name}</h3>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${promotion.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {promotion.status === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm tắt'}
                          </span>
                          <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                            Giảm {promotion.discountPercent}%
                          </span>
                        </div>
                        {promotion.description && <p className="mt-2 text-sm text-gray-600">{promotion.description}</p>}
                        <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                          <span>Bắt đầu: {formatDate(promotion.startsAt)}</span>
                          <span>Kết thúc: {formatDate(promotion.endsAt)}</span>
                          <span>{promotion.bookCount || promotion.books?.length || 0} sách</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(promotion.books || []).slice(0, 5).map((book) => (
                            <div key={book.id} className="flex max-w-[220px] items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-2">
                              <img src={getBookImage(book)} alt={book.title} className="h-10 w-8 rounded object-cover ring-1 ring-gray-200" />
                              <span className="line-clamp-2 text-xs font-medium text-gray-700">{book.title}</span>
                            </div>
                          ))}
                          {(promotion.books?.length || 0) > 5 && (
                            <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                              +{(promotion.books?.length || 0) - 5} sách
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button onClick={() => openEditPromotion(promotion)} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition-colors hover:bg-blue-100" title="Sửa chương trình">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeletePromotionProgram(promotion)} disabled={deletingPromotionId === promotion.id} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100 transition-colors hover:bg-red-100 disabled:opacity-50" title="Xóa chương trình">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPromotions.length === 0 && <EmptyState text="Chưa có chương trình khuyến mãi phù hợp." />}
              </div>
            </div>
          )}

          {false && currentView === 'promotions' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Sách đang khuyến mãi</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{activePromotionBooks.length}</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Mức giảm cao nhất</p>
                  <p className="mt-2 text-3xl font-bold text-orange-600">{maxPromotionDiscount}%</p>
                </div>
                <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Tổng sách có thể áp dụng</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{promotionBooks.length}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm sách để cấu hình khuyến mãi..." />
                <button onClick={() => navigate('/promotions')} className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 font-semibold text-orange-700 transition-colors hover:bg-orange-100">
                  Xem trang khuyến mãi
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Cấu hình khuyến mãi theo sách</h3>
                  <p className="text-sm text-gray-500">Cập nhật giá bán, giá gốc và phần trăm giảm. Sách có % giảm lớn hơn 0 sẽ hiển thị ở trang khuyến mãi.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <TableHead>Sách</TableHead>
                        <TableHead>Giá bán</TableHead>
                        <TableHead>Giá gốc</TableHead>
                        <TableHead>% giảm</TableHead>
                        <TableHead>Hiện trạng</TableHead>
                        <TableHead align="right">Thao tác</TableHead>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPromotionBooks.map((book) => {
                        const draft = promotionDrafts[book.id] || { price: String(book.price ?? ''), originalPrice: String(book.originalPrice ?? book.price ?? ''), discount: String(book.discount ?? 0) };
                        const isUpdating = updatingPromotionBookId === book.id;
                        const isActivePromotion = Number(book.discount || 0) > 0;
                        return (
                          <tr key={book.id} className="hover:bg-orange-50/30">
                            <TableCell>
                              <div className="flex items-center gap-4">
                                <img src={getBookImage(book)} alt={book.title} className="h-16 w-12 rounded-lg object-cover ring-1 ring-gray-200" />
                                <div>
                                  <p className="line-clamp-2 font-semibold text-gray-900">{book.title}</p>
                                  <p className="text-sm text-gray-500">{book.author}</p>
                                  <p className="text-xs text-gray-400">{book.category?.name || 'Chưa phân loại'}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell><input type="number" min="0" value={draft.price} onChange={(event) => handlePromotionDraftChange(book.id, 'price', event.target.value)} className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" /></TableCell>
                            <TableCell><input type="number" min="0" value={draft.originalPrice} onChange={(event) => handlePromotionDraftChange(book.id, 'originalPrice', event.target.value)} className="w-32 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" /></TableCell>
                            <TableCell><input type="number" min="0" max="100" value={draft.discount} onChange={(event) => handlePromotionDraftChange(book.id, 'discount', event.target.value)} className="w-24 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" /></TableCell>
                            <TableCell>{isActivePromotion ? (<span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">Đang giảm {Number(book.discount || 0)}%</span>) : (<span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Chưa áp dụng</span>)}</TableCell>
                            <TableCell align="right"><div className="flex justify-end gap-2"><button onClick={() => handleSavePromotion(book)} disabled={isUpdating} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50">{isUpdating ? 'Đang lưu...' : 'Lưu'}</button><button onClick={() => handleClearPromotion(book)} disabled={isUpdating || !isActivePromotion} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">Tắt sale</button></div></TableCell>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredPromotionBooks.length === 0 && <EmptyState text="Không có sách phù hợp." />}
              </div>
            </div>
          )}

          {currentView === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm danh mục theo tên hoặc mô tả..." />
                <select
                  value={categoryVisibilityFilter}
                  onChange={(event) => setCategoryVisibilityFilter(event.target.value as CategoryVisibilityFilter)}
                  className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="active">Danh mục đang dùng</option>
                  <option value="deleted">Danh mục đã xóa mềm</option>
                  <option value="all">Tất cả danh mục</option>
                </select>
                <select
                  value={categoryBookFilter}
                  onChange={(event) => setCategoryBookFilter(event.target.value as CategoryBookFilter)}
                  className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả số sách</option>
                  <option value="with_books">Có sách</option>
                  <option value="empty">Không có sách</option>
                </select>
                <button
                  onClick={openCreateCategory}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-600"
                >
                  <Plus className="h-5 w-5" />
                  Thêm danh mục
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Tổng danh mục</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{activeCategories.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Đang có sách</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">
                    {activeCategories.filter((category) => getCategoryBookCount(category.id) > 0).length}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Chưa có sách</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {activeCategories.filter((category) => getCategoryBookCount(category.id) === 0).length}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Danh sách danh mục</h3>
                  <p className="text-sm text-gray-500">
                    {filteredCategories.length.toLocaleString('vi-VN')} danh mục phù hợp với bộ lọc hiện tại
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-slate-50/80">
                      <tr>
                        <TableHead>Danh mục</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead>Số sách</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead align="right">Thao tác</TableHead>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCategories.map((category) => {
                        const bookCount = getCategoryBookCount(category.id);
                        const deleted = isCategoryDeleted(category);
                        return (
                          <tr key={category.id} className={`transition-colors hover:bg-orange-50/30 ${deleted ? 'bg-gray-50/80 opacity-80' : 'bg-white'}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                                  <FolderTree className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-950">{category.name}</p>
                                  <div className="mt-1 flex items-center gap-2">
                                    <p className="text-xs text-gray-500">{category.id.slice(0, 8)}</p>
                                    {deleted && (
                                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                        Đã xóa mềm
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="max-w-xl line-clamp-2 text-gray-600">
                                {category.description || 'Chưa có mô tả'}
                              </p>
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                                bookCount > 0
                                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                                  : 'bg-gray-100 text-gray-600 ring-gray-200'
                              }`}>
                                {bookCount.toLocaleString('vi-VN')} sách
                              </span>
                            </TableCell>
                            <TableCell>{formatDate(category.createdAt)}</TableCell>
                            <TableCell align="right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => openEditCategory(category)}
                                  disabled={deleted}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Chỉnh sửa danh mục"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleSoftDeleteCategory(category)}
                                  disabled={deletingCategoryId === category.id || deleted}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Xóa mềm danh mục"
                                >
                                  <ArchiveX className="h-4 w-4" />
                                </button>
                                {deleted && (
                                  <button
                                    onClick={() => handleRestoreCategory(category)}
                                    disabled={deletingCategoryId === category.id}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 ring-1 ring-green-100 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                                    title="Khôi phục danh mục"
                                  >
                                    <RefreshCcw className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleHardDeleteCategory(category)}
                                  disabled={deletingCategoryId === category.id}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Xóa cứng danh mục"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </TableCell>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredCategories.length === 0 && <EmptyState text="Không có danh mục phù hợp." />}
              </div>
            </div>
          )}

          {currentView === 'orders' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {orderStatusSummary.map((item) => (
                  <button
                    key={item.status}
                    type="button"
                    onClick={() => setStatusFilter(item.status)}
                    className={`rounded-2xl border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                      statusFilter === item.status ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.className}`}>
                        {item.label}
                      </span>
                      <ShoppingCart className="h-5 w-5 text-gray-300" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-gray-900">
                      {item.count.toLocaleString('vi-VN')}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Đơn hàng</div>
                  </button>
                ))}
              </div>

              {cancelRequestOrders.length > 0 && (
              <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-1 h-6 w-6 text-yellow-700" />
                    <div>
                      <h3 className="text-lg font-bold text-yellow-900">Yêu cầu hủy từ khách hàng</h3>
                      <p className="mt-1 text-sm text-yellow-800">
                        Có {cancelRequestOrders.length.toLocaleString('vi-VN')} đơn đang chờ admin xử lý yêu cầu hủy.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCancelRequestsOnly((value) => !value)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                        showCancelRequestsOnly
                          ? 'bg-yellow-700 text-white hover:bg-yellow-800'
                          : 'border border-yellow-300 bg-white text-yellow-800 hover:bg-yellow-100'
                      }`}
                    >
                      {showCancelRequestsOnly ? 'Hiển thị tất cả đơn' : 'Chỉ xem yêu cầu hủy'}
                    </button>
                    {cancelRequestOrders[0] && (
                      <button
                        type="button"
                        onClick={() => openOrderDetail(cancelRequestOrders[0])}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                      >
                        Xử lý yêu cầu mới nhất
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )}

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm đơn theo mã, khách hàng, email..." />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'all' | AdminOrderStatus)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="PENDING">Chờ xử lý</option>
                  <option value="PROCESSING">Đang xử lý</option>
                  <option value="SHIPPED">Đang giao</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>

              <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Ngày đặt</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead align="right">Thao tác</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <TableCell>
                          <p className="font-medium text-gray-800">{order.orderCode || order.id.slice(0, 8)}</p>
                        </TableCell>
                        <TableCell>
                          <p className="text-gray-800">{order.customerName || 'Khách hàng'}</p>
                          <p className="text-sm text-gray-500">{order.customerEmail}</p>
                        </TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{order.totalItems || 0}</TableCell>
                        <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                            {getOrderStatusText(order.status)}
                          </span>
                          {hasPendingCustomerCancelRequest(order) && (
                            <span className="ml-2 inline-flex rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                              Khách yêu cầu hủy
                            </span>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            {hasPendingCustomerCancelRequest(order) && (
                              <button
                                onClick={() => openOrderDetail(order)}
                                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
                              >
                                Xử lý hủy
                              </button>
                            )}
                            <button
                              onClick={() => openOrderDetail(order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOrders.length === 0 && <EmptyState text="Không có đơn hàng phù hợp." />}
              </div>
            </div>
          )}

          {currentView === 'customers' && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Tổng tài khoản</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{customers.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Đang hoạt động</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600">{activeUsers.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Đã khóa</p>
                  <p className="mt-2 text-3xl font-bold text-red-600">{lockedUsers.length}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-gray-500">Chưa xác thực</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">{unverifiedUsers.length}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Tạo tài khoản mới</h3>
                  <p className="mt-1 text-sm text-gray-500">Admin có thể tạo tài khoản khách hàng hoặc nhân viên để sử dụng hệ thống.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openCreateUserModal('CUSTOMER')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 px-4 py-2 font-semibold text-orange-600 transition-colors hover:bg-orange-50"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo khách hàng
                  </button>
                  <button
                    type="button"
                    onClick={() => openCreateUserModal('STAFF')}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4" />
                    Tạo nhân viên
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
                  <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo tên, username hoặc email..." />
                  <select
                    value={userRoleFilter}
                    onChange={(event) => setUserRoleFilter(event.target.value as UserRoleFilter)}
                    className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">Tất cả vai trò</option>
                    <option value="CUSTOMER">Khách hàng</option>
                    <option value="STAFF">Nhân viên</option>
                    <option value="ADMIN">Admin</option>
                    <option value="GUEST">Khách vãng lai</option>
                  </select>
                  <select
                    value={userLockFilter}
                    onChange={(event) => setUserLockFilter(event.target.value as UserLockFilter)}
                    className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="locked">Đã khóa</option>
                  </select>
                  <select
                    value={userVerifiedFilter}
                    onChange={(event) => setUserVerifiedFilter(event.target.value as UserVerifiedFilter)}
                    className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">Tất cả xác thực</option>
                    <option value="verified">Đã xác thực</option>
                    <option value="unverified">Chưa xác thực</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-100 px-5 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Danh sách tài khoản</h3>
                  <p className="text-sm text-gray-500">
                    {filteredCustomers.length.toLocaleString('vi-VN')} tài khoản phù hợp với bộ lọc hiện tại
                  </p>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHead>Tài khoản</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Xác thực</TableHead>
                      <TableHead>Ngày tham gia</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead align="right">Thao tác</TableHead>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer.fullName || customer.userName)}&background=F97316&color=fff`}
                              alt={customer.fullName || customer.userName}
                              className="w-10 h-10 rounded-full"
                            />
                            <div>
                              <p className="font-medium text-gray-800">{customer.fullName || customer.userName}</p>
                              <p className="text-xs text-gray-500">{customer.role}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>
                          <select
                            value={customer.role}
                            disabled={updatingUserId === customer.id || customer.id === user?.id}
                            onChange={(event) => handleChangeUserRole(customer, event.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="STAFF">STAFF</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="GUEST">GUEST</option>
                          </select>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${customer.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                            {customer.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(customer.createdAt)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${customer.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {customer.isLocked ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              disabled={updatingUserId === customer.id || customer.id === user?.id}
                              onClick={() => handleToggleUserLock(customer)}
                              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                                customer.isLocked
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-red-50 text-red-700 hover:bg-red-100'
                              }`}
                            >
                              {customer.isLocked ? 'Mở khóa' : 'Khóa'}
                            </button>
                            <button
                              type="button"
                              disabled={updatingUserId === customer.id}
                              onClick={() => handleResetUserPassword(customer)}
                              className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                            >
                              Reset MK
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
                {filteredCustomers.length === 0 && <EmptyState text="Không có khách hàng phù hợp." />}
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Cài đặt</h3>
              <p className="text-gray-600">Khu vực cài đặt sẽ được kết nối theo các API cấu hình khi backend bổ sung.</p>
            </div>
          )}
        </div>
      </main>

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateUser} className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Tạo tài khoản</h3>
                <p className="text-sm text-gray-500">Tạo tài khoản khách hàng hoặc nhân viên mới.</p>
              </div>
              <button
                type="button"
                disabled={savingUser}
                onClick={() => {
                  setShowUserModal(false);
                  resetUserForm();
                }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <UserInput
                label="Tên đăng nhập"
                required
                value={userForm.userName}
                onChange={(value) => setUserForm((prev) => ({ ...prev, userName: value }))}
              />
              <UserInput
                label="Họ và tên"
                value={userForm.fullName || ''}
                onChange={(value) => setUserForm((prev) => ({ ...prev, fullName: value }))}
              />
              <UserInput
                label="Email"
                type="email"
                required
                value={userForm.email}
                onChange={(value) => setUserForm((prev) => ({ ...prev, email: value }))}
              />
              <UserInput
                label="Số điện thoại"
                value={userForm.phone || ''}
                onChange={(value) => setUserForm((prev) => ({ ...prev, phone: value }))}
              />
              <UserInput
                label="Mật khẩu"
                type="password"
                required
                value={userForm.password}
                onChange={(value) => setUserForm((prev) => ({ ...prev, password: value }))}
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Vai trò <span className="text-red-500">*</span>
                </label>
                <select
                  value={userForm.role}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value as 'CUSTOMER' | 'STAFF' }))}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="CUSTOMER">Khách hàng</option>
                  <option value="STAFF">Nhân viên</option>
                </select>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 md:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(userForm.isVerified)}
                  onChange={(event) => setUserForm((prev) => ({ ...prev, isVerified: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Đánh dấu email đã xác thực</span>
              </label>
              <div className="rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-700 md:col-span-2">
                Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                disabled={savingUser}
                onClick={() => {
                  setShowUserModal(false);
                  resetUserForm();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={savingUser}
                className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {savingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
              </button>
            </div>
          </form>
        </div>
      )}

      {categoryModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {categoryModalMode === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}
                </h3>
                <p className="text-sm text-gray-500">Quản lý nhóm sách hiển thị trên website.</p>
              </div>
              <button
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                onClick={() => {
                  setCategoryModalMode(null);
                  resetCategoryForm();
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tên danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  value={categoryForm.name}
                  onChange={(event) => handleCategoryInput('name', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
                  placeholder="Ví dụ: Kỹ năng sống"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={categoryForm.description}
                  onChange={(event) => handleCategoryInput('description', event.target.value)}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
                  placeholder="Mô tả ngắn giúp khách hàng hiểu nhóm sách này"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setCategoryModalMode(null);
                  resetCategoryForm();
                }}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                disabled={savingCategory}
                className="rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingCategory ? 'Đang lưu...' : 'Lưu danh mục'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bookModalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                {bookModalMode === 'create' && 'Thêm sách mới'}
                {bookModalMode === 'edit' && 'Chỉnh sửa sách'}
                {bookModalMode === 'detail' && 'Chi tiết sách'}
              </h3>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={closeBookModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookModalMode === 'detail' && selectedBook ? (
              <div className="p-6 space-y-6">
                {getPromotionForBook(selectedBook.id) && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Percent className="h-5 w-5 text-orange-600" />
                          <h4 className="font-bold text-orange-900">Sách đang thuộc chương trình khuyến mãi</h4>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
                            {getPromotionStatusLabel(getPromotionForBook(selectedBook.id))}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-orange-800">
                          {getPromotionForBook(selectedBook.id)?.name} - giảm {getPromotionForBook(selectedBook.id)?.discountPercent}%.
                        </p>
                        <p className="mt-1 text-xs text-orange-700">
                          Thời gian: {formatDate(getPromotionForBook(selectedBook.id)?.startsAt)} - {formatDate(getPromotionForBook(selectedBook.id)?.endsAt)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-white px-4 py-3 text-right ring-1 ring-orange-100">
                        <p className="text-xs font-medium text-gray-500">Giá sau khuyến mãi</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(selectedBook.price)}</p>
                        {Number(selectedBook.discount || 0) > 0 && (
                          <p className="text-xs text-gray-400 line-through">{formatCurrency(selectedBook.originalPrice)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-6 md:flex-row">
                  <img
                    src={getBookImage(selectedBook)}
                    alt={selectedBook.title}
                    className="w-full max-w-48 aspect-[3/4] object-cover rounded-lg border border-gray-200"
                  />
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h4>
                      <p className="text-gray-600">{selectedBook.author}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InfoBlock
                        title="Thông tin bán hàng"
                        rows={[
                          ['Danh mục', selectedBook.category?.name || 'Chưa phân loại'],
                          ['Giá bán', formatCurrency(selectedBook.price)],
                          ['Giá gốc', formatCurrency(selectedBook.originalPrice)],
                          ['Tồn kho', String(selectedBook.stock ?? 0)],
                          ['Đã bán', String(selectedBook.soldCount ?? 0)],
                        ]}
                      />
                      <InfoBlock
                        title="Thông tin xuất bản"
                        rows={[
                          ['ISBN', selectedBook.isbn || 'Đang cập nhật'],
                          ['NXB', selectedBook.publisher || 'Đang cập nhật'],
                          ['Năm XB', selectedBook.publishYear ? String(selectedBook.publishYear) : 'Đang cập nhật'],
                          ['Số trang', selectedBook.pages ? String(selectedBook.pages) : 'Đang cập nhật'],
                          ['Ngôn ngữ', selectedBook.language || 'Đang cập nhật'],
                        ]}
                      />
                    </div>
                  </div>
                </div>
                <BookImageGallery images={getBookImageItems(selectedBook)} />
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Mô tả</h4>
                  <p className="text-gray-800 leading-6 whitespace-pre-line">{selectedBook.description}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <BookInput label="Tên sách" value={bookForm.title} onChange={(value) => handleBookInput('title', value)} required />
                  <BookInput label="Tác giả" value={bookForm.author} onChange={(value) => handleBookInput('author', value)} required />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Danh mục <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bookForm.categoryId}
                      onChange={(event) => handleBookInput('categoryId', event.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Chọn danh mục</option>
                      {activeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <BookInput label="ISBN" value={bookForm.isbn} onChange={(value) => handleBookInput('isbn', value)} required />
                  <BookInput label="Giá gốc" type="number" value={bookForm.originalPrice} onChange={(value) => handleBookInput('originalPrice', value)} required />
                  {bookModalMode === 'edit' && selectedBook && (
                    <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
                      <p className="text-sm font-medium text-gray-700">Giá bán hiện tại</p>
                      <p className="mt-1 text-lg font-bold text-orange-600">{formatCurrency(selectedBook.price)}</p>
                      <p className="mt-1 text-xs text-gray-500">Tự cập nhật theo chương trình khuyến mãi.</p>
                    </div>
                  )}
                  <BookInput label="Tồn kho" type="number" value={bookForm.stock} onChange={(value) => handleBookInput('stock', value)} required />
                  <BookInput label="Nhà xuất bản" value={bookForm.publisher || ''} onChange={(value) => handleBookInput('publisher', value)} />
                  <BookInput label="Năm xuất bản" type="number" value={bookForm.publishYear || ''} onChange={(value) => handleBookInput('publishYear', value)} />
                  <BookInput label="Số trang" type="number" value={bookForm.pages || ''} onChange={(value) => handleBookInput('pages', value)} />
                  <BookInput label="Ngôn ngữ" value={bookForm.language || ''} onChange={(value) => handleBookInput('language', value)} />
                  <BookInput label="Ngày phát hành" type="date" value={bookForm.releaseDate || ''} onChange={(value) => handleBookInput('releaseDate', value)} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mô tả <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={bookForm.description}
                    onChange={(event) => handleBookInput('description', event.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    placeholder="Nhập mô tả sách"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ảnh sách {bookModalMode === 'create' && <span className="text-red-500">*</span>}
                  </label>
                  {bookModalMode === 'edit' && selectedBook && (
                    <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-700">Ảnh hiện có</p>
                        {deletedImageIds.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setDeletedImageIds([])}
                            className="text-xs font-medium text-orange-600 hover:text-orange-700"
                          >
                            Hoàn tác xóa ảnh
                          </button>
                        )}
                      </div>
                      <BookImageGallery
                        images={getBookImageItems(selectedBook)}
                        compact
                        deletedImageIds={deletedImageIds}
                        onToggleDelete={toggleDeleteImage}
                      />
                      {getVisibleBookImageItems(selectedBook).length === 0 && (
                        <p className="mt-2 text-xs text-red-600">
                          Bạn đang chọn xóa toàn bộ ảnh hiện có. Hãy upload ít nhất một ảnh mới trước khi lưu.
                        </p>
                      )}
                    </div>
                  )}
                  <input
                    ref={bookImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => {
                      const isValid = handleBookImagesChange(event.target.files);
                      if (!isValid) event.currentTarget.value = '';
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {bookFormError && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{bookFormError}</span>
                    </div>
                  )}
                  {bookImagePreviews.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-700">Ảnh vừa chọn</p>
                        <button
                          type="button"
                          onClick={clearSelectedBookImages}
                          className="text-xs font-medium text-orange-600 hover:text-orange-700"
                        >
                          Bỏ chọn ảnh
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                        {bookImagePreviews.map((preview, index) => (
                          <div key={preview.url} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                            <img
                              src={preview.url}
                              alt={`Ảnh vừa chọn ${index + 1}`}
                              className="h-32 w-full object-cover"
                            />
                            <div className="space-y-0.5 px-2 py-1.5">
                              <p className="truncate text-xs font-medium text-gray-700" title={preview.name}>
                                {preview.name}
                              </p>
                              <p className="text-xs text-gray-500">{formatFileSize(preview.size)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Hỗ trợ jpg, png, webp. Tối đa 5 ảnh, mỗi ảnh 2MB. Khi sửa, ảnh mới sẽ được thêm vào bộ ảnh hiện có; các ảnh được đánh dấu xóa sẽ bị xóa khi lưu.
                  </p>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={closeBookModal}
              >
                {bookModalMode === 'detail' ? 'Đóng' : 'Hủy'}
              </button>
              {bookModalMode !== 'detail' && (
                <button
                  onClick={handleSaveBook}
                  disabled={savingBook}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {savingBook ? 'Đang lưu...' : 'Lưu sách'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {promotionModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {promotionModalMode === 'edit' ? 'Sửa chương trình khuyến mãi' : 'Tạo chương trình khuyến mãi'}
                </h3>
                <p className="text-sm text-gray-500">Chọn sách để áp dụng giá khuyến mãi tự động.</p>
              </div>
              <button
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                onClick={() => setPromotionModalMode(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              {promotionFormError && (
                <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{promotionFormError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Tên chương trình</label>
                  <input
                    value={promotionForm.name}
                    onChange={(event) => handlePromotionFormInput('name', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Ví dụ: Sale hè 2026"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Phần trăm giảm</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={promotionForm.discountPercent}
                    onChange={(event) => handlePromotionFormInput('discountPercent', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={promotionForm.startsAt || ''}
                    onChange={(event) => handlePromotionFormInput('startsAt', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={promotionForm.endsAt || ''}
                    onChange={(event) => handlePromotionFormInput('endsAt', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Trạng thái</label>
                  <select
                    value={promotionForm.status}
                    onChange={(event) => handlePromotionFormInput('status', event.target.value as AdminPromotionPayload['status'])}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ACTIVE">Đang áp dụng</option>
                    <option value="INACTIVE">Tạm tắt</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Số sách đã chọn</label>
                  <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 font-semibold text-orange-700">
                    {promotionForm.bookIds.length} / {promotionBooks.length} sách
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Mô tả</label>
                <textarea
                  rows={3}
                  value={promotionForm.description || ''}
                  onChange={(event) => handlePromotionFormInput('description', event.target.value)}
                  className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ghi chú ngắn về chương trình"
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Ảnh banner slider {promotionModalMode === 'create' && <span className="text-red-500">*</span>}
                  </label>
                  {(promotionBannerPreview || promotionForm.bannerImageUrl) && (
                    <button
                      type="button"
                      onClick={clearPromotionBanner}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700"
                    >
                      Bỏ chọn ảnh
                    </button>
                  )}
                </div>
                <input
                  ref={promotionBannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const isValid = handlePromotionBannerChange(event.target.files);
                    if (!isValid) event.currentTarget.value = '';
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="mt-2 text-xs text-gray-500">Hỗ trợ jpg, png, webp. Tối đa 2MB. Ảnh này sẽ hiển thị trên slider trang chủ khi chương trình đang áp dụng.</p>
                {(promotionBannerPreview || promotionForm.bannerImageUrl) && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    <img
                      src={promotionBannerPreview || promotionForm.bannerImageUrl || ''}
                      alt="Ảnh banner khuyến mãi"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-200">
                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <h4 className="font-semibold text-gray-900">Sách áp dụng</h4>
                    <span className="text-sm text-gray-500">
                      Đang hiện {filteredPromotionModalBooks.length} / {promotionBooks.length} sách
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto]">
                    <input
                      value={promotionBookSearch}
                      onChange={(event) => setPromotionBookSearch(event.target.value)}
                      placeholder="Tìm theo tên sách, tác giả, ISBN..."
                      className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <select
                      value={promotionCategoryFilter}
                      onChange={(event) => setPromotionCategoryFilter(event.target.value)}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">Tất cả danh mục</option>
                      {activeCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={promotionStockFilter}
                      onChange={(event) => setPromotionStockFilter(event.target.value as PromotionBookStockFilter)}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">Tất cả tồn kho</option>
                      <option value="in_stock">Còn hàng</option>
                      <option value="low_stock">Sắp hết hàng</option>
                      <option value="out_of_stock">Hết hàng</option>
                    </select>
                    <label className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={showSelectedPromotionBooksOnly}
                        onChange={(event) => setShowSelectedPromotionBooksOnly(event.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      Đã chọn
                    </label>
                  </div>
                </div>
                <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto p-4 md:grid-cols-2">
                  {filteredPromotionModalBooks.map((book) => {
                    const checked = promotionForm.bookIds.includes(book.id);
                    return (
                      <label key={book.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${checked ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePromotionBook(book.id)}
                          className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        />
                        <img src={getBookImage(book)} alt={book.title} className="h-14 w-10 rounded object-cover ring-1 ring-gray-200" />
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-gray-900">{book.title}</p>
                          <p className="text-xs text-gray-500">{book.author}</p>
                          <p className="text-xs text-gray-400">{formatCurrency(book.price)}</p>
                        </div>
                      </label>
                    );
                  })}
                  {filteredPromotionModalBooks.length === 0 && (
                    <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                      Không có sách phù hợp với bộ lọc.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-100"
                onClick={() => setPromotionModalMode(null)}
              >
                Hủy
              </button>
              <button
                onClick={handleSavePromotionProgram}
                disabled={savingPromotion}
                className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
              >
                <CheckCircle2 className="h-5 w-5" />
                {savingPromotion ? 'Đang lưu...' : 'Lưu chương trình'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">
                Chi tiết đơn {selectedOrder.orderCode || selectedOrder.id.slice(0, 8)}
              </h3>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setSelectedOrder(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <InfoBlock
                  title="Thông tin đơn hàng"
                  rows={[
                    ['Mã đơn', selectedOrder.orderCode || selectedOrder.id],
                    ['Ngày đặt', formatDate(selectedOrder.createdAt)],
                    ['Trạng thái', getOrderStatusText(selectedOrder.status)],
                  ]}
                />
                <InfoBlock
                  title="Thông tin khách hàng"
                  rows={[
                    ['Họ tên', selectedOrder.user?.fullName || selectedOrder.user?.userName || 'Khách hàng'],
                    ['Email', selectedOrder.user?.email || 'Đang cập nhật'],
                    ['Số điện thoại', selectedOrder.address?.phone || 'Đang cập nhật'],
                  ]}
                />
              </div>

              {hasPendingCustomerCancelRequest(selectedOrder) && (
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-700" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900">Khách hàng yêu cầu hủy đơn</h4>
                      <p className="mt-1 text-sm leading-6 text-yellow-800">
                        {getLatestCancelNote(selectedOrder) || 'Khách đã gửi yêu cầu hủy đơn hàng này.'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleUpdateStatus('CANCELLED')}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          Duyệt hủy đơn
                        </button>
                        <button
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => openCancelDecisionDialog('reject')}
                          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                        >
                          Từ chối yêu cầu
                        </button>
                        {selectedOrder.status === 'PENDING' && (
                          <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() => handleUpdateStatus('PROCESSING')}
                            className="rounded-lg border border-yellow-300 bg-white px-4 py-2 text-sm font-semibold text-yellow-800 transition-colors hover:bg-yellow-100 disabled:opacity-50"
                          >
                            Tiếp tục xử lý
                          </button>
                        )}
                        {selectedOrder.status === 'PROCESSING' && (
                          <button
                            type="button"
                            disabled={updatingStatus}
                            onClick={() => handleUpdateStatus('SHIPPED')}
                            className="rounded-lg border border-yellow-300 bg-white px-4 py-2 text-sm font-semibold text-yellow-800 transition-colors hover:bg-yellow-100 disabled:opacity-50"
                          >
                            Chuyển sang đang giao
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrder.status === 'CANCELLED' && getLatestCancelNote(selectedOrder) && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <h4 className="font-semibold text-red-800">Lý do hủy đơn</h4>
                      <p className="mt-1 text-sm leading-6 text-red-700">{getLatestCancelNote(selectedOrder)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Địa chỉ giao hàng</h4>
                <p className="text-gray-800">
                  {[
                    selectedOrder.address?.addressLine,
                    selectedOrder.address?.wardName || selectedOrder.address?.ward,
                    selectedOrder.address?.districtName || selectedOrder.address?.district,
                    selectedOrder.address?.provinceName || selectedOrder.address?.city,
                    selectedOrder.address?.country,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Đang cập nhật'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <InfoBlock
                  title="Thanh toán"
                  rows={[
                    ['Phương thức', getPaymentMethodText(selectedOrder.payments?.[0]?.method)],
                    ['Trạng thái', getPaymentStatusText(selectedOrder.payments?.[0]?.status)],
                    ['Số tiền', formatCurrency(selectedOrder.payments?.[0]?.amount || selectedOrder.totalAmount)],
                  ]}
                />
                <InfoBlock
                  title="Xử lý đơn"
                  rows={[
                    ['Cập nhật lần cuối', formatDate(selectedOrder.updatedAt)],
                    ['Bước tiếp theo', getNextStatuses(selectedOrder.status).map(getOrderStatusText).join(', ') || 'Không còn thao tác'],
                  ]}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Sản phẩm</h4>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <TableHead>Tên sách</TableHead>
                        <TableHead align="right">Số lượng</TableHead>
                        <TableHead align="right">Đơn giá</TableHead>
                        <TableHead align="right">Thành tiền</TableHead>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(selectedOrder.items || []).map((item) => (
                        <tr key={item.id}>
                          <TableCell>{item.book?.title || 'Sách'}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.subTotal)}</TableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
                <span className="text-lg font-medium text-gray-600">Tổng cộng</span>
                <span className="text-2xl font-bold text-orange-500">{formatCurrency(selectedOrder.totalAmount)}</span>
              </div>

              {(selectedOrder.statusLogs || []).length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="font-medium text-gray-800 mb-4">Lịch sử xử lý</h4>
                  <div className="space-y-3">
                    {[...(selectedOrder.statusLogs || [])]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((log) => (
                        <div key={log.id} className="rounded-lg bg-gray-50 p-3">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm font-semibold text-gray-800">
                              {getOrderStatusText(log.fromStatus)} → {getOrderStatusText(log.toStatus)}
                            </div>
                            <div className="text-xs text-gray-500">{formatDate(log.createdAt)}</div>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Người cập nhật:{' '}
                            {log.changedByUser?.fullName || log.changedByUser?.userName || log.changedByUser?.email || 'Khách hàng / hệ thống'}
                          </div>
                          {log.note && <p className="mt-2 text-sm leading-6 text-gray-700">{log.note}</p>}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {getNextStatuses(selectedOrder.status).length > 0 && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <h4 className="font-medium text-gray-800 mb-3">Cập nhật trạng thái</h4>
                  <div className="flex flex-wrap gap-2">
                    {getNextStatuses(selectedOrder.status).map((status) => (
                      <button
                        key={status}
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus(status)}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {getOrderStatusText(status)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

function BookInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

function UserInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

function BookImageGallery({
  images,
  compact = false,
  deletedImageIds = [],
  onToggleDelete,
}: {
  images: ExistingBookImage[];
  compact?: boolean;
  deletedImageIds?: string[];
  onToggleDelete?: (imageId?: string) => void;
}) {
  if (images.length === 0) {
    return <p className="text-sm text-gray-500">Chưa có ảnh sách.</p>;
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'}`}>
      {images.map((image, index) => {
        const isDeleted = Boolean(image.id && deletedImageIds.includes(image.id));

        return (
        <div
          key={`${image.url}-${index}`}
          className={`relative overflow-hidden rounded-lg border bg-white ${
            isDeleted ? 'border-red-300 opacity-60' : 'border-gray-200'
          }`}
        >
          <img
            src={image.url}
            alt={`Ảnh sách ${index + 1}`}
            className={`${compact ? 'h-24' : 'h-32'} w-full object-cover`}
          />
          {onToggleDelete && image.id && (
            <button
              type="button"
              onClick={() => onToggleDelete(image.id)}
              className={`absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-medium shadow-sm ${
                isDeleted
                  ? 'bg-white text-red-600 hover:bg-red-50'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isDeleted ? 'Hoàn tác' : 'Xóa'}
            </button>
          )}
          {image.isPrimary && !isDeleted && (
            <div className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-1 text-xs font-medium text-white">
              Chính
            </div>
          )}
          {isDeleted && (
            <div className="absolute inset-x-0 bottom-0 bg-red-600/90 px-2 py-1 text-center text-xs font-medium text-white">
              Sẽ xóa khi lưu
            </div>
          )}
          {!compact && (
            <div className="px-2 py-1 text-center text-xs text-gray-500">
              Ảnh {index + 1}
            </div>
          )}
        </div>
      );
      })}
    </div>
  );
}

function TableHead({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return <td className={`px-5 py-4 align-top text-sm text-gray-700 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</td>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-10 text-gray-500">
      <BarChart3 className="w-5 h-5" />
      {text}
    </div>
  );
}

function InfoBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-3">{title}</h4>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium text-gray-800 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
