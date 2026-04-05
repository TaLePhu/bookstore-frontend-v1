import { Star, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';

export function BestSellers() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const books = [
    {
      id: 1,
      title: 'Nhà Giả Kim',
      author: 'Paulo Coelho',
      price: '79.000đ',
      originalPrice: '110.000đ',
      discount: '28%',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1664095885286-65fb80ba335d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rcyUyMGNvbG9yZnVsJTIwc3RhY2t8ZW58MXx8fHwxNzczODQ2NjQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 2,
      title: 'Đắc Nhân Tâm',
      author: 'Dale Carnegie',
      price: '65.000đ',
      originalPrice: '86.000đ',
      discount: '24%',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1760840415479-438f61268bed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWFkaW5nJTIwYm9vayUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NzM4NDY2NDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 3,
      title: 'Sapiens',
      author: 'Yuval Noah Harari',
      price: '189.000đ',
      originalPrice: '230.000đ',
      discount: '18%',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1569728723358-d1a317aa7fba?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rc3RvcmUlMjBsaWJyYXJ5JTIwc2hlbHZlc3xlbnwxfHx8fDE3NzM4MTI1MDR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    },
    {
      id: 4,
      title: 'Tuổi Trẻ Đáng Giá Bao Nhiêu',
      author: 'Rosie Nguyễn',
      price: '75.000đ',
      originalPrice: '95.000đ',
      discount: '21%',
      rating: 4.6,
      image: 'https://images.unsplash.com/photo-1611633360825-7d9657ca6185?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aWV0bmFtZXNlJTIwYm9vayUyMGNvdmVyfGVufDF8fHx8MTc3Mzg0NjY1MHww&ixlib=rb-4.1.0&q=80&w=1080',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Sách bán chạy</h2>
        <a href="#" className="text-orange-500 hover:text-orange-600 font-medium">
          Xem tất cả →
        </a>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            onClick={() => navigate('/book/1')}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              {book.discount && (
                <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{book.discount}
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
                <span className="text-sm text-gray-600 ml-1">({book.rating})</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-orange-500 font-bold text-lg">{book.price}</div>
                  {book.originalPrice && (
                    <div className="text-gray-400 line-through text-sm">
                      {book.originalPrice}
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
                      price: book.price,
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
    </section>
  );
}