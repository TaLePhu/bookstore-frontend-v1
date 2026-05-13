import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Sparkles,
  Filter,
  SlidersHorizontal,
  Star,
  Calendar,
  X,
  Grid3x3,
  List,
  Heart,
  ShoppingCart,
  Eye,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getCategories } from '../services/category.service';
import { getLatestBooks } from '../services/book.service';
import {
  formatCurrency,
  formatReleaseDate,
  toVisibleDisplayBooks,
  type DisplayBook,
} from '../utils/book-display';
import { type ApiCategory } from '../utils/category-display';

export function NewBooksPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookData, categoryData] = await Promise.all([
          getLatestBooks(),
          getCategories(),
        ]);
        setBooks(toVisibleDisplayBooks(bookData));
        setCategories(categoryData);
      } catch (error) {
        console.error('Fetch new books page data error:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const categoryOptions = useMemo(
    () => [
      { id: 'all', name: 'Tất cả', count: books.length },
      ...categories.map((category) => ({
        id: category.id,
        name: category.name,
        count: books.filter((book) => book.categoryId === category.id).length,
      })),
    ].filter((item, index, list) => index === list.findIndex((x) => x.id === item.id)),
    [books, categories]
  );

  const priceRanges = [
    { id: 'all', name: 'Tất cả mức giá' },
    { id: '0-150', name: 'Dưới 150.000đ' },
    { id: '150-180', name: '150.000đ - 180.000đ' },
    { id: '180-200', name: '180.000đ - 200.000đ' },
    { id: '200+', name: 'Trên 200.000đ' },
  ];

  const sortOptions = [
    { id: 'newest', name: 'Mới nhất' },
    { id: 'rating', name: 'Đánh giá cao' },
    { id: 'price-low', name: 'Giá thấp đến cao' },
    { id: 'price-high', name: 'Giá cao đến thấp' },
    { id: 'popular', name: 'Phổ biến nhất' },
  ];

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (selectedCategory !== 'all') {
      result = result.filter((book) => book.categoryId === selectedCategory);
    }

    if (selectedPriceRange !== 'all') {
      result = result.filter((book) => {
        if (selectedPriceRange === '0-150') return book.price < 150000;
        if (selectedPriceRange === '150-180') return book.price >= 150000 && book.price <= 180000;
        if (selectedPriceRange === '180-200') return book.price > 180000 && book.price <= 200000;
        if (selectedPriceRange === '200+') return book.price > 200000;
        return true;
      });
    }

    if (selectedRating === '4+') {
      result = result.filter((book) => book.rating >= 4);
    }

    if (selectedRating === '4.5+') {
      result = result.filter((book) => book.rating >= 4.5);
    }

    result.sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'popular') return b.reviews - a.reviews;
      return (b.releaseDate || '').localeCompare(a.releaseDate || '');
    });

    return result;
  }, [books, selectedCategory, selectedPriceRange, selectedRating, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">Sách Mới Phát Hành</h1>
              </div>
              <p className="text-lg opacity-90 mb-4">
                Khám phá những cuốn sách mới nhất vừa được xuất bản
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>Cập nhật hàng ngày</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>100% sách mới</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span>Giảm giá hấp dẫn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">{books.length}</div>
              <div className="text-sm text-gray-600">Sách mới</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">Mới</div>
              <div className="text-sm text-gray-600">Cập nhật gần đây</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {(books.reduce((sum, book) => sum + book.rating, 0) / (books.length || 1)).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Đánh giá trung bình</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                -{Math.max(...books.map((book) => book.discount), 0)}%
              </div>
              <div className="text-sm text-gray-600">Giảm giá đến</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span>Bộ lọc</span>
              </button>

              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent border-none outline-none font-medium text-gray-900 cursor-pointer"
                >
                  {sortOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {(selectedCategory !== 'all' || selectedPriceRange !== 'all' || selectedRating !== 'all') && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="text-sm text-gray-600">Đang lọc:</span>
              {selectedCategory !== 'all' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  <span>{categoryOptions.find((c) => c.id === selectedCategory)?.name}</span>
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedPriceRange('all');
                  setSelectedRating('all');
                }}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium ml-2"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            Đang tải sách mới...
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {showFilters && (
              <div className="space-y-6 lg:col-span-3">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Danh mục</h3>
                  <div className="space-y-2">
                    {categoryOptions.map((cat) => (
                      <label key={cat.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="category"
                            checked={selectedCategory === cat.id}
                            onChange={() => setSelectedCategory(cat.id)}
                            className="text-purple-600"
                          />
                          <span className="text-sm">{cat.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">({cat.count})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className={showFilters ? 'lg:col-span-9' : 'lg:col-span-12'}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {filteredBooks.map((book) => (
                  <div key={book.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                    <div className="relative">
                      <img src={book.image} alt={book.title} className="w-full h-80 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute top-2 left-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        MỚI
                      </div>
                      {book.discount > 0 && (
                        <>
                          <div className="absolute left-2 top-10 rounded-lg bg-red-600 px-2 py-1 text-[11px] font-bold text-white shadow">
                            Khuyến mãi
                          </div>
                          <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                            -{book.discount}%
                          </div>
                        </>
                      )}
                      {book.isOutOfStock && (
                        <div className="absolute bottom-2 left-2 rounded-md bg-gray-900/85 px-2 py-1 text-xs font-bold text-white">
                          Hết hàng
                        </div>
                      )}
                      <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 hover:bg-white">
                          <Eye className="w-6 h-6 text-gray-800" onClick={() => navigate(`/book/${book.id}`)} />
                        </div>
                      </button>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 mb-1 line-clamp-2 min-h-[3rem]">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-4 h-4 ${i < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">{book.rating.toFixed(1)} ({book.reviews})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>Phát hành: {formatReleaseDate(book.releaseDate)}</span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-3">
                        {book.discount > 0 && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            Sale
                          </span>
                        )}
                        <span className={`text-xl font-bold ${book.discount > 0 ? 'text-red-600' : 'text-purple-600'}`}>{formatCurrency(book.price)}</span>
                        {book.originalPrice && <span className="text-sm text-gray-400 line-through">{formatCurrency(book.originalPrice)}</span>}
                      </div>
                      <div className="flex gap-2">
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
                          className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span className="text-sm font-medium">{book.isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}</span>
                        </button>
                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Heart className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBooks.map((book) => (
              <div key={book.id} className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm transition-all hover:shadow-xl sm:flex-row">
                <div className="relative flex-shrink-0">
                  <img src={book.image} alt={book.title} className="w-32 h-48 object-cover rounded-lg" />
                  <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-bold">MỚI</div>
                  {book.discount > 0 && (
                    <>
                      <div className="absolute left-2 top-10 rounded bg-red-600 px-2 py-1 text-[11px] font-bold text-white">
                        Khuyến mãi
                      </div>
                      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
                        -{book.discount}%
                      </div>
                    </>
                  )}
                  {book.isOutOfStock && (
                    <div className="absolute bottom-2 left-2 rounded bg-gray-900/85 px-2 py-1 text-xs font-bold text-white">
                      Hết hàng
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800 mb-1">{book.title}</h3>
                  <p className="text-gray-600 mb-2">{book.author}</p>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">{book.rating.toFixed(1)} ({book.reviews} đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>Phát hành: {formatReleaseDate(book.releaseDate)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      {book.discount > 0 && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                          Đang khuyến mãi
                        </span>
                      )}
                      <span className={`text-2xl font-bold ${book.discount > 0 ? 'text-red-600' : 'text-purple-600'}`}>{formatCurrency(book.price)}</span>
                      {book.originalPrice && <span className="text-gray-400 line-through">{formatCurrency(book.originalPrice)}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/book/${book.id}`)} className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors">
                        Xem chi tiết
                      </button>
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
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {book.isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
