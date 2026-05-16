import { useEffect, useState } from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { getBestSellerBooks } from '../services/book.service';
import { formatCurrency, toVisibleDisplayBooks, type DisplayBook } from '../utils/book-display';

export function BestSellers() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const data = await getBestSellerBooks();
        setBooks(toVisibleDisplayBooks(data));
      } catch (error) {
        console.error('Fetch best seller books error:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Sách bán chạy</h2>
        <button
          onClick={() => navigate('/bestsellers')}
          className="text-orange-500 hover:text-orange-600 font-medium"
        >
          Xem tất cả →
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-center sm:p-8 text-gray-500">
          Đang tải sách bán chạy...
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border bg-white p-4 text-center sm:p-8 text-gray-500">
          Chưa có dữ liệu sách bán chạy.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {books.slice(0, 4).map((book) => (
            <div
              key={book.id}
              onClick={() => navigate(`/book/${book.id}`)}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                {book.discount > 0 && (
                  <>
                    <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                      Đang khuyến mãi
                    </div>
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      -{book.discount}%
                    </div>
                  </>
                )}
                {book.isOutOfStock && (
                  <div className="absolute bottom-3 left-3 rounded-full bg-gray-900/85 px-3 py-1 text-sm font-bold text-white">
                    Hết hàng
                  </div>
                )}
              </div>

              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{book.author}</p>

                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(book.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">({book.rating.toFixed(1)})</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    {book.discount > 0 && (
                      <div className="mb-1 w-fit rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                        Giá khuyến mãi
                      </div>
                    )}
                    <div className={`font-bold text-lg ${book.discount > 0 ? 'text-red-600' : 'text-orange-500'}`}>
                      {formatCurrency(book.price)}
                    </div>
                    {book.originalPrice && (
                      <div className="text-gray-400 line-through text-sm">
                        {formatCurrency(book.originalPrice)}
                      </div>
                    )}
                  </div>
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors ${
                      book.isOutOfStock
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600 hover:scale-110'
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
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

