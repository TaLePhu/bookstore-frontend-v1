import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BookOpen,
  ChevronRight,
  Eye,
  Filter,
  Grid3x3,
  Heart,
  Home,
  List,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getBooksByCategory, getCategories } from '../services/category.service';

interface ApiCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

interface RawBook {
  id: string;
  title: string;
  author: string;
  description?: string;
  price: number | string;
  stock?: number;
  status?: 'in_stock' | 'out_of_stock' | 'deleted';
  deletedAt?: string | null;
  soldCount?: number | string | null;
  image?: string;
  images?: Array<string | { imageUrl?: string; url?: string }>;
  originalPrice?: number | string | null;
  discount?: number | null;
  rating?: number | null;
  totalReviews?: number | null;
  categoryId?: string;
}

interface CategoryDisplay extends ApiCategory {
  icon: LucideIcon;
  color: string;
  image: string;
}

interface DisplayBook {
  id: string;
  title: string;
  author: string;
  price: number;
  originalPrice: number | null;
  discount: number;
  rating: number;
  reviews: number;
  sold: number;
  stock: number;
  isOutOfStock: boolean;
  isDeleted: boolean;
  image: string;
  badge: string | null;
  isNew: boolean;
}

const FALLBACK_BOOK_IMAGES = [
  'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=800',
  'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=800',
  'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?q=80&w=800',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800',
  'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=800',
];
const ITEMS_PER_PAGE = 10;

const categoryMetaLibrary = [
  {
    match: ['van hoc', 'tieu thuyet', 'truyen'],
    icon: BookOpen,
    color: 'from-purple-500 to-pink-500',
    image:
      'https://images.unsplash.com/photo-1761319115156-d758b22ed57b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXRlcmF0dXJlJTIwY2xhc3NpYyUyMGJvb2tzfGVufDF8fHx8MTc3Mzg0OTU1MXww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    match: ['kinh te', 'kinh doanh', 'tai chinh', 'marketing'],
    icon: TrendingUp,
    color: 'from-blue-500 to-cyan-500',
    image:
      'https://images.unsplash.com/photo-1747037632512-3bea94e6e618?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGVjb25vbWljcyUyMGJvb2tzfGVufDF8fHx8MTc3Mzg0OTU1MXww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    match: ['phat trien ban than', 'ky nang song', 'tam ly', 'self help'],
    icon: Sparkles,
    color: 'from-orange-500 to-yellow-500',
    image:
      'https://images.unsplash.com/photo-1546913760-e23d946dd386?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWxmJTIwaGVscCUyMGJvb2t8ZW58MXx8fHwxNzczODQ3MDAxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    match: ['thieu nhi', 'tre em', 'children'],
    icon: Award,
    color: 'from-green-500 to-emerald-500',
    image:
      'https://images.unsplash.com/photo-1705660800046-2113f479369a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGJvb2tzJTIwY29sb3JmdWx8ZW58MXx8fHwxNzczODQzNjIzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const getCategoryMeta = (name: string) => {
  const normalizedName = normalizeText(name);
  const matched = categoryMetaLibrary.find((item) =>
    item.match.some((keyword) => normalizedName.includes(keyword))
  );

  return (
    matched ?? {
      icon: BookOpen,
      color: 'from-slate-600 to-slate-800',
      image:
        'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
    }
  );
};

const formatCurrency = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const getFallbackBookImage = (bookId: string) => {
  const hash = bookId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return FALLBACK_BOOK_IMAGES[hash % FALLBACK_BOOK_IMAGES.length];
};

const getBookImage = (book: RawBook) => {
  if (book.image) {
    return book.image;
  }

  const firstImage = book.images?.[0];
  if (typeof firstImage === 'string') {
    return firstImage;
  }

  return firstImage?.imageUrl || firstImage?.url || getFallbackBookImage(book.id);
};

const toDisplayBook = (book: RawBook, index: number): DisplayBook => {
  const price = Number(book.price) || 0;
  const stock = Number(book.stock) || 0;
  const isDeleted = Boolean(book.deletedAt || book.status === 'deleted');
  const originalPrice =
    book.originalPrice != null ? Number(book.originalPrice) : Math.round(price * 1.3);
  const safeOriginalPrice = originalPrice > price ? originalPrice : null;
  const discount =
    typeof book.discount === 'number'
      ? book.discount
      : safeOriginalPrice
        ? Math.round((1 - price / safeOriginalPrice) * 100)
        : 0;

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    price,
    originalPrice: safeOriginalPrice,
    discount,
    rating: Number(book.rating || 0),
    reviews: Number(book.totalReviews) || 0,
    sold: Number(book.soldCount) || index,
    stock,
    isOutOfStock: !isDeleted && stock <= 0,
    isDeleted,
    image: getBookImage(book),
    badge: index % 5 === 0 ? 'BEST SELLER' : null,
    isNew: index % 7 === 0,
  };
};

