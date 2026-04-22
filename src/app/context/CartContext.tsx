import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import authApi from '../utils/api';
import { getBookImage } from '../utils/book-display';

interface CartItem {
  id: string | number;
  title: string;
  author: string;
  price: string;
  image: string;
  quantity: number;
  cartItemId?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => Promise<void>;
  removeFromCart: (id: string | number) => Promise<void>;
  updateQuantity: (id: string | number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

interface ServerCartItem {
  id: string;
  quantity: number;
  bookId: string;
  book?: {
    id: string;
    title: string;
    author: string;
    price: number | string;
    image?: string;
    images?: Array<string | { imageUrl?: string; url?: string }>;
  };
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const LOCAL_CART_KEY = 'tram-sach-local-cart';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const formatPrice = (value: number | string) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const isValidBookId = (value: string | number) => typeof value === 'string' && UUID_PATTERN.test(value);

const mapServerCartItems = (items: ServerCartItem[]): CartItem[] =>
  items.map((item) => ({
    id: item.bookId,
    cartItemId: item.id,
    title: item.book?.title || 'Sách',
    author: item.book?.author || 'Đang cập nhật',
    price: formatPrice(item.book?.price || 0),
    image: item.book ? getBookImage(item.book as any) : '',
    quantity: item.quantity,
  }));

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem(LOCAL_CART_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated]);

  const loadServerCart = async () => {
    const response = await authApi.get('/cart');
    const serverItems = response.data?.data?.items || [];
    setItems(mapServerCartItems(serverItems));
  };

  useEffect(() => {
    const syncCart = async () => {
      if (!isAuthenticated) {
        const stored = localStorage.getItem(LOCAL_CART_KEY);
        setItems(stored ? JSON.parse(stored) : []);
        return;
      }

      try {
        const localItems = JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]') as CartItem[];
        const validLocalItems = localItems.filter((item) => isValidBookId(item.id));
        const invalidLocalItems = localItems.filter((item) => !isValidBookId(item.id));

        if (validLocalItems.length > 0) {
          for (const item of validLocalItems) {
            await authApi.post('/cart/add', {
              bookId: item.id,
              quantity: item.quantity,
            });
          }
        }

        if (invalidLocalItems.length > 0) {
          localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(invalidLocalItems));
        } else {
          localStorage.removeItem(LOCAL_CART_KEY);
        }

        await loadServerCart();
      } catch (error) {
        console.error('Cart sync error:', error);
      }
    };

    syncCart();
  }, [isAuthenticated]);

  const addToCart = async (item: Omit<CartItem, 'quantity'>) => {
    if (isAuthenticated) {
      if (!isValidBookId(item.id)) {
        toast.error('Sáº£n pháº©m nĂ y chÆ°a sáºµn sĂ ng Ä‘á»ƒ mua trÃªn há»‡ thá»‘ng');
        return;
      }

      try {
        await authApi.post('/cart/add', {
          bookId: item.id,
          quantity: 1,
        });
        await loadServerCart();
        toast.success(`Đã thêm "${item.title}" vào giỏ hàng`);
      } catch (error: any) {
        console.error('Add to cart error:', error);
        toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
      }
      return;
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === item.id);
      const nextQuantity = existingItem ? existingItem.quantity + 1 : 1;

      toast.success(`Đã thêm "${item.title}" vào giỏ hàng`, {
        description: `Số lượng hiện tại: ${nextQuantity}`,
      });

      if (existingItem) {
        return prevItems.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = async (id: string | number) => {
    if (isAuthenticated) {
      const item = items.find((cartItem) => cartItem.id === id);
      if (!item?.cartItemId) return;

      try {
        await authApi.delete(`/cart/remove/${item.cartItemId}`);
        await loadServerCart();
      } catch (error: any) {
        console.error('Remove cart item error:', error);
        toast.error(error?.response?.data?.message || 'Không thể xóa sản phẩm');
      }
      return;
    }

    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const updateQuantity = async (id: string | number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(id);
      return;
    }

    if (isAuthenticated) {
      const item = items.find((cartItem) => cartItem.id === id);
      if (!item?.cartItemId) return;

      try {
        await authApi.put(`/cart/update/${item.cartItemId}`, { quantity });
        await loadServerCart();
      } catch (error: any) {
        console.error('Update cart quantity error:', error);
        toast.error(error?.response?.data?.message || 'Không thể cập nhật số lượng');
      }
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await Promise.all(
          items
            .filter((item) => item.cartItemId)
            .map((item) => authApi.delete(`/cart/remove/${item.cartItemId}`))
        );
        await loadServerCart();
      } catch (error) {
        console.error('Clear server cart error:', error);
      }
      return;
    }

    setItems([]);
    localStorage.removeItem(LOCAL_CART_KEY);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^\d]/g, ''));
    return sum + price * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
