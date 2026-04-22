import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Settings,
  Package,
  Heart,
  MapPin,
  Bell,
  LogOut,
  Edit2,
  Mail,
  Phone,
  Calendar,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Star,
  ChevronRight,
  Shield,
} from 'lucide-react';
import {
  getMyAddresses,
  getMyOrders,
  getMyProfile,
  updateMyProfile,
  type AddressItem,
  type OrderDto,
  type UserProfile,
} from '../services/account.service';
import { getBestSellerBooks } from '../services/book.service';
import { formatCurrency, getBookImage, toDisplayBook, type DisplayBook } from '../utils/book-display';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'COMPLETED':
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        className: 'bg-green-100 text-green-700 border-green-200',
        label: 'Đã giao hàng',
      };
    case 'SHIPPED':
      return {
        icon: <Truck className="w-5 h-5 text-blue-500" />,
        className: 'bg-blue-100 text-blue-700 border-blue-200',
        label: 'Đang giao hàng',
      };
    case 'PROCESSING':
      return {
        icon: <Clock className="w-5 h-5 text-orange-500" />,
        className: 'bg-orange-100 text-orange-700 border-orange-200',
        label: 'Đang xử lý',
      };
    case 'CANCELLED':
      return {
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        className: 'bg-red-100 text-red-700 border-red-200',
        label: 'Đã hủy',
      };
    default:
      return {
        icon: <Clock className="w-5 h-5 text-gray-500" />,
        className: 'bg-gray-100 text-gray-700 border-gray-200',
        label: status,
      };
  }
};

const formatOrderCode = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

