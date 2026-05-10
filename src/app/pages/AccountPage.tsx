import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  User,
  AlertCircle,
  Settings,
  Package,
  MapPin,
  Bell,
  LogOut,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
  Mail,
  Phone,
  Calendar,
  Award,
  BookOpen,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronRight,
  Shield,
  KeyRound,
  RefreshCw,
} from 'lucide-react';
import {
  changeMyPassword,
  createMyAddress,
  deleteMyAddress,
  getMyAddresses,
  getMyOrders,
  getMyProfile,
  updateMyAddress,
  updateMyProfile,
  type AddressItem,
  type AddressPayload,
  type OrderDto,
  type UserProfile,
} from '../services/account.service';
import { formatCurrency, getBookImage } from '../utils/book-display';

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

const getDisplayOrderCode = (order: OrderDto) => order.orderCode || formatOrderCode(order.id);

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

const emptyAddressForm = {
  receiverName: '',
  phone: '',
  addressLine: '',
  country: 'Việt Nam',
  provinceName: '',
  districtName: '',
  wardName: '',
  isDefault: false,
};

const toAddressPayload = (form: typeof emptyAddressForm): AddressPayload => ({
  receiverName: form.receiverName.trim(),
  phone: form.phone.trim(),
  addressLine: form.addressLine.trim(),
  country: form.country.trim() || 'Việt Nam',
  provinceName: form.provinceName.trim(),
  provinceCode: form.provinceName.trim(),
  districtName: form.districtName.trim(),
  districtCode: form.districtName.trim(),
  wardName: form.wardName.trim(),
  wardCode: form.wardName.trim(),
  isDefault: form.isDefault,
});

const toAddressForm = (address: AddressItem) => ({
  receiverName: address.receiverName || '',
  phone: address.phone || '',
  addressLine: address.addressLine || '',
  country: address.country || 'Việt Nam',
  provinceName: address.provinceName || '',
  districtName: address.districtName || '',
  wardName: address.wardName || '',
  isDefault: Boolean(address.isDefault),
});

