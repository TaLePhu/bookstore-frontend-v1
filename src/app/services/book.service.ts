import api from './api';

export interface ApiBook {
  id: string;
  title: string;
  author: string;
  description?: string;
  price: number | string;
  stock?: number;
  image?: string;
  images?: Array<string | { imageUrl?: string; url?: string }>;
  originalPrice?: number | string | null;
  discount?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  releaseDate?: string | null;
  categoryId?: string;
}

interface SearchBooksResponse {
  data: ApiBook[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

interface BooksListResponse {
  data: ApiBook[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

export const getAllBooks = async (page = 1, limit = 10): Promise<BooksListResponse> => {
  const res = await api.get('/books', {
    params: { page, limit },
  });

  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};

export const getBookById = async (id: string): Promise<ApiBook> => {
  const res = await api.get(`/books/${id}`);
  return res.data.data;
};

export const getLatestBooks = async (): Promise<ApiBook[]> => {
  const res = await api.get('/books/latest');
  return res.data.data;
};

export const getBestSellerBooks = async (): Promise<ApiBook[]> => {
  const res = await api.get('/books/best-sellers');
  return res.data.data;
};

export const searchBooks = async (
  q: string,
  page = 1,
  limit = 10
): Promise<SearchBooksResponse> => {
  const res = await api.get('/books/search', {
    params: { q, page, limit },
  });

  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};
