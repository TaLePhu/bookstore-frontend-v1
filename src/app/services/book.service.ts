import api from './api';

export interface ApiBook {
  id: string;
  title: string;
  author: string;
  description?: string;
  price: number | string;
  isbn?: string | null;
  stock?: number;
  soldCount?: number | string | null;
  status?: 'in_stock' | 'out_of_stock' | 'deleted';
  deletedAt?: string | null;
  image?: string;
  images?: Array<string | { id?: string; imageUrl?: string; url?: string; isPrimary?: boolean }>;
  originalPrice?: number | string | null;
  discount?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  releaseDate?: string | null;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  translator?: string | null;
  publisher?: string | null;
  publishYear?: number | string | null;
  pages?: number | string | null;
  dimensions?: string | null;
  weight?: string | null;
  format?: string | null;
  language?: string | null;
  highlights?: string[] | null;
  reviews?: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt?: string | null;
    user?: {
      userName?: string | null;
      fullName?: string | null;
      email?: string | null;
    } | null;
  }>;
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

export interface SmartSearchBooksResponse extends SearchBooksResponse {
  message: string;
  isFallback: boolean;
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

export const getRelatedBooks = async (id: string, limit = 5): Promise<ApiBook[]> => {
  const res = await api.get(`/books/${id}/related`, {
    params: { limit },
  });
  return res.data.data;
};

export const getLatestBooks = async (): Promise<ApiBook[]> => {
  const res = await api.get('/books', {
    params: { sort: 'latest', limit: 12 },
  });
  return res.data.data;
};

export const getBestSellerBooks = async (): Promise<ApiBook[]> => {
  const res = await api.get('/books', {
    params: { sort: 'bestseller', limit: 12 },
  });
  const data = res.data.data as ApiBook[];

  if (data.length > 0) {
    return data;
  }

  const fallbackRes = await api.get('/books', {
    params: { limit: 12 },
  });
  return fallbackRes.data.data;
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

export const semanticSearchBooks = async (
  q: string,
  page = 1,
  limit = 8
): Promise<SearchBooksResponse> => {
  const res = await api.get('/books/semantic-search', {
    params: { q, page, limit },
  });

  return {
    data: res.data.data,
    pagination: res.data.pagination,
  };
};

export const smartSearchBooks = async (
  q: string,
  page = 1,
  limit = 8
): Promise<SmartSearchBooksResponse> => {
  const trimmedQuery = q.trim();
  if (!trimmedQuery) {
    return {
      data: [],
      pagination: { total: 0, page, limit },
      message: '',
      isFallback: false,
    };
  }

  try {
    const semantic = await semanticSearchBooks(trimmedQuery, page, limit);
    if (semantic.data.length > 0) {
      return {
        ...semantic,
        message: `Mình tìm thấy một số sách hợp với "${trimmedQuery}".`,
        isFallback: false,
      };
    }
  } catch (error) {
    console.warn('Semantic search failed on client, trying fallback search:', error);
  }

  try {
    const keyword = await searchBooks(trimmedQuery, page, limit);
    if (keyword.data.length > 0) {
      return {
        ...keyword,
        message: `Chưa thấy kết quả ngữ nghĩa rõ ràng, đây là các sách gần với "${trimmedQuery}".`,
        isFallback: false,
      };
    }
  } catch (error) {
    console.warn('Keyword fallback search failed on client, trying latest books:', error);
  }

  const fallback = await getAllBooks(1, limit);
  return {
    data: fallback.data,
    pagination: {
      total: fallback.pagination.total,
      page: 1,
      limit,
    },
    message: `Chưa có kết quả khớp chính xác cho "${trimmedQuery}", mình gợi ý vài đầu sách nổi bật để bạn tham khảo nhé.`,
    isFallback: true,
  };
};
