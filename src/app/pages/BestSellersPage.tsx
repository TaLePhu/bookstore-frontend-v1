import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  TrendingUp,
  Filter,
  SlidersHorizontal,
  Star,
  Flame,
  Award,
  X,
  Grid3x3,
  List,
  Heart,
  ShoppingCart,
  Eye,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getCategories } from '../services/category.service';
import { getBestSellerBooks } from '../services/book.service';
import { formatCurrency, toDisplayBook, type DisplayBook } from '../utils/book-display';
import { type ApiCategory } from '../utils/category-display';

export function BestSellersPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('bestseller');
  const [showFilters, setShowFilters] = useState(false);
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [bookData, categoryData] = await Promise.all([
          getBestSellerBooks(),
          getCategories(),
        ]);
        setBooks(bookData.map((book, index) => toDisplayBook(book, index)));
        setCategories(categoryData);
      } catch (error) {
        console.error('Fetch bestseller page data error:', error);
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
    { id: '0-100', name: 'Dưới 100.000đ' },
    { id: '100-150', name: '100.000đ - 150.000đ' },
    { id: '150-200', name: '150.000đ - 200.000đ' },
    { id: '200+', name: 'Trên 200.000đ' },
  ];

  const sortOptions = [
    { id: 'bestseller', name: 'Bán chạy nhất' },
    { id: 'rating', name: 'Đánh giá cao' },
    { id: 'price-low', name: 'Giá thấp đến cao' },
    { id: 'price-high', name: 'Giá cao đến thấp' },
    { id: 'newest', name: 'Mới nhất' },
  ];

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (selectedCategory !== 'all') {
      result = result.filter((book) => book.categoryId === selectedCategory);
    }

    if (selectedPriceRange !== 'all') {
      result = result.filter((book) => {
        if (selectedPriceRange === '0-100') return book.price < 100000;
        if (selectedPriceRange === '100-150') return book.price >= 100000 && book.price <= 150000;
        if (selectedPriceRange === '150-200') return book.price > 150000 && book.price <= 200000;
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
      if (sortBy === 'newest') return (b.releaseDate || '').localeCompare(a.releaseDate || '');
      return b.sold - a.sold;
    });

    return result;
  }, [books, selectedCategory, selectedPriceRange, selectedRating, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">Sách Bán Chạy</h1>
              </div>
              <p className="text-lg opacity-90 mb-4">
                Khám phá những cuốn sách được yêu thích nhất tại Trạm Sách
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span>Top sách nổi bật</span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5" />
                  <span>Cập nhật từ hệ thống</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  <span>Đánh giá cao</span>
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
              <div className="text-3xl font-bold text-orange-600 mb-1">{books.length}</div>
              <div className="text-sm text-gray-600">Sách bán chạy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {books.reduce((sum, book) => sum + book.sold, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Lượt bán</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {(books.reduce((sum, book) => sum + book.rating, 0) / (books.length || 1)).toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">Đánh giá trung bình</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-1">
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
                <span className="font-medium">Bộ lọc</span>
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
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-orange-500 text-white'
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
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  <span>{categoryOptions.find((c) => c.id === selectedCategory)?.name}</span>
                  <button onClick={() => setSelectedCategory('all')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {selectedPriceRange !== 'all' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  <span>{priceRanges.find((p) => p.id === selectedPriceRange)?.name}</span>
                  <button onClick={() => setSelectedPriceRange('all')}>
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
                className="text-sm text-orange-600 hover:text-orange-700 font-medium ml-2"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            Đang tải sách bán chạy...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {showFilters && (
              <div className="space-y-6 lg:col-span-3">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Thể loại</h3>
                  <div className="space-y-2">
                    {categoryOptions.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="category"
                            value={category.id}
                            checked={selectedCategory === category.id}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-4 h-4 text-orange-500"
                          />
                          <span className="text-gray-900">{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">({category.count})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Khoảng giá</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range) => (
                      <label key={range.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="price"
                          value={range.id}
                          checked={selectedPriceRange === range.id}
                          onChange={(e) => setSelectedPriceRange(e.target.value)}
                          className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-gray-900">{range.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="font-bold text-gray-900 mb-4">Đánh giá</h3>
                  <div className="space-y-2">
                    {[
                      { id: 'all', stars: 0, label: 'Tất cả' },
                      { id: '4+', stars: 4, label: '4 sao trở lên' },
                      { id: '4.5+', stars: 4.5, label: '4.5 sao trở lên' },
                    ].map((rating) => (
                      <label key={rating.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                        <input
                          type="radio"
                          name="rating"
                          value={rating.id}
                          checked={selectedRating === rating.id}
                          onChange={(e) => setSelectedRating(e.target.value)}
                          className="w-4 h-4 text-orange-500"
                        />
                        <span className="text-gray-900">{rating.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={showFilters ? 'lg:col-span-9' : 'lg:col-span-12'}>
              <div className="mb-4 text-sm text-gray-600">
                Hiển thị <span className="font-bold text-gray-900">{filteredBooks.length}</span> sản phẩm
              </div>

              {viewMode === 'grid' ? (
                <div className={`grid gap-6 ${showFilters ? 'sm:grid-cols-2 xl:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
                  {filteredBooks.map((book, index) => (
                    <div key={book.id} className="bg-white rounded-xl shadow-sm border hover:shadow-xl transition-all group overflow-hidden">
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        <img src={book.image} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          TOP {index + 1}
                        </div>
                        {book.discount > 0 && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                            -{book.discount}%
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate(`/book/${book.id}`)}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all transform hover:scale-110"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform hover:scale-110">
                            <Heart className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                          ))}
                          <span className="text-sm text-gray-600 ml-1">({book.reviews})</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => navigate(`/book/${book.id}`)}>
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">{book.author}</p>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl font-bold text-orange-600">{formatCurrency(book.price)}</span>
                          {book.originalPrice && <span className="text-sm text-gray-400 line-through">{formatCurrency(book.originalPrice)}</span>}
                        </div>
                        <div className="text-xs text-gray-500 mb-3">
                          <Flame className="w-3 h-3 inline mr-1" />
                          Đã bán {book.sold.toLocaleString()}
                        </div>
                        <button
                          onClick={() =>
                            addToCart({
                              id: book.id,
                              title: book.title,
                              author: book.author,
                              price: formatCurrency(book.price),
                              image: book.image,
                            })
                          }
                          className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Thêm vào giỏ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBooks.map((book) => (
                    <div key={book.id} className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-lg sm:flex-row">
                      <div className="w-32 h-44 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                        <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                        {book.discount > 0 && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold">
                            -{book.discount}%
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:text-orange-600 transition-colors" onClick={() => navigate(`/book/${book.id}`)}>
                              {book.title}
                            </h3>
                            <p className="text-gray-600 mb-2">{book.author}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-4 h-4 ${i < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600">{book.rating.toFixed(1)} ({book.reviews} đánh giá)</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              <Flame className="w-4 h-4 inline mr-1" />
                              Đã bán {book.sold.toLocaleString()} sản phẩm
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-orange-600 mb-1">{formatCurrency(book.price)}</div>
                            {book.originalPrice && <div className="text-sm text-gray-400 line-through mb-2">{formatCurrency(book.originalPrice)}</div>}
                          </div>
                        </div>
                        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center">
                          <button
                            onClick={() =>
                              addToCart({
                                id: book.id,
                                title: book.title,
                                author: book.author,
                                price: formatCurrency(book.price),
                                image: book.image,
                              })
                            }
                            className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Thêm vào giỏ
                          </button>
                          <button
                            onClick={() => navigate(`/book/${book.id}`)}
                            className="px-6 py-2.5 border-2 border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
