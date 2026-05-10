import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  MessageCircle,
  Star,
  TrendingUp,
  Heart,
  Brain,
  Lightbulb,
  User,
  ShoppingCart,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import {
  getAIAdvisorRecommendations,
  type AdvisorBook,
  type AdvisorHistoryMessage,
} from '../services/advisor.service';
import { formatCurrency, getBookImage } from '../utils/book-display';

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  books?: AdvisorBook[];
}

export function AIAdvisorPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'ai',
      text: 'Xin chào! Tôi là AI Assistant của Trạm Sách. Hãy cho tôi biết bạn muốn đọc thể loại gì, mục tiêu đọc ra sao hoặc một cuốn sách bạn từng thích.',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const quickQuestions = [
    { icon: TrendingUp, text: 'Sách bán chạy nhất hiện nay', color: 'bg-orange-100 text-orange-600' },
    { icon: Brain, text: 'Sách phát triển bản thân', color: 'bg-purple-100 text-purple-600' },
    { icon: Heart, text: 'Tiểu thuyết lãng mạn', color: 'bg-pink-100 text-pink-600' },
    { icon: Lightbulb, text: 'Sách kinh doanh khởi nghiệp', color: 'bg-blue-100 text-blue-600' },
  ];

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      text: messageText,
    };
    const nextMessages = [...messages, userMessage];
    const history: AdvisorHistoryMessage[] = messages
      .filter((message) => message.id !== 1)
      .slice(-8)
      .map((message) => ({
        role: message.type === 'user' ? 'user' : 'assistant',
        content: message.text,
      }));

    setMessages(nextMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await getAIAdvisorRecommendations(messageText, 5, history);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          text: result.answer,
          books: result.books,
        },
      ]);
    } catch (error) {
      console.error('AI advisor error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          text: 'Xin lỗi, AI tư vấn đang tạm thời bận. Bạn thử lại sau ít phút hoặc nhập một nhu cầu cụ thể hơn nhé.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Bot className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-bold">Tư Vấn Sách Với AI</h1>
              </div>
              <p className="text-lg opacity-90 mb-4">
                Trợ lý AI giúp bạn tìm cuốn sách phù hợp từ kho sách thật của cửa hàng
              </p>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Gợi ý thông minh</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Dữ liệu sách thật</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  <span>Tư vấn miễn phí</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1080"
                alt="AI Assistant"
                className="w-48 h-48 object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h2 className="font-bold text-lg">AI Book Advisor</h2>
                <p className="text-sm opacity-90">Luôn sẵn sàng hỗ trợ bạn</p>
              </div>
            </div>
          </div>

          <div className="h-[500px] overflow-y-auto bg-gray-50 p-4 space-y-4 sm:p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-full gap-3 sm:max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                    }`}
                  >
                    {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-line">{message.text}</p>
                    </div>

                    {message.books && message.books.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {message.books.map((book) => (
                          <div
                            key={book.id}
                            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row">
                              <img
                                src={getBookImage(book)}
                                alt={book.title}
                                className="w-20 h-28 object-cover rounded-lg flex-shrink-0"
                              />
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-800 mb-1">{book.title}</h4>
                                <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                                <div className="flex items-center gap-1 mb-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < Math.floor(Number(book.rating) || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="text-sm text-gray-600 ml-1">{Number(book.rating) || 0}</span>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 italic">{book.reason}</p>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-lg font-bold text-blue-600">
                                    {formatCurrency(Number(book.price) || 0)}
                                  </span>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                      onClick={() => navigate(`/book/${book.id}`)}
                                      className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                    >
                                      Xem chi tiết
                                    </button>
                                    <button
                                      onClick={() =>
                                        addToCart({
                                          id: book.id,
                                          title: book.title,
                                          author: book.author,
                                          price: formatCurrency(Number(book.price) || 0),
                                          image: getBookImage(book),
                                        })
                                      }
                                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                                    >
                                      <ShoppingCart className="w-4 h-4" />
                                      Thêm vào giỏ
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="px-6 py-4 bg-white border-t">
              <p className="text-sm text-gray-600 mb-3">Câu hỏi gợi ý:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickQuestions.map((question) => {
                  const Icon = question.icon;
                  return (
                    <button
                      key={question.text}
                      onClick={() => handleSendMessage(question.text)}
                      className={`${question.color} px-4 py-3 rounded-lg text-sm font-medium hover:shadow-md transition-all text-left flex items-center gap-2`}
                    >
                      <Icon className="w-4 h-4" />
                      {question.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="p-6 bg-white border-t">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send className="w-5 h-5" />
                <span className="font-medium">Gửi</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Gợi ý thông minh</h3>
            <p className="text-sm text-gray-600">AI phân tích nhu cầu và đề xuất sách phù hợp nhất</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Kho sách thật</h3>
            <p className="text-sm text-gray-600">Kết quả lấy trực tiếp từ dữ liệu sách trong hệ thống</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Hỏi tự nhiên</h3>
            <p className="text-sm text-gray-600">Bạn có thể mô tả sở thích, tâm trạng hoặc mục tiêu đọc</p>
          </div>
        </div>
      </div>
    </div>
  );
}
