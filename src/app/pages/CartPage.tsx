import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ChevronLeft,
  Truck,
  Shield,
  CreditCard,
  Clock,
  Star,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { getBestSellerBooks } from '../services/book.service';
import { formatCurrency, toVisibleDisplayBooks, type DisplayBook } from '../utils/book-display';

type CartItemView = {
  id: string | number;
  title: string;
  author: string;
  price: string;
  image: string;
  quantity: number;
};

const BUY_NOW_ITEM_KEY = 'tram-sach-buy-now-item';

export function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    items,
    removeFromCart,
    removeSelectedItems,
    updateQuantity,
    totalItems,
    addToCart,
    selectedTotalItems,
    selectedTotalPrice,
    areAllItemsSelected,
    isLoading,
    error,
    refreshCart,
    toggleAllSelection,
    toggleItemSelection,
    isItemSelected,
  } = useCart();

  const [suggestedBooks, setSuggestedBooks] = useState<DisplayBook[]>([]);
  const [itemToRemove, setItemToRemove] = useState<CartItemView | null>(null);
  const [showRemoveSelectedConfirm, setShowRemoveSelectedConfirm] = useState(false);
  const [removedItemTitle, setRemovedItemTitle] = useState('');
  const [buyNowItem, setBuyNowItem] = useState<CartItemView | null>(null);

  useEffect(() => {
    if ((location.state as { mode?: string } | null)?.mode !== 'buy-now') return;

    try {
      setBuyNowItem(JSON.parse(sessionStorage.getItem(BUY_NOW_ITEM_KEY) || 'null'));
    } catch {
      sessionStorage.removeItem(BUY_NOW_ITEM_KEY);
      setBuyNowItem(null);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchSuggestedBooks = async () => {
      try {
        const data = await getBestSellerBooks();
        setSuggestedBooks(toVisibleDisplayBooks(data).slice(0, 4));
      } catch (error) {
        console.error('Fetch suggested books error:', error);
        setSuggestedBooks([]);
      }
    };

    fetchSuggestedBooks();
  }, []);

  const getItemPrice = (item: CartItemView) => Number(item.price.replace(/[^\d]/g, '')) || 0;
  const isBuyNowMode = Boolean(buyNowItem);
  const visibleItems = buyNowItem ? [buyNowItem] : items;
  const checkoutItemCount = buyNowItem ? buyNowItem.quantity : selectedTotalItems;
  const checkoutSubtotal = buyNowItem ? getItemPrice(buyNowItem) * buyNowItem.quantity : selectedTotalPrice;
  const visibleTotalItems = buyNowItem ? buyNowItem.quantity : totalItems;
  const shippingFee = checkoutItemCount === 0 || checkoutSubtotal >= 200000 ? 0 : 30000;
  const finalTotal = checkoutItemCount === 0 ? 0 : checkoutSubtotal + shippingFee;

  const handleQuantityChange = async (item: CartItemView, quantity: number) => {
    if (quantity <= 0) {
      setItemToRemove(item);
      return;
    }

    if (isBuyNowMode) {
      const nextItem = { ...item, quantity };
      setBuyNowItem(nextItem);
      sessionStorage.setItem(BUY_NOW_ITEM_KEY, JSON.stringify(nextItem));
      return;
    }

    await updateQuantity(item.id, quantity);
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;

    try {
      if (isBuyNowMode) {
        sessionStorage.removeItem(BUY_NOW_ITEM_KEY);
        setBuyNowItem(null);
        setRemovedItemTitle(itemToRemove.title);
        return;
      }

      await removeFromCart(itemToRemove.id);
      setRemovedItemTitle(itemToRemove.title);
    } finally {
      setItemToRemove(null);
    }
  };

  const confirmRemoveSelected = async () => {
    if (selectedTotalItems === 0) return;

    await removeSelectedItems();
    setShowRemoveSelectedConfirm(false);
    setRemovedItemTitle(`${selectedTotalItems} sản phẩm đã chọn`);
  };

  const handleCheckout = () => {
    if (checkoutItemCount === 0) {
      toast.error('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán');
      return;
    }

    navigate(isBuyNowMode ? '/checkout?mode=buy-now' : '/checkout', {
      state: isBuyNowMode ? { mode: 'buy-now' } : undefined,
    });
  };

  if (!isBuyNowMode && isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">
        Đang tải giỏ hàng...
      </div>
    );
  }

  const SuggestedSection = ({ title }: { title: string }) => {
    if (suggestedBooks.length === 0) return null;

    return (
      <div className="mt-16">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">{title}</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {suggestedBooks.map((book) => (
            <div
              key={book.id}
              className="cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img src={book.image} alt={book.title} className="h-full w-full object-cover" />
                {book.discount > 0 && (
                  <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                    Khuyến mãi -{book.discount}%
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="mb-1 line-clamp-2 font-bold text-gray-900">{book.title}</h3>
                <p className="mb-3 text-sm text-gray-600">{book.author}</p>
                <div className="mb-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    {book.discount > 0 && (
                      <div className="mb-1 text-xs font-semibold text-red-600">Đang khuyến mãi</div>
                    )}
                    <div className={`font-bold ${book.discount > 0 ? 'text-red-600' : 'text-orange-500'}`}>{formatCurrency(book.price)}</div>
                    {book.originalPrice && (
                      <div className="text-sm text-gray-400 line-through">{formatCurrency(book.originalPrice)}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={book.isOutOfStock}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (book.isOutOfStock) return;
                      addToCart({
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        price: formatCurrency(book.price),
                        image: book.image,
                      });
                    }}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                    aria-label={`Thêm ${book.title} vào giỏ hàng`}
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const RemoveConfirmModal = () => {
    if (!itemToRemove && !showRemoveSelectedConfirm) return null;

    const isBulk = showRemoveSelectedConfirm;
    const title = isBulk ? 'Xóa sản phẩm đã chọn?' : 'Xóa khỏi giỏ hàng?';
    const message = isBulk
      ? `Bạn có chắc muốn xóa ${selectedTotalItems} sản phẩm đã chọn khỏi giỏ hàng không?`
      : `Bạn có chắc muốn xóa "${itemToRemove?.title}" khỏi giỏ hàng không?`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-600">{message}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setItemToRemove(null);
                setShowRemoveSelectedConfirm(false);
              }}
              className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Giữ lại
            </button>
            <button
              type="button"
              onClick={isBulk ? confirmRemoveSelected : confirmRemoveItem}
              className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Xóa sản phẩm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const RemovedNoticeModal = () => {
    if (!removedItemTitle) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
          <button
            type="button"
            onClick={() => setRemovedItemTitle('')}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Đóng thông báo"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Đã xóa khỏi giỏ hàng</h3>
          <p className="mt-2 text-sm text-gray-600">{removedItemTitle}</p>
          <button
            type="button"
            onClick={() => setRemovedItemTitle('')}
            className="mt-5 w-full rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            Đã hiểu
          </button>
        </div>
      </div>
    );
  };

  if (visibleItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 transition-colors hover:text-orange-500">
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Trang chủ / Giỏ hàng</span>
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-gray-100">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-gray-900">Giỏ hàng trống</h2>
            <p className="mb-8 text-gray-600">
              Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy khám phá và chọn những cuốn sách yêu thích.
            </p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <ShoppingCart className="h-5 w-5" />
              Tiếp tục mua sắm
            </button>
          </div>

          <SuggestedSection title="Có thể bạn sẽ thích" />
        </div>
        <RemovedNoticeModal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-gray-600 transition-colors hover:text-orange-500">
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Trang chủ / Giỏ hàng</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Giỏ hàng của bạn</h1>
          <p className="text-gray-600">
            {isBuyNowMode ? 'Sản phẩm mua ngay của bạn' : `Bạn có ${visibleTotalItems} sản phẩm trong giỏ hàng`}
          </p>
          {!isBuyNowMode && error && (
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={refreshCart}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Tải lại
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-8 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { icon: Truck, color: 'bg-blue-500', title: 'Miễn phí vận chuyển', desc: 'Đơn từ 200.000đ' },
                  { icon: Shield, color: 'bg-green-500', title: 'Hàng chính hãng', desc: '100% cam kết' },
                  { icon: Clock, color: 'bg-orange-500', title: 'Giao hàng nhanh', desc: '2-3 ngày' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${item.color}`}>
                        <Icon className="h-6 w-6 text-white" />
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

            <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
              <div className="border-b bg-gray-50 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  {!isBuyNowMode && (
                  <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
                    <input
                      type="checkbox"
                      checked={areAllItemsSelected}
                      onChange={toggleAllSelection}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    Chọn tất cả sản phẩm
                  </label>
                  )}
                  {isBuyNowMode && <span className="text-sm font-bold text-orange-700">Luồng mua ngay</span>}
                  {!isBuyNowMode && <button
                    type="button"
                    onClick={() => setShowRemoveSelectedConfirm(true)}
                    disabled={selectedTotalItems === 0}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 transition-colors hover:text-red-700 disabled:cursor-not-allowed disabled:text-gray-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    Xóa sản phẩm đã chọn
                  </button>}
                </div>
              </div>

              <div className="divide-y">
                {visibleItems.map((item) => {
                  const itemPrice = getItemPrice(item);
                  const itemTotal = itemPrice * item.quantity;
                  const selected = isBuyNowMode || isItemSelected(item.id);

                  return (
                    <div key={item.id} className={`p-5 transition-colors sm:p-6 ${selected ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="grid gap-4 md:grid-cols-12 md:items-center">
                        <div className="flex gap-4 md:col-span-6">
                          <div className="flex items-start pt-1">
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={isBuyNowMode}
                              onChange={() => toggleItemSelection(item.id)}
                              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate(`/book/${item.id}`)}
                            className="h-32 w-24 shrink-0 overflow-hidden rounded-lg shadow-md"
                          >
                            <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                          </button>
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-2 line-clamp-2 font-bold text-gray-900">{item.title}</h3>
                            <p className="mb-3 text-sm text-gray-600">{item.author}</p>
                            <button
                              type="button"
                              onClick={() => setItemToRemove(item)}
                              className="flex items-center gap-1 text-sm text-red-600 transition-colors hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2 md:text-center">
                          <span className="font-bold text-gray-900">{item.price}</span>
                        </div>

                        <div className="md:col-span-2 md:flex md:justify-center">
                          <div className="flex w-fit items-center gap-3 rounded-lg bg-gray-100 p-1">
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item, item.quantity - 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white transition-colors hover:border-orange-500 hover:bg-orange-50"
                              aria-label={`Giảm số lượng ${item.title}`}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-12 text-center font-bold">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(item, item.quantity + 1)}
                              className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 bg-white transition-colors hover:border-orange-500 hover:bg-orange-50"
                              aria-label={`Tăng số lượng ${item.title}`}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="md:col-span-2 md:text-right">
                          <span className="text-lg font-bold text-orange-600">{itemTotal.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button onClick={() => navigate('/')} className="mt-6 flex items-center gap-2 font-medium text-orange-600 transition-colors hover:text-orange-700">
              <ChevronLeft className="h-5 w-5" />
              Tiếp tục mua sắm
            </button>
          </div>

          <div className="xl:col-span-4">
            <div className="sticky top-4 rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-6 text-lg font-bold text-gray-900">Thông tin đơn hàng</h3>
              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between gap-4 text-gray-600">
                  <span>Tạm tính ({checkoutItemCount} sản phẩm)</span>
                  <span className="font-medium">{checkoutSubtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-gray-600">
                  <span>Phí vận chuyển</span>
                  {shippingFee === 0 ? (
                    <span className="font-medium text-green-600">{checkoutItemCount === 0 ? 'Chưa tính' : 'Miễn phí'}</span>
                  ) : (
                    <span className="font-medium">{shippingFee.toLocaleString('vi-VN')}đ</span>
                  )}
                </div>
              </div>

              <div className="mb-6 border-t pt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Tổng cộng</span>
                  <span className="text-3xl font-bold text-orange-600">{finalTotal.toLocaleString('vi-VN')}đ</span>
                </div>
                <p className="text-right text-sm text-gray-600">(Đã bao gồm VAT)</p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkoutItemCount === 0}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <CreditCard className="h-5 w-5" />
                Thanh toán ngay
                <ArrowRight className="h-5 w-5" />
              </button>
              {checkoutItemCount === 0 && (
                <p className="mb-3 text-sm text-red-500">Vui lòng chọn ít nhất 1 sản phẩm để thanh toán.</p>
              )}

              <button
                onClick={() => navigate('/')}
                className="w-full rounded-xl border-2 border-gray-200 py-3 font-medium text-gray-700 transition-all hover:border-orange-300 hover:bg-orange-50"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          </div>
        </div>

        <SuggestedSection title="Có thể bạn cũng thích" />
      </div>

      <RemoveConfirmModal />
      <RemovedNoticeModal />
    </div>
  );
}
