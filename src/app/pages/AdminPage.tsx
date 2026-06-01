import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  ArchiveX,
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
  Settings,
  ShoppingCart,
  Store,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getPromotions } from '../services/promotion.service';
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
  getManagementBookDetail,
  getManagementBooks,
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
  type AdminPaymentMethod,
  type AdminPaymentStatus,
  type AdminOrderStatus,
  type AdminPromotion,
  type AdminPromotionPayload,
  type AdminUser,
  type AdminUserPayload,
} from '../services/admin.service';
import type { ApiBook } from '../services/book.service';
import { getBookImage } from '../utils/book-display';
import logoUrl from '../../assets/logo.png';
import {
  ADMIN_BOOKS_PAGE_SIZE,
  ADMIN_ORDERS_PAGE_SIZE,
  ACCEPTED_BOOK_IMAGE_TYPES,
  EMPTY_ORDER_STATUS_TOTALS,
  LOW_STOCK_THRESHOLD,
  MAX_BOOK_IMAGES,
  MAX_BOOK_IMAGE_SIZE,
  ORDER_STATUS_OPTIONS,
  emptyUserForm,
} from './admin/constants';
import {
  EmptyState,
  InfoBlock,
  SearchBox,
  TableCell,
  TableHead,
} from './admin/components';
import { OrdersView } from './admin/OrdersView';
import { OrderDetailModal } from './admin/OrderDetailModal';
import { BooksView } from './admin/BooksView';
import { BookModal } from './admin/BookModal';
import { PromotionsView } from './admin/PromotionsView';
import { PromotionModal } from './admin/PromotionModal';
import { CategoriesView } from './admin/CategoriesView';
import { CustomersView } from './admin/CustomersView';
import { UserCreateModal } from './admin/UserCreateModal';
import { CategoryModal } from './admin/CategoryModal';
import { CancelDecisionModal, ConfirmDialogModal } from './admin/AdminDialogs';
import { DashboardView } from './admin/DashboardView';
import {
  buildOrderPrintHtml,
  formatCurrency,
  formatDate,
  getOrderOperationNote,
  getOrderStatusText,
  getPaymentMethodText,
  hasCustomerCancelRequest,
  hasPendingCustomerCancelRequest,
} from './admin/utils';
import type {
  AdminView,
  BookCategoryFilter,
  BookImagePreview,
  BookStockFilter,
  BookVisibilityFilter,
  CancelDecisionDialog,
  CategoryBookFilter,
  CategoryVisibilityFilter,
  ConfirmDialog,
  ExistingBookImage,
  OrderAction,
  OrderWorkflowTab,
  PopupMessage,
  PromotionBookStockFilter,
  PromotionDraft,
  PromotionModalMode,
  UserLockFilter,
  UserRoleFilter,
  UserVerifiedFilter,
} from './admin/types';

