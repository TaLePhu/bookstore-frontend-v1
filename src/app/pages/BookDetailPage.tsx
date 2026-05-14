import { useCallback, useEffect, useMemo, useState } from 'react';
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
  ChevronRight,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getBookById, getRelatedBooks, type ApiBook } from '../services/book.service';
import { formatCurrency, formatReleaseDate, getBookImage, isBookDeleted, toDisplayBook } from '../utils/book-display';

interface ReviewCard {
  id: string;
  user: string;
  rating: number;
  date: string;
  verified: boolean;
  comment: string;
}

interface ReviewUpdatePayload {
  bookId?: string;
  rating?: number;
  totalReviews?: number;
  updatedAt?: number;
  review?: NonNullable<ApiBook['reviews']>[number];
}

const clampRating = (rating: number) => Math.min(5, Math.max(0, rating));

const getBookGalleryImages = (book: ApiBook) => {
  const images = book.images?.map((item) =>
    typeof item === 'string' ? item : item.imageUrl || item.url || ''
  ).filter(Boolean) || [];
  return [...new Set([book.image, ...images, getBookImage(book)].filter(Boolean) as string[])];
};

const buildReviews = (book: ApiBook): ReviewCard[] =>
  (book.reviews || [])
    .slice()
    .sort((first, second) => {
      const firstTime = first.createdAt ? new Date(first.createdAt).getTime() : 0;
      const secondTime = second.createdAt ? new Date(second.createdAt).getTime() : 0;
      return secondTime - firstTime;
    })
    .map((review) => ({
      id: review.id,
      user: review.user?.fullName || review.user?.userName || review.user?.email || 'Độc giả',
      rating: clampRating(Number(review.rating) || 0),
      date: review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : 'Đang cập nhật',
      verified: true,
      comment: review.comment?.trim() || 'Người mua đã đánh giá sao cho sản phẩm này.',
    }));

