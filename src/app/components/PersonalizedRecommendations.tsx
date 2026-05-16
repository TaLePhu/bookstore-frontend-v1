import { useEffect, useMemo, useState } from 'react';
import { History, ShoppingCart, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getMyOrders, type OrderDto } from '../services/account.service';
import { getAllBooks, type ApiBook } from '../services/book.service';
import {
  formatCurrency,
  toVisibleDisplayBooks,
  type DisplayBook,
} from '../utils/book-display';

type RecommendationSource = 'history' | 'random' | 'empty';

const RECOMMENDATION_LIMIT = 4;
const BOOK_POOL_LIMIT = 50;

const normalizeText = (value?: string | null) => (value || '').trim().toLowerCase();

const shuffleBooks = (books: DisplayBook[]) =>
  books
    .map((book) => ({ book, sort: Math.random() }))
    .sort((first, second) => first.sort - second.sort)
    .map((item) => item.book);

const getPurchasedItems = (orders: OrderDto[]) =>
  orders
    .filter((order) => order.status !== 'CANCELLED')
    .flatMap((order) => order.items || [])
    .filter((item) => item.bookId || item.book?.id);

const buildRandomRecommendations = (allBooks: ApiBook[]) =>
  shuffleBooks(toVisibleDisplayBooks(allBooks).filter((book) => !book.isOutOfStock)).slice(0, RECOMMENDATION_LIMIT);

const buildHistoryRecommendations = (allBooks: ApiBook[], orders: OrderDto[]) => {
  const visibleBooks = toVisibleDisplayBooks(allBooks).filter((book) => !book.isOutOfStock);
  const purchasedItems = getPurchasedItems(orders);
  const purchasedIds = new Set(purchasedItems.map((item) => item.bookId || item.book?.id).filter(Boolean));

  if (purchasedItems.length === 0) {
    return {
      books: buildRandomRecommendations(allBooks),
      reasons: {},
      source: 'random' as RecommendationSource,
    };
  }

  const bookById = new Map(allBooks.map((book) => [book.id, book]));
  const purchasedAuthors = new Set(
    purchasedItems.map((item) => normalizeText(item.book?.author)).filter(Boolean)
  );
  const purchasedCategoryIds = new Set(
    purchasedItems
      .map((item) => bookById.get(item.bookId || item.book?.id || '')?.categoryId)
      .filter(Boolean)
  );
  const purchasedTitleTokens = new Set(
    purchasedItems
      .flatMap((item) => normalizeText(item.book?.title).split(/\s+/))
      .filter((token) => token.length >= 4)
  );

  const scoredBooks = visibleBooks
    .filter((book) => !purchasedIds.has(book.id))
    .map((book) => {
      const apiBook = bookById.get(book.id);
      const author = normalizeText(book.author);
      const title = normalizeText(book.title);
      let score = 0;
      const reasons: string[] = [];

      if (purchasedAuthors.has(author)) {
        score += 5;
        reasons.push('Cùng tác giả với sách bạn đã mua.');
      }

      if (apiBook?.categoryId && purchasedCategoryIds.has(apiBook.categoryId)) {
        score += 4;
        reasons.push('Cùng nhóm sách bạn từng chọn.');
      }

      const sharedTitleTokens = [...purchasedTitleTokens].filter((token) => title.includes(token));
      if (sharedTitleTokens.length > 0) {
        score += Math.min(3, sharedTitleTokens.length);
        reasons.push('Có chủ đề gần với lịch sử mua hàng.');
      }

      score += Math.min(2, book.rating / 3);
      score += Math.min(2, book.sold / 100);

      return {
        book,
        score,
        reason: reasons[0] || 'Phù hợp với xu hướng sách bạn đã mua.',
      };
    })
    .sort((first, second) => second.score - first.score);

  const recommended = scoredBooks.slice(0, RECOMMENDATION_LIMIT);

  if (recommended.length === 0) {
    return {
      books: buildRandomRecommendations(allBooks),
      reasons: {},
      source: 'random' as RecommendationSource,
    };
  }

  return {
    books: recommended.map((item) => item.book),
    reasons: Object.fromEntries(recommended.map((item) => [item.book.id, item.reason])),
    source: 'history' as RecommendationSource,
  };
};

export function PersonalizedRecommendations() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [source, setSource] = useState<RecommendationSource>('empty');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        const bookResult = await getAllBooks(1, BOOK_POOL_LIMIT);

        if (!isAuthenticated) {
          if (!active) return;
          setBooks(buildRandomRecommendations(bookResult.data));
          setReasons({});
          setSource('random');
          return;
        }

        const orderHistory = await getMyOrders(1, 20);
        const recommendation = buildHistoryRecommendations(bookResult.data, orderHistory.orders || []);

        if (!active) return;
        setBooks(recommendation.books);
        setReasons(recommendation.reasons);
        setSource(recommendation.source);
      } catch (error) {
        console.error('Fetch personalized recommendations error:', error);
        if (!active) return;
        setBooks([]);
        setReasons({});
        setSource('empty');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRecommendations();

    return () => {
      active = false;
    };
  }, [isAuthenticated, user?.id]);

  const heading = useMemo(() => {
    return 'Gợi ý cho bạn';
  }, []);

  const description = useMemo(() => {
    if (source === 'history') {
      return 'Tụi mình chọn vài cuốn có thể hợp gu với bạn dựa trên những sách bạn từng mua.';
    }
    if (isAuthenticated) {
      return 'Bạn chưa có nhiều lịch sử mua hàng, nên tụi mình gợi ý trước vài cuốn thú vị đang có sẵn.';
    }
    return 'Một vài cuốn sách được chọn ngẫu nhiên từ kho, biết đâu bạn sẽ gặp đúng cuốn mình đang cần.';
  }, [isAuthenticated, source]);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {source === 'history' ? 'Theo lịch sử mua hàng' : 'Ngẫu nhiên'}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{heading}</h2>
          <p className="mt-2 max-w-2xl text-gray-600">{description}</p>
        </div>
        {source === 'history' && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
            <History className="h-4 w-4" />
            Dựa trên đơn hàng gần đây
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-center sm:p-8 text-gray-500">
          Đang chuẩn bị gợi ý sách cho bạn...
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border bg-white p-4 text-center sm:p-8 text-gray-500">
          Chưa có sách phù hợp để gợi ý.
        </div>
      ) : (
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
                  #{index + 1} {source === 'history' ? 'phù hợp' : 'ngẫu nhiên'}
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

                {source === 'history' && (
                  <div className="mb-3 rounded-lg bg-indigo-50 p-3 text-xs leading-5 text-indigo-700">
                    <span className="font-semibold">Lý do: </span>
                    {reasons[book.id] || 'Phù hợp với lịch sử mua hàng của bạn.'}
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
      )}
    </section>
  );
}

