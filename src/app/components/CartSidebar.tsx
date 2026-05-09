import { useState } from 'react';
import { X, ShoppingCart, Trash2, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type SidebarCartItem = {
  id: string | number;
  title: string;
  author: string;
  price: string;
  image: string;
  quantity: number;
};

export function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { items, removeFromCart, updateQuantity, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();
  const [itemToRemove, setItemToRemove] = useState<SidebarCartItem | null>(null);
  const [removedItemTitle, setRemovedItemTitle] = useState('');

  const handleViewCart = () => {
    navigate('/cart');
    onClose();
  };

  const handleQuantityChange = (item: SidebarCartItem, quantity: number) => {
    if (quantity <= 0) {
      setItemToRemove(item);
      return;
    }

    updateQuantity(item.id, quantity);
  };

  const confirmRemoveItem = async () => {
    if (!itemToRemove) return;

    await removeFromCart(itemToRemove.id);
    setRemovedItemTitle(itemToRemove.title);
    setItemToRemove(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} />

      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:w-[450px]">
        <div className="flex items-center justify-between border-b p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500">
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Giỏ hàng</h2>
              <p className="text-sm text-gray-600">{totalItems} sản phẩm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            aria-label="Đóng giỏ hàng"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">Giỏ hàng trống</h3>
              <p className="mb-6 text-gray-600">Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm</p>
              <button
                onClick={onClose}
                className="rounded-xl bg-orange-500 px-6 py-3 font-medium text-white transition-colors hover:bg-orange-600"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                  <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg">
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 line-clamp-2 font-bold text-gray-900">{item.title}</h3>
                    <p className="mb-2 text-sm text-gray-600">{item.author}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-orange-500">{item.price}</span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 transition-colors hover:border-orange-500 hover:bg-orange-50"
                          aria-label={`Giảm số lượng ${item.title}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-300 transition-colors hover:border-orange-500 hover:bg-orange-50"
                          aria-label={`Tăng số lượng ${item.title}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setItemToRemove(item)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Xóa ${item.title} khỏi giỏ hàng`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-6">
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between text-gray-600">
                <span>Tạm tính ({totalItems} sản phẩm)</span>
                <span className="font-medium">{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="font-medium text-green-600">Tính ở bước thanh toán</span>
              </div>
              <div className="flex items-center justify-between border-t pt-3">
                <span className="text-lg font-bold text-gray-900">Tổng tạm tính</span>
                <span className="text-2xl font-bold text-orange-500">{totalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

            <button
              onClick={handleViewCart}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              Xem giỏ hàng & Thanh toán
            </button>
            <button
              onClick={onClose}
              className="mt-3 w-full rounded-xl border-2 border-gray-200 py-3 font-medium text-gray-700 transition-all hover:border-orange-300 hover:bg-orange-50"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        )}
      </div>

      {itemToRemove && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Xóa khỏi giỏ hàng?</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Bạn có chắc muốn xóa "{itemToRemove.title}" khỏi giỏ hàng không?
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setItemToRemove(null)}
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={confirmRemoveItem}
                className="rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-700"
              >
                Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {removedItemTitle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
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
      )}
    </>
  );
}
