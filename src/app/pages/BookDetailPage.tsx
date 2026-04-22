import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Truck,
  Shield,
  RotateCcw,
  BookOpen,
  Award,
  TrendingUp,
  MessageCircle,
  ChevronLeft,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getBooksByCategory } from '../services/category.service';
import { getBookById, type ApiBook } from '../services/book.service';
import { formatCurrency, formatReleaseDate, getBookImage, toDisplayBook } from '../utils/book-display';

interface ReviewCard {
  id: string;
  user: string;
  rating: number;
  date: string;
  verified: boolean;
  comment: string;
}

const buildReviews = (book: ApiBook): ReviewCard[] => {
  const baseName = book.author || 'Độc giả';
  return [
    {
      id: `${book.id}-1`,
      user: `${baseName} Fan`,
      rating: Math.round(Number(book.rating) || 5),
      date: '15/03/2026',
      verified: true,
      comment: 'Nội dung cuốn hút, trình bày tốt và rất đáng để đọc.',
    },
    {
      id: `${book.id}-2`,
      user: 'Khách hàng Trạm Sách',
      rating: Math.max(4, Math.round(Number(book.rating) || 4)),
      date: '12/03/2026',
      verified: true,
      comment: 'Sách giao nhanh, chất lượng ổn và phần nội dung khá hữu ích.',
    },
  ];
};

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart } = useCart();
  const [book, setBook] = useState<ApiBook | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<ApiBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');
        const data = await getBookById(id);
        setBook(data);

        const images = data.images?.map((item) =>
          typeof item === 'string' ? item : item.imageUrl || item.url || ''
        ).filter(Boolean);
        setMainImage(data.image || images?.[0] || getBookImage(data));

        if (data.categoryId) {
          const related = await getBooksByCategory(data.categoryId);
          setRelatedBooks(related.filter((item) => item.id !== data.id).slice(0, 5));
        } else {
          setRelatedBooks([]);
        }
      } catch (fetchError) {
        console.error('Fetch book detail error:', fetchError);
        setError('Không tải được thông tin sách.');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  const galleryImages = useMemo(() => {
    if (!book) return [];
    const images = book.images?.map((item) =>
      typeof item === 'string' ? item : item.imageUrl || item.url || ''
    ).filter(Boolean);
    const merged = [book.image, ...(images || []), getBookImage(book)].filter(Boolean);
    return [...new Set(merged)];
  }, [book]);

  const displayBook = useMemo(() => {
    if (!book) return null;
    return toDisplayBook(book, 0);
  }, [book]);

  const reviews = useMemo(() => (book ? buildReviews(book) : []), [book]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Đang tải chi tiết sách...</div>;
  }

  if (!book || !displayBook) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-red-600">{error || 'Không tìm thấy sách.'}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Quay lại / {book.title}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-4">
              <div className="relative aspect-[3/4] mb-4 rounded-xl overflow-hidden bg-gray-100">
                <img src={mainImage} alt={book.title} className="w-full h-full object-cover" />
                {displayBook.discount > 0 && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                    -{displayBook.discount}%
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {galleryImages.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    onClick={() => setMainImage(image)}
                    className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                      mainImage === image ? 'border-orange-500 scale-95' : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <img src={image} alt={`${book.title} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    isFavorite
                      ? 'bg-red-50 border-red-500 text-red-600'
                      : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-600' : ''}`} />
                  <span className="font-medium">Yêu thích</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all">
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Chia sẻ</span>
                </button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-7">
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{book.title}</h1>
              <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-gray-600">
                  Tác giả: <span className="text-orange-600 font-medium">{book.author}</span>
                </span>
                {book.publisher && (
                  <>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">NXB: {book.publisher}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 border-b pb-6 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.floor(displayBook.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-xl font-bold text-gray-900">{displayBook.rating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span>{displayBook.reviews.toLocaleString()} đánh giá</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-5 h-5" />
                  <span>Đã bán {displayBook.sold.toLocaleString()}</span>
                </div>
              </div>

              <div className="py-6 border-b">
                <div className="mb-2 flex flex-wrap items-baseline gap-3 sm:gap-4">
                  <span className="text-4xl font-bold text-red-600">{formatCurrency(displayBook.price)}</span>
                  {displayBook.originalPrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      {formatCurrency(displayBook.originalPrice)}
                    </span>
                  )}
                  {displayBook.discount > 0 && (
                    <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold">
                      Tiết kiệm {displayBook.discount}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Giá đã bao gồm VAT. Phát hành: {formatReleaseDate(book.releaseDate)}
                </p>
              </div>

              <div className="py-6 border-b">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="text-gray-700 font-medium">Số lượng:</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">{book.stock || 0} sản phẩm có sẵn</span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                    onClick={() =>
                      addToCart({
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        price: formatCurrency(displayBook.price),
                        image: getBookImage(book),
                      })
                    }
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Thêm vào giỏ hàng
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1"
                    onClick={() => navigate('/checkout')}
                  >
                    Mua ngay
                  </button>
                </div>
              </div>

              <div className="py-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    { icon: Truck, title: 'Giao hàng nhanh', desc: '2-3 ngày', color: 'bg-blue-500' },
                    { icon: Shield, title: 'Hàng chính hãng', desc: '100% cam kết', color: 'bg-green-500' },
                    { icon: RotateCcw, title: 'Đổi trả dễ dàng', desc: 'Trong 7 ngày', color: 'bg-purple-500' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <div className={`w-10 h-10 ${item.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                          <div className="text-xs text-gray-600">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex flex-col border-b sm:flex-row">
                {[
                  { id: 'description', label: 'Mô tả sản phẩm' },
                  { id: 'specifications', label: 'Thông số kỹ thuật' },
                  { id: 'reviews', label: `Đánh giá (${displayBook.reviews})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    className={`flex-1 py-4 font-medium transition-all ${
                      selectedTab === tab.id
                        ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-8">
                {selectedTab === 'description' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-orange-600" />
                      Giới thiệu sách
                    </h3>
                    <p className="text-gray-700 mb-6 whitespace-pre-line">{book.description || 'Chưa có mô tả cho cuốn sách này.'}</p>
                    {book.highlights && book.highlights.length > 0 && (
                      <>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5 text-orange-600" />
                          Điểm nổi bật
                        </h4>
                        <ul className="space-y-2">
                          {book.highlights.map((highlight, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-700">
                              <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                {selectedTab === 'specifications' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Thông tin chi tiết</h3>
                    <table className="w-full">
                      <tbody>
                        {[
                          ['Tác giả', book.author],
                          ['Người dịch', book.translator],
                          ['Nhà xuất bản', book.publisher],
                          ['Năm xuất bản', book.publishYear],
                          ['Số trang', book.pages],
                          ['Kích thước', book.dimensions],
                          ['Trọng lượng', book.weight],
                          ['Hình thức', book.format],
                          ['Ngôn ngữ', book.language],
                        ].filter((item) => item[1]).map(([label, value], index) => (
                          <tr key={label} className={index % 2 === 1 ? 'bg-gray-50 border-b' : 'border-b'}>
                            <td className="py-3 text-gray-600 font-medium w-1/3">{label}</td>
                            <td className="py-3 text-gray-900">{String(value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {selectedTab === 'reviews' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Đánh giá từ khách hàng</h3>
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-b-0">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                              {review.user.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">{review.user}</span>
                                {review.verified && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Shield className="w-3 h-3" />
                                    Đã mua hàng
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">{review.date}</span>
                              </div>
                              <p className="text-gray-700">{review.comment}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {relatedBooks.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Sách liên quan</h2>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
              {relatedBooks.map((relatedBook, index) => {
                const item = toDisplayBook(relatedBook, index);
                return (
                  <div
                    key={relatedBook.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate(`/book/${relatedBook.id}`)}
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{item.author}</p>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(item.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-orange-500 font-bold">{formatCurrency(item.price)}</span>
                        {item.originalPrice && <span className="text-gray-400 line-through text-sm">{formatCurrency(item.originalPrice)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
