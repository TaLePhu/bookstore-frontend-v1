import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  Wallet,
  Building2,
  Truck,
  Package,
  Clock,
  Tag,
  Gift,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import authApi from '../utils/api';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    note: '',
  });

  const shippingOptions = [
    { id: 'standard', name: 'Giao hàng tiêu chuẩn', description: '3-5 ngày làm việc', price: 30000, icon: Package },
    { id: 'express', name: 'Giao hàng nhanh', description: '1-2 ngày làm việc', price: 50000, icon: Truck },
    { id: 'same-day', name: 'Giao trong ngày', description: 'Đặt trước 10h sáng', price: 80000, icon: Clock },
  ];

  const paymentMethods = [
    { id: 'cod', name: 'Thanh toán khi nhận hàng (COD)', description: 'Thanh toán bằng tiền mặt khi nhận hàng', icon: Wallet },
    { id: 'card', name: 'Thẻ tín dụng/Ghi nợ', description: 'Visa, Mastercard, JCB', icon: CreditCard },
    { id: 'bank', name: 'Chuyển khoản ngân hàng', description: 'Chuyển khoản qua Internet Banking', icon: Building2 },
  ];

  const shippingFee = shippingOptions.find((opt) => opt.id === selectedShipping)?.price || 0;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = totalPrice + shippingFee - discount;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
    }
  }, [items.length, navigate]);

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'TRAMSACH2024') {
      setAppliedCoupon({ code: couponCode, discount: 50000 });
    } else if (couponCode.toUpperCase() === 'FREESHIP') {
      setAppliedCoupon({ code: couponCode, discount: shippingFee });
    } else {
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const mapPaymentMethod = () => {
    if (selectedPayment === 'card') return 'CREDIT_CARD';
    if (selectedPayment === 'bank') return 'BANK_TRANSFER';
    return 'COD';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!items.length) {
      navigate('/cart');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Bạn cần đăng nhập trước khi thanh toán');
      navigate('/login');
      return;
    }

    try {
      setIsSubmitting(true);
      const cartItemIds = items.map((item: any) => item.cartItemId).filter(Boolean);

      if (cartItemIds.length === 0) {
        toast.error('Giỏ hàng hiện chưa đồng bộ, vui lòng quay lại giỏ hàng và thử lại');
        navigate('/cart');
        return;
      }

      const res = await authApi.post('/orders', {
        cartItemIds,
        receiverName: formData.fullName,
        phone: formData.phone,
        addressLine: formData.address,
        provinceName: formData.city,
        districtName: formData.district,
        wardName: formData.ward,
        note: formData.note,
        shippingFee,
        paymentMethod: mapPaymentMethod(),
        country: 'Việt Nam',
      });

      await clearCart();
      toast.success('Đặt hàng thành công');
      navigate('/track-order', {
        state: { orderId: res.data?.data?.id },
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error?.response?.data?.message || 'Không thể tạo đơn hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Giỏ hàng / Thanh toán</span>
          </button>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="font-medium text-gray-900">Giỏ hàng</span>
            </div>
            <div className="w-24 h-1 bg-orange-500"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">2</div>
              <span className="font-medium text-orange-600">Thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Thông tin giao hàng</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[
                  { name: 'fullName', label: 'Họ và tên', icon: User, required: true, col: 'md:col-span-2' },
                  { name: 'phone', label: 'Số điện thoại', icon: Phone, required: true },
                  { name: 'email', label: 'Email', icon: Mail, required: false },
                  { name: 'address', label: 'Địa chỉ', icon: MapPin, required: true, col: 'md:col-span-2' },
                ].map((field) => {
                  const Icon = field.icon;
                  return (
                    <div key={field.name} className={field.col}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label} {field.required && <span className="text-red-500">*</span>}
                      </label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type={field.name === 'email' ? 'email' : 'text'}
                          name={field.name}
                          value={(formData as any)[field.name]}
                          onChange={handleInputChange}
                          required={field.required}
                          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors"
                        />
                      </div>
                    </div>
                  );
                })}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tỉnh/Thành phố</label>
                  <input name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quận/Huyện</label>
                  <input name="district" value={formData.district} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phường/Xã</label>
                  <input name="ward" value={formData.ward} onChange={handleInputChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú đơn hàng</label>
                  <textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Phương thức vận chuyển</h2>
              </div>

              <div className="space-y-3">
                {shippingOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <label key={option.id} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedShipping === option.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                      <div className="flex items-center gap-4">
                        <input type="radio" name="shipping" value={option.id} checked={selectedShipping === option.id} onChange={(e) => setSelectedShipping(e.target.value)} className="w-5 h-5 text-orange-500" />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedShipping === option.id ? 'bg-orange-500' : 'bg-gray-100'}`}>
                          <Icon className={`w-6 h-6 ${selectedShipping === option.id ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{option.name}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </div>
                      <div className="font-bold text-orange-600">{option.price.toLocaleString('vi-VN')}đ</div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Phương thức thanh toán</h2>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <label key={method.id} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedPayment === method.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'}`}>
                      <div className="flex items-center gap-4">
                        <input type="radio" name="payment" value={method.id} checked={selectedPayment === method.id} onChange={(e) => setSelectedPayment(e.target.value)} className="w-5 h-5 text-orange-500" />
                        <div>
                          <div className="font-bold text-gray-900">{method.name}</div>
                          <div className="text-sm text-gray-600">{method.description}</div>
                        </div>
                      </div>
                      <Icon className={`w-6 h-6 ${selectedPayment === method.id ? 'text-orange-500' : 'text-gray-400'}`} />
                    </label>
                  );
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <span className="font-bold">Bảo mật thanh toán:</span> Đơn hàng sẽ được tạo trên hệ thống thật sau khi bạn xác nhận thanh toán.
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-4">
            <div className="sticky top-4 space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Đơn hàng ({totalItems} sản phẩm)</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{item.title}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">SL: {item.quantity}</span>
                          <span className="text-sm font-bold text-orange-600">{item.price}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-orange-600" />
                  <h3 className="font-bold text-gray-900">Mã giảm giá</h3>
                </div>

                <div className="mb-3 flex flex-col gap-2 sm:flex-row">
                  <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Nhập mã giảm giá" className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 transition-colors" />
                  <button type="button" onClick={applyCoupon} className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors">
                    Áp dụng
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Mã "{appliedCoupon.code}"</span>
                    </div>
                    <button type="button" onClick={() => setAppliedCoupon(null)} className="text-green-700 hover:text-green-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-lg">Tổng đơn hàng</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-medium">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium">{shippingFee.toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-medium">-{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-3xl font-bold text-orange-600">{finalTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p className="text-sm text-gray-600 text-right">(Đã bao gồm VAT)</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  {isSubmitting ? 'Đang tạo đơn hàng...' : 'Hoàn tất đơn hàng'}
                </button>

                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Bằng việc đặt hàng, bạn đồng ý với điều khoản sử dụng của chúng tôi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
