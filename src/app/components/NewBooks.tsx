import { useEffect, useMemo, useState } from 'react';
import { Star, Sparkles, Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { getCategories } from '../services/category.service';
import { getLatestBooks } from '../services/book.service';
import {
  formatCurrency,
  formatReleaseDate,
  toVisibleDisplayBooks,
  type DisplayBook,
} from '../utils/book-display';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export function NewBooks() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [latestBooks, categoryData] = await Promise.all([
          getLatestBooks(),
          getCategories(),
        ]);

        setBooks(toVisibleDisplayBooks(latestBooks));
        setCategories(categoryData);
      } catch (error) {
        console.error('Fetch latest books error:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categoryMap = useMemo(
    () => new Map(categories.map((item) => [item.id, item.name])),
    [categories]
  );

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Sách mới phát hành</h2>
        </div>
        <button
          onClick={() => navigate('/new-books')}
          className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1"
        >
          Xem tất cả →
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Đang tải sách mới phát hành...
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Chưa có dữ liệu sách mới.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
         {books.slice(0, 6).map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/book/${book.id}`)}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group relative"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  MỚI
                </div>

                {book.discount > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                    -{book.discount}%
                  </div>
                )}
                {book.isOutOfStock && (
                  <div className="absolute bottom-2 left-2 rounded-md bg-gray-900/85 px-2 py-1 text-xs font-bold text-white">
                    Hết hàng
                  </div>
                )}

                <button
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-12 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-50"
                >
                  <Heart className="w-4 h-4 text-red-500" />
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    disabled={book.isOutOfStock}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (book.isOutOfStock) return;
                      addToCart({
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        price: formatCurrency(book.price),
                        image: book.image,
                      });
                    }}
                    className={`w-full py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                      book.isOutOfStock
                        ? 'bg-gray-300 text-white cursor-not-allowed'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {book.isOutOfStock ? 'Hết hàng' : 'Thêm giỏ hàng'}
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="text-xs text-purple-600 font-medium mb-1">
                  {categoryMap.get(book.categoryId || '') || 'Sách mới'}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-1">{book.author}</p>

                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(book.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-600 ml-1">({book.rating.toFixed(1)})</span>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-red-600 font-bold">{formatCurrency(book.price)}</span>
                  {book.originalPrice && (
                    <span className="text-gray-400 line-through text-xs">
                      {formatCurrency(book.originalPrice)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                  <span>Phát hành: {formatReleaseDate(book.releaseDate)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-5 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Đón đọc những cuốn sách mới nhất!
            </h3>
            <p className="text-gray-600">
              Cập nhật liên tục các đầu sách mới phát hành từ các nhà xuất bản uy tín
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/new-books')}
          className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-bold text-white transition-all hover:-translate-y-1 hover:shadow-lg sm:w-fit"
        >
          Xem thêm sách mới
        </button>
      </div>
    </section>
  );
}