export function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const [book, setBook] = useState<ApiBook | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<ApiBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);

  const fetchBookDetail = useCallback(async (options: { resetView?: boolean; silent?: boolean } = {}) => {
    if (!id) return;

    try {
      if (!options.silent) {
        setLoading(true);
      }
      setError('');
      if (options.resetView) {
        setQuantity(1);
        setSelectedTab('description');
        setGalleryStartIndex(0);
      }

      const data = await getBookById(id);
      setBook(data);
      setMainImage((current) => (options.resetView || !current ? getBookImage(data) : current));

      if (options.resetView) {
        const related = await getRelatedBooks(data.id, 5);
        setRelatedBooks(related.filter((item) => !isBookDeleted(item)));
      }
    } catch (fetchError) {
      console.error('Fetch book detail error:', fetchError);
      setError('Không tải được thông tin sách.');
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }, [id]);

  const applyReviewUpdate = useCallback((update?: ReviewUpdatePayload | null) => {
    if (!update?.bookId || update.bookId !== id) {
      return;
    }

    setBook((current) => {
      if (!current || current.id !== update.bookId) {
        return current;
      }

      const currentReviews = current.reviews || [];
      const hasIncomingReview = Boolean(update.review?.id);
      const hasReviewAlready = hasIncomingReview
        ? currentReviews.some((review) => review.id === update.review?.id)
        : false;
      const nextReviews = hasIncomingReview && !hasReviewAlready
        ? [update.review!, ...currentReviews]
        : currentReviews;

      return {
        ...current,
        rating: update.rating ?? current.rating,
        totalReviews: update.totalReviews ?? Math.max(Number(current.totalReviews) || 0, nextReviews.length),
        reviews: nextReviews,
      };
    });
  }, [id]);

  useEffect(() => {
    fetchBookDetail({ resetView: true });
  }, [fetchBookDetail]);

  useEffect(() => {
    if (!id) return;

    const refreshIfCurrentBook = async (event?: Event) => {
      const update = (event as CustomEvent<ReviewUpdatePayload> | undefined)?.detail;
      const updatedBookId = update?.bookId;
      if (!updatedBookId || updatedBookId === id) {
        if (update) {
          applyReviewUpdate(update);
        }
        try {
          await fetchBookDetail({ silent: true });
        } finally {
          if (update) {
            applyReviewUpdate(update);
          }
        }
      }
    };

    const marker = sessionStorage.getItem(`tram-sach-review-updated-${id}`);
    if (marker) {
      sessionStorage.removeItem(`tram-sach-review-updated-${id}`);
      try {
        const update = JSON.parse(marker) as ReviewUpdatePayload;
        applyReviewUpdate(update);
        fetchBookDetail({ silent: true }).finally(() => applyReviewUpdate(update));
      } catch {
        // Ignore stale markers from older app versions.
      }
    }

    window.addEventListener('tram-sach-review-updated', refreshIfCurrentBook);
    window.addEventListener('focus', refreshIfCurrentBook);

    return () => {
      window.removeEventListener('tram-sach-review-updated', refreshIfCurrentBook);
      window.removeEventListener('focus', refreshIfCurrentBook);
    };
  }, [applyReviewUpdate, fetchBookDetail, id]);

  const displayBook = useMemo(() => (book ? toDisplayBook(book, 0) : null), [book]);
  const galleryImages = useMemo(() => (book ? getBookGalleryImages(book) : []), [book]);
  const visibleGalleryImages = useMemo(
    () => galleryImages.slice(galleryStartIndex, galleryStartIndex + 3),
    [galleryImages, galleryStartIndex]
  );
  const reviews = useMemo(() => (book ? buildReviews(book) : []), [book]);
  const reviewCount = useMemo(
    () => Math.max(Number(book?.totalReviews) || 0, reviews.length),
    [book?.totalReviews, reviews.length]
  );
  const averageRating = useMemo(() => {
    const apiRating = clampRating(Number(book?.rating) || 0);
    if (apiRating > 0 || reviews.length === 0) {
      return apiRating;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return clampRating(totalRating / reviews.length);
  }, [book?.rating, reviews]);
  const ratingBreakdown = useMemo(() => {
    const countedReviews = reviews.length;

    return [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((review) => Math.round(review.rating) === stars).length;

      return {
        stars,
        count,
        percent: countedReviews > 0 ? Math.round((count / countedReviews) * 100) : 0,
      };
    });
  }, [reviews]);
  const hasReviewSummary = reviewCount > 0 || averageRating > 0;
  const hasDetailedReviews = reviews.length > 0;
  const maxQuantity = Math.max(1, Number(book?.stock) || 1);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-gray-500">Đang tải chi tiết sách...</div>;
  }

  if (!book || !displayBook) {
    return <div className="min-h-screen bg-gray-50 p-8 text-center text-red-600">{error || 'Không tìm thấy sách.'}</div>;
  }

  const isOutOfStock = displayBook.isOutOfStock;
  const canSlideGallery = galleryImages.length > 3;
  const canSlideGalleryPrev = galleryStartIndex > 0;
  const canSlideGalleryNext = galleryStartIndex + 3 < galleryImages.length;

  const handleGalleryPrev = () => {
    setGalleryStartIndex((prev) => Math.max(0, prev - 1));
  };

  const handleGalleryNext = () => {
    setGalleryStartIndex((prev) => Math.min(Math.max(0, galleryImages.length - 3), prev + 1));
  };

  const specs = [
    ['Danh mục', book.category?.name],
    ['Tác giả', book.author],
    ['ISBN', book.isbn],
    ['Người dịch', book.translator],
    ['Nhà xuất bản', book.publisher],
    ['Năm xuất bản', book.publishYear],
    ['Ngày phát hành', formatReleaseDate(book.releaseDate)],
    ['Số trang', book.pages],
    ['Kích thước', book.dimensions],
    ['Trọng lượng', book.weight],
    ['Hình thức', book.format],
    ['Ngôn ngữ', book.language],
    ['Tồn kho', `${Number(book.stock) || 0} cuốn`],
    ['Đã bán', `${displayBook.sold.toLocaleString('vi-VN')} cuốn`],
  ].filter((item) => item[1]);

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
                <img src={mainImage || displayBook.image} alt={book.title} className="w-full h-full object-cover" />
                {displayBook.discount > 0 && (
                  <>
                    <div className="absolute left-4 top-4 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
                      Đang khuyến mãi
                    </div>
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                      -{displayBook.discount}%
                    </div>
                  </>
                )}
                {isOutOfStock && (
                  <div className="absolute bottom-4 left-4 rounded-full bg-gray-900/85 px-4 py-2 text-sm font-bold text-white">
                    Hết hàng
                  </div>
                )}
              </div>

              <div className="relative">
                {canSlideGallery && (
                  <button
                    type="button"
                    onClick={handleGalleryPrev}
                    disabled={!canSlideGalleryPrev}
                    className="absolute left-0 top-1/2 z-10 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Xem ảnh trước"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                <div className="grid grid-cols-3 gap-3">
                  {visibleGalleryImages.map((image, index) => {
                    const imageIndex = galleryStartIndex + index;

                    return (
                      <button
                        key={`${image}-${imageIndex}`}
                        onClick={() => setMainImage(image)}
                        className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                          (mainImage || displayBook.image) === image
                            ? 'border-orange-500 scale-95'
                            : 'border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <img src={image} alt={`${book.title} ${imageIndex + 1}`} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
                {canSlideGallery && (
                  <button
                    type="button"
                    onClick={handleGalleryNext}
                    disabled={!canSlideGalleryNext}
                    className="absolute right-0 top-1/2 z-10 flex h-9 w-9 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-gray-700 shadow-md ring-1 ring-gray-200 transition hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Xem ảnh tiếp theo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
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
                      <Star key={i} className={`w-5 h-5 ${i < Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <span className="text-xl font-bold text-gray-900">{averageRating.toFixed(1)}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span>{reviewCount.toLocaleString('vi-VN')} đánh giá</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-5 h-5" />
                  <span>Đã bán {displayBook.sold.toLocaleString()}</span>
                </div>
              </div>

              <div className="py-6 border-b">
                {displayBook.discount > 0 && (
                  <div className="mb-3 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600 ring-1 ring-red-100">
                    Sách đang khuyến mãi
                  </div>
                )}
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
                    <button
                      disabled={isOutOfStock}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                    <button
                      disabled={isOutOfStock}
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className={`text-sm ${isOutOfStock ? 'font-semibold text-red-600' : 'text-gray-600'}`}>
                    {isOutOfStock ? 'Hết hàng' : `${Number(book.stock) || 0} sản phẩm có sẵn`}
                  </span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <button
                    disabled={isOutOfStock}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    onClick={() => {
                      if (isOutOfStock) return;
                      addToCart({
                        id: book.id,
                        title: book.title,
                        author: book.author,
                        price: formatCurrency(displayBook.price),
                        image: displayBook.image,
                      }, quantity);
                    }}
                  >
                    <ShoppingCart className="w-6 h-6" />
                    Thêm vào giỏ hàng
                  </button>
                  <button
                    disabled={isOutOfStock}
                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    onClick={async () => {
                      if (isOutOfStock) return;
                      sessionStorage.setItem(
                        'tram-sach-buy-now-item',
                        JSON.stringify({
                          id: book.id,
                          title: book.title,
                          author: book.author,
                          price: formatCurrency(displayBook.price),
                          image: displayBook.image,
                          quantity,
                        })
                      );
                      navigate('/checkout?mode=buy-now', { state: { mode: 'buy-now' } });
                    }}
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
                  { id: 'specifications', label: 'Thông tin chi tiết' },
                  { id: 'reviews', label: `Đánh giá (${reviewCount.toLocaleString('vi-VN')})` },
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
                    {specs.length === 0 ? (
                      <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">Chưa có thông tin chi tiết.</div>
                    ) : (
                      <table className="w-full">
                        <tbody>
                          {specs.map(([label, value], index) => (
                            <tr key={label} className={index % 2 === 1 ? 'bg-gray-50 border-b' : 'border-b'}>
                              <td className="py-3 text-gray-600 font-medium w-1/3">{label}</td>
                              <td className="py-3 text-gray-900">{String(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {selectedTab === 'reviews' && (
                  <div>
                    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Đánh giá từ khách hàng</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Tổng hợp cảm nhận của khách đã mua sách tại Trạm Sách.
                        </p>
                      </div>
                      <div className="text-sm text-gray-500">{reviewCount.toLocaleString('vi-VN')} lượt đánh giá</div>
                    </div>
                    {!hasReviewSummary ? (
                      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-orange-500 shadow-sm">
                          <MessageCircle className="h-7 w-7" />
                        </div>
                        <h4 className="font-semibold text-gray-900">Chưa có đánh giá</h4>
                        <p className="mt-2 text-sm text-gray-500">
                          Khi khách hàng hoàn tất đơn và gửi đánh giá, nội dung sẽ hiển thị tại đây.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        <div className="grid gap-6 rounded-xl border border-orange-100 bg-orange-50/60 p-5 md:grid-cols-[220px_1fr]">
                          <div className="flex flex-col items-center justify-center rounded-xl bg-white p-5 text-center shadow-sm">
                            <div className="text-5xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
                            <div className="mt-2 flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 ${
                                    i < Math.floor(averageRating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="mt-2 text-sm text-gray-500">
                              {reviewCount.toLocaleString('vi-VN')} lượt đánh giá
                            </div>
                          </div>

                          <div className="space-y-3">
                            {hasDetailedReviews ? (
                              <>
                                {ratingBreakdown.map((item) => (
                                  <div key={item.stars} className="grid grid-cols-[64px_1fr_48px] items-center gap-3 text-sm">
                                    <div className="flex items-center gap-1 font-medium text-gray-700">
                                      {item.stars}
                                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-white">
                                      <div
                                        className="h-full rounded-full bg-yellow-400"
                                        style={{ width: `${item.percent}%` }}
                                      />
                                    </div>
                                    <div className="text-right text-gray-500">{item.count}</div>
                                  </div>
                                ))}
                                {reviewCount > reviews.length && (
                                  <p className="text-xs text-gray-500">
                                    Biểu đồ đang dựa trên {reviews.length.toLocaleString('vi-VN')} nhận xét hiển thị gần nhất.
                                  </p>
                                )}
                              </>
                            ) : (
                              <div className="flex h-full min-h-36 items-center rounded-xl bg-white p-5 text-sm text-gray-500">
                                Sách đã có điểm đánh giá tổng hợp, nhưng chưa có nhận xét chi tiết để thống kê theo từng mức sao.
                              </div>
                            )}
                          </div>
                        </div>

                        {hasDetailedReviews ? (
                          <div className="space-y-5">
                            {reviews.map((review) => (
                              <div key={review.id} className="rounded-xl border border-gray-100 p-5">
                                <div className="flex items-start gap-4">
                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-600">
                                    {review.user.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-gray-900">{review.user}</span>
                                      {review.verified && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                          <Shield className="h-3 w-3" />
                                          Đã mua hàng
                                        </span>
                                      )}
                                      <span className="text-sm text-gray-400">{review.date}</span>
                                    </div>
                                    <div className="mb-3 flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                              i < Math.round(review.rating)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm font-medium text-gray-700">{review.rating.toFixed(1)}</span>
                                    </div>
                                    <p className="text-gray-700">{review.comment}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                            <h4 className="font-semibold text-gray-900">Chưa có nhận xét chi tiết</h4>
                            <p className="mt-2 text-sm text-gray-500">
                              Điểm đánh giá đã được ghi nhận. Nhận xét bằng chữ sẽ xuất hiện sau khi khách hàng gửi thêm nội dung.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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
                      {item.discount > 0 && (
                        <div className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[11px] font-bold text-white">
                          Khuyến mãi -{item.discount}%
                        </div>
                      )}
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
                        <span className={`font-bold ${item.discount > 0 ? 'text-red-600' : 'text-orange-500'}`}>{formatCurrency(item.price)}</span>
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
