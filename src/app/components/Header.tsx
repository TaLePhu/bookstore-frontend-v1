import { useEffect, useMemo, useState } from 'react';
import { Search, Bell, ShoppingCart, User, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';
import { smartSearchBooks } from '../services/book.service';
import { getBookImage } from '../utils/book-display';
import { toast } from 'sonner';
import logoUrl from '../../assets/logo.png';

interface SearchResult {
  id: string;
  title: string;
  author: string;
  image: string;
  category?: string;
}

const SEARCH_HISTORY_KEY = 'tram-sach-search-history';
const DEFAULT_SEARCH_SUGGESTIONS = [
  'Sách mới phát hành',
  'Sách bán chạy',
  'Kỹ năng sống',
  'Văn học Việt Nam',
  'Kinh doanh',
  'Sách thiếu nhi',
];

export function Header() {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchMessage, setSearchMessage] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchFallback, setIsSearchFallback] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const role = user?.role?.toUpperCase();
  const canManage = role === 'ADMIN' || role === 'STAFF';

  useEffect(() => {
    try {
      const rawHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsedHistory = rawHistory ? JSON.parse(rawHistory) : [];
      if (Array.isArray(parsedHistory)) {
        setSearchHistory(parsedHistory.filter((item): item is string => typeof item === 'string').slice(0, 8));
      }
    } catch {
      setSearchHistory([]);
    }
  }, []);

  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      if (trimmedQuery.length < 2) {
        setSearchResults([]);
        setSearchMessage('');
        setIsSearchFallback(false);
        setIsSearchLoading(false);
        return;
      }

      try {
        setIsSearchLoading(true);
        const result = await smartSearchBooks(trimmedQuery, 1, 5, controller.signal);
        setSearchMessage(result.message);
        setIsSearchFallback(result.isFallback);
        setSearchResults(
          result.data.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            image: getBookImage(book),
            category: book.category?.name,
          }))
        );
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Header search error:', error);
        setSearchResults([]);
        setSearchMessage('Hệ thống đang gặp trục trặc nhỏ, bạn thử lại sau ít phút nhé.');
        setIsSearchFallback(false);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const saveSearchHistory = (value: string) => {
    const trimmedValue = value.trim();
    if (trimmedValue.length < 2) return;

    const nextHistory = [
      trimmedValue,
      ...searchHistory.filter((item) => item.toLowerCase() !== trimmedValue.toLowerCase()),
    ].slice(0, 8);

    setSearchHistory(nextHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const submitSearch = (value = searchQuery) => {
    const trimmedQuery = value.trim();
    if (trimmedQuery.length < 2) return;

    saveSearchHistory(trimmedQuery);
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    setShowSearchResults(false);
  };

  const removeHistoryItem = (value: string) => {
    const nextHistory = searchHistory.filter((item) => item !== value);
    setSearchHistory(nextHistory);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(nextHistory));
  };

  const keywordSuggestions = useMemo(() => {
    const trimmedQuery = searchQuery.trim().toLowerCase();
    const source = searchQuery.trim().length >= 2
      ? searchResults.flatMap((result) => [result.title, result.author, result.category].filter(Boolean) as string[])
      : [...searchHistory, ...DEFAULT_SEARCH_SUGGESTIONS];

    return Array.from(new Set(source))
      .filter((item) => !trimmedQuery || item.toLowerCase().includes(trimmedQuery))
      .slice(0, 8);
  }, [searchHistory, searchQuery, searchResults]);

  const handleAccountClick = () => {
    if (isAuthenticated) {
      navigate('/account');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
    toast.success('Đăng xuất thành công. Hẹn gặp lại bạn!');
    navigate('/', { replace: true });
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-6">
          <button
            onClick={() => navigate('/')}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-4 py-2.5 transition-colors hover:bg-orange-50 sm:px-6 lg:w-auto lg:flex-none"
          >
            {/* <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-orange-500 sm:h-12 sm:w-12">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4C16 4 12 6 12 10V12C12 12 12 16 8 16C8 16 12 16 12 20V22C12 26 16 28 16 28C16 28 20 26 20 22V20C20 16 24 16 24 16C20 16 20 12 20 12V10C20 6 16 4 16 4Z" fill="white"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-orange-500">Trạm Sách</h1> */}
            <img src={logoUrl} alt="Trạm Sách" className="h-10 w-auto sm:h-12" />
          </button>

          <div className="order-3 w-full basis-full lg:order-none lg:basis-auto lg:flex-1 lg:max-w-2xl">
            <form
              className="relative"
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Tìm sách, tác giả, thể loại hoặc nhu cầu đọc..."
                className="w-full rounded-xl border border-blue-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-base"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                aria-label="Tìm kiếm"
              >
                <Search className="w-5 h-5" />
              </button>

              {showSearchResults && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-lg">
                  {searchQuery.trim().length < 2 ? (
                    <div className="p-3">
                      {searchHistory.length > 0 && (
                        <div className="mb-3">
                          <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Lịch sử tìm kiếm</div>
                          <div className="space-y-1">
                            {searchHistory.slice(0, 5).map((item) => (
                              <div key={item} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => submitSearch(item)}
                                  className="min-w-0 flex-1 rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-orange-50"
                                >
                                  <span className="block truncate">{item}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeHistoryItem(item)}
                                  className="rounded-lg px-2 py-2 text-xs font-semibold text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                                  aria-label={`Xóa lịch sử ${item}`}
                                >
                                  Xóa
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Gợi ý từ khóa</div>
                        <div className="flex flex-wrap gap-2">
                          {DEFAULT_SEARCH_SUGGESTIONS.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onClick={() => submitSearch(item)}
                              className="rounded-full bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 hover:bg-orange-100"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {searchMessage && (
                    <div className="border-b border-gray-100 px-4 py-3 text-sm text-blue-700">
                      {searchMessage}
                      {isSearchFallback && <div className="mt-1 text-xs text-gray-500">Đây là gợi ý tham khảo, không phải kết quả khớp chính xác.</div>}
                    </div>
                      )}
                      {isSearchLoading ? (
                        <div className="p-4 text-sm text-gray-500">Đang tìm sách phù hợp...</div>
                      ) : (
                        <div className="max-h-96 overflow-y-auto p-2">
                          {keywordSuggestions.length > 0 && (
                            <div className="border-b border-gray-100 pb-2">
                              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Từ khóa phù hợp</div>
                              {keywordSuggestions.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => submitSearch(item)}
                                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-gray-800 hover:bg-orange-50"
                                >
                                  <Search className="h-4 w-4 shrink-0 text-gray-400" />
                                  <span className="truncate">{item}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {searchResults.length > 0 ? (
                            <div className="pt-2">
                              <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Sách liên quan</div>
                              {searchResults.map((result) => (
                                <button
                                  key={result.id}
                                  type="button"
                                  onClick={() => {
                                    saveSearchHistory(searchQuery);
                                    navigate(`/book/${result.id}`);
                                    setShowSearchResults(false);
                                    setSearchQuery('');
                                  }}
                                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-orange-50"
                                >
                                  <img src={result.image} alt={result.title} className="h-12 w-10 rounded object-cover" />
                                  <div className="min-w-0">
                                    <div className="truncate font-medium text-gray-900">{result.title}</div>
                                    <div className="truncate text-sm text-gray-600">{result.author}</div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-sm text-gray-500">Chưa tìm thấy kết quả phù hợp.</div>
                          )}

                          <button
                            type="button"
                            onClick={() => submitSearch()}
                            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-orange-600 hover:bg-orange-50"
                          >
                            Xem tất cả kết quả cho "{searchQuery.trim()}"
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </form>
          </div>
          <div className={`grid w-auto shrink-0 ${canManage ? 'grid-cols-4' : 'grid-cols-3'} gap-1 rounded-2xl border border-blue-100 bg-white p-1.5 shadow-sm sm:gap-2 sm:p-2 lg:flex lg:w-auto lg:flex-nowrap lg:items-center lg:justify-end lg:gap-3 lg:px-3 lg:py-2`}>
            {canManage && (
              <button
                onClick={() => navigate('/admin')}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-3 text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-500 lg:min-h-14"
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-xs">Quản lý</span>
              </button>
            )}
            <button className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-3 text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-500 lg:min-h-14">
              <Bell className="w-5 h-5" />
              <span className="text-xs">Thông báo</span>
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-3 text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-500 lg:min-h-14"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </div>
              <span className="text-xs">Giỏ hàng</span>
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex min-h-12 w-full flex-col items-center justify-center gap-1 rounded-xl px-3 text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-500 lg:min-h-14 lg:min-w-40 lg:flex-row lg:justify-start lg:gap-3"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user?.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden flex-col items-start lg:flex">
                    <span className="max-w-24 truncate text-sm font-semibold text-gray-800">{user?.name}</span>
                    <span className="text-xs text-gray-500">Tài khoản</span>
                  </div>
                  <ChevronDown className={`hidden w-4 h-4 text-gray-400 transition-transform lg:block ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl">
                    <button
                      onClick={() => {
                        navigate('/account');
                        setShowUserMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-600"
                    >
                      <User className="w-4 h-4" />
                      Quản lý tài khoản
                    </button>
                    <div className="my-2 border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-semibold text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleAccountClick}
                className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-3 text-gray-700 transition-colors hover:bg-orange-50 hover:text-orange-500 lg:min-h-14"
              >
                <User className="w-5 h-5" />
                <span className="text-xs">Tài khoản</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
}