export function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const bookImageInputRef = useRef<HTMLInputElement | null>(null);
  const promotionBannerInputRef = useRef<HTMLInputElement | null>(null);
  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN';
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminOrderStatus>('all');
  const [orderWorkflowTab, setOrderWorkflowTab] = useState<OrderWorkflowTab>('all');
  const [orderPaymentMethodFilter, setOrderPaymentMethodFilter] = useState<'all' | AdminPaymentMethod>('all');
  const [orderPaymentStatusFilter, setOrderPaymentStatusFilter] = useState<'all' | AdminPaymentStatus>('all');
  const [orderDateFrom, setOrderDateFrom] = useState('');
  const [orderDateTo, setOrderDateTo] = useState('');
  const [showCancelRequestsOnly, setShowCancelRequestsOnly] = useState(false);
  const [bookVisibilityFilter, setBookVisibilityFilter] = useState<BookVisibilityFilter>('active');
  const [bookStockFilter, setBookStockFilter] = useState<BookStockFilter>('all');
  const [bookCategoryFilter, setBookCategoryFilter] = useState<BookCategoryFilter>('all');
  const [bookCurrentPage, setBookCurrentPage] = useState(1);
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
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const [orderTotal, setOrderTotal] = useState(0);
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
  const [orderInternalNote, setOrderInternalNote] = useState('');
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
    { id: 'dashboard' as const, label: isAdmin ? 'Dashboard' : 'Bảng làm việc', icon: LayoutDashboard },
    { id: 'promotions' as const, label: 'Khuyến mãi', icon: Percent },
    { id: 'categories' as const, label: 'Danh mục', icon: FolderTree },
    { id: 'books' as const, label: 'Quản lý sách', icon: BookOpen },
    { id: 'orders' as const, label: 'Đơn hàng', icon: ShoppingCart },
    { id: 'customers' as const, label: 'Khách hàng', icon: Users },
    { id: 'settings' as const, label: 'Cài đặt', icon: Settings },
  ];

  const visibleMenuItems = useMemo(() => {
    if (isAdmin) return menuItems;
    return menuItems.filter((item) => ['dashboard', 'books', 'orders', 'promotions'].includes(item.id));
  }, [isAdmin]);

  useEffect(() => {
    if (!visibleMenuItems.some((item) => item.id === currentView)) {
      setCurrentView(visibleMenuItems[0]?.id || 'orders');
      setSearchQuery('');
    }
  }, [currentView, visibleMenuItems]);

  const orderSearchQuery = currentView === 'orders' ? searchQuery.trim() : '';

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const orderRequestParams = {
        page: orderCurrentPage,
        limit: ADMIN_ORDERS_PAGE_SIZE,
        status: statusFilter === 'all' ? undefined : statusFilter,
        q: orderSearchQuery || undefined,
        cancelRequested: showCancelRequestsOnly || undefined,
        paymentMethod: orderPaymentMethodFilter === 'all' ? undefined : orderPaymentMethodFilter,
        paymentStatus: orderPaymentStatusFilter === 'all' ? undefined : orderPaymentStatusFilter,
        dateFrom: orderDateFrom || undefined,
        dateTo: orderDateTo || undefined,
      };

      if (!isAdmin) {
        const [ordersData, booksData, promotionsData, orderStatusResults] = await Promise.all([
          getAdminOrders(orderRequestParams),
          getManagementBooks({ limit: 50 }),
          getPromotions(),
          Promise.all(ORDER_STATUS_OPTIONS.map((status) => getAdminOrders({ limit: 1, status }))),
        ]);

        setDashboard(null);
        setBooks(booksData.data);
        setPromotions(
          (promotionsData.programs || []).map((program) => ({
            ...program,
            status: 'ACTIVE',
            createdAt: '',
            updatedAt: '',
          }))
        );
        setCategories([]);
        setCustomers([]);
        setOrders(ordersData.data);
        setOrderTotal(ordersData.total);
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
        getAdminOrders(orderRequestParams),
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
      setOrderTotal(ordersData.total);
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
  }, [
    isAdmin,
    currentView,
    orderSearchQuery,
    statusFilter,
    showCancelRequestsOnly,
    orderCurrentPage,
    orderPaymentMethodFilter,
    orderPaymentStatusFilter,
    orderDateFrom,
    orderDateTo,
    bookVisibilityFilter,
    userRoleFilter,
    userLockFilter,
    userVerifiedFilter,
  ]);

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

  const totalBookPages = useMemo(
    () => Math.max(1, Math.ceil(filteredBooks.length / ADMIN_BOOKS_PAGE_SIZE)),
    [filteredBooks.length]
  );

  const paginatedBooks = useMemo(() => {
    const safePage = Math.min(bookCurrentPage, totalBookPages);
    const start = (safePage - 1) * ADMIN_BOOKS_PAGE_SIZE;
    return filteredBooks.slice(start, start + ADMIN_BOOKS_PAGE_SIZE);
  }, [bookCurrentPage, filteredBooks, totalBookPages]);

  useEffect(() => {
    if (bookCurrentPage > totalBookPages) {
      setBookCurrentPage(totalBookPages);
    }
  }, [bookCurrentPage, totalBookPages]);

  useEffect(() => {
    setBookCurrentPage(1);
  }, [searchQuery, bookVisibilityFilter, bookStockFilter, bookCategoryFilter, currentView]);

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
      [order.orderCode, order.customerName, order.customerEmail, order.customerPhone, order.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [orders, currentView, searchQuery, showCancelRequestsOnly]);

  const totalOrderPages = useMemo(
    () => Math.max(1, Math.ceil(orderTotal / ADMIN_ORDERS_PAGE_SIZE)),
    [orderTotal]
  );

  useEffect(() => {
    if (orderCurrentPage > totalOrderPages) {
      setOrderCurrentPage(totalOrderPages);
    }
  }, [orderCurrentPage, totalOrderPages]);

  useEffect(() => {
    setOrderCurrentPage(1);
  }, [statusFilter]);

  useEffect(() => {
    if (currentView === 'orders') {
      setOrderCurrentPage(1);
    }
  }, [
    currentView,
    searchQuery,
    showCancelRequestsOnly,
    orderPaymentMethodFilter,
    orderPaymentStatusFilter,
    orderDateFrom,
    orderDateTo,
  ]);

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
  const bookDerivedCategories = Array.from(
    books.reduce((map, book) => {
      const categoryId = book.categoryId || book.category?.id;
      const categoryName = book.category?.name;
      if (categoryId && categoryName && !map.has(categoryId)) {
        map.set(categoryId, {
          id: categoryId,
          name: categoryName,
          description: book.category?.description || null,
        });
      }
      return map;
    }, new Map<string, AdminCategory>())
  )
    .map(([, category]) => category)
    .sort((left, right) => left.name.localeCompare(right.name, 'vi'));
  const activeCategories = categories.length > 0 ? categories.filter((category) => !isCategoryDeleted(category)) : bookDerivedCategories;
  const outOfStockBooks = books.filter((book) => !isBookDeleted(book) && Number(book.stock || 0) <= 0);
  const lowStockBooks = books.filter((book) => {
    const stock = Number(book.stock || 0);
    return !isBookDeleted(book) && stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  });
  const cancelRequestOrders = orders.filter((order) => hasPendingCustomerCancelRequest(order));
  const cancelRequestCount = showCancelRequestsOnly ? orderTotal : cancelRequestOrders.length;
  const orderWorkflowTabs: Array<{
    id: OrderWorkflowTab;
    label: string;
    count: number;
    status?: AdminOrderStatus;
  }> = [
    {
      id: 'all',
      label: 'Tất cả',
      count: ORDER_STATUS_OPTIONS.reduce((sum, status) => sum + (orderStatusTotals[status] || 0), 0),
    },
    { id: 'pending', label: 'Chờ xác nhận', count: orderStatusTotals.PENDING || 0, status: 'PENDING' },
    { id: 'processing', label: 'Cần đóng gói', count: orderStatusTotals.PROCESSING || 0, status: 'PROCESSING' },
    { id: 'shipped', label: 'Đang giao', count: orderStatusTotals.SHIPPED || 0, status: 'SHIPPED' },
    { id: 'completed', label: 'Hoàn tất', count: orderStatusTotals.COMPLETED || 0, status: 'COMPLETED' },
    { id: 'cancelled', label: 'Đã hủy', count: orderStatusTotals.CANCELLED || 0, status: 'CANCELLED' },
    { id: 'cancel_requests', label: 'Yêu cầu hủy', count: cancelRequestCount },
  ];
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

  const goToOrders = (status?: AdminOrderStatus) => {
    setStatusFilter(status || 'all');
    setOrderCurrentPage(1);
    setOrderWorkflowTab(
      status === 'PENDING'
        ? 'pending'
        : status === 'PROCESSING'
          ? 'processing'
          : status === 'SHIPPED'
            ? 'shipped'
            : status === 'COMPLETED'
              ? 'completed'
              : status === 'CANCELLED'
                ? 'cancelled'
                : 'all'
    );
    setShowCancelRequestsOnly(false);
    setSearchQuery('');
    setCurrentView('orders');
  };

  const goToCancelRequests = () => {
    setStatusFilter('all');
    setOrderCurrentPage(1);
    setOrderWorkflowTab('cancel_requests');
    setShowCancelRequestsOnly(true);
    setSearchQuery('');
    setCurrentView('orders');
  };

  const goToOrderWorkflowTab = (tab: OrderWorkflowTab) => {
    const nextStatus = orderWorkflowTabs.find((item) => item.id === tab)?.status;
    setOrderWorkflowTab(tab);
    setStatusFilter(nextStatus || 'all');
    setShowCancelRequestsOnly(tab === 'cancel_requests');
    setOrderCurrentPage(1);
  };

  const clearOrderFilters = () => {
    setSearchQuery('');
    setOrderPaymentMethodFilter('all');
    setOrderPaymentStatusFilter('all');
    setOrderDateFrom('');
    setOrderDateTo('');
    setOrderCurrentPage(1);
  };

  const goToStockAlerts = (filter: BookStockFilter = 'all') => {
    setBookStockFilter(filter);
    setSearchQuery('');
    setCurrentView('books');
  };

  const stockAlertBooks = [...outOfStockBooks, ...lowStockBooks].sort(
    (a, b) => Number(a.stock || 0) - Number(b.stock || 0)
  );
  const staffWorkCards = [
    {
      id: 'pending',
      title: 'Cần xác nhận',
      value: orderStatusTotals.PENDING || 0,
      helper: 'Đơn mới cần kiểm tra thông tin',
      className: 'border-orange-100 bg-orange-50 text-orange-700',
      iconClassName: 'bg-orange-100 text-orange-700',
      icon: ShoppingCart,
      onClick: () => goToOrders('PENDING'),
    },
    {
      id: 'processing',
      title: 'Cần đóng gói',
      value: orderStatusTotals.PROCESSING || 0,
      helper: 'Đơn đã xác nhận chờ chuẩn bị',
      className: 'border-blue-100 bg-blue-50 text-blue-700',
      iconClassName: 'bg-blue-100 text-blue-700',
      icon: Package,
      onClick: () => goToOrders('PROCESSING'),
    },
    {
      id: 'shipped',
      title: 'Đang giao',
      value: orderStatusTotals.SHIPPED || 0,
      helper: 'Theo dõi đơn đang vận chuyển',
      className: 'border-indigo-100 bg-indigo-50 text-indigo-700',
      iconClassName: 'bg-indigo-100 text-indigo-700',
      icon: ShoppingCart,
      onClick: () => goToOrders('SHIPPED'),
    },
    {
      id: 'cancel',
      title: 'Yêu cầu hủy',
      value: cancelRequestCount,
      helper: 'Cần phản hồi khách hàng',
      className: 'border-rose-100 bg-rose-50 text-rose-700',
      iconClassName: 'bg-rose-100 text-rose-700',
      icon: AlertCircle,
      onClick: () => goToCancelRequests(),
    },
  ];
  const staffPriorityOrders = orders
    .filter(
      (order) =>
        hasPendingCustomerCancelRequest(order) ||
        order.status === 'PENDING' ||
        order.status === 'PROCESSING' ||
        order.status === 'SHIPPED'
    )
    .sort((a, b) => {
      const priority = (order: AdminOrder) => {
        if (hasPendingCustomerCancelRequest(order)) return 0;
        if (order.status === 'PENDING') return 1;
        if (order.status === 'PROCESSING') return 2;
        if (order.status === 'SHIPPED') return 3;
        return 4;
      };
      const cancelDiff = priority(a) - priority(b);
      if (cancelDiff !== 0) return cancelDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

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
  const staffActivePromotions = activePromotions
    .filter(isPromotionCurrentlyActive)
    .sort((a, b) => {
      const left = a.endsAt ? new Date(a.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
      const right = b.endsAt ? new Date(b.endsAt).getTime() : Number.MAX_SAFE_INTEGER;
      return left - right;
    });
  const latestRevenuePoint = dashboard?.revenueData?.[(dashboard?.revenueData?.length || 1) - 1];
  const currentMonthRevenue = Number(latestRevenuePoint?.revenue || 0) * 1_000_000;
  const completedOrderTotal = orderStatusTotals.COMPLETED || 0;
  const cancelledOrderTotal = orderStatusTotals.CANCELLED || 0;
  const allOrderTotal = ORDER_STATUS_OPTIONS.reduce((sum, status) => sum + (orderStatusTotals[status] || 0), 0);
  const averageOrderValue = completedOrderTotal > 0 ? Number(dashboard?.stats.totalRevenue || 0) / completedOrderTotal : 0;
  const completionRate = allOrderTotal > 0 ? Math.round((completedOrderTotal / allOrderTotal) * 100) : 0;
  const cancelRate = allOrderTotal > 0 ? Math.round((cancelledOrderTotal / allOrderTotal) * 100) : 0;
  const adminKpiCards = [
    {
      id: 'month-revenue',
      title: 'Doanh thu tháng này',
      value: formatCurrency(currentMonthRevenue),
      helper: 'Theo đơn đã hoàn thành',
      icon: DollarSign,
      className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      iconClassName: 'bg-emerald-100 text-emerald-700',
      onClick: undefined,
    },
    {
      id: 'orders',
      title: 'Tổng đơn hàng',
      value: (dashboard?.stats.totalOrders || 0).toLocaleString('vi-VN'),
      helper: 'Tất cả trạng thái',
      icon: ShoppingCart,
      className: 'border-blue-100 bg-blue-50 text-blue-700',
      iconClassName: 'bg-blue-100 text-blue-700',
      onClick: () => goToOrders(),
    },
    {
      id: 'pending',
      title: 'Đơn chờ xử lý',
      value: (orderStatusTotals.PENDING || 0).toLocaleString('vi-VN'),
      helper: 'Cần xác nhận',
      icon: AlertCircle,
      className: 'border-orange-100 bg-orange-50 text-orange-700',
      iconClassName: 'bg-orange-100 text-orange-700',
      onClick: () => goToOrders('PENDING'),
    },
    {
      id: 'cancel',
      title: 'Yêu cầu hủy',
      value: cancelRequestCount.toLocaleString('vi-VN'),
      helper: 'Cần phản hồi',
      icon: ArchiveX,
      className: 'border-rose-100 bg-rose-50 text-rose-700',
      iconClassName: 'bg-rose-100 text-rose-700',
      onClick: () => goToCancelRequests(),
    },
    {
      id: 'books',
      title: 'Sách đang bán',
      value: books.filter((book) => !isBookDeleted(book)).length.toLocaleString('vi-VN'),
      helper: `${stockAlertBooks.length.toLocaleString('vi-VN')} sách cần chú ý`,
      icon: BookOpen,
      className: 'border-indigo-100 bg-indigo-50 text-indigo-700',
      iconClassName: 'bg-indigo-100 text-indigo-700',
      onClick: () => {
        setBookVisibilityFilter('active');
        setCurrentView('books');
      },
    },
    {
      id: 'customers',
      title: 'Khách hàng',
      value: (dashboard?.stats.totalCustomers || 0).toLocaleString('vi-VN'),
      helper: 'Tài khoản khách',
      icon: Users,
      className: 'border-sky-100 bg-sky-50 text-sky-700',
      iconClassName: 'bg-sky-100 text-sky-700',
      onClick: () => setCurrentView('customers'),
    },
  ];
  const adminActionItems = [
    {
      id: 'pending-orders',
      label: `${(orderStatusTotals.PENDING || 0).toLocaleString('vi-VN')} đơn chờ xác nhận`,
      helper: 'Kiểm tra thông tin khách và chuyển sang đóng gói.',
      actionLabel: 'Xem don',
      hidden: (orderStatusTotals.PENDING || 0) === 0,
      onClick: () => goToOrders('PENDING'),
    },
    {
      id: 'packing-orders',
      label: `${(orderStatusTotals.PROCESSING || 0).toLocaleString('vi-VN')} đơn cần đóng gói`,
      helper: 'Theo dõi tiến độ chuẩn bị hàng.',
      actionLabel: 'Đóng gói',
      hidden: (orderStatusTotals.PROCESSING || 0) === 0,
      onClick: () => goToOrders('PROCESSING'),
    },
    {
      id: 'cancel-requests',
      label: `${cancelRequestCount.toLocaleString('vi-VN')} yêu cầu hủy`,
      helper: 'Duyệt hoặc từ chối yêu cầu hủy từ khách.',
      actionLabel: 'Xử lý',
      hidden: cancelRequestCount === 0,
      onClick: () => goToCancelRequests(),
    },
    {
      id: 'stock-alerts',
      label: `${stockAlertBooks.length.toLocaleString('vi-VN')} sách tồn kho thấp`,
      helper: 'Ưu tiên sách hết hàng và sắp hết.',
      actionLabel: 'Xem sách',
      hidden: stockAlertBooks.length === 0,
      onClick: () => goToStockAlerts(stockAlertBooks.some((book) => Number(book.stock || 0) <= 0) ? 'out_of_stock' : 'low_stock'),
    },
    {
      id: 'ending-promotions',
      label: `${staffActivePromotions.filter((promotion) => promotion.endsAt && new Date(promotion.endsAt).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000).length.toLocaleString('vi-VN')} khuyến mãi sắp hết`,
      helper: 'Kiểm tra chương trình cần gia hạn hoặc thay banner.',
      actionLabel: 'Xem KM',
      hidden: staffActivePromotions.filter((promotion) => promotion.endsAt && new Date(promotion.endsAt).getTime() - Date.now() <= 3 * 24 * 60 * 60 * 1000).length === 0,
      onClick: () => setCurrentView('promotions'),
    },
  ].filter((item) => !item.hidden);
  const adminOrderStatusChartData = ORDER_STATUS_OPTIONS.map((status) => ({
    status,
    label: getOrderStatusText(status),
    count: orderStatusTotals[status] || 0,
  }));
  const adminHealthMetrics = [
    { label: 'Giá trị TB / đơn hoàn thành', value: formatCurrency(averageOrderValue) },
    { label: 'Tỷ lệ hoàn thành', value: `${completionRate}%` },
    { label: 'Tỷ lệ hủy', value: `${cancelRate}%` },
  ];
  const getPromotionRemainingText = (promotion: AdminPromotion) => {
    if (!promotion.endsAt) return 'Chưa có ngày kết thúc';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endsAt = new Date(promotion.endsAt);
    endsAt.setHours(0, 0, 0, 0);
    const days = Math.ceil((endsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'Đã hết hạn';
    if (days === 0) return 'Kết thúc hôm nay';
    return `Còn ${days} ngày`;
  };
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

  const openOrderDetail = async (order: AdminOrder) => {
    try {
      const detail = await getAdminOrderDetail(order.id);
      setSelectedOrder(detail);
      setOrderInternalNote('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải chi tiết đơn hàng');
    }
  };

  const closeOrderDetail = () => {
    setSelectedOrder(null);
    setOrderInternalNote('');
  };

  const handlePrintOrder = (order: AdminOrderDetail) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      showPopup({ type: 'error', text: 'Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup và thử lại.' });
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildOrderPrintHtml(order));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handlePrintOrderFromList = async (order: AdminOrder) => {
    try {
      const detail = await getAdminOrderDetail(order.id);
      handlePrintOrder(detail);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải chi tiết đơn hàng để in phiếu');
    }
  };

  const handleCopyText = async (value?: string | null, label = 'Nội dung') => {
    const text = value?.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showPopup({ type: 'success', text: `Đã copy ${label}.` });
    } catch {
      showPopup({ type: 'error', text: `Không thể copy ${label}.` });
    }
  };

  const getOrderActions = (order: AdminOrder | AdminOrderDetail, placement: 'table' | 'modal'): OrderAction[] => {
    const actions: OrderAction[] = [];
    const hasCancelRequest = hasPendingCustomerCancelRequest(order);

    if (hasCancelRequest) {
      if (placement === 'table') {
        actions.push({ key: 'view_cancel', label: 'Xử lý hủy', group: 'cancel', variant: 'danger' });
      } else {
        actions.push({ key: 'approve_cancel', label: 'Duyệt hủy đơn', group: 'cancel', variant: 'danger' });
        actions.push({ key: 'reject_cancel', label: 'Từ chối yêu cầu', group: 'cancel', variant: 'secondary' });
      }
    } else if (isAdmin && ['PENDING', 'PROCESSING'].includes(order.status)) {
      actions.push({ key: 'manual_cancel', label: 'Hủy đơn thủ công', group: 'cancel', variant: 'danger' });
    }

    const showOperationalActions = placement === 'modal' || !hasCancelRequest;

    if (showOperationalActions && order.status === 'PENDING') {
      actions.push({ key: 'confirm', label: 'Xác nhận đơn', group: 'operation', nextStatus: 'PROCESSING', variant: 'primary' });
    }

    if (showOperationalActions && order.status === 'PROCESSING') {
      actions.push({ key: 'print', label: 'In phiếu', group: 'operation', variant: 'secondary' });
      actions.push({ key: 'handover', label: 'Chuyển sang đang giao', group: 'operation', nextStatus: 'SHIPPED', variant: 'primary' });
    }

    if (showOperationalActions && order.status === 'SHIPPED') {
      actions.push({ key: 'complete', label: 'Xác nhận hoàn thành', group: 'operation', nextStatus: 'COMPLETED', variant: 'success' });
    }

    if (placement === 'table') {
      actions.push({ key: 'view', label: 'Xem chi tiết', group: 'view', variant: 'icon' });
    }

    return actions;
  };

  const handleOperationalStatusChange = async (
    order: AdminOrder | AdminOrderDetail,
    status: AdminOrderStatus,
    note?: string
  ) => {
    try {
      setUpdatingStatus(true);
      const updatedOrder = await updateAdminOrderStatus(order.id, status, note || getOrderOperationNote(status));
      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder(updatedOrder);
        setOrderInternalNote('');
      }
      await loadData();
      showPopup({ type: 'success', text: 'Đã cập nhật trạng thái đơn hàng.' });
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng';
      setError(message);
      showPopup({ type: 'error', text: message });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const confirmOperationalStatusChange = (
    order: AdminOrder | AdminOrderDetail,
    status: AdminOrderStatus,
    note?: string
  ) => {
    const orderCode = order.orderCode || order.id.slice(0, 8);
    const messages: Record<AdminOrderStatus, string> = {
      PENDING: '',
      PROCESSING: `Xác nhận đơn ${orderCode} và chuyển sang đang chuẩn bị?`,
      SHIPPED: `Đơn ${orderCode} đã được đóng gói và sẵn sàng bàn giao vận chuyển?`,
      COMPLETED: `Xác nhận đơn ${orderCode} đã giao thành công?`,
      CANCELLED: `Hủy đơn ${orderCode}?`,
    };

    setConfirmDialog({
      title: getOrderStatusText(status),
      message: messages[status] || `Chuyển đơn ${orderCode} sang trạng thái ${getOrderStatusText(status)}?`,
      confirmLabel: 'Xác nhận',
      variant: 'warning',
      onConfirm: async () => handleOperationalStatusChange(order, status, note),
    });
  };

  const handleOrderAction = (order: AdminOrder | AdminOrderDetail, action: OrderAction) => {
    if (action.key === 'view' || action.key === 'view_cancel') {
      openOrderDetail(order);
      return;
    }

    if (action.key === 'print') {
      if ('items' in order) {
        handlePrintOrder(order);
      } else {
        handlePrintOrderFromList(order);
      }
      return;
    }

    if (action.key === 'approve_cancel' || action.key === 'manual_cancel') {
      openCancelDecisionDialog('approve', order);
      return;
    }

    if (action.key === 'reject_cancel') {
      openCancelDecisionDialog('reject', order);
      return;
    }

    if ('nextStatus' in action) {
      const note = 'items' in order ? orderInternalNote.trim() || undefined : undefined;
      confirmOperationalStatusChange(order, action.nextStatus, note);
    }
  };

  const getOrderActionClassName = (action: OrderAction) => {
    if (action.variant === 'icon') return 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-indigo-600 ring-1 ring-indigo-100 transition-colors hover:bg-indigo-50';
    if (action.variant === 'danger') {
      return 'inline-flex min-w-[132px] items-center justify-center rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50';
    }
    if (action.variant === 'success') {
      return 'inline-flex min-w-[132px] items-center justify-center rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50';
    }
    if (action.variant === 'primary') {
      return 'inline-flex min-w-[132px] items-center justify-center rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50';
    }
    return 'inline-flex min-w-[132px] items-center justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-700 ring-1 ring-gray-200 transition-colors hover:bg-gray-50 disabled:opacity-50';
  };

  const renderOrderActionButton = (order: AdminOrder | AdminOrderDetail, action: OrderAction) => (
    <button
      key={action.key}
      type="button"
      disabled={updatingStatus}
      onClick={() => handleOrderAction(order, action)}
      className={getOrderActionClassName(action)}
      title={action.label}
    >
      {action.variant === 'icon' ? <Eye className="w-4 h-4" /> : action.label}
    </button>
  );

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
    if (!isAdmin) return;
    resetBookForm();
    setBookModalMode('create');
  };

  const closeBookModal = () => {
    setBookModalMode(null);
    resetBookForm();
  };

  const openBookDetail = async (book: ApiBook, mode: 'detail' | 'edit') => {
    try {
      const safeMode = isAdmin ? mode : 'detail';
      const detail = isAdmin ? await getAdminBookDetail(book.id) : await getManagementBookDetail(book.id);
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
      setBookModalMode(safeMode);
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
      if (!isAdmin) return;
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

  const openCancelDecisionDialog = (action: 'approve' | 'reject', order?: AdminOrder | AdminOrderDetail) => {
    const targetOrder = order || selectedOrder;
    if (!targetOrder) return;
    setCancelDecisionDialog({ action, order: targetOrder });
    setCancelDecisionNote(
      action === 'approve'
        ? hasPendingCustomerCancelRequest(targetOrder)
          ? 'Duyệt yêu cầu hủy đơn'
          : 'Hủy đơn thủ công'
        : ''
    );
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
      const hadCancelRequest = hasPendingCustomerCancelRequest(cancelDecisionDialog.order);
      showPopup({
        type: 'success',
        text:
          cancelDecisionDialog.action === 'approve'
            ? hadCancelRequest
              ? 'Đã duyệt yêu cầu hủy đơn hàng.'
              : 'Đã hủy đơn hàng.'
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

  const handleLogout = async () => {
    await logout();
    toast.success('Đăng xuất thành công. Quay lại trang chủ bán hàng.');
    navigate('/', { replace: true });
  };

  const handleAdminLogoClick = () => {
    setStatusFilter('all');
    setShowCancelRequestsOnly(false);
    setBookStockFilter('all');
    setCurrentView('dashboard');
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
              {isAdmin ? 'Quản trị hệ thống' : 'Bảng làm việc nhân viên'}
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
                  if (item.id === 'dashboard') {
                    setStatusFilter('all');
                    setShowCancelRequestsOnly(false);
                    setBookStockFilter('all');
                  }
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
            <ConfirmDialogModal
              confirmDialog={confirmDialog}
              isConfirmingDialog={isConfirmingDialog}
              closeConfirmDialog={() => setConfirmDialog(null)}
              handleConfirmDialog={handleConfirmDialog}
            />
          )}

          {cancelDecisionDialog && (
            <CancelDecisionModal
              cancelDecisionDialog={cancelDecisionDialog}
              cancelDecisionNote={cancelDecisionNote}
              updatingStatus={updatingStatus}
              closeCancelDecisionDialog={closeCancelDecisionDialog}
              setCancelDecisionNote={setCancelDecisionNote}
              handleCancelDecisionSubmit={handleCancelDecisionSubmit}
            />
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
            <DashboardView
              isAdmin={isAdmin}
              dashboard={dashboard}
              staffWorkCards={staffWorkCards}
              staffPriorityOrders={staffPriorityOrders}
              stockAlertBooks={stockAlertBooks}
              staffActivePromotions={staffActivePromotions}
              adminKpiCards={adminKpiCards}
              adminActionItems={adminActionItems}
              adminOrderStatusChartData={adminOrderStatusChartData}
              adminHealthMetrics={adminHealthMetrics}
              goToOrders={() => goToOrders()}
              goToStockAlerts={goToStockAlerts}
              openOrderDetail={openOrderDetail}
              openBookDetail={(book) => openBookDetail(book, 'detail')}
              openPromotionsView={() => setCurrentView('promotions')}
              getOrderActions={(order, placement) => getOrderActions(order, placement)}
              renderOrderActionButton={renderOrderActionButton}
              getPromotionRemainingText={getPromotionRemainingText}
            />
          )}


          {currentView === 'books' && (
            <BooksView
              isAdmin={isAdmin}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              books={books}
              filteredBooks={filteredBooks}
              paginatedBooks={paginatedBooks}
              outOfStockBooks={outOfStockBooks}
              lowStockBooks={lowStockBooks}
              activeCategories={activeCategories}
              bookVisibilityFilter={bookVisibilityFilter}
              setBookVisibilityFilter={setBookVisibilityFilter}
              bookStockFilter={bookStockFilter}
              setBookStockFilter={setBookStockFilter}
              bookCategoryFilter={bookCategoryFilter}
              setBookCategoryFilter={setBookCategoryFilter}
              openCreateBook={openCreateBook}
              openBookDetail={openBookDetail}
              handleSoftDeleteBook={handleSoftDeleteBook}
              handleRestoreDeletedBook={handleRestoreDeletedBook}
              handlePermanentDeleteBook={handlePermanentDeleteBook}
              deletingBookId={deletingBookId}
              isBookDeleted={isBookDeleted}
              getPromotionForBook={getPromotionForBook}
              isPromotionCurrentlyActive={isPromotionCurrentlyActive}
              getPromotionStatusLabel={getPromotionStatusLabel}
              bookCurrentPage={bookCurrentPage}
              totalBookPages={totalBookPages}
              setBookCurrentPage={setBookCurrentPage}
            />
          )}

          {currentView === 'promotions' && (
            <PromotionsView
              isAdmin={isAdmin}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              promotions={promotions}
              activePromotions={activePromotions}
              promotionBookTotal={promotionBookTotal}
              filteredPromotions={filteredPromotions}
              openCreatePromotion={openCreatePromotion}
              openEditPromotion={openEditPromotion}
              handleDeletePromotionProgram={handleDeletePromotionProgram}
              deletingPromotionId={deletingPromotionId}
              onViewPromotionsPage={() => navigate('/promotions')}
            />
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
                            <TableCell align="right"><div className="flex flex-wrap justify-end gap-2"><button onClick={() => handleSavePromotion(book)} disabled={isUpdating} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50">{isUpdating ? 'Đang lưu...' : 'Lưu'}</button><button onClick={() => handleClearPromotion(book)} disabled={isUpdating || !isActivePromotion} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50">Tắt sale</button></div></TableCell>
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
            <CategoriesView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              categoryVisibilityFilter={categoryVisibilityFilter}
              setCategoryVisibilityFilter={setCategoryVisibilityFilter}
              categoryBookFilter={categoryBookFilter}
              setCategoryBookFilter={setCategoryBookFilter}
              activeCategories={activeCategories}
              filteredCategories={filteredCategories}
              openCreateCategory={openCreateCategory}
              openEditCategory={openEditCategory}
              handleSoftDeleteCategory={handleSoftDeleteCategory}
              handleRestoreCategory={handleRestoreCategory}
              handleHardDeleteCategory={handleHardDeleteCategory}
              deletingCategoryId={deletingCategoryId}
              getCategoryBookCount={getCategoryBookCount}
              isCategoryDeleted={isCategoryDeleted}
            />
          )}

          {currentView === 'orders' && (
            <OrdersView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              orderWorkflowTabs={orderWorkflowTabs}
              orderWorkflowTab={orderWorkflowTab}
              goToOrderWorkflowTab={goToOrderWorkflowTab}
              orderPaymentMethodFilter={orderPaymentMethodFilter}
              setOrderPaymentMethodFilter={setOrderPaymentMethodFilter}
              orderPaymentStatusFilter={orderPaymentStatusFilter}
              setOrderPaymentStatusFilter={setOrderPaymentStatusFilter}
              orderDateFrom={orderDateFrom}
              setOrderDateFrom={setOrderDateFrom}
              orderDateTo={orderDateTo}
              setOrderDateTo={setOrderDateTo}
              clearOrderFilters={clearOrderFilters}
              filteredOrders={filteredOrders}
              orders={orders}
              getOrderActions={getOrderActions}
              renderOrderActionButton={renderOrderActionButton}
              orderTotal={orderTotal}
              showCancelRequestsOnly={showCancelRequestsOnly}
              orderCurrentPage={orderCurrentPage}
              totalOrderPages={totalOrderPages}
              setOrderCurrentPage={setOrderCurrentPage}
              isLoading={isLoading}
            />
          )}

          {currentView === 'customers' && (
            <CustomersView
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              customers={customers}
              activeUsers={activeUsers}
              lockedUsers={lockedUsers}
              unverifiedUsers={unverifiedUsers}
              filteredCustomers={filteredCustomers}
              userRoleFilter={userRoleFilter}
              setUserRoleFilter={setUserRoleFilter}
              userLockFilter={userLockFilter}
              setUserLockFilter={setUserLockFilter}
              userVerifiedFilter={userVerifiedFilter}
              setUserVerifiedFilter={setUserVerifiedFilter}
              openCreateUserModal={openCreateUserModal}
              handleToggleUserLock={handleToggleUserLock}
              handleChangeUserRole={handleChangeUserRole}
              handleResetUserPassword={handleResetUserPassword}
              updatingUserId={updatingUserId}
              currentUserId={user?.id}
            />
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
        <UserCreateModal
          userForm={userForm}
          setUserForm={setUserForm}
          savingUser={savingUser}
          closeUserModal={() => {
            setShowUserModal(false);
            resetUserForm();
          }}
          handleCreateUser={handleCreateUser}
        />
      )}

      {categoryModalMode && (
        <CategoryModal
          categoryModalMode={categoryModalMode}
          categoryForm={categoryForm}
          savingCategory={savingCategory}
          closeCategoryModal={() => {
            setCategoryModalMode(null);
            resetCategoryForm();
          }}
          handleCategoryInput={handleCategoryInput}
          handleSaveCategory={handleSaveCategory}
        />
      )}

      {bookModalMode && (
        <BookModal
          bookModalMode={bookModalMode}
          selectedBook={selectedBook}
          bookForm={bookForm}
          activeCategories={activeCategories}
          deletedImageIds={deletedImageIds}
          setDeletedImageIds={setDeletedImageIds}
          bookImagePreviews={bookImagePreviews}
          bookFormError={bookFormError}
          savingBook={savingBook}
          bookImageInputRef={bookImageInputRef}
          closeBookModal={closeBookModal}
          handleBookInput={handleBookInput}
          handleBookImagesChange={handleBookImagesChange}
          clearSelectedBookImages={clearSelectedBookImages}
          handleSaveBook={handleSaveBook}
          getBookImageItems={getBookImageItems}
          getVisibleBookImageItems={getVisibleBookImageItems}
          toggleDeleteImage={toggleDeleteImage}
          getPromotionForBook={getPromotionForBook}
          getPromotionStatusLabel={getPromotionStatusLabel}
          formatFileSize={formatFileSize}
        />
      )}

      {promotionModalMode && (
        <PromotionModal
          promotionModalMode={promotionModalMode}
          promotionForm={promotionForm}
          promotionFormError={promotionFormError}
          promotionBannerPreview={promotionBannerPreview}
          promotionBannerInputRef={promotionBannerInputRef}
          promotionBooks={promotionBooks}
          filteredPromotionModalBooks={filteredPromotionModalBooks}
          activeCategories={activeCategories}
          promotionBookSearch={promotionBookSearch}
          setPromotionBookSearch={setPromotionBookSearch}
          promotionCategoryFilter={promotionCategoryFilter}
          setPromotionCategoryFilter={setPromotionCategoryFilter}
          promotionStockFilter={promotionStockFilter}
          setPromotionStockFilter={setPromotionStockFilter}
          showSelectedPromotionBooksOnly={showSelectedPromotionBooksOnly}
          setShowSelectedPromotionBooksOnly={setShowSelectedPromotionBooksOnly}
          savingPromotion={savingPromotion}
          closePromotionModal={() => setPromotionModalMode(null)}
          handlePromotionFormInput={handlePromotionFormInput}
          handlePromotionBannerChange={handlePromotionBannerChange}
          clearPromotionBanner={clearPromotionBanner}
          togglePromotionBook={togglePromotionBook}
          handleSavePromotionProgram={handleSavePromotionProgram}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          selectedOrder={selectedOrder}
          orderInternalNote={orderInternalNote}
          setOrderInternalNote={setOrderInternalNote}
          closeOrderDetail={closeOrderDetail}
          handlePrintOrder={handlePrintOrder}
          handleCopyText={handleCopyText}
          getOrderActions={getOrderActions}
          renderOrderActionButton={renderOrderActionButton}
        />
      )}
    </div>
  );
}
