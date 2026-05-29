import { useEffect, useState } from 'react';
import { History, ShoppingCart, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { getHomeRecommendations } from '../services/book.service';
import {
  formatCurrency,
  toVisibleDisplayBooks,
  type DisplayBook,
} from '../utils/book-display';

type RecommendationSource = 'personalized' | 'popular' | 'empty';
type RecommendedDisplayBook = DisplayBook & { reason?: string };

const RECOMMENDATION_LIMIT = 4;

export function PersonalizedRecommendations() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [books, setBooks] = useState<RecommendedDisplayBook[]>([]);
  const [source, setSource] = useState<RecommendationSource>('empty');
  const [heading, setHeading] = useState('Gợi ý cho bạn');
  const [description, setDescription] = useState('Đang chuẩn bị các gợi ý phù hợp từ kho sách.');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const recommendation = await getHomeRecommendations(RECOMMENDATION_LIMIT);
        const displayBooks = toVisibleDisplayBooks(recommendation.books)
          .filter((book) => !book.isOutOfStock)
          .map((book) => ({
            ...book,
            reason: recommendation.books.find((item) => item.id === book.id)?.reason,
          }));

        if (!active) return;
        setBooks(displayBooks);
        setSource(recommendation.source);
        setHeading(recommendation.title);
        setDescription(recommendation.subtitle);
      } catch (error) {
        console.error('Fetch personalized recommendations error:', error);
        if (!active) return;
        setBooks([]);
        setSource('empty');
        setHeading('Gợi ý cho bạn');
        setDescription('Chưa thể tải gợi ý sách lúc này.');
      } finally {
        if (active) setLoading(false);
      }
    };

    timeoutId = setTimeout(fetchRecommendations, 500);

    return () => {
      active = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
              {source === 'personalized' ? 'Theo gu gần đây' : 'Được nhiều độc giả chọn'}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{heading}</h2>
          <p className="mt-2 max-w-2xl text-gray-600">{description}</p>
        </div>
        {source === 'personalized' && (
          <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700">
            <History className="h-4 w-4" />
            Dựa trên tìm kiếm, tư vấn AI và lịch sử mua
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
                  #{index + 1} {source === 'personalized' ? 'hợp gu' : 'nổi bật'}
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

                {book.reason && (
                  <div className="mb-3 rounded-lg bg-indigo-50 p-3 text-xs leading-5 text-indigo-700">
                    <span className="font-semibold">Vì sao gợi ý: </span>
                    {book.reason}
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

