import { useEffect, useMemo, useState } from 'react';
import { Bot, History, ShoppingCart, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyOrders, type OrderDto } from '../services/account.service';
import { getAIAdvisorRecommendations } from '../services/advisor.service';
import { getBestSellerBooks } from '../services/book.service';
import {
  formatCurrency,
  toVisibleDisplayBooks,
  type DisplayBook,
} from '../utils/book-display';

type RecommendationSource = 'ai' | 'fallback' | 'empty';

const buildPurchasePrompt = (orders: OrderDto[]) => {
  const purchasedBooks = orders
    .filter((order) => order.status !== 'CANCELLED')
    .flatMap((order) => order.items || [])
    .filter((item) => item.book?.title)
    .slice(0, 12)
    .map((item) => {
      const title = item.book?.title || 'Sách';
      const author = item.book?.author ? ` của ${item.book.author}` : '';
      const quantity = Number(item.quantity || 1);
      return `${title}${author}${quantity > 1 ? ` (${quantity} cuốn)` : ''}`;
    });

  if (purchasedBooks.length === 0) return '';

  return [
    'Dựa trên lịch sử mua hàng của tôi, hãy đề xuất những sách khác trong kho có khả năng phù hợp.',
    'Ưu tiên sách cùng gu đọc, cùng chủ đề hoặc bổ sung tự nhiên cho các sách đã mua.',
    'Không đề xuất lại chính những sách tôi đã mua nếu có lựa chọn khác.',
    `Các sách tôi đã mua gần đây: ${purchasedBooks.join('; ')}.`,
  ].join(' ');
};

export function PersonalizedRecommendations() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [aiAnswer, setAiAnswer] = useState('');
  const [source, setSource] = useState<RecommendationSource>('empty');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadFallbackBooks = async () => {
      const fallbackBooks = await getBestSellerBooks();
      if (!active) return;
      setBooks(toVisibleDisplayBooks(fallbackBooks).slice(0, 4));
      setReasons({});
      setAiAnswer('');
      setSource('fallback');
    };

    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        if (!isAuthenticated) {
          await loadFallbackBooks();
          return;
        }

        const orderHistory = await getMyOrders(1, 8);
        const prompt = buildPurchasePrompt(orderHistory.orders || []);

        if (!prompt) {
          await loadFallbackBooks();
          return;
        }

        const purchasedBookIds = new Set(
          (orderHistory.orders || [])
            .flatMap((order) => order.items || [])
            .map((item) => item.bookId)
            .filter(Boolean)
        );
        const result = await getAIAdvisorRecommendations(prompt, 6);
        const recommendedBooks = result.books.filter((book) => !purchasedBookIds.has(book.id));

        if (!active) return;

        if (recommendedBooks.length === 0) {
          await loadFallbackBooks();
          return;
        }

        setBooks(toVisibleDisplayBooks(recommendedBooks).slice(0, 4));
        setReasons(Object.fromEntries(recommendedBooks.map((book) => [book.id, book.reason])));
        setAiAnswer(result.answer);
        setSource('ai');
      } catch (error) {
        console.error('Fetch personalized recommendations error:', error);
        await loadFallbackBooks();
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRecommendations();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const heading = useMemo(() => {
    if (source === 'ai') return `Gợi ý dành riêng cho ${user?.name || 'bạn'}`;
    if (isAuthenticated) return 'Gợi ý sách cho lần đọc tiếp theo';
    return 'Gợi ý sách nổi bật';
  }, [isAuthenticated, source, user?.name]);

  const description = useMemo(() => {
    if (source === 'ai') {
      return 'AI phân tích lịch sử mua hàng gần đây để chọn những cuốn sách có gu đọc tương đồng.';
    }
    if (isAuthenticated) {
      return 'Bạn chưa có đủ lịch sử mua hàng, nên mình hiển thị các sách đang được quan tâm nhiều.';
    }
    return 'Đăng nhập để nhận đề xuất cá nhân hóa theo lịch sử mua hàng của bạn.';
  }, [isAuthenticated, source]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
              {source === 'ai' ? <Bot className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {source === 'ai' ? 'AI cá nhân hóa' : 'Recommend'}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{heading}</h2>
          <p className="mt-2 max-w-2xl text-gray-600">{description}</p>
        </div>
        {source === 'ai' && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
            <History className="h-4 w-4" />
            Dựa trên đơn hàng gần đây
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Đang chuẩn bị gợi ý sách cho bạn...
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Chưa có sách phù hợp để gợi ý.
        </div>
      ) : (
        <>
          {aiAnswer && (
            <p className="mb-6 rounded-xl bg-indigo-50 px-5 py-4 text-sm leading-6 text-indigo-800">
              {aiAnswer}
            </p>
          )}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {books.map((book, index) => (
              <div
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow">
                    #{index + 1} phù hợp
                  </div>
                  {book.discount > 0 && (
                    <div className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                      -{book.discount}%
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-1 line-clamp-2 font-bold text-gray-900">{book.title}</h3>
                  <p className="mb-3 text-sm text-gray-600">{book.author}</p>

                  {source === 'ai' && (
                    <div className="mb-3 rounded-lg bg-indigo-50 p-3 text-xs leading-5 text-indigo-700">
                      <span className="font-semibold">Vì sao hợp: </span>
                      {reasons[book.id] || 'Có nội dung gần với gu đọc từ lịch sử mua hàng của bạn.'}
                    </div>
                  )}

                  <div className="mb-3 flex items-center gap-1">
                    {[...Array(5)].map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className={`h-4 w-4 ${
                          starIndex < Math.floor(book.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-1 text-sm text-gray-600">({book.rating.toFixed(1)})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-lg font-bold ${book.discount > 0 ? 'text-red-600' : 'text-orange-500'}`}>
                        {formatCurrency(book.price)}
                      </div>
                      {book.originalPrice && (
                        <div className="text-sm text-gray-400 line-through">
                          {formatCurrency(book.originalPrice)}
                        </div>
                      )}
                    </div>
                    <button
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
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:scale-110 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:scale-100"
                    >
                      <ShoppingCart className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
