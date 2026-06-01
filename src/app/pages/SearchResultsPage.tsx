import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Search, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { smartSearchBooks } from '../services/book.service';
import { getCategories } from '../services/category.service';
import { formatCurrency, toVisibleDisplayBooks, type DisplayBook } from '../utils/book-display';
import type { ApiCategory } from '../utils/category-display';

const PAGE_SIZE = 12;
const FILTER_FETCH_LIMIT = 60;
const SEARCH_HISTORY_KEY = 'tram-sach-search-history';

const priceRanges = [
  { id: 'all', name: 'Tất cả mức giá', min: 0, max: Number.POSITIVE_INFINITY },
  { id: '0-100', name: 'Dưới 100.000đ', min: 0, max: 100000 },
  { id: '100-200', name: '100.000đ - 200.000đ', min: 100000, max: 200000 },
  { id: '200+', name: 'Trên 200.000đ', min: 200000, max: Number.POSITIVE_INFINITY },
];

const sortOptions = [
  { id: 'relevance', name: 'Liên quan nhất' },
  { id: 'price-low', name: 'Giá thấp đến cao' },
  { id: 'price-high', name: 'Giá cao đến thấp' },
  { id: 'rating', name: 'Đánh giá cao' },
  { id: 'newest', name: 'Mới nhất' },
];

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const query = searchParams.get('q') || '';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const category = searchParams.get('category') || 'all';
  const price = searchParams.get('price') || 'all';
  const sort = searchParams.get('sort') || 'relevance';
  const hasActiveFilters = category !== 'all' || price !== 'all' || sort !== 'relevance';

  const [draftQuery, setDraftQuery] = useState(query);
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [message, setMessage] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.error('Load search categories error:', error);
        setCategories([]);
      });
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setBooks([]);
      setMessage('');
      setIsFallback(false);
      setTotalResults(0);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      try {
        setLoading(true);
        const result = await smartSearchBooks(
          trimmedQuery,
          hasActiveFilters ? 1 : page,
          hasActiveFilters ? FILTER_FETCH_LIMIT : PAGE_SIZE,
          controller.signal
        );
        setBooks(toVisibleDisplayBooks(result.data));
        setMessage(result.message);
        setIsFallback(result.isFallback);
        setTotalResults(result.pagination.total || result.data.length);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Search page error:', error);
        setBooks([]);
        setTotalResults(0);
        setMessage('Hệ thống đang bận, bạn thử tìm lại sau ít phút nhé.');
        setIsFallback(false);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchResults();

    return () => controller.abort();
  }, [hasActiveFilters, page, query]);

  const filteredBooks = useMemo(() => {
    const selectedRange = priceRanges.find((item) => item.id === price) || priceRanges[0];
    const result = books.filter((book) => {
      const matchCategory = category === 'all' || book.categoryId === category;
      const matchPrice = book.price >= selectedRange.min && book.price <= selectedRange.max;
      return matchCategory && matchPrice;
    });

    result.sort((left, right) => {
      if (sort === 'price-low') return left.price - right.price;
      if (sort === 'price-high') return right.price - left.price;
      if (sort === 'rating') return right.rating - left.rating;
      if (sort === 'newest') return (right.releaseDate || '').localeCompare(left.releaseDate || '');
      return 0;
    });

    return result;
  }, [books, category, price, sort]);

  const visibleBooks = useMemo(() => {
    if (!hasActiveFilters) return filteredBooks;
    const start = (page - 1) * PAGE_SIZE;
    return filteredBooks.slice(start, start + PAGE_SIZE);
  }, [filteredBooks, hasActiveFilters, page]);

  const effectiveTotal = hasActiveFilters ? filteredBooks.length : totalResults;
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / PAGE_SIZE));

  const heading = useMemo(() => {
    if (!query.trim()) return 'Tìm kiếm sách';
    return isFallback ? 'Gợi ý tham khảo' : 'Kết quả tìm kiếm';
  }, [isFallback, query]);

  const updateParams = (changes: Record<string, string | number>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => {
      const stringValue = String(value);
      if (!stringValue || stringValue === 'all' || (key === 'page' && stringValue === '1') || (key === 'sort' && stringValue === 'relevance')) {
        next.delete(key);
      } else {
        next.set(key, stringValue);
      }
    });
    setSearchParams(next);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuery = draftQuery.trim();
    if (!trimmedQuery) return;
    try {
      const rawHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      const currentHistory = rawHistory ? JSON.parse(rawHistory) : [];
      const history = Array.isArray(currentHistory) ? currentHistory.filter((item): item is string => typeof item === 'string') : [];
      const nextHistory = [
        trimmedQuery,
        ...history.filter((item) => item.toLowerCase() !== trimmedQuery.toLowerCase()),
      ].slice(0, 8);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
    } catch {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify([trimmedQuery]));
    }
    setSearchParams({ q: trimmedQuery });
  };

  const clearFilters = () => {
    setSearchParams(query.trim() ? { q: query.trim() } : {});
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-orange-600">
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{heading}</h1>
              {message && <p className="mt-2 max-w-2xl text-sm text-gray-600">{message}</p>}
            </div>

            <form onSubmit={handleSubmit} className="relative w-full lg:max-w-xl">
              <input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="Tìm tên sách, tác giả, thể loại hoặc nhu cầu đọc..."
                className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                aria-label="Tìm kiếm"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 rounded-xl border bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-semibold text-gray-900">
              <Filter className="h-5 w-5 text-orange-500" />
              Bộ lọc
            </div>
            {hasActiveFilters && (
              <button type="button" onClick={clearFilters} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={category}
              onChange={(event) => updateParams({ category: event.target.value, page: 1 })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="all">Tất cả thể loại</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={price}
              onChange={(event) => updateParams({ price: event.target.value, page: 1 })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {priceRanges.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => updateParams({ sort: event.target.value, page: 1 })}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {sortOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Tìm thấy <strong className="text-gray-900">{effectiveTotal}</strong> kết quả
          </span>
          <span>
            Trang {Math.min(page, totalPages)} / {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Đang tìm sách phù hợp...</div>
        ) : visibleBooks.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900">Chưa có kết quả phù hợp</h2>
            <p className="mt-2 text-sm text-gray-600">Hãy thử tên sách ngắn hơn, tên tác giả hoặc điều chỉnh bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {visibleBooks.map((book) => (
                <article key={book.id} className="overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-lg">
                  <button onClick={() => navigate(`/book/${book.id}`)} className="block w-full bg-gray-100 text-left">
                    <img src={book.image} alt={book.title} className="aspect-[3/4] w-full object-cover" />
                  </button>

                  <div className="p-4">
                    <button onClick={() => navigate(`/book/${book.id}`)} className="line-clamp-2 min-h-12 text-left font-bold text-gray-900 hover:text-orange-600">
                      {book.title}
                    </button>
                    <p className="mt-1 truncate text-sm text-gray-600">{book.author}</p>

                    <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{book.rating.toFixed(1)}</span>
                      <span>({book.reviews})</span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-lg font-bold text-orange-600">{formatCurrency(book.price)}</span>
                      {book.originalPrice && <span className="text-sm text-gray-400 line-through">{formatCurrency(book.originalPrice)}</span>}
                    </div>

                    <button
                      disabled={book.isOutOfStock}
                      onClick={() =>
                        addToCart({
                          id: book.id,
                          title: book.title,
                          author: book.author,
                          price: formatCurrency(book.price),
                          image: book.image,
                        })
                      }
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {book.isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => updateParams({ page: page - 1 })}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Trước
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pageNumber = start + index;
                if (pageNumber > totalPages) return null;

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => updateParams({ page: pageNumber })}
                    className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${
                      pageNumber === page
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-orange-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => updateParams({ page: page + 1 })}
                className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
