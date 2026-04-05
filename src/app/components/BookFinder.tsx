import { useState } from 'react';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { useCart } from '../context/CartContext';

export function BookFinder() {
  const [activeTab, setActiveTab] = useState('trending');
  const { addToCart } = useCart();

  const tabs = [
    { id: 'trending', label: 'TIỂU THUYẾT' },
    { id: 'sale', label: 'SÁCH HAY - 25%' },
    { id: 'psychology', label: 'TÂM LÝ' },
    { id: 'business', label: 'KINH DOANH' },
    { id: 'gift', label: 'QUÀ TẶNG' },
  ];

  const books = {
    trending: [
      {
        id: 1,
        title: 'Đảo Giấu Mặt',
        subtitle: 'Bộ sách trinh thám ly kỳ và hấp dẫn nhất năm',
        price: '120.000đ',
        originalPrice: '180.000đ',
        rating: 5,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1752243751485-28462bdee57a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaWN0aW9uJTIwbm92ZWwlMjBib29rJTIwY292ZXJ8ZW58MXx8fHwxNzczNzU5MTUyfDA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      {
        id: 2,
        title: 'Chiến Lược Kinh Doanh',
        subtitle: 'Học hỏi từ các doanh nghiệp thành công nhất thế giới',
        price: '145.000đ',
        originalPrice: '200.000đ',
        rating: 5,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1768991732235-ac3e1bc9259c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGJvb2slMjBoYXJkY292ZXJ8ZW58MXx8fHwxNzczODIyMjA1fDA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      {
        id: 3,
        title: 'Thế Giới Kỳ Diệu',
        subtitle: 'Bộ sách dành cho trẻ em đầy màu sắc và sáng tạo',
        price: '85.000đ',
        originalPrice: '120.000đ',
        rating: 5,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1631426964394-06606872d836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsZHJlbiUyMGJvb2slMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzM4NDcwMDF8MA&ixlib=rb-4.1.0&q=80&w=1080',
      },
      {
        id: 4,
        title: 'Bí Mật Trong Bóng Tối',
        subtitle: 'Câu chuyện ly kỳ khiến bạn không thể rời mắt',
        price: '95.000đ',
        originalPrice: '140.000đ',
        rating: 4,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1698956483970-a47edef29331?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxteXN0ZXJ5JTIwdGhyaWxsZXIlMjBib29rfGVufDF8fHx8MTc3Mzc5NTY3MHww&ixlib=rb-4.1.0&q=80&w=1080',
      },
      {
        id: 5,
        title: 'Thay Đổi Cuộc Sống',
        subtitle: 'Hành trình khám phá bản thân và phát triển',
        price: '110.000đ',
        originalPrice: '155.000đ',
        rating: 5,
        isNew: true,
        image: 'https://images.unsplash.com/photo-1546913760-e23d946dd386?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWxmJTIwaGVscCUyMGJvb2t8ZW58MXx8fHwxNzczODQ3MDAxfDA&ixlib=rb-4.1.0&q=80&w=1080',
      },
    ],
    sale: [],
    psychology: [],
    business: [],
    gift: [],
  };

  return (
    <section className="bg-gradient-to-br from-orange-50 to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header with Tabs */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-red-600 uppercase">
            Bạn đang tìm sách gì?
          </h2>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2 rounded-full border-2 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-red-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        <div className="grid grid-cols-5 gap-6">
          {books[activeTab as keyof typeof books].map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-2 group"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                <img
                  src={book.image}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                {book.isNew && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                    Mới
                  </div>
                )}
                
                {/* Quick Actions */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-full bg-white text-gray-900 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors mb-2">
                    <Eye className="w-4 h-4" />
                    XEM NHANH
                  </button>
                </div>
              </div>

              {/* Book Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                  {book.title}
                </h3>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2 h-8">
                  {book.subtitle}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < book.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-xs text-gray-600 ml-1">({book.rating})</span>
                </div>

                {/* Price and Cart */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-red-600 font-bold text-lg">
                      {book.price}
                    </div>
                    {book.originalPrice && (
                      <div className="text-gray-400 line-through text-xs">
                        {book.originalPrice}
                      </div>
                    )}
                  </div>
                  <button
                    className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white hover:bg-orange-600 transition-colors shadow-md"
                    onClick={() => addToCart(book)}
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}