import type { ApiBook } from '../services/book.service';

export interface DisplayBook {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  price: number;
  originalPrice: number | null;
  discount: number;
  rating: number;
  reviews: number;
  sold: number;
  image: string;
  releaseDate: string | null;
  categoryId?: string;
}

const FALLBACK_BOOK_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800',
];

const getFallbackBookImage = (bookId: string) => {
  const hash = bookId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_BOOK_IMAGES[hash % FALLBACK_BOOK_IMAGES.length];
};

export const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

export const formatReleaseDate = (value?: string | null) => {
  if (!value) {
    return 'Đang cập nhật';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Đang cập nhật';
  }

  return date.toLocaleDateString('vi-VN');
};

export const getBookImage = (book: ApiBook) => {
  if (book.image) {
    return book.image;
  }

  const firstImage = book.images?.[0];
  if (typeof firstImage === 'string') {
    return firstImage;
  }

  return firstImage?.imageUrl || firstImage?.url || getFallbackBookImage(book.id);
};

export const toDisplayBook = (book: ApiBook, index: number): DisplayBook => {
  const price = Number(book.price) || 0;
  const originalPrice =
    book.originalPrice != null ? Number(book.originalPrice) : Math.round(price * 1.25);
  const safeOriginalPrice = originalPrice > price ? originalPrice : null;
  const discount =
    typeof book.discount === 'number'
      ? book.discount
      : safeOriginalPrice
        ? Math.round((1 - price / safeOriginalPrice) * 100)
        : 0;

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    subtitle: book.description || 'Khám phá nội dung nổi bật của cuốn sách này.',
    price,
    originalPrice: safeOriginalPrice,
    discount,
    rating: Number(book.rating) || 4.5,
    reviews: Number(book.totalReviews) || 0,
    sold: Number(book.soldCount) || index,
    image: getBookImage(book),
    releaseDate: book.releaseDate || null,
    categoryId: book.categoryId,
  };
};
