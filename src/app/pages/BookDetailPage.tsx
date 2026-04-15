import { useState } from 'react';
import { useNavigate } from 'react-router';
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
  ThumbsUp,
  ChevronLeft,
  Plus,
  Minus,
} from 'lucide-react';
import { useCart } from '../context/CartContext';


export function BookDetailPage() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);
  const { addToCart } = useCart();


  const book = {
    id: 1,
    title: 'Nhà Giả Kim',
    author: 'Paulo Coelho',
    translator: 'Lê Chu Cầu',
    publisher: 'NXB Văn Học',
    publishYear: '2024',
    pages: 227,
    dimensions: '20.5 x 14.5 cm',
    weight: '350g',
    format: 'Bìa mềm',
    language: 'Tiếng Việt',
    price: '79.000đ',
    originalPrice: '110.000đ',
    discount: '28%',
    rating: 4.8,
    totalRatings: 2456,
    totalReviews: 856,
    stock: 152,
    sold: 5432,
    images: [
      'https://images.unsplash.com/photo-1652452856335-20ebcd351bc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwZGV0YWlsJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzM4NDczODV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1623613406591-6f0ffe5b605c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcGVuJTIwYm9vayUyMHBhZ2VzfGVufDF8fHx8MTc3Mzc3MTczNnww&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1622609184693-58079bb6742f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwcmV2aWV3JTIwcmF0aW5nfGVufDF8fHx8MTc3Mzg0NzM4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
    ],
    description: `"Nhà Giả Kim" là một trong những cuốn sách bán chạy nhất mọi thời đại, đã được dịch ra hơn 80 ngôn ngữ và bán được hơn 65 triệu bản trên toàn thế giới.

Câu chuyện kể về hành trình của Santiago, một cậu bé chăn cừu người Tây Ban Nha, trong việc theo đuổi giấc mơ tìm kiếm kho báu ở Kim tự tháp Ai Cập. Trên con đường đó, cậu đã học được những bài học quý giá về cuộc sống, tình yêu và ý nghĩa thực sự của hạnh phúc.

Paulo Coelho đã khéo léo kết hợp triết lý phương Đông và phương Tây để tạo nên một tác phẩm đầy cảm hứng, giúp người đọc nhận ra rằng kho báu lớn nhất không nằm ở đích đến mà chính là hành trình đi tìm nó.`,
    highlights: [
      'Tác phẩm kinh điển của Paulo Coelho',
      'Bán được hơn 65 triệu bản trên toàn thế giới',
      'Dịch ra hơn 80 ngôn ngữ',
      'Thông điệp sâu sắc về ý nghĩa cuộc sống',
      'Phù hợp cho mọi lứa tuổi',
    ],
  };

  const reviews = [
    {
      id: 1,
      user: 'Nguyễn Văn A',
      avatar: 'https://images.unsplash.com/photo-1686771855137-dca1f094bac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjByZWFkaW5nJTIwYm9vayUyMGhhcHB5fGVufDF8fHx8MTc3Mzg0NzM4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 5,
      date: '15/03/2026',
      verified: true,
      comment:
        'Một cuốn sách tuyệt vời! Thông điệp sâu sắc và cách kể chuyện hấp dẫn. Rất đáng đọc!',
      helpful: 234,
    },
    {
      id: 2,
      user: 'Trần Thị B',
      avatar: 'https://images.unsplash.com/photo-1686771855137-dca1f094bac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjByZWFkaW5nJTIwYm9vayUyMGhhcHB5fGVufDF8fHx8MTc3Mzg0NzM4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 5,
      date: '12/03/2026',
      verified: true,
      comment:
        'Đọc xong cảm thấy được truyền cảm hứng rất nhiều. Chất lượng sách tốt, giao hàng nhanh.',
      helpful: 156,
    },
    {
      id: 3,
      user: 'Lê Văn C',
      avatar: 'https://images.unsplash.com/photo-1686771855137-dca1f094bac5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjByZWFkaW5nJTIwYm9vayUyMGhhcHB5fGVufDF8fHx8MTc3Mzg0NzM4Nnww&ixlib=rb-4.1.0&q=80&w=1080',
      rating: 4,
      date: '10/03/2026',
      verified: true,
      comment: 'Nội dung hay nhưng bản dịch có chỗ hơi khó hiểu. Nhìn chung vẫn rất đáng mua.',
      helpful: 89,
    },
  ];

  const relatedBooks = [
    {
      id: 2,
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      price: '65.000đ',
      originalPrice: '86.000đ',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1760840415479-438f61268bed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFkaW5nJTIwYm9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NzM4NDY2NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 3,
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      price: '189.000đ',
      originalPrice: '230.000đ',
      rating: 4.7,
      image:
        'https://images.unsplash.com/photo-1569728723358-d1a317aa7fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rc3RvcmUlMjBsaWJyYXJ5JTIwc2hlbHZlc3xlbnwxfHx8fDE3NzM4MTI1MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 4,
      title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
      author: 'Rosie Nguyễn',
      price: '75.000đ',
      originalPrice: '95.000đ',
      rating: 4.6,
      image:
        'https://images.unsplash.com/photo-1611633360825-7d9657ca6185?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc3Mzg0NjY1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 5,
      title: 'Vùng Đất Hứa',
      author: 'Nguyễn Văn A',
      price: '149.000đ',
      originalPrice: '200.000đ',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1583078156135-8e04f60c2606?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjBib29rJTIwcmVsZWFzZSUyMDIwMjR8ZW58MXx8fHwxNzczODQ3MTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  const [mainImage, setMainImage] = useState(book.images[0]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">
              Trang chủ / Văn học / {book.title}
            </span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid gap-8 xl:grid-cols-12">
          {/* Left Column - Images */}
          <div className="xl:col-span-5">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-4">
              {/* Main Image */}
              <div className="relative aspect-[3/4] mb-4 rounded-xl overflow-hidden bg-gray-100">
                <img
                  src={mainImage}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
                {book.discount && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold text-lg">
                    -{book.discount}
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              <div className="grid grid-cols-3 gap-3">
                {book.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setMainImage(image)}
                    className={`aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${
                      mainImage === image
                        ? 'border-orange-500 scale-95'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${book.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    isFavorite
                      ? 'bg-red-50 border-red-500 text-red-600'
                      : 'border-gray-200 text-gray-700 hover:border-red-300 hover:bg-red-50'
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isFavorite ? 'fill-red-600' : ''}`}
                  />
                  <span className="font-medium">Yêu thích</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50 transition-all">
                  <Share2 className="w-5 h-5" />
                  <span className="font-medium">Chia sẻ</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="xl:col-span-7">
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
              {/* Title & Author */}
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {book.title}
              </h1>
              <div className="mb-4 flex flex-wrap items-center gap-3 sm:gap-4">
                <span className="text-gray-600">
                  Tác giả:{' '}
                  <span className="text-orange-600 font-medium hover:underline cursor-pointer">
                    {book.author}
                  </span>
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">
                  NXB: {book.publisher}
                </span>
              </div>

              {/* Rating & Stats */}
              <div className="flex flex-wrap items-center gap-4 border-b pb-6 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.floor(book.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    {book.rating}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <MessageCircle className="w-5 h-5" />
                  <span>
                    {book.totalReviews.toLocaleString()} đánh giá
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <TrendingUp className="w-5 h-5" />
                  <span>Đã bán {book.sold.toLocaleString()}</span>
                </div>
              </div>

              {/* Price */}
              <div className="py-6 border-b">
                <div className="mb-2 flex flex-wrap items-baseline gap-3 sm:gap-4">
                  <span className="text-4xl font-bold text-red-600">
                    {book.price}
                  </span>
                  {book.originalPrice && (
                    <span className="text-2xl text-gray-400 line-through">
                      {book.originalPrice}
                    </span>
                  )}
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold">
                    Tiết kiệm {book.discount}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Giá đã bao gồm VAT. Miễn phí vận chuyển cho đơn hàng từ
                  200.000đ
                </p>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="py-6 border-b">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <span className="text-gray-700 font-medium">Số lượng:</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-sm text-gray-600">
                    {book.stock} sản phẩm có sẵn
                  </span>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <button className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                  onClick={() => addToCart(book)}
                
                  >
                  
                    <ShoppingCart className="w-6 h-6" 
                    
                    />
                    Thêm vào giỏ hàng
                  </button>
                  <button className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:shadow-xl transition-all hover:-translate-y-1"
                  onClick={() => navigate('/checkout')}

                  >
                    Mua ngay
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="py-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        Giao hàng nhanh
                      </div>
                      <div className="text-xs text-gray-600">2-3 ngày</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        Hàng chính hãng
                      </div>
                      <div className="text-xs text-gray-600">100% cam kết</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <RotateCcw className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        Đổi trả dễ dàng
                      </div>
                      <div className="text-xs text-gray-600">Trong 7 ngày</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="flex flex-col border-b sm:flex-row">
                <button
                  onClick={() => setSelectedTab('description')}
                  className={`flex-1 py-4 font-medium transition-all ${
                    selectedTab === 'description'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Mô tả sản phẩm
                </button>
                <button
                  onClick={() => setSelectedTab('specifications')}
                  className={`flex-1 py-4 font-medium transition-all ${
                    selectedTab === 'specifications'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Thông số kỹ thuật
                </button>
                <button
                  onClick={() => setSelectedTab('reviews')}
                  className={`flex-1 py-4 font-medium transition-all ${
                    selectedTab === 'reviews'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Đánh giá ({book.totalReviews})
                </button>
              </div>

              <div className="p-5 sm:p-8">
                {/* Description Tab */}
                {selectedTab === 'description' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-6 h-6 text-orange-600" />
                      Giới thiệu sách
                    </h3>
                    <div className="prose prose-lg max-w-none mb-6">
                      {book.description.split('\n\n').map((para, index) => (
                        <p key={index} className="text-gray-700 mb-4">
                          {para}
                        </p>
                      ))}
                    </div>

                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <Award className="w-5 h-5 text-orange-600" />
                      Điểm nổi bật
                    </h4>
                    <ul className="space-y-2">
                      {book.highlights.map((highlight, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-gray-700"
                        >
                          <span className="w-2 h-2 bg-orange-500 rounded-full mt-2"></span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specifications Tab */}
                {selectedTab === 'specifications' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Thông tin chi tiết
                    </h3>
                    <table className="w-full">
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 text-gray-600 font-medium w-1/3">
                            Tác giả
                          </td>
                          <td className="py-3 text-gray-900">{book.author}</td>
                        </tr>
                        <tr className="border-b bg-gray-50">
                          <td className="py-3 text-gray-600 font-medium">
                            Người dịch
                          </td>
                          <td className="py-3 text-gray-900">
                            {book.translator}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 text-gray-600 font-medium">
                            Nhà xuất bản
                          </td>
                          <td className="py-3 text-gray-900">
                            {book.publisher}
                          </td>
                        </tr>
                        <tr className="border-b bg-gray-50">
                          <td className="py-3 text-gray-600 font-medium">
                            Năm xuất bản
                          </td>
                          <td className="py-3 text-gray-900">
                            {book.publishYear}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 text-gray-600 font-medium">
                            Số trang
                          </td>
                          <td className="py-3 text-gray-900">{book.pages}</td>
                        </tr>
                        <tr className="border-b bg-gray-50">
                          <td className="py-3 text-gray-600 font-medium">
                            Kích thước
                          </td>
                          <td className="py-3 text-gray-900">
                            {book.dimensions}
                          </td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 text-gray-600 font-medium">
                            Trọng lượng
                          </td>
                          <td className="py-3 text-gray-900">{book.weight}</td>
                        </tr>
                        <tr className="border-b bg-gray-50">
                          <td className="py-3 text-gray-600 font-medium">
                            Hình thức
                          </td>
                          <td className="py-3 text-gray-900">{book.format}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 text-gray-600 font-medium">
                            Ngôn ngữ
                          </td>
                          <td className="py-3 text-gray-900">
                            {book.language}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Reviews Tab */}
                {selectedTab === 'reviews' && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">
                      Đánh giá từ khách hàng
                    </h3>
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="border-b pb-6 last:border-b-0"
                        >
                          <div className="flex items-start gap-4">
                            <img
                              src={review.avatar}
                              alt={review.user}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">
                                  {review.user}
                                </span>
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
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {review.date}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-3">
                                {review.comment}
                              </p>
                              <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                Hữu ích ({review.helpful})
                              </button>
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

        {/* Related Books */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Sách liên quan
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-5">
            {relatedBooks.map((relatedBook) => (
              <div
                key={relatedBook.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={relatedBook.image}
                    alt={relatedBook.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                    {relatedBook.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {relatedBook.author}
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < Math.floor(relatedBook.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-500 font-bold">
                      {relatedBook.price}
                    </span>
                    {relatedBook.originalPrice && (
                      <span className="text-gray-400 line-through text-sm">
                        {relatedBook.originalPrice}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
