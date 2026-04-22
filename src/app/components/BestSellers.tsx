import { useEffect, useState } from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { getBestSellerBooks } from '../services/book.service';
import { formatCurrency, toDisplayBook, type DisplayBook } from '../utils/book-display';

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
        setBooks(data.map((book, index) => toDisplayBook(book, index)));
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
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Đang tải sách bán chạy...
        </div>
      ) : books.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          Chưa có dữ liệu sách bán chạy.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {books.map((book) => (
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
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{book.discount}%
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
                    <div className="text-orange-500 font-bold text-lg">
                      {formatCurrency(book.price)}
                    </div>
                    {book.originalPrice && (
                      <div className="text-gray-400 line-through text-sm">
                        {formatCurrency(book.originalPrice)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart({
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        price: formatCurrency(book.price),
                        image: book.image,
                      });
                    }}
                    className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors hover:scale-110"
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
