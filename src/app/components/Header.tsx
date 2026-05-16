import { useEffect, useState } from 'react';
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
}

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
  const role = user?.role?.toUpperCase();
  const canManage = role === 'ADMIN' || role === 'STAFF';

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearchMessage('');
        return;
      }

      try {
        const result = await smartSearchBooks(searchQuery, 1, 5);
        setSearchMessage(result.message);
        setSearchResults(
          result.data.map((book) => ({
            id: book.id,
            title: book.title,
            author: book.author,
            image: getBookImage(book),
          }))
        );
      } catch (error) {
        console.error('Header search error:', error);
        setSearchResults([]);
        setSearchMessage('He thong dang gap truc trac nho, ban thu lai sau it phut nhe.');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Tìm sách, tác giả, thể loại..."
                className="w-full rounded-xl border border-blue-200 px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 sm:text-base"
              />
              <button
                onClick={() => {
                  if (searchResults[0]) {
                    navigate(`/book/${searchResults[0].id}`);
                    setShowSearchResults(false);
                    setSearchQuery('');
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900"
              >
                <Search className="w-5 h-5" />
              </button>

              {showSearchResults && searchQuery.trim() && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border bg-white shadow-lg">
                  {searchMessage && (
                    <div className="border-b border-gray-100 px-4 py-3 text-sm text-blue-700">{searchMessage}</div>
                  )}
                  {searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto p-2">
                      {searchResults.map((result) => (
                        <button
                          key={result.id}
                          onClick={() => {
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
                    <div className="p-4 text-sm text-gray-500">Không tìm thấy kết quả phù hợp.</div>
                  )}
                </div>
              )}
            </div>
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
