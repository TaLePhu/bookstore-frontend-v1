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
  selectedItems: CartItem[];
  selectedItemIds: string[];
  isLoading: boolean;
  error: string;
  addToCart: (
    item: Omit<CartItem, 'quantity'>,
    quantity?: number,
    options?: { selectOnly?: boolean; silent?: boolean }
  ) => Promise<void>;
  removeFromCart: (id: string | number) => Promise<void>;
  updateQuantity: (id: string | number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  removeSelectedItems: () => Promise<void>;
  removeItemsLocally: (ids: Array<string | number>) => void;
  refreshCart: () => Promise<void>;
  toggleItemSelection: (id: string | number) => void;
  toggleAllSelection: () => void;
  isItemSelected: (id: string | number) => boolean;
  totalItems: number;
  totalPrice: number;
  selectedTotalItems: number;
  selectedTotalPrice: number;
  areAllItemsSelected: boolean;
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
const toItemKey = (id: string | number) => String(id);
const getItemPrice = (item: CartItem) => Number(item.price.replace(/[^\d]/g, '')) || 0;

const mapServerCartItems = (items: ServerCartItem[] = []): CartItem[] =>
  items.filter((item) => item.bookId || item.book?.id).map((item) => ({
    id: item.bookId || item.book!.id,
    cartItemId: item.id,
    title: item.book?.title || 'Sách',
    author: item.book?.author || 'Đang cập nhật',
    price: formatPrice(item.book?.price || 0),
    image: item.book ? getBookImage(item.book as any) : '',
    quantity: item.quantity,
  }));

const readLocalCart = (): CartItem[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CART_KEY) || '[]') as CartItem[];
  } catch {
    localStorage.removeItem(LOCAL_CART_KEY);
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => readLocalCart());
  const [cartOwner, setCartOwner] = useState<'guest' | 'user'>(() => (isAuthenticated ? 'user' : 'guest'));
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated && cartOwner === 'guest') {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
    }
  }, [items, isAuthenticated, cartOwner]);

  useEffect(() => {
    if (!items.length) {
      setSelectedItemIds([]);
      setHasInitializedSelection(false);
      return;
    }

    const itemKeys = new Set(items.map((item) => toItemKey(item.id)));

    if (!hasInitializedSelection) {
      setSelectedItemIds(Array.from(itemKeys));
      setHasInitializedSelection(true);
      return;
    }

    setSelectedItemIds((prev) => prev.filter((id) => itemKeys.has(id)));
  }, [items, hasInitializedSelection]);

  const loadServerCart = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await authApi.get('/cart');
      const serverItems = response.data?.data?.items || [];
      setItems(mapServerCartItems(serverItems));
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Không thể tải giỏ hàng';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const syncCart = async () => {
      if (!isAuthenticated) {
        setCartOwner('guest');
        setItems(readLocalCart());
        setError('');
        return;
      }

      try {
        setCartOwner('user');
        const localItems = readLocalCart();
        const validLocalItems = localItems.filter((item) => isValidBookId(item.id));
        const invalidLocalItems = localItems.filter((item) => !isValidBookId(item.id));
        const mergedQuantity = validLocalItems.reduce((sum, item) => sum + item.quantity, 0);

        for (const item of validLocalItems) {
          await authApi.post('/cart/add', {
            bookId: item.id,
            quantity: item.quantity,
          });
        }

        if (invalidLocalItems.length > 0) {
          localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(invalidLocalItems));
        } else {
          localStorage.removeItem(LOCAL_CART_KEY);
        }

        await loadServerCart();

        if (validLocalItems.length > 0) {
          toast.success('Đã gộp giỏ hàng của khách vào tài khoản', {
            description: `${mergedQuantity} sản phẩm từ giỏ hàng khách đã được thêm vào giỏ hàng của bạn.`,
          });
        }
      } catch (error) {
        console.error('Cart sync error:', error);
        setError('Không thể đồng bộ giỏ hàng');
      }
    };

    syncCart();
  }, [isAuthenticated]);

  const addToCart = async (
    item: Omit<CartItem, 'quantity'>,
    quantity = 1,
    options: { selectOnly?: boolean; silent?: boolean } = {}
  ) => {
    const safeQuantity = Math.max(1, Math.floor(quantity));

    if (isAuthenticated) {
      if (!isValidBookId(item.id)) {
        toast.error('Sản phẩm này chưa sẵn sàng để mua trên hệ thống');
        return;
      }

      try {
        await authApi.post('/cart/add', {
          bookId: item.id,
          quantity: safeQuantity,
        });
        await loadServerCart();
        if (options.selectOnly) {
          setSelectedItemIds([toItemKey(item.id)]);
          setHasInitializedSelection(true);
        }
        if (!options.silent) {
          toast.success(`Đã thêm "${item.title}" vào giỏ hàng`);
        }
      } catch (error: any) {
        console.error('Add to cart error:', error);
        toast.error(error?.response?.data?.message || 'Không thể thêm vào giỏ hàng');
      }
      return;
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
      const nextQuantity = existingItem ? existingItem.quantity + safeQuantity : safeQuantity;

      if (!options.silent) {
        toast.success(`Đã thêm "${item.title}" vào giỏ hàng`, {
          description: `Số lượng hiện tại: ${nextQuantity}`,
        });
      }

      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + safeQuantity } : cartItem
        );
      }

      return [...prevItems, { ...item, quantity: safeQuantity }];
    });

    if (options.selectOnly) {
      setSelectedItemIds([toItemKey(item.id)]);
      setHasInitializedSelection(true);
    }
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

  const removeSelectedItems = async () => {
    if (selectedItemIds.length === 0) return;

    const selectedSet = new Set(selectedItemIds);
    const selectedItems = items.filter((item) => selectedSet.has(toItemKey(item.id)));

    if (isAuthenticated) {
      try {
        await Promise.all(
          selectedItems
            .filter((item) => item.cartItemId)
            .map((item) => authApi.delete(`/cart/remove/${item.cartItemId}`))
        );
        await loadServerCart();
      } catch (error) {
        console.error('Remove selected items error:', error);
      }
      return;
    }

    setItems((prevItems) => prevItems.filter((item) => !selectedSet.has(toItemKey(item.id))));
  };

  const removeItemsLocally = (ids: Array<string | number>) => {
    const itemKeys = new Set(ids.map(toItemKey));
    setItems((prevItems) => prevItems.filter((item) => !itemKeys.has(toItemKey(item.id))));
    setSelectedItemIds((prev) => prev.filter((id) => !itemKeys.has(id)));
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      await loadServerCart();
      return;
    }

    setItems(readLocalCart());
  };

  const toggleItemSelection = (id: string | number) => {
    const itemKey = toItemKey(id);
    setSelectedItemIds((prev) =>
      prev.includes(itemKey) ? prev.filter((selectedId) => selectedId !== itemKey) : [...prev, itemKey]
    );
  };

  const toggleAllSelection = () => {
    const allItemKeys = items.map((item) => toItemKey(item.id));
    const allSelected = allItemKeys.length > 0 && allItemKeys.every((id) => selectedItemIds.includes(id));
    setSelectedItemIds(allSelected ? [] : allItemKeys);
  };

  const isItemSelected = (id: string | number) => selectedItemIds.includes(toItemKey(id));

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const selectedItems = items.filter((item) => selectedItemIds.includes(toItemKey(item.id)));
  const selectedTotalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const selectedTotalPrice = selectedItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const areAllItemsSelected =
    items.length > 0 && items.every((item) => selectedItemIds.includes(toItemKey(item.id)));

  return (
    <CartContext.Provider
      value={{
        items,
        selectedItems,
        selectedItemIds,
        isLoading,
        error,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        removeSelectedItems,
        removeItemsLocally,
        refreshCart,
        toggleItemSelection,
        toggleAllSelection,
        isItemSelected,
        totalItems,
        totalPrice,
        selectedTotalItems,
        selectedTotalPrice,
        areAllItemsSelected,
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
