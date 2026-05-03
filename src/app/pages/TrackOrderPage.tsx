import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  Search,
  Package,
  CheckCircle2,
  Truck,
  Home,
  Clock,
  MapPin,
  Phone,
  CreditCard,
  User,
  MessageCircle,
  Star,
  ChevronRight,
  Box,
  ClipboardCheck,
  PackageCheck,
} from 'lucide-react';
import { trackOrderPublic, type OrderDto } from '../services/account.service';
import { formatCurrency, getBookImage } from '../utils/book-display';
import { toast } from 'sonner';

const formatOrderCode = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;

const statusToStep = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'PROCESSING':
      return 2;
    case 'SHIPPED':
      return 3;
    case 'COMPLETED':
      return 4;
    case 'CANCELLED':
      return 1;
    default:
      return 0;
  }
};

export function TrackOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialOrderId = (location.state as { orderId?: string } | null)?.orderId || '';
  const [orderCode, setOrderCode] = useState(initialOrderId);
  const [phone, setPhone] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [searching, setSearching] = useState(false);


  const currentStatus = selectedOrder ? statusToStep(selectedOrder.status) : 0;

  const trackingSteps = [
    {
      id: 0,
      title: 'Đơn hàng đã đặt',
      description: 'Đơn hàng đã được tạo thành công',
      icon: ClipboardCheck,
      color: 'bg-green-500',
    },
    {
      id: 1,
      title: 'Đã xác nhận',
      description: 'Đơn hàng đã được xác nhận',
      icon: CheckCircle2,
      color: 'bg-green-500',
    },
    {
      id: 2,
      title: 'Đang xử lý',
      description: 'Đơn hàng đang được chuẩn bị',
      icon: Box,
      color: 'bg-orange-500',
    },
    {
      id: 3,
      title: 'Đang vận chuyển',
      description: 'Đơn hàng đang được giao đến bạn',
      icon: Truck,
      color: 'bg-orange-500',
    },
    {
      id: 4,
      title: 'Giao hàng thành công',
      description: 'Đơn hàng đã được giao thành công',
      icon: PackageCheck,
      color: 'bg-green-500',
    },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = orderCode.trim();
    const phoneNumber = phone.trim();

    if (!code || !phoneNumber) {
      toast.error('Vui long nhap ma don hang va so dien thoai');
      return;
    }

    try {
      setSearching(true);
      const detail = await trackOrderPublic(code, phoneNumber);
      setSelectedOrder(detail);
      setShowTracking(true);
    } catch (error: any) {
      console.error('Fetch selected order detail error:', error);
      toast.error(error?.response?.data?.message || 'Khong tim thay don hang phu hop');
    } finally {
      setSearching(false);
    }
  };

  if (!showTracking || !selectedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Package className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Tra cứu đơn hàng</h1>
            <p className="text-lg text-gray-600">Nhập mã đơn hàng để theo dõi tình trạng giao hàng của bạn</p>
          </div>
          <form onSubmit={handleSearch} className="mb-12">
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <label className="mb-3 block text-sm font-medium text-gray-700">Ma don hang</label>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Nhap ma don hang (vi du: ORD-...)"
                    className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-lg"
                  />
                </div>
                <div className="relative">
                  <label className="mb-3 block text-sm font-medium text-gray-700">So dien thoai</label>
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhap so dien thoai nguoi nhan"
                    className="w-full pl-14 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors text-lg"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <Search className="w-5 h-5" />
                  {searching ? 'Dang tra cuu...' : 'Tra cuu'}
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { icon: Truck, title: 'Giao hàng nhanh', desc: 'Giao hàng trong 2-3 ngày làm việc', color: 'text-blue-600 bg-blue-100' },
              { icon: PackageCheck, title: 'Theo dõi realtime', desc: 'Cập nhật trạng thái đơn hàng liên tục', color: 'text-green-600 bg-green-100' },
              { icon: MessageCircle, title: 'Hỗ trợ 24/7', desc: 'Luôn sẵn sàng hỗ trợ bạn mọi lúc', color: 'text-orange-600 bg-orange-100' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white rounded-2xl shadow-lg p-6 text-center hover:shadow-xl transition-shadow">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${item.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-900 mb-4">Liên kết nhanh</h3>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-orange-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-600 group-hover:text-orange-600" />
                  <span className="font-medium text-gray-900">Tiep tuc mua sam</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-orange-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const address = selectedOrder.address;
  const payment = selectedOrder.payments?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button onClick={() => setShowTracking(false)} className="text-gray-600 hover:text-orange-500 transition-colors">
              <Package className="w-6 h-6" />
            </button>
            <form onSubmit={handleSearch} className="flex-1">
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="Ma don hang"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="So dien thoai"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-orange-500 text-white px-5 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-60"
                >
                  Tra cuu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg p-8 mb-8 text-white">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm opacity-90 mb-2">Mã đơn hàng</div>
              <div className="text-3xl font-bold">{formatOrderCode(selectedOrder.id)}</div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90 mb-2">Ngày đặt hàng</div>
              <div className="text-xl font-bold">{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</div>
            </div>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm opacity-90">Trạng thái</div>
                <div className="text-xl font-bold">{selectedOrder.status}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-90">Tổng tiền</div>
              <div className="text-xl font-bold">{formatCurrency(Number(selectedOrder.totalAmount))}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          <div className="space-y-8 xl:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Lộ trình vận chuyển</h2>
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-1 bg-gray-200"></div>
                <div
                  className="absolute left-6 top-0 w-1 bg-orange-500 transition-all duration-500"
                  style={{ height: `${(currentStatus / (trackingSteps.length - 1)) * 100}%` }}
                ></div>

                <div className="space-y-8">
                  {trackingSteps.map((step) => {
                    const Icon = step.icon;
                    const isActive = step.id <= currentStatus;
                    const isCurrent = step.id === currentStatus;
                    return (
                      <div key={step.id} className="relative flex gap-6">
                        <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${isActive ? step.color : 'bg-gray-200'} ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 pt-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`text-lg font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{step.title}</h3>
                            <div className="text-sm text-gray-600">
                              {isActive ? new Date(selectedOrder.updatedAt || selectedOrder.createdAt).toLocaleString('vi-VN') : ''}
                            </div>
                          </div>
                          <p className={`${isActive ? 'text-gray-600' : 'text-gray-400'}`}>{step.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sản phẩm ({selectedOrder.items.length})</h2>
              <div className="space-y-4">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                    <div className="w-20 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.book ? <img src={getBookImage(item.book as any)} alt={item.book.title} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 mb-1">{item.book?.title || item.bookId}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.book?.author || 'Đang cập nhật tác giả'}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Số lượng: {item.quantity}</span>
                        <span className="font-bold text-orange-600">{formatCurrency(Number(item.price))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center justify-between text-gray-600">
                  <span>Tạm tính</span>
                  <span className="font-medium">
                    {formatCurrency(
                      selectedOrder.items.reduce((sum, item) => sum + Number(item.subTotal || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-medium">{formatCurrency(Number(selectedOrder.shippingFee || 0))}</span>
                </div>
                <div className="flex items-center justify-between text-xl font-bold text-gray-900 pt-3 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-orange-600">{formatCurrency(Number(selectedOrder.totalAmount))}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 xl:col-span-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Home className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900">Địa chỉ nhận hàng</h3>
              </div>

              {address ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Người nhận</div>
                      <div className="font-medium text-gray-900">{address.receiverName}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Số điện thoại</div>
                      <div className="font-medium text-gray-900">{address.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Địa chỉ</div>
                      <div className="font-medium text-gray-900">
                        {[address.addressLine, address.wardName, address.districtName, address.provinceName].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">Đơn hàng chưa có địa chỉ chi tiết.</div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-bold text-gray-900">Thanh toán</h3>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-600">Phương thức</span>
                <span className="font-bold text-gray-900">{payment?.method || 'Đang cập nhật'}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900">Cần hỗ trợ?</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">Liên hệ với chúng tôi nếu bạn cần hỗ trợ về đơn hàng.</p>
              <div className="space-y-2">
                <button className="w-full bg-white border border-blue-200 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Chat với CSKH
                </button>
                <button className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:border-orange-300 hover:bg-orange-50 transition-all flex items-center justify-center gap-2">
                  <Star className="w-4 h-4" />
                  Đánh giá đơn hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
