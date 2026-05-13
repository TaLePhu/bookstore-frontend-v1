import api from './api';
import { getBookImage } from '../utils/book-display';

export interface PromotionBook {
  id: string;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
  discount: number;
  image: string;
  rating: number;
  sold: number;
  stock: number;
  categoryName?: string;
}

export interface DiscountTier {
  percent: number;
  title: string;
  count: number;
}

export interface PromotionCombo {
  id: string;
  title: string;
  books: number;
  price: number;
  originalPrice: number;
  saving: number;
  image: string;
}

export interface PromotionBanner {
  id: string;
  name: string;
  description?: string | null;
  discountPercent: number;
  image: string;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface PromotionProgram {
  id: string;
  name: string;
  description?: string | null;
  discountPercent: number;
  bannerImageUrl?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  bookCount: number;
  books: PromotionBook[];
}

export interface PromotionsResponse {
  flashSaleEndsAt: string;
  flashSaleBooks: PromotionBook[];
  discountTiers: DiscountTier[];
  programs: PromotionProgram[];
  banners: PromotionBanner[];
  combos: PromotionCombo[];
}

const normalizeBook = (book: any): PromotionBook => {
  const price = Number(book.price || 0);
  const originalPrice = Number(book.originalPrice || 0) || price;
  const discount =
    typeof book.discount === 'number' && book.discount > 0
      ? book.discount
      : originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    price,
    originalPrice,
    discount,
    image: getBookImage(book),
    rating: Number(book.rating || 0) || 4.8,
    sold: Number(book.soldCount || 0),
    stock: Number(book.stock || 0),
    categoryName: book.category?.name,
  };
};

const buildPromotionsFromBooks = async (): Promise<PromotionsResponse> => {
  const res = await api.get('/books', {
    params: { limit: 50 },
  });
  const books = (res.data.data || []).map(normalizeBook);
  const discountedBooks = books
    .filter((book: PromotionBook) => book.discount > 0)
    .sort((left: PromotionBook, right: PromotionBook) => right.discount - left.discount || right.sold - left.sold);

  const categoryGroups = new Map<string, PromotionBook[]>();
  discountedBooks.forEach((book: PromotionBook) => {
    const key = book.categoryName || 'Sách khuyến mãi';
    categoryGroups.set(key, [...(categoryGroups.get(key) || []), book]);
  });

  const combos = Array.from(categoryGroups.entries())
    .filter(([, groupedBooks]) => groupedBooks.length >= 2)
    .slice(0, 3)
    .map(([categoryName, groupedBooks], index) => {
      const comboBooks = groupedBooks.slice(0, Math.min(5, groupedBooks.length));
      const price = comboBooks.reduce((sum, book) => sum + book.price, 0);
      const originalPrice = comboBooks.reduce((sum, book) => sum + book.originalPrice, 0);

      return {
        id: `combo-${index + 1}`,
        title: `Combo ${categoryName}`,
        books: comboBooks.length,
        price,
        originalPrice,
        saving: Math.max(0, originalPrice - price),
        image: comboBooks[0].image,
      };
    });

  const flashSaleEndsAt = new Date();
  flashSaleEndsAt.setHours(23, 59, 59, 999);

  return {
    flashSaleEndsAt: flashSaleEndsAt.toISOString(),
    flashSaleBooks: discountedBooks.slice(0, 8),
    discountTiers: [30, 40, 50].map((percent) => ({
      percent,
      title: `Giảm ${percent}%`,
      count: discountedBooks.filter((book: PromotionBook) => book.discount >= percent).length,
    })),
    programs: [],
    banners: [],
    combos,
  };
};

export const getPromotions = async (): Promise<PromotionsResponse> => {
  try {
    const res = await api.get('/promotions');
    const data = res.data.data;

    return {
      flashSaleEndsAt: data.flashSaleEndsAt,
      flashSaleBooks: data.flashSaleBooks || [],
      discountTiers: data.discountTiers || [],
      programs: data.programs || [],
      banners: data.banners || [],
      combos: data.combos || [],
    };
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return buildPromotionsFromBooks();
    }

    throw error;
  }
};
