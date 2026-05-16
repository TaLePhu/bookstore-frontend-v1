import { useEffect, useState } from 'react';
import { Bot, Sparkles, Search, TrendingUp, Heart, BookOpen, Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getBestSellerBooks } from '../services/book.service';
import { getCategories } from '../services/category.service';
import { getAIAdvisorRecommendations } from '../services/advisor.service';
import { formatCurrency, toVisibleDisplayBooks, type DisplayBook } from '../utils/book-display';

interface CategoryItem {
  id: string;
  name: string;
}

const cleanAiSummary = (answer: string) => {
  const normalized = answer.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Mình đã chọn vài cuốn phù hợp nhất với nội dung bạn vừa tìm.';
  }

  const firstSentence = normalized.match(/.+?[.!?](\s|$)/)?.[0]?.trim() || normalized;
  return firstSentence.length > 180 ? `${firstSentence.slice(0, 177).trim()}...` : firstSentence;
};

export function AIRecommendation() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [aiBooks, setAiBooks] = useState<DisplayBook[]>([]);
  const [aiAnswer, setAiAnswer] = useState('');
  const [bookReasons, setBookReasons] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const { addToCart } = useCart();

  const quickPrompts = [
    { icon: Heart, text: 'Sách hay về tình yêu', color: 'from-pink-500 to-rose-500' },
    { icon: TrendingUp, text: 'Sách kinh doanh bán chạy', color: 'from-blue-500 to-cyan-500' },
    { icon: BookOpen, text: 'Tiểu thuyết trinh thám', color: 'from-purple-500 to-indigo-500' },
    { icon: Sparkles, text: 'Phát triển bản thân', color: 'from-orange-500 to-amber-500' },
  ];

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(data))
      .catch((error) => {
        console.error('Fetch categories for AI recommendation error:', error);
        setCategories([]);
      });
  }, []);

  const getCategoryName = (categoryId?: string) =>
    categories.find((category) => category.id === categoryId)?.name || 'Gợi ý phù hợp';

  const runSearch = async (value: string) => {
    const keyword = value.trim();
    if (!keyword) return;

    setIsLoading(true);
    try {
      const result = await getAIAdvisorRecommendations(keyword, 4);
      setAiAnswer(cleanAiSummary(result.answer));
      setBookReasons(Object.fromEntries(result.books.map((book) => [book.id, book.reason])));
      setAiBooks(toVisibleDisplayBooks(result.books));
      setShowResults(true);
    } catch (error) {
      console.error('Fetch AI recommendation books error:', error);
      try {
        const fallbackBooks = await getBestSellerBooks();
        setAiAnswer('AI tạm thời chưa phản hồi được, mình gợi ý vài cuốn nổi bật để bạn tham khảo trước.');
        setBookReasons({});
        setAiBooks(toVisibleDisplayBooks(fallbackBooks).slice(0, 4));
        setShowResults(true);
      } catch (fallbackError) {
        console.error('Fetch fallback recommendation books error:', fallbackError);
        setAiAnswer('');
        setBookReasons({});
        setAiBooks([]);
        setShowResults(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    runSearch(prompt);
  };

  const handleQuickPrompt = (text: string) => {
    setPrompt(text);
    runSearch(text);
  };

  return (
    <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-9 h-9 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Trợ lý AI gợi ý sách</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Mô tả cuốn sách bạn muốn đọc, AI sẽ chọn những gợi ý dễ hiểu từ kho sách thật của cửa hàng.
          </p>
        </div>

        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn đọc sách về khởi nghiệp, dễ hiểu và thực tế..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 text-base"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              </div>
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg transition-all hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang tìm...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span>Tìm sách</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 py-2">Gợi ý nhanh:</span>
              {quickPrompts.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.text}
                    onClick={() => handleQuickPrompt(item.text)}
                    className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-indigo-50 hover:to-purple-50 rounded-full text-sm font-medium text-gray-700 hover:text-indigo-700 transition-all border border-gray-200 hover:border-indigo-300 flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {item.text}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {showResults && (
          <div className="mx-auto max-w-6xl">
            <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Gợi ý phù hợp với tìm kiếm của bạn</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {aiBooks.length > 0
                        ? `Mình tìm thấy ${aiBooks.length} cuốn trong kho có thể hợp với nhu cầu bạn vừa nhập.`
                        : 'Mình chưa tìm thấy cuốn nào thật sự phù hợp với nội dung này.'}
                    </p>
                  </div>
                </div>
              </div>

              {aiAnswer && (
                <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm leading-6 text-indigo-800">
                  {aiAnswer}
                </div>
              )}

              {aiBooks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center sm:p-8 text-gray-500">
                  Bạn thử mô tả rõ hơn một chút, ví dụ thể loại, chủ đề, tác giả yêu thích hoặc mục tiêu đọc nhé.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                  {aiBooks.map((book) => (
                    <div
                      key={book.id}
                      className="group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                        <img
                          src={book.image}
                          alt={book.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow">
                          {getCategoryName(book.categoryId)}
                        </div>
                        {book.discount > 0 && (
                          <div className="absolute right-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
                            -{book.discount}%
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h4 className="mb-1 line-clamp-2 font-bold text-gray-900">{book.title}</h4>
                        <p className="mb-3 text-sm text-gray-600">{book.author}</p>

                        <div className="mb-3 rounded-lg bg-indigo-50 p-3 text-xs leading-5 text-indigo-700">
                          <span className="font-semibold">Vì sao gợi ý: </span>
                          {bookReasons[book.id] || 'Phù hợp với nội dung bạn vừa tìm và đang có trong kho.'}
                        </div>

                        <div className="mb-3 flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${
                                i < Math.floor(book.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-xs text-gray-600">{book.rating.toFixed(1)}</span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className={`font-bold ${book.discount > 0 ? 'text-red-600' : 'text-orange-500'}`}>
                              {formatCurrency(book.price)}
                            </div>
                            {book.originalPrice && (
                              <div className="text-xs text-gray-400 line-through">
                                {formatCurrency(book.originalPrice)}
                              </div>
                            )}
                          </div>
                          <button
                            disabled={book.isOutOfStock}
                            onClick={() => {
                              if (book.isOutOfStock) return;
                              addToCart({
                                id: book.id,
                                title: book.title,
                                author: book.author,
                                price: formatCurrency(book.price),
                                image: book.image,
                              });
                            }}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white transition-all hover:scale-110 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:scale-100"
                            aria-label={`Thêm ${book.title} vào giỏ hàng`}
                          >
                            <ShoppingCart className="h-4 w-4" />
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

        {!showResults && (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Gợi ý thông minh</h3>
              <p className="text-sm text-gray-600">AI phân tích nhu cầu và tìm sách phù hợp nhất với bạn.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Dễ hiểu</h3>
              <p className="text-sm text-gray-600">Mỗi kết quả có lý do ngắn gọn để bạn biết vì sao cuốn đó phù hợp.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Kho sách thật</h3>
              <p className="text-sm text-gray-600">Kết quả lấy trực tiếp từ dữ liệu sách đang có trong hệ thống.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

