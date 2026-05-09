import { useEffect, useMemo, useState } from 'react';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { getBooksByCategory, getCategories } from '../services/category.service';
import { formatCurrency, toDisplayBook, type DisplayBook } from '../utils/book-display';

interface CategoryItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export function BookFinder() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [activeTab, setActiveTab] = useState('');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getCategories();
        setCategories(data);
        if (data.length > 0) {
          setActiveTab(data[0].id);
        }
      } catch (error) {
        console.error('Fetch categories for BookFinder error:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!activeTab) {
        setBooks([]);
        setLoadingBooks(false);
        return;
      }

      try {
        setLoadingBooks(true);
        const data = await getBooksByCategory(activeTab);
        setBooks(data.map((book, index) => toDisplayBook(book, index)));
      } catch (error) {
        console.error('Fetch category books for BookFinder error:', error);
        setBooks([]);
      } finally {
        setLoadingBooks(false);
      }
    };

    fetchBooks();
  }, [activeTab]);

  const activeCategory = useMemo(
    () => categories.find((item) => item.id === activeTab),
    [activeTab, categories]
  );

  return (
    <section className="bg-gradient-to-br from-orange-50 to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h2 className="text-2xl font-bold text-red-600 uppercase">
            Bạn đang tìm sách gì?
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {loadingCategories ? (
              <div className="text-sm text-gray-500">Đang tải danh mục...</div>
            ) : (
              categories.slice(0, 6).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap rounded-full border-2 px-4 py-2 text-sm font-medium transition-all sm:px-6 sm:text-base ${
                    activeTab === tab.id
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                  }`}
                >
                  {tab.name.toUpperCase()}
                </button>
              ))
            )}
          </div>
        </div>

        {activeCategory?.description && (
          <p className="mb-6 max-w-3xl text-sm text-gray-600">{activeCategory.description}</p>
        )}

        {loadingBooks ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
            Đang tải sách theo danh mục...
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-500">
            Chưa có sách phù hợp trong danh mục này.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {books.slice(0, 5).map((book, index) => (
              <div
                key={book.id}
                onClick={() => navigate(`/book/${book.id}`)}
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-2 group cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                  <img
                    src={book.image}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {index < 3 && (
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      Nổi bật
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/book/${book.id}`);
                      }}
                      className="w-full bg-white text-gray-900 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors mb-2"
                    >
                      <Eye className="w-4 h-4" />
                      XEM NHANH
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 h-8">
                    {book.subtitle}
                  </p>

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(book.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-xs text-gray-600 ml-1">({book.rating.toFixed(1)})</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-red-600 font-bold text-lg">
                        {formatCurrency(book.price)}
                      </div>
                      {book.originalPrice && (
                        <div className="text-gray-400 line-through text-xs">
                          {formatCurrency(book.originalPrice)}
                        </div>
                      )}
                    </div>
                    <button
                      className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-md"
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
                    >
                      <ShoppingCart className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