export function CategoryPage() {
  const { category: categoryId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [books, setBooks] = useState<DisplayBook[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const data = await getCategories();
        setCategories(data);
      } catch (fetchError) {
        console.error('Fetch categories error:', fetchError);
        setError('Không tải được danh mục từ hệ thống.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!categoryId) {
        setBooks([]);
        setLoadingBooks(false);
        return;
      }

      try {
        setLoadingBooks(true);
        setError('');
        const data = await getBooksByCategory(categoryId);
        setBooks(data.filter((item) => !(item.deletedAt || item.status === 'deleted')).map((item, index) => toDisplayBook(item as RawBook, index)));
      } catch (fetchError) {
        console.error('Fetch books error:', fetchError);
        setBooks([]);
        setError('Không tải được sách của danh mục này.');
      } finally {
        setLoadingBooks(false);
      }
    };

    setSelectedSubCategory('all');
    setSelectedPriceRange('all');
    setSelectedRating('all');
    setSortBy('popular');
    setCurrentPage(1);
    fetchBooks();
  }, [categoryId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPriceRange, selectedRating, sortBy, viewMode]);

  const displayCategories = useMemo<CategoryDisplay[]>(
    () =>
      categories.map((item) => ({
        ...item,
        ...getCategoryMeta(item.name),
      })),
    [categories]
  );

  const currentCategory = useMemo<CategoryDisplay>(() => {
    const found = displayCategories.find((item) => item.id === categoryId);
    if (found) {
      return found;
    }

    return {
      id: categoryId || 'unknown',
      name: 'Danh mục sách',
      description: 'Khám phá các đầu sách nổi bật trong danh mục này.',
      createdAt: '',
      ...getCategoryMeta(''),
    };
  }, [categoryId, displayCategories]);

  const currentSubCategories = useMemo(
    () => [{ id: 'all', name: 'Tất cả', count: books.length }],
    [books.length]
  );

  const priceRanges = [
    { id: 'all', name: 'Tất cả mức giá' },
    { id: '0-50', name: 'Dưới 50.000đ' },
    { id: '50-100', name: '50.000đ - 100.000đ' },
    { id: '100-150', name: '100.000đ - 150.000đ' },
    { id: '150-200', name: '150.000đ - 200.000đ' },
    { id: '200+', name: 'Trên 200.000đ' },
  ];

  const sortOptions = [
    { id: 'popular', name: 'Phổ biến nhất' },
    { id: 'bestseller', name: 'Bán chạy' },
    { id: 'rating', name: 'Đánh giá cao' },
    { id: 'price-low', name: 'Giá thấp đến cao' },
    { id: 'price-high', name: 'Giá cao đến thấp' },
    { id: 'newest', name: 'Mới nhất' },
  ];

  const filteredBooks = useMemo(() => {
    let result = [...books];

    if (selectedPriceRange !== 'all') {
      result = result.filter((book) => {
        if (selectedPriceRange === '0-50') return book.price < 50000;
        if (selectedPriceRange === '50-100') return book.price >= 50000 && book.price <= 100000;
        if (selectedPriceRange === '100-150') return book.price > 100000 && book.price <= 150000;
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
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'bestseller') return b.sold - a.sold;
      if (sortBy === 'newest') return Number(b.isNew) - Number(a.isNew);
      return b.reviews + b.sold - (a.reviews + a.sold);
    });

    return result;
  }, [books, selectedPriceRange, selectedRating, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / ITEMS_PER_PAGE));
  const paginatedBooks = useMemo(
    () => filteredBooks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [currentPage, filteredBooks]
  );

  const CategoryIcon = currentCategory.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-orange-600 transition-colors"
            >
              Danh mục
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-orange-600 font-medium">{currentCategory.name}</span>
          </div>
        </div>
      </div>

      <div className={`bg-gradient-to-r ${currentCategory.color} text-white`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <CategoryIcon className="w-9 h-9" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{currentCategory.name}</h1>
                  <p className="text-lg opacity-90">{currentCategory.description}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{loadingBooks ? 'Đang tải...' : `${books.length} sách`}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  <span>Giảm đến 35%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                  <span>Đánh giá cao</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="relative">
                <img
                  src={currentCategory.image}
                  alt={currentCategory.name}
                  className="w-full h-64 object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 overflow-x-auto">
            {loadingCategories ? (
              <div className="text-sm text-gray-500">Đang tải danh mục...</div>
            ) : (
              displayCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/category/${cat.id}`)}
                    className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 transition-all whitespace-nowrap ${
                      cat.id === currentCategory.id
                        ? 'border-orange-500 bg-orange-50 text-orange-600'
                        : 'border-gray-200 hover:border-orange-300 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{cat.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div> */}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors lg:hidden"
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

            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-bold text-gray-900">{filteredBooks.length}</span> sản phẩm
              </div>
              <div className="flex items-center gap-2">
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
          </div>

          {(selectedSubCategory !== 'all' ||
            selectedPriceRange !== 'all' ||
            selectedRating !== 'all') && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="text-sm text-gray-600">Đang lọc:</span>
              {selectedSubCategory !== 'all' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  <span>
                    {currentSubCategories.find((c) => c.id === selectedSubCategory)?.name}
                  </span>
                  <button onClick={() => setSelectedSubCategory('all')}>
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
              {selectedRating !== 'all' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                  <span>{selectedRating === '4+' ? '4 sao trở lên' : '4.5 sao trở lên'}</span>
                  <button onClick={() => setSelectedRating('all')}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setSelectedSubCategory('all');
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

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <div className={`${showMobileFilters ? 'block' : 'hidden'} space-y-6 lg:col-span-3 lg:block`}>
            {/* <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-600" />
                Danh mục con
              </h3>
              <div className="space-y-2">
                {currentSubCategories.map((subCat) => (
                  <label
                    key={subCat.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="subcategory"
                        value={subCat.id}
                        checked={selectedSubCategory === subCat.id}
                        onChange={(e) => setSelectedSubCategory(e.target.value)}
                        className="w-4 h-4 text-orange-500"
                      />
                      <span className="text-gray-900">{subCat.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">({subCat.count})</span>
                  </label>
                ))}
              </div>
            </div> */}

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-orange-600" />
                Khoảng giá
              </h3>
              <div className="space-y-2">
                {priceRanges.map((range) => (
                  <label
                    key={range.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
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
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-600 fill-orange-600" />
                Đánh giá
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'all', stars: 0, label: 'Tất cả' },
                  { id: '4+', stars: 4, label: '4 sao trở lên' },
                  { id: '4.5+', stars: 4.5, label: '4.5 sao trở lên' },
                ].map((rating) => (
                  <label
                    key={rating.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={rating.id}
                      checked={selectedRating === rating.id}
                      onChange={(e) => setSelectedRating(e.target.value)}
                      className="w-4 h-4 text-orange-500"
                    />
                    <div className="flex items-center gap-2">
                      {rating.stars > 0 && (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(rating.stars)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </>
                      )}
                      <span className="text-gray-900">{rating.label}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className={`bg-gradient-to-br ${currentCategory.color} rounded-xl p-6 text-white`}>
              <CategoryIcon className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="font-bold text-lg mb-2">Khuyến mãi đặc biệt!</h3>
              <p className="text-sm opacity-90 mb-4">
                Giảm giá đến 35% cho tất cả sách trong danh mục {currentCategory.name}
              </p>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm">
                <Tag className="w-4 h-4" />
                <span>Áp dụng đến 31/03/2026</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            {loadingBooks ? (
              <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                Đang tải sách theo danh mục...
              </div>
            ) : filteredBooks.length === 0 ? (
              <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
                Chưa có sách nào trong danh mục này.
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="bg-white rounded-xl shadow-sm border hover:shadow-xl transition-all group overflow-hidden"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                      <img
                        src={book.image}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />

                      {book.badge && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {book.badge}
                        </div>
                      )}

                      {book.isNew && !book.badge && (
                        <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          MỚI
                        </div>
                      )}

                      {book.discount > 0 && (
                        <>
                          <div className="absolute left-3 top-12 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-lg">
                            Đang khuyến mãi
                          </div>
                          <div className="absolute top-3 right-3 bg-red-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                            -{book.discount}%
                          </div>
                        </>
                      )}
                      {book.isOutOfStock && (
                        <div className="absolute bottom-3 left-3 rounded-full bg-gray-900/85 px-3 py-1 text-xs font-bold text-white">
                          Hết hàng
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
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < Math.floor(book.rating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-1">({book.reviews})</span>
                      </div>

                      <h3
                        className="font-bold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-orange-600 transition-colors"
                        onClick={() => navigate(`/book/${book.id}`)}
                      >
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">{book.author}</p>

                      <div className="flex items-center gap-2 mb-3">
                        {book.discount > 0 && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                            Sale
                          </span>
                        )}
                        <span className={`text-xl font-bold ${book.discount > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                          {formatCurrency(book.price)}
                        </span>
                        {book.originalPrice && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(book.originalPrice)}
                          </span>
                        )}
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
                        className="w-full bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {book.isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedBooks.map((book) => (
                  <div
                    key={book.id}
                    className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-lg sm:flex-row"
                  >
                    <div className="w-32 h-44 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                      <img src={book.image} alt={book.title} className="w-full h-full object-cover" />
                      {book.badge && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {book.badge}
                        </div>
                      )}
                      {book.discount > 0 && (
                        <>
                          <div className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[11px] font-bold text-white">
                            Khuyến mãi
                          </div>
                          <div className="absolute top-2 right-2 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold">
                            -{book.discount}%
                          </div>
                        </>
                      )}
                      {book.isOutOfStock && (
                        <div className="absolute bottom-2 left-2 rounded-full bg-gray-900/85 px-2 py-1 text-xs font-bold text-white">
                          Hết hàng
                        </div>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col">
                      <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <h3
                            className="text-xl font-bold text-gray-900 mb-1 cursor-pointer hover:text-orange-600 transition-colors"
                            onClick={() => navigate(`/book/${book.id}`)}
                          >
                            {book.title}
                          </h3>
                          <p className="text-gray-600 mb-2">{book.author}</p>

                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
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
                            </div>
                            <span className="text-sm text-gray-600">
                              {book.rating.toFixed(1)} ({book.reviews} đánh giá)
                            </span>
                          </div>

                          <div className="text-sm text-gray-500">
                            Đã bán {book.sold.toLocaleString()} sản phẩm
                          </div>
                        </div>

                        <div className="text-right">
                          {book.discount > 0 && (
                            <div className="mb-1 text-xs font-semibold text-red-600">Đang khuyến mãi</div>
                          )}
                          <div className={`text-2xl font-bold mb-1 ${book.discount > 0 ? 'text-red-600' : 'text-orange-600'}`}>
                            {formatCurrency(book.price)}
                          </div>
                          {book.originalPrice && (
                            <div className="text-sm text-gray-400 line-through mb-2">
                              {formatCurrency(book.originalPrice)}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center">
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
                          className="flex-1 bg-orange-500 text-white py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          {book.isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
                        </button>
                        <button
                          onClick={() => navigate(`/book/${book.id}`)}
                          className="px-6 py-2.5 border-2 border-orange-500 text-orange-600 rounded-lg font-medium hover:bg-orange-50 transition-colors"
                        >
                          Xem chi tiết
                        </button>
                        <button className="w-10 h-10 border-2 border-gray-200 rounded-lg flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-colors">
                          <Heart className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              <button className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors font-medium">
                Trước
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === 1
                      ? 'bg-orange-500 text-white'
                      : 'border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors font-medium">
                Sau
              </button>
            </div> */}

{filteredBooks.length > ITEMS_PER_PAGE && (
  <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
    
    <button
      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
      className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors font-medium"
    >
      Trước
    </button>

    {[...Array(totalPages)].map((_, index) => {
      const page = index + 1;
      return (
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          className={`w-10 h-10 rounded-lg font-medium transition-colors ${
            page === currentPage
              ? 'bg-orange-500 text-white'
              : 'border-2 border-gray-200 hover:border-orange-500 hover:text-orange-600'
          }`}
        >
          {page}
        </button>
      );
    })}

    <button
      onClick={() =>
        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
      }
      className="px-4 py-2 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors font-medium"
    >
      Sau
    </button>

  </div>
)}
            
          </div>
        </div>
      </div>
    </div>
  );
}