type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
} | null;

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>(null);
  const [isConfirmingDialog, setIsConfirmingDialog] = useState(false);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isAddressSaving, setIsAddressSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    phone: '',
    dob: '',
  });

  const loadOrders = async (showToast = false) => {
    try {
      setIsOrdersLoading(true);
      const orderData = await getMyOrders(1, 50);
      setOrders(orderData.orders || []);
      setOrderTotal(orderData.total || orderData.orders?.length || 0);
      if (showToast) toast.success('Đã cập nhật danh sách đơn hàng.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải danh sách đơn hàng.');
    } finally {
      setIsOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setLoadError('');
        const [profileData, orderData, addressData] = await Promise.all([
          getMyProfile(),
          getMyOrders(1, 50),
          getMyAddresses(),
        ]);

        const normalizedProfile = {
          ...profileData,
          fullName: profileData.fullName || user.fullName || user.name,
          phone: profileData.phone || user.phone,
        };

        setProfile(normalizedProfile);
        updateUser({
          id: normalizedProfile.id,
          name: normalizedProfile.fullName || normalizedProfile.userName,
          userName: normalizedProfile.userName,
          fullName: normalizedProfile.fullName,
          email: normalizedProfile.email,
          role: normalizedProfile.role,
          avatar: normalizedProfile.avatar,
          phone: normalizedProfile.phone,
        });
        setOrders(orderData.orders || []);
        setOrderTotal(orderData.total || orderData.orders?.length || 0);
        setAddresses(addressData);
        setEditForm({
          fullName: normalizedProfile.fullName || normalizedProfile.userName || '',
          phone: normalizedProfile.phone || '',
          dob: normalizedProfile.dob ? new Date(normalizedProfile.dob).toISOString().slice(0, 10) : '',
        });
      } catch (error) {
        console.error('Fetch account data error:', error);
        setLoadError('Không thể tải thông tin tài khoản. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id, navigate, updateUser]);

  useEffect(() => {
    if (activeTab === 'orders' && user) {
      void loadOrders(false);
    }
  }, [activeTab, user?.id]);

  const stats = useMemo(
    () => [
      { label: 'Đơn hàng', value: orderTotal.toString(), icon: Package, color: 'bg-blue-500' },
      {
        label: 'Sách đã mua',
        value: orders
          .reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
          .toString(),
        icon: BookOpen,
        color: 'bg-green-500',
      },
      {
        label: 'Địa chỉ',
        value: addresses.length.toString(),
        icon: MapPin,
        color: 'bg-orange-500',
      },
    ],
    [orders, addresses, orderTotal]
  );

  const tabs = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: User },
    { id: 'orders', label: 'Đơn hàng', icon: Package },
    { id: 'addresses', label: 'Địa chỉ', icon: MapPin },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const showActionSuccess = (message: string) => {
    setActionError('');
    setActionSuccess(message);
  };

  const showActionError = (message: string) => {
    setActionSuccess('');
    setActionError(message);
  };

  const openPasswordForm = () => {
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setActionError('');
    setActionSuccess('');
    setIsPasswordFormOpen(true);
  };

  const closePasswordForm = () => {
    if (isChangingPassword) return;
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setIsPasswordFormOpen(false);
  };

  const startCreateAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...emptyAddressForm,
      receiverName: profile?.fullName || profile?.userName || '',
      phone: profile?.phone || '',
    });
    setIsAddressFormOpen(true);
    setActionError('');
    setActionSuccess('');
  };

  const startEditAddress = (address: AddressItem) => {
    setEditingAddressId(address.id);
    setAddressForm(toAddressForm(address));
    setIsAddressFormOpen(true);
    setActionError('');
    setActionSuccess('');
  };

  const handleSaveAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsAddressSaving(true);
    try {
      const payload = toAddressPayload(addressForm);
      if (editingAddressId) {
        const updated = await updateMyAddress(editingAddressId, payload);
        setAddresses((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        showActionSuccess('Đã cập nhật địa chỉ.');
      } else {
        const created = await createMyAddress(payload);
        setAddresses((prev) => [created, ...prev]);
        showActionSuccess('Đã thêm địa chỉ mới.');
      }
      setIsAddressFormOpen(false);
      setEditingAddressId(null);
      setAddressForm(emptyAddressForm);
    } catch (error: any) {
      showActionError(error?.response?.data?.message || 'Không thể lưu địa chỉ.');
    } finally {
      setIsAddressSaving(false);
    }
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

  const handleDeleteAddress = async (addressId: string) => {
    setConfirmDialog({
      title: 'Xóa địa chỉ',
      message: 'Bạn có chắc muốn xóa địa chỉ này?',
      confirmLabel: 'Xóa địa chỉ',
      onConfirm: async () => {
        try {
          await deleteMyAddress(addressId);
          setAddresses((prev) => prev.filter((item) => item.id !== addressId));
          showActionSuccess('Đã xóa địa chỉ.');
        } catch (error: any) {
          showActionError(error?.response?.data?.message || 'Không thể xóa địa chỉ.');
        }
      },
    });
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const result = await changeMyPassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      if (result?.accessToken) localStorage.setItem('accessToken', result.accessToken);
      if (result?.refreshToken) localStorage.setItem('refreshToken', result.refreshToken);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setIsPasswordFormOpen(false);
      toast.success('Đã đổi mật khẩu thành công.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đổi mật khẩu.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (!user || loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Đang tải tài khoản...</div>;
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <p className="mb-4 text-gray-700">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
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
                <form onSubmit={handleChangePassword} className="hidden">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                        required
                        minLength={6}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="mt-5 rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                  </button>
                </form>
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
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Đăng xuất</span>
            </button>
          </div>

          <div className="col-span-9">
            {(actionError || actionSuccess) && (
              <div
                className={`mb-6 rounded-xl border p-4 text-sm ${
                  actionError
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                }`}
              >
                {actionError || actionSuccess}
              </div>
            )}

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
                            setActionError('');
                            setActionSuccess('');
                            const updated = await updateMyProfile({
                              fullName: editForm.fullName.trim(),
                              phone: editForm.phone.trim(),
                              dob: editForm.dob || undefined,
                            });
                            setProfile(updated);
                            updateUser({
                              id: updated.id,
                              name: updated.fullName || updated.userName,
                              userName: updated.userName,
                              fullName: updated.fullName,
                              email: updated.email,
                              role: updated.role,
                              avatar: updated.avatar,
                              phone: updated.phone,
                            });
                            setIsEditing(false);
                            setActionSuccess('Đã cập nhật thông tin cá nhân.');
                          } catch (error: any) {
                            console.error('Update profile error:', error);
                            setActionError(error?.response?.data?.message || 'Không thể cập nhật thông tin cá nhân.');
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
                <div className="mt-6 rounded-xl border border-orange-100 bg-orange-50/60 p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                        <KeyRound className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Cập nhật mật khẩu đăng nhập để bảo vệ tài khoản của bạn.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openPasswordForm}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                    >
                      <KeyRound className="h-4 w-4" />
                      Đổi mật khẩu
                    </button>
                  </div>
                </div>
                <form onSubmit={handleChangePassword} className="hidden">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                        required
                        minLength={6}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="mt-5 rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Đơn hàng của tôi</h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Hiển thị {orders.length.toLocaleString('vi-VN')} / {orderTotal.toLocaleString('vi-VN')} đơn hàng mới nhất
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadOrders(true)}
                    disabled={isOrdersLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 px-4 py-2 font-medium text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isOrdersLoading ? 'animate-spin' : ''}`} />
                    Cập nhật
                  </button>
                </div>
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-gray-500">Bạn chưa có đơn hàng nào.</div>
                  ) : (
                    orders.map((order) => {
                      const status = getStatusConfig(order.status);
                      const firstItem = order.items[0];
                      const displayOrderCode = getDisplayOrderCode(order);
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
                                <div className="font-bold text-gray-900 mb-1">Đơn hàng {displayOrderCode}</div>
                                <div className="text-sm text-gray-600 mb-2">
                                  {order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm • {new Date(order.createdAt).toLocaleDateString('vi-VN')}
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
                                onClick={() => navigate('/track-order', { state: { orderCode: order.orderCode || order.id } })}
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

            {activeTab === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Địa chỉ nhận hàng</h2>
                  <button
                    type="button"
                    onClick={startCreateAddress}
                    className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4" />
                    Thêm địa chỉ
                  </button>
                </div>
                {isAddressFormOpen && (
                  <form onSubmit={handleSaveAddress} className="mb-6 rounded-xl border border-orange-200 bg-orange-50 p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {[
                        ['receiverName', 'Người nhận'],
                        ['phone', 'Số điện thoại'],
                        ['provinceName', 'Tỉnh/Thành phố'],
                        ['districtName', 'Quận/Huyện'],
                        ['wardName', 'Phường/Xã'],
                        ['country', 'Quốc gia'],
                      ].map(([field, label]) => (
                        <div key={field}>
                          <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
                          <input
                            value={(addressForm as any)[field]}
                            onChange={(event) => setAddressForm((prev) => ({ ...prev, [field]: event.target.value }))}
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      ))}
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700">Địa chỉ chi tiết</label>
                        <input
                          value={addressForm.addressLine}
                          onChange={(event) => setAddressForm((prev) => ({ ...prev, addressLine: event.target.value }))}
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(event) => setAddressForm((prev) => ({ ...prev, isDefault: event.target.checked }))}
                          className="h-4 w-4 rounded text-orange-500"
                        />
                        Đặt làm địa chỉ mặc định
                      </label>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="submit"
                        disabled={isAddressSaving}
                        className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-white disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        {isAddressSaving ? 'Đang lưu...' : 'Lưu địa chỉ'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddressFormOpen(false);
                          setEditingAddressId(null);
                        }}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-white"
                      >
                        Hủy
                      </button>
                    </div>
                  </form>
                )}
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
                            <div className="mt-4 flex gap-2">
                              <button
                                type="button"
                                onClick={() => startEditAddress(addr)}
                                className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 className="h-4 w-4" />
                                Sửa
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Xóa
                              </button>
                            </div>
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
                <form onSubmit={handleChangePassword} className="hidden">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Đổi mật khẩu</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                      <input
                        type="password"
                        value={passwordForm.oldPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                        required
                        minLength={6}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="mt-5 rounded-lg bg-orange-500 px-5 py-3 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isChangingPassword ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
      {isPasswordFormOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleChangePassword}
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                  <KeyRound className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Đổi mật khẩu</h3>
                  <p className="mt-1 text-sm text-gray-600">Nhập mật khẩu hiện tại và mật khẩu mới.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePasswordForm}
                disabled={isChangingPassword}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, oldPassword: event.target.value }))}
                  required
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closePasswordForm}
                disabled={isChangingPassword}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isChangingPassword}
                className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isChangingPassword ? 'Đang đổi mật khẩu...' : 'Lưu mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      )}
      {confirmDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
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
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isConfirmingDialog ? 'Đang xử lý...' : confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