const formatAddress = (address: AddressItem) =>
  [
    address.addressLine,
    address.wardName,
    address.districtName,
    address.provinceName,
    address.country,
  ]
    .filter(Boolean)
    .join(', ');

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<DisplayBook[]>([]);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, orderData, addressData, bestSellerData] = await Promise.all([
          getMyProfile(),
          getMyOrders(1, 10),
          getMyAddresses(),
          getBestSellerBooks(),
        ]);

        setProfile(profileData);
        setOrders(orderData.orders || []);
        setAddresses(addressData);
        setWishlistBooks(bestSellerData.map((book, index) => toDisplayBook(book, index)).slice(0, 4));
        setEditForm({
          fullName: profileData.fullName || profileData.userName || '',
          phone: profileData.phone || '',
          dob: profileData.dob ? new Date(profileData.dob).toISOString().slice(0, 10) : '',
        });
      } catch (error) {
        console.error('Fetch account data error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  const stats = useMemo(
    () => [
      { label: 'Đơn hàng', value: orders.length.toString(), icon: Package, color: 'bg-blue-500' },
      {
        label: 'Sách đã mua',
        value: orders.reduce((sum, order) => sum + order.items.length, 0).toString(),
        icon: BookOpen,
        color: 'bg-green-500',
      },
      {
        label: 'Địa chỉ',
        value: addresses.length.toString(),
        icon: MapPin,
        color: 'bg-orange-500',
      },
      {
        label: 'Yêu thích',
        value: wishlistBooks.length.toString(),
        icon: Heart,
        color: 'bg-red-500',
      },
    ],
    [orders, addresses, wishlistBooks.length]
  );

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: User },
    { id: 'orders', label: 'Đơn hàng', icon: Package },
    { id: 'wishlist', label: 'Yêu thích', icon: Heart },
    { id: 'addresses', label: 'Địa chỉ', icon: MapPin },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  if (!user || loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Đang tải tài khoản...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="h-24 bg-gradient-to-r from-orange-500 to-orange-600"></div>
              <div className="px-6 pb-6">
                <div className="relative -mt-12 mb-4">
                  <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden mx-auto bg-gray-100">
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt={profile.fullName || profile.userName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-600 text-3xl font-bold">
                        {(profile?.fullName || profile?.userName || 'U').charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{profile?.fullName || profile?.userName}</h2>
                  <p className="text-sm text-gray-600 mb-1">{profile?.email}</p>
                  <div className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                    <Award className="w-3 h-3" />
                    {profile?.role || 'MEMBER'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        activeTab === tab.id ? 'bg-orange-500 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              onClick={logout}
              className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>

          <div className="col-span-9">
            <div className="grid grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                );
              })}
            </div>

            {activeTab === 'profile' && profile && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700">
                        Hủy
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            setIsSaving(true);
                            const updated = await updateMyProfile({
                              fullName: editForm.fullName,
                              phone: editForm.phone,
                              dob: editForm.dob,
                            });
                            setProfile(updated);
                            updateUser({
                              id: updated.id,
                              name: updated.fullName || updated.userName,
                              email: updated.email,
                              role: updated.role,
                              avatar: updated.avatar,
                            });
                            setIsEditing(false);
                          } catch (error) {
                            console.error('Update profile error:', error);
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg bg-green-500 text-white disabled:opacity-50"
                      >
                        {isSaving ? 'Đang lưu...' : 'Lưu lại'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Họ và tên</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <User className="w-5 h-5 text-gray-400" />
                      {isEditing ? (
                        <input
                          value={editForm.fullName}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                          className="bg-transparent outline-none w-full"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{profile.fullName || profile.userName}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Email</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-900">{profile.email}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Số điện thoại</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-gray-400" />
                      {isEditing ? (
                        <input
                          value={editForm.phone}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))}
                          className="bg-transparent outline-none w-full"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">{profile.phone || 'Chưa cập nhật'}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Ngày sinh</label>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      {isEditing ? (
                        <input
                          type="date"
                          value={editForm.dob}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, dob: e.target.value }))}
                          className="bg-transparent outline-none w-full"
                        />
                      ) : (
                        <span className="font-medium text-gray-900">
                          {profile.dob ? new Date(profile.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Đơn hàng của tôi</h2>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-gray-500">Bạn chưa có đơn hàng nào.</div>
                  ) : (
                    orders.map((order) => {
                      const status = getStatusConfig(order.status);
                      const firstItem = order.items[0];
                      return (
                        <div key={order.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-20 h-28 rounded-lg overflow-hidden bg-gray-100">
                                {firstItem?.book ? (
                                  <img src={getBookImage(firstItem.book as any)} alt={firstItem.book.title} className="w-full h-full object-cover" />
                                ) : null}
                              </div>
                              <div>
                                <div className="font-bold text-gray-900 mb-1">Đơn hàng {formatOrderCode(order.id)}</div>
                                <div className="text-sm text-gray-600 mb-2">
                                  {order.items.length} sản phẩm • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                </div>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium border ${status.className}`}>
                                  {status.icon}
                                  {status.label}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 mb-2">Tổng cộng</div>
                              <div className="text-2xl font-bold text-orange-600 mb-3">
                                {formatCurrency(Number(order.totalAmount))}
                              </div>
                              <button
                                onClick={() => navigate('/track-order', { state: { orderId: order.id } })}
                                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium"
                              >
                                Xem chi tiết
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Gợi ý cho bạn</h2>
                  <p className="text-gray-600">{wishlistBooks.length} sản phẩm</p>
                </div>
                <div className="grid grid-cols-4 gap-6">
                  {wishlistBooks.map((book) => (
                    <div key={book.id} className="group relative bg-gray-50 rounded-xl overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                        <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50">
                          <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                        <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-orange-500 font-bold">{formatCurrency(book.price)}</div>
                            {book.originalPrice && (
                              <div className="text-gray-400 line-through text-sm">{formatCurrency(book.originalPrice)}</div>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/book/${book.id}`)}
                            className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                          >
                            <Package className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Địa chỉ nhận hàng</h2>
                </div>
                <div className="space-y-4">
                  {addresses.length === 0 ? (
                    <div className="text-gray-500">Bạn chưa có địa chỉ nào.</div>
                  ) : (
                    addresses.map((addr) => (
                      <div key={addr.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-orange-300 transition-colors relative">
                        {addr.isDefault && (
                          <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Mặc định
                          </div>
                        )}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-bold text-gray-900 mb-2">{addr.receiverName}</div>
                            <div className="text-gray-600 mb-1">{addr.phone}</div>
                            <div className="text-gray-600">{formatAddress(addr)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Cài đặt tài khoản</h2>
                  <div className="space-y-4">
                    {[
                      {
                        icon: Bell,
                        title: 'Thông báo đẩy',
                        desc: 'Nhận thông báo về đơn hàng và khuyến mãi',
                      },
                      {
                        icon: Mail,
                        title: 'Email marketing',
                        desc: 'Nhận tin tức và ưu đãi qua email',
                      },
                      {
                        icon: Shield,
                        title: 'Tài khoản đã xác thực',
                        desc: profile?.isVerified ? 'Tài khoản của bạn đang ở trạng thái xác thực' : 'Tài khoản chưa xác thực',
                      },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-600" />
                            <div>
                              <div className="font-medium text-gray-900">{item.title}</div>
                              <div className="text-sm text-gray-600">{item.desc}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
