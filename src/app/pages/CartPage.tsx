import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  Tag,
  Truck,
  Shield,
  CreditCard,
  Clock,
  Star,
  Gift,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { getBestSellerBooks } from '../services/book.service';
import { formatCurrency, toDisplayBook, type DisplayBook } from '../utils/book-display';

export function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice, addToCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [suggestedBooks, setSuggestedBooks] = useState<DisplayBook[]>([]);

  useEffect(() => {
    const fetchSuggestedBooks = async () => {
      try {
        const data = await getBestSellerBooks();
        setSuggestedBooks(data.map((book, index) => toDisplayBook(book, index)).slice(0, 4));
      } catch (error) {
        console.error('Fetch suggested books error:', error);
        setSuggestedBooks([]);
      }
    };

    fetchSuggestedBooks();
  }, []);

  const shippingFee = totalPrice >= 200000 ? 0 : 30000;
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = totalPrice + shippingFee - discount;

  const applyCoupon = () => {
    if (couponCode.toUpperCase() === 'TRAMSACH2024') {
      setAppliedCoupon({ code: couponCode, discount: 50000 });
    } else if (couponCode.toUpperCase() === 'FREESHIP') {
      setAppliedCoupon({ code: couponCode, discount: shippingFee });
    } else {
      toast.error('Mã giảm giá không hợp lệ');
    }
  };

  const SuggestedSection = ({ title }: { title: string }) => (
    <div className="mt-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{title}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {suggestedBooks.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
            onClick={() => navigate(`/book/${book.id}`)}
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
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
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({
                      id: book.id,
                      title: book.title,
                      author: book.author,
                      price: formatCurrency(book.price),
                      image: book.image,
                    });
                  }}
                  className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Trang chủ / Giỏ hàng</span>
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="max-w-md mx-auto text-center">
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Giỏ hàng trống</h2>
            <p className="text-gray-600 mb-8">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá và chọn những cuốn sách yêu thích của bạn!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 inline-flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Tiếp tục mua sắm
            </button>
          </div>

          <SuggestedSection title="Có thể bạn sẽ thích" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Trang chủ / Giỏ hàng</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Giỏ hàng của bạn</h1>
          <p className="text-gray-600">Bạn có {totalItems} sản phẩm trong giỏ hàng</p>
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { icon: Truck, color: 'bg-blue-500', title: 'Miễn phí vận chuyển', desc: 'Đơn từ 200.000đ' },
                  { icon: Shield, color: 'bg-green-500', title: 'Hàng chính hãng', desc: '100% cam kết' },
                  { icon: Clock, color: 'bg-orange-500', title: 'Giao hàng nhanh', desc: '2-3 ngày' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-3">
                      <div className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b bg-gray-50">
                <div className="hidden grid-cols-12 gap-4 text-sm font-bold text-gray-700 md:grid">
                  <div className="col-span-6">SẢN PHẨM</div>
                  <div className="col-span-2 text-center">ĐƠN GIÁ</div>
                  <div className="col-span-2 text-center">SỐ LƯỢNG</div>
                  <div className="col-span-2 text-right">THÀNH TIỀN</div>
                </div>
              </div>

              <div className="divide-y">
                {items.map((item) => {
                  const itemPrice = parseFloat(item.price.replace(/[^\d]/g, ''));
                  const itemTotal = itemPrice * item.quantity;

                  return (
                    <div key={item.id} className="p-5 transition-colors hover:bg-gray-50 sm:p-6">
                      <div className="grid gap-4 md:grid-cols-12 md:items-center">
                        <div className="flex gap-4 md:col-span-6">
                          <div className="w-24 h-32 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                            <p className="text-sm text-gray-600 mb-3">{item.author}</p>
                            <button onClick={() => removeFromCart(item.id)} className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors">
                              <Trash2 className="w-4 h-4" />
                              Xóa
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2 md:text-center">
                          <span className="font-bold text-gray-900">{item.price}</span>
                        </div>

                        <div className="md:col-span-2 md:flex md:justify-center">
                          <div className="flex items-center gap-3 bg-gray-100 rounded-lg p-1">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8 rounded-md bg-white border border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-12 text-center font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8 rounded-md bg-white border border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2 md:text-right">
                          <span className="font-bold text-orange-600 text-lg">{itemTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={() => navigate('/')} className="mt-6 flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors">
              <ChevronLeft className="w-5 h-5" />
              Tiếp tục mua sắm
            </button>
          </div>

          <div className="xl:col-span-4">
            <div className="sticky top-4">
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Tag className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Mã giảm giá</h3>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Nhập mã giảm giá"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
                  />
                  <button onClick={applyCoupon} className="bg-orange-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors">
                    Áp dụng
                  </button>
                </div>

                {appliedCoupon && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Mã "{appliedCoupon.code}" đã được áp dụng</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-green-700 hover:text-green-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Tag className="w-4 h-4" />
                    <span>Mã khả dụng: TRAMSACH2024, FREESHIP</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="font-bold text-gray-900 mb-6 text-lg">Thông tin đơn hàng</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Tạm tính ({totalItems} sản phẩm)</span>
                    <span className="font-medium">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    {shippingFee === 0 ? (
                      <span className="font-medium text-green-600">Miễn phí</span>
                    ) : (
                      <span className="font-medium">{shippingFee.toLocaleString('vi-VN')}đ</span>
                    )}
                  </div>
                  {discount > 0 && (
                    <div className="flex items-center justify-between text-green-600">
                      <span>Giảm giá</span>
                      <span className="font-medium">-{discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                    <span className="text-3xl font-bold text-orange-600">{finalTotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <p className="text-sm text-gray-600 text-right">(Đã bao gồm VAT)</p>
                </div>

                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 mb-3"
                >
                  <CreditCard className="w-5 h-5" />
                  Thanh toán ngay
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:border-orange-300 hover:bg-orange-50 transition-all"
                >
                  Tiếp tục mua sắm
                </button>
              </div>
            </div>
          </div>
        </div>

        <SuggestedSection title="Có thể bạn cũng thích" />
      </div>
    </div>
  );
}
