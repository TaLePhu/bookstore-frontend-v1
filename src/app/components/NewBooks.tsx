import { Star, Sparkles, Heart, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function NewBooks() {
  const { addToCart } = useCart();
  
  const books = [
    {
      id: 1,
      title: 'Vùng Đất Hứa',
      author: 'Nguyễn Văn A',
      category: 'Văn học',
      price: '149.000đ',
      originalPrice: '200.000đ',
      discount: '25%',
      rating: 4.9,
      releaseDate: '15/03/2026',
      image: 'https://images.unsplash.com/photo-1583078156135-8e04f60c2606?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXclMjBib29rJTIwcmVsZWFzZSUyMDIwMjR8ZW58MXx8fHwxNzczODQ3MTQ3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 2,
      title: 'Bí Mật Thành Công',
      author: 'Trần Thị B',
      category: 'Phát triển bản thân',
      price: '129.000đ',
      originalPrice: '165.000đ',
      discount: '22%',
      rating: 5.0,
      releaseDate: '12/03/2026',
      image: 'https://images.unsplash.com/photo-1758565811465-4c64744b898a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBtb2Rlcm4lMjBkZXNpZ258ZW58MXx8fHwxNzczODQ3MTQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 3,
      title: 'Hành Trình Khởi Nghiệp',
      author: 'Lê Văn C',
      category: 'Kinh doanh',
      price: '175.000đ',
      originalPrice: '220.000đ',
      discount: '20%',
      rating: 4.8,
      releaseDate: '10/03/2026',
      image: 'https://images.unsplash.com/photo-1647696945040-56de84f73f5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXRlcmF0dXJlJTIwbm92ZWwlMjBoYXJkYmFja3xlbnwxfHx8fDE3NzM4NDcxNDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 4,
      title: 'Python Nâng Cao',
      author: 'Phạm Minh D',
      category: 'Công nghệ',
      price: '195.000đ',
      originalPrice: '250.000đ',
      discount: '22%',
      rating: 4.7,
      releaseDate: '08/03/2026',
      image: 'https://images.unsplash.com/photo-1707586234446-a1338e496161?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY2FkZW1pYyUyMHRleHRib29rfGVufDF8fHx8MTc3Mzg0NzE0OXww&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 5,
      title: 'Tư Duy Tích Cực',
      author: 'Hoàng Thị E',
      category: 'Tâm lý',
      price: '139.000đ',
      originalPrice: '180.000đ',
      discount: '23%',
      rating: 4.9,
      releaseDate: '05/03/2026',
      image: 'https://images.unsplash.com/photo-1605263995534-995965cb88e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3RpdmF0aW9uYWwlMjBib29rJTIwaW5zcGlyZXxlbnwxfHx8fDE3NzM4NDcxNDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 6,
      title: 'Nghệ Thuật Sống',
      author: 'Võ Văn F',
      category: 'Triết học',
      price: '155.000đ',
      originalPrice: '195.000đ',
      discount: '21%',
      rating: 4.8,
      releaseDate: '01/03/2026',
      image: 'https://images.unsplash.com/photo-1618760523936-069757c99ab9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY292ZXIlMjBwaG90b2dyYXBoeXxlbnwxfHx8fDE3NzM4NDcxNTJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Sách mới phát hành</h2>
        </div>
        <a href="#" className="text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
          Xem tất cả →
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group relative"
          >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* New Badge */}
              <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                MỚI
              </div>

              {/* Discount Badge */}
              {book.discount && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                  -{book.discount}
                </div>
              )}

              {/* Favorite Button */}
              <button className="absolute top-12 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-50">
                <Heart className="w-4 h-4 text-red-500" />
              </button>

              {/* Quick Add to Cart */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart({
                      id: book.id,
                      title: book.title,
                      author: book.author,
                      price: book.price,
                      image: book.image,
                    });
                  }}
                  className="w-full bg-orange-500 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Thêm giỏ hàng
                </button>
              </div>
            </div>
            
            {/* Book Info */}
            <div className="p-3">
              <div className="text-xs text-purple-600 font-medium mb-1">{book.category}</div>
              <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                {book.title}
              </h3>
              <p className="text-xs text-gray-600 mb-2 line-clamp-1">{book.author}</p>
              
              {/* Rating */}
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
                <span className="text-xs text-gray-600 ml-1">({book.rating})</span>
              </div>
              
              {/* Price */}
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-red-600 font-bold">{book.price}</span>
                {book.originalPrice && (
                  <span className="text-gray-400 line-through text-xs">
                    {book.originalPrice}
                  </span>
                )}
              </div>

              {/* Release Date */}
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                <span>Phát hành: {book.releaseDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
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
        <button className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-bold text-white transition-all hover:-translate-y-1 hover:shadow-lg sm:w-fit">
          Xem thêm sách mới
        </button>
      </div>
    </section>
  );
}
