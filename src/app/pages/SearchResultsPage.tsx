import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Search, ShoppingCart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { smartSearchBooks } from '../services/book.service';
import { formatCurrency, toVisibleDisplayBooks, type DisplayBook } from '../utils/book-display';

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const query = searchParams.get('q') || '';
  const [draftQuery, setDraftQuery] = useState(query);
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [message, setMessage] = useState('');
  const [isFallback, setIsFallback] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setBooks([]);
      setMessage('');
      setIsFallback(false);
      return;
    }

    const controller = new AbortController();

    const fetchResults = async () => {
      try {
        setLoading(true);
        const result = await smartSearchBooks(trimmedQuery, 1, 24, controller.signal);
        setBooks(toVisibleDisplayBooks(result.data));
        setMessage(result.message);
        setIsFallback(result.isFallback);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Search page error:', error);
        setBooks([]);
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
  }, [query]);

  const heading = useMemo(() => {
    if (!query.trim()) return 'Tìm kiếm sách';
    return isFallback ? 'Gợi ý tham khảo' : 'Kết quả tìm kiếm';
  }, [isFallback, query]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuery = draftQuery.trim();
    if (!trimmedQuery) return;
    setSearchParams({ q: trimmedQuery });
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
        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Đang tìm sách phù hợp...</div>
        ) : books.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center">
            <h2 className="text-xl font-bold text-gray-900">Chưa có kết quả phù hợp</h2>
            <p className="mt-2 text-sm text-gray-600">Hãy thử tên sách ngắn hơn, tên tác giả hoặc một thể loại cụ thể.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {books.map((book) => (
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
        )}
      </div>
    </div>
  );
}
