import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  DollarSign,
  Edit,
  Eye,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  ShoppingCart,
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
  deleteAdminBook,
  getAdminBooks,
  getAdminBookDetail,
  getAdminCategories,
  getAdminCustomers,
  getAdminDashboard,
  getAdminOrderDetail,
  getAdminOrders,
  updateAdminBook,
  updateAdminOrderStatus,
  type AdminBookPayload,
  type AdminCategory,
  type AdminDashboardResponse,
  type AdminOrder,
  type AdminOrderDetail,
  type AdminOrderStatus,
  type AdminUser,
} from '../services/admin.service';
import type { ApiBook } from '../services/book.service';
import { getBookImage } from '../utils/book-display';

type AdminView = 'dashboard' | 'books' | 'orders' | 'customers' | 'settings';

const COLORS = ['#F97316', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444', '#14B8A6'];

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

export function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<AdminView>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminOrderStatus>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [books, setBooks] = useState<ApiBook[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminUser[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderDetail | null>(null);
  const [selectedBook, setSelectedBook] = useState<ApiBook | null>(null);
  const [bookModalMode, setBookModalMode] = useState<'create' | 'edit' | 'detail' | null>(null);
  const [bookForm, setBookForm] = useState<AdminBookPayload>({
    title: '',
    author: '',
    categoryId: '',
    price: '',
    originalPrice: '',
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
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const menuItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'books' as const, label: 'Quản lý sách', icon: BookOpen },
    { id: 'orders' as const, label: 'Đơn hàng', icon: ShoppingCart },
    { id: 'customers' as const, label: 'Khách hàng', icon: Users },
    { id: 'settings' as const, label: 'Cài đặt', icon: Settings },
  ];

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [dashboardData, booksData, categoriesData, ordersData, customersData] = await Promise.all([
        getAdminDashboard(),
        getAdminBooks({ limit: 50 }),
        getAdminCategories(),
        getAdminOrders({
          limit: 50,
          status: statusFilter === 'all' ? undefined : statusFilter,
        }),
        getAdminCustomers({ limit: 50 }),
      ]);

      setDashboard(dashboardData);
      setBooks(booksData.data);
      setCategories(categoriesData);
      setOrders(ordersData.data);
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
  }, [statusFilter]);

  const filteredBooks = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (currentView !== 'books' || !keyword) return books;
    return books.filter((book) =>
      [book.title, book.author, book.category?.name].filter(Boolean).join(' ').toLowerCase().includes(keyword)
    );
  }, [books, currentView, searchQuery]);

  const filteredOrders = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (currentView !== 'orders' || !keyword) return orders;
    return orders.filter((order) =>
      [order.orderCode, order.customerName, order.customerEmail, order.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(keyword)
    );
  }, [orders, currentView, searchQuery]);

  const filteredCustomers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    if (currentView !== 'customers' || !keyword) return customers;
    return customers.filter((customer) =>
      [customer.fullName, customer.userName, customer.email].filter(Boolean).join(' ').toLowerCase().includes(keyword)
    );
  }, [customers, currentView, searchQuery]);

  const outOfStockBooks = books.filter((book) => Number(book.stock || 0) <= 0);

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

  const resetBookForm = () => {
    setBookForm({
      title: '',
      author: '',
      categoryId: categories[0]?.id || '',
      price: '',
      originalPrice: '',
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
  };

  const openCreateBook = () => {
    resetBookForm();
    setBookModalMode('create');
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
        stock: String(detail.stock ?? ''),
        isbn: detail.isbn || '',
        description: detail.description || '',
        publisher: detail.publisher || '',
        publishYear: detail.publishYear ? String(detail.publishYear) : '',
        pages: detail.pages ? String(detail.pages) : '',
        language: detail.language || 'Tiếng Việt',
        releaseDate: detail.releaseDate ? detail.releaseDate.slice(0, 10) : '',
      });
      setBookModalMode(mode);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải chi tiết sách');
    }
  };

  const handleBookInput = (field: keyof AdminBookPayload, value: string | FileList) => {
    setBookForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveBook = async () => {
    try {
      setSavingBook(true);
      if (bookModalMode === 'create') {
        await createAdminBook(bookForm);
      } else if (bookModalMode === 'edit' && selectedBook) {
        await updateAdminBook(selectedBook.id, bookForm);
      }
      setBookModalMode(null);
      resetBookForm();
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể lưu sách');
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (book: ApiBook) => {
    const confirmed = window.confirm(`Xóa sách "${book.title}"? Sách đã phát sinh đơn hàng sẽ không thể xóa.`);
    if (!confirmed) return;

    try {
      setDeletingBookId(book.id);
      await deleteAdminBook(book.id);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể xóa sách');
    } finally {
      setDeletingBookId(null);
    }
  };

  const handleUpdateStatus = async (status: AdminOrderStatus) => {
    if (!selectedOrder) return;
    const note = status === 'CANCELLED' ? 'Admin hủy đơn từ dashboard' : undefined;

    try {
      setUpdatingStatus(true);
      const updatedOrder = await updateAdminOrderStatus(selectedOrder.id, status, note);
      setSelectedOrder(updatedOrder);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <button onClick={() => navigate('/')} className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
              TS
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-orange-500">Trạm Sách</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
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
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {menuItems.find((item) => item.id === currentView)?.label}
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

        <div className="p-8">
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

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm sách theo tên, tác giả, danh mục..." />
                <button
                  onClick={openCreateBook}
                  className="px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Thêm sách mới
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
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
                  <tbody className="divide-y divide-gray-200">
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50">
                        <TableCell>
                          <p className="font-medium text-gray-800">{book.title}</p>
                          <p className="text-sm text-gray-500">{book.author}</p>
                        </TableCell>
                        <TableCell>{book.category?.name || 'Chưa phân loại'}</TableCell>
                        <TableCell>{formatCurrency(book.price)}</TableCell>
                        <TableCell>{Number(book.stock || 0)}</TableCell>
                        <TableCell>{Number(book.soldCount || 0)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${Number(book.stock || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {Number(book.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                          </span>
                        </TableCell>
                        <TableCell align="right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => openBookDetail(book, 'detail')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openBookDetail(book, 'edit')}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book)}
                              disabled={deletingBookId === book.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Xóa sách"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBooks.length === 0 && <EmptyState text="Không có sách phù hợp." />}
              </div>
            </div>
          )}

          {currentView === 'orders' && (
            <div className="space-y-6">
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

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
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
                        </TableCell>
                        <TableCell align="right">
                          <button
                            onClick={() => openOrderDetail(order)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
              <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm khách hàng theo tên hoặc email..." />

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Ngày tham gia</TableHead>
                      <TableHead>Trạng thái</TableHead>
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
                        <TableCell>{formatDate(customer.createdAt)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded-full ${customer.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {customer.isLocked ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </TableCell>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                onClick={() => setBookModalMode(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookModalMode === 'detail' && selectedBook ? (
              <div className="p-6 space-y-6">
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
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <BookInput label="ISBN" value={bookForm.isbn} onChange={(value) => handleBookInput('isbn', value)} required />
                  <BookInput label="Giá bán" type="number" value={bookForm.price} onChange={(value) => handleBookInput('price', value)} required />
                  <BookInput label="Giá gốc" type="number" value={bookForm.originalPrice} onChange={(value) => handleBookInput('originalPrice', value)} required />
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
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(event) => event.target.files && handleBookInput('images', event.target.files)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Hỗ trợ jpg, png, webp. Tối đa 5 ảnh, mỗi ảnh 2MB. Khi sửa, chọn ảnh mới sẽ thay bộ ảnh cũ.
                  </p>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setBookModalMode(null)}
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

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
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

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Địa chỉ giao hàng</h4>
                <p className="text-gray-800">
                  {[selectedOrder.address?.addressLine, selectedOrder.address?.ward, selectedOrder.address?.district, selectedOrder.address?.city]
                    .filter(Boolean)
                    .join(', ') || 'Đang cập nhật'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-3">Sản phẩm</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
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

function TableHead({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-6 py-3 text-sm font-medium text-gray-600 ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </th>
  );
}

function TableCell({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <td className={`px-6 py-4 text-gray-700 ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</td>;
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
