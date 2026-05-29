import { useEffect, useMemo, useRef, useState } from 'react';
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
  Plus,
  Trash2,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  createAIAdvisorConversation,
  deleteAIAdvisorConversation,
  getAIAdvisorRecommendations,
  getAIAdvisorConversations,
  updateAIAdvisorConversation,
  type AdvisorBook,
  type AdvisorConversation,
  type AdvisorHistoryMessage,
} from '../services/advisor.service';
import { formatCurrency, getBookImage, isBookDeleted } from '../utils/book-display';

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  books?: AdvisorBook[];
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

const WELCOME_MESSAGE: Message = {
  id: 1,
  type: 'ai',
  text: 'Xin chào! Tôi là trợ lý tư vấn sách của Trạm Sách. Hãy cho tôi biết bạn muốn đọc thể loại gì, mục tiêu đọc ra sao hoặc một cuốn sách bạn từng thích.',
};

const MAX_STORED_MESSAGES = 40;
const MAX_STORED_CONVERSATIONS = 12;

const getSessionsKey = (userId?: string) => `bookstore:ai-advisor:sessions:${userId || 'guest'}`;
const getActiveSessionKey = (userId?: string) => `bookstore:ai-advisor:active-session:${userId || 'guest'}`;
const getLegacyMessagesKey = (userId?: string) => `bookstore:ai-advisor:messages:${userId || 'guest'}`;

const createConversation = (): Conversation => ({
  id: `chat-${Date.now()}`,
  title: 'Cuộc trò chuyện mới',
  updatedAt: Date.now(),
  messages: [WELCOME_MESSAGE],
});

const isValidStoredMessage = (message: unknown): message is Message => {
  if (!message || typeof message !== 'object') return false;
  const item = message as Partial<Message>;
  return (
    typeof item.id === 'number' &&
    (item.type === 'user' || item.type === 'ai') &&
    typeof item.text === 'string' &&
    (!item.books || Array.isArray(item.books))
  );
};

const isValidConversation = (conversation: unknown): conversation is Conversation => {
  if (!conversation || typeof conversation !== 'object') return false;
  const item = conversation as Partial<Conversation>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.updatedAt === 'number' &&
    Array.isArray(item.messages) &&
    item.messages.every(isValidStoredMessage)
  );
};

const getConversationTitle = (messages: Message[]) => {
  const firstUserMessage = messages.find((message) => message.type === 'user')?.text.trim();
  if (!firstUserMessage) return 'Cuộc trò chuyện mới';
  return firstUserMessage.length > 48 ? `${firstUserMessage.slice(0, 45).trim()}...` : firstUserMessage;
};

const normalizeStoredMessages = (messages: Message[]) =>
  messages.slice(-MAX_STORED_MESSAGES).map((message, index) => {
    if (index === 0 && message.type === 'ai') {
      return WELCOME_MESSAGE;
    }

    return message;
  });

const loadLegacyConversation = (userId?: string): Conversation | null => {
  try {
    const raw = localStorage.getItem(getLegacyMessagesKey(userId));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const messages = normalizeStoredMessages(parsed.filter(isValidStoredMessage));
    if (messages.length <= 1) return null;

    return {
      id: `chat-${Date.now()}`,
      title: getConversationTitle(messages),
      updatedAt: Date.now(),
      messages,
    };
  } catch {
    return null;
  }
};

const loadConversations = (userId?: string): Conversation[] => {
  try {
    const raw = localStorage.getItem(getSessionsKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const conversations = parsed
          .filter(isValidConversation)
          .map((conversation) => {
            const messages = normalizeStoredMessages(conversation.messages);
            return {
              ...conversation,
              title: getConversationTitle(messages),
              messages,
            };
          })
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, MAX_STORED_CONVERSATIONS);

        if (conversations.length > 0) return conversations;
      }
    }

    const legacyConversation = loadLegacyConversation(userId);
    return legacyConversation ? [legacyConversation] : [createConversation()];
  } catch (error) {
    console.warn('Failed to load AI advisor conversations:', error);
    return [createConversation()];
  }
};

const formatConversationTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const toClientConversation = (conversation: AdvisorConversation): Conversation => {
  const messages = normalizeStoredMessages(conversation.messages.filter(isValidStoredMessage));
  return {
    id: conversation.id,
    title: conversation.title || getConversationTitle(messages),
    updatedAt: typeof conversation.updatedAt === 'number' ? conversation.updatedAt : new Date(conversation.updatedAt).getTime(),
    messages: messages.length > 0 ? messages : [WELCOME_MESSAGE],
  };
};

const buildAdvisorHistoryContent = (message: Message) => {
  if (message.type === 'user' || !message.books || message.books.length === 0) {
    return message.text;
  }

  const suggestedBooks = message.books
    .map((book, index) => {
      const title = book.title || `Sách ${index + 1}`;
      const author = book.author ? ` - ${book.author}` : '';
      const reason = book.reason ? `: ${book.reason}` : '';
      return `${index + 1}. ${title}${author}${reason}`;
    })
    .join('\n');

  return [message.text, `Các sách đã gợi ý trong lượt này:\n${suggestedBooks}`].join('\n\n');
};

const renderFormattedMessage = (text: string, hasBookCards = false) => {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  const intro = lines.filter((line) => !line.startsWith('-'));
  const bullets = lines
    .filter((line) => line.startsWith('-'))
    .map((line) => line.replace(/^-\s*/, ''));
  const visibleBullets = hasBookCards ? [] : bullets;

  return (
    <div className="space-y-3">
      {intro.map((line, index) => (
        <p key={`p-${index}`} className="leading-7">
          {line}
        </p>
      ))}
      {visibleBullets.length > 0 && (
        <ul className="space-y-2">
          {visibleBullets.map((line, index) => {
            const [title, ...rest] = line.split(':');
            const description = rest.join(':').trim();

            return (
              <li key={`b-${index}`} className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2 leading-6">
                {description ? (
                  <>
                    <span className="font-semibold text-blue-900">{title.trim()}:</span>{' '}
                    <span>{description}</span>
                  </>
                ) : (
                  <span>{line}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export function AIAdvisorPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations(user?.id));
  const [activeConversationId, setActiveConversationId] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || conversations[0],
    [activeConversationId, conversations]
  );
  const messages = activeConversation?.messages || [WELCOME_MESSAGE];

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!user?.id) {
        const nextConversations = loadConversations();
        setConversations(nextConversations);
        const savedId = localStorage.getItem(getActiveSessionKey());
        setActiveConversationId(savedId && nextConversations.some((item) => item.id === savedId) ? savedId : nextConversations[0].id);
        return;
      }

      try {
        const remoteConversations = (await getAIAdvisorConversations()).map(toClientConversation);
        let nextConversations = remoteConversations;

        if (nextConversations.length === 0) {
          const legacyConversation = loadLegacyConversation(user.id) || loadLegacyConversation();
          const created = await createAIAdvisorConversation({
            title: legacyConversation?.title || 'Cuộc trò chuyện mới',
            messages: legacyConversation?.messages || [WELCOME_MESSAGE],
          });
          nextConversations = [toClientConversation(created)];
        }

        if (cancelled) return;
        setConversations(nextConversations);
        const savedId = localStorage.getItem(getActiveSessionKey(user.id));
        setActiveConversationId(savedId && nextConversations.some((item) => item.id === savedId) ? savedId : nextConversations[0].id);
      } catch (error) {
        console.error('Failed to load AI conversations:', error);
        if (cancelled) return;
        const fallbackConversations = loadConversations(user.id);
        setConversations(fallbackConversations);
        setActiveConversationId(fallbackConversations[0].id);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (conversations.length === 0) return;
    if (!activeConversationId || !conversations.some((conversation) => conversation.id === activeConversationId)) {
      setActiveConversationId(conversations[0].id);
    }
  }, [activeConversationId, conversations]);

  useEffect(() => {
    if (!user?.id) {
      localStorage.setItem(getSessionsKey(), JSON.stringify(conversations.slice(0, MAX_STORED_CONVERSATIONS)));
    }
  }, [conversations, user?.id]);

  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(getActiveSessionKey(user?.id), activeConversationId);
    }
  }, [activeConversationId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const quickQuestions = [
    { icon: TrendingUp, text: 'Sách bán chạy nhất hiện nay', color: 'bg-orange-100 text-orange-600' },
    { icon: Brain, text: 'Sách phát triển bản thân', color: 'bg-purple-100 text-purple-600' },
    { icon: Heart, text: 'Tiểu thuyết lãng mạn', color: 'bg-pink-100 text-pink-600' },
    { icon: Lightbulb, text: 'Sách kinh doanh khởi nghiệp', color: 'bg-blue-100 text-blue-600' },
  ];

  const updateActiveConversation = (nextMessages: Message[]) => {
    const title = getConversationTitle(nextMessages);
    const updatedAt = Date.now();

    setConversations((prev) => {
      const updated = prev.map((conversation) =>
        conversation.id === activeConversationId
          ? {
              ...conversation,
              title,
              updatedAt,
              messages: nextMessages.slice(-MAX_STORED_MESSAGES),
            }
          : conversation
      );

      return updated.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_STORED_CONVERSATIONS);
    });

    if (user?.id && activeConversationId) {
      void updateAIAdvisorConversation(activeConversationId, {
        title,
        messages: nextMessages.slice(-MAX_STORED_MESSAGES),
      }).catch((error) => {
        console.error('Failed to save AI conversation:', error);
      });
    }
  };

  const handleNewConversation = async () => {
    try {
      const nextConversation = user?.id
        ? toClientConversation(
            await createAIAdvisorConversation({
              title: 'Cuộc trò chuyện mới',
              messages: [WELCOME_MESSAGE],
            })
          )
        : createConversation();

      setConversations((prev) => [nextConversation, ...prev].slice(0, MAX_STORED_CONVERSATIONS));
      setActiveConversationId(nextConversation.id);
      setInputValue('');
    } catch (error) {
      console.error('Failed to create AI conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      if (user?.id) {
        await deleteAIAdvisorConversation(conversationId);
      }

      const remaining = conversations.filter((conversation) => conversation.id !== conversationId);
      let next = remaining;

      if (next.length === 0) {
        const replacement = user?.id
          ? toClientConversation(
              await createAIAdvisorConversation({
                title: 'Cuộc trò chuyện mới',
                messages: [WELCOME_MESSAGE],
              })
            )
          : createConversation();
        next = [replacement];
      }

      setConversations(next);
      if (conversationId === activeConversationId) {
        setActiveConversationId(next[0].id);
      }
    } catch (error) {
      console.error('Failed to delete AI conversation:', error);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText || isTyping || !activeConversation) return;

    const currentMessages = activeConversation.messages;
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      text: messageText,
    };
    const nextMessages = [...currentMessages, userMessage];
    const history: AdvisorHistoryMessage[] = currentMessages
      .filter((message) => message.id !== 1)
      .slice(-10)
      .map((message) => ({
        role: message.type === 'user' ? 'user' : 'assistant',
        content: buildAdvisorHistoryContent(message),
      }));
    const excludeBookIds = Array.from(
      new Set(
        currentMessages
          .flatMap((message) => message.books || [])
          .map((book) => book.id)
          .filter(Boolean)
      )
    ).slice(-30);

    updateActiveConversation(nextMessages);
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await getAIAdvisorRecommendations(messageText, 5, history, excludeBookIds);
      updateActiveConversation([
        ...nextMessages,
        {
          id: Date.now() + 1,
          type: 'ai',
          text: result.answer,
          books: result.books.filter((book) => !isBookDeleted(book)),
        },
      ]);
    } catch (error) {
      console.error('AI advisor error:', error);
      updateActiveConversation([
        ...nextMessages,
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
        <div className="mx-auto max-w-7xl px-4 py-10">
          <div className="flex items-center justify-between gap-8">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Bot className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold sm:text-4xl">Tư vấn sách với AI</h1>
              </div>
              <p className="mb-4 max-w-2xl text-lg opacity-90">
                Trợ lý AI giúp bạn tìm cuốn sách phù hợp từ kho sách thật của cửa hàng.
              </p>
              <div className="flex flex-wrap items-center gap-5 text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Gợi ý thông minh</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Dữ liệu sách thật</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Lưu lịch sử trò chuyện</span>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1080"
                alt="AI Assistant"
                className="h-44 w-44 rounded-2xl object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
            <div>
              <h2 className="font-bold text-gray-900">Trò chuyện</h2>
              <p className="text-xs text-gray-500">Lưu trên trình duyệt này</p>
            </div>
            <button
              type="button"
              onClick={handleNewConversation}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
              aria-label="Tạo cuộc trò chuyện mới"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-blue-100 bg-blue-50/70 px-4 py-3 text-xs leading-5 text-blue-900">
            Nếu muốn tìm chủ đề sách hoàn toàn khác, hãy bấm nút <span className="font-semibold">+</span> để tạo cuộc trò chuyện mới. Cuộc trò chuyện hiện tại sẽ tiếp tục ghi nhớ các yêu cầu trước đó.
          </div>

          <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversation?.id;
              return (
                <div
                  key={conversation.id}
                  className={`group flex items-start gap-2 rounded-xl border p-3 transition-colors ${
                    isActive ? 'border-blue-200 bg-blue-50' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveConversationId(conversation.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="line-clamp-2 text-sm font-semibold text-gray-900">{conversation.title}</div>
                    <div className="mt-1 text-xs text-gray-500">{formatConversationTime(conversation.updatedAt)}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(conversation.id)}
                    className="rounded-md p-1 text-gray-400 opacity-100 transition-colors hover:bg-red-50 hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100"
                    aria-label="Xóa cuộc trò chuyện"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-white">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Book Advisor</h2>
                  <p className="text-sm opacity-90">{activeConversation?.title || 'Cuộc trò chuyện mới'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[560px] space-y-4 overflow-y-auto bg-gray-50 p-4 sm:p-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-full gap-3 sm:max-w-[82%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                    }`}
                  >
                    {message.type === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 bg-white text-gray-800'
                      }`}
                    >
                      {message.type === 'ai'
                        ? renderFormattedMessage(message.text, Boolean(message.books?.length))
                        : <p className="whitespace-pre-line">{message.text}</p>}
                    </div>

                    {message.books && message.books.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {message.books.map((book) => (
                          <div
                            key={book.id}
                            className="rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-lg"
                          >
                            <div className="flex flex-col gap-4 sm:flex-row">
                              <img
                                src={getBookImage(book)}
                                alt={book.title}
                                className="h-28 w-20 shrink-0 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <h4 className="mb-1 font-bold text-gray-800">{book.title}</h4>
                                <p className="mb-2 text-sm text-gray-600">{book.author}</p>
                                <div className="mb-2 flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < Math.floor(Number(book.rating) || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                  <span className="ml-1 text-sm text-gray-600">{Number(book.rating) || 0}</span>
                                </div>
                                <p className="mb-3 text-sm italic text-gray-600">{book.reason}</p>
                                {Number(book.stock) <= 0 && (
                                  <div className="mb-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                    Hết hàng
                                  </div>
                                )}
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                  <span className="text-lg font-bold text-blue-600">
                                    {formatCurrency(Number(book.price) || 0)}
                                  </span>
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <button
                                      type="button"
                                      onClick={() => navigate(`/book/${book.id}`)}
                                      className="rounded-lg border border-blue-600 px-3 py-1 text-sm text-blue-600 transition-colors hover:bg-blue-50"
                                    >
                                      Xem chi tiết
                                    </button>
                                    <button
                                      type="button"
                                      disabled={Number(book.stock) <= 0}
                                      onClick={() => {
                                        if (Number(book.stock) <= 0) return;
                                        addToCart({
                                          id: book.id,
                                          title: book.title,
                                          author: book.author,
                                          price: formatCurrency(Number(book.price) || 0),
                                          image: getBookImage(book),
                                        });
                                      }}
                                      className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:hover:bg-gray-300"
                                    >
                                      <ShoppingCart className="h-4 w-4" />
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
                <div className="flex max-w-[80%] gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && (
            <div className="border-t bg-white px-6 py-4">
              <p className="mb-3 text-sm text-gray-600">Câu hỏi gợi ý:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {quickQuestions.map((question) => {
                  const Icon = question.icon;
                  return (
                    <button
                      key={question.text}
                      type="button"
                      onClick={() => handleSendMessage(question.text)}
                      className={`${question.color} flex items-center gap-2 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all hover:shadow-md`}
                    >
                      <Icon className="h-4 w-4" />
                      {question.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || isTyping}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
                <span className="font-medium">Gửi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
