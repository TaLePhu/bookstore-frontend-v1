import { Search, Bell, ShoppingCart, User, LogOut, ChevronDown } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { LoginModal } from './LoginModal';

interface HeaderProps {
  onCartClick: () => void;
}

export function Header({ onCartClick }: HeaderProps) {
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleAccountClick = () => {
    if (isAuthenticated) {
      navigate('/account');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 border border-dashed border-orange-400 px-6 py-2 rounded-lg min-w-fit hover:bg-orange-50 transition-colors"
          >
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 4C16 4 12 6 12 10V12C12 12 12 16 8 16C8 16 12 16 12 20V22C12 26 16 28 16 28C16 28 20 26 20 22V20C20 16 24 16 24 16C20 16 20 12 20 12V10C20 6 16 4 16 4Z" fill="white"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-orange-500">Trạm Sách</h1>
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Value"
                className="w-full px-4 py-3 pr-12 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-900">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Utility Navigation */}
          <div className="flex items-center gap-8 border border-blue-300 px-6 py-3 rounded-lg">
            <button className="flex flex-col items-center gap-1 text-gray-700 hover:text-orange-500 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="text-xs">Thông báo</span>
            </button>
            <button 
              onClick={() => navigate('/cart')}
              className="flex flex-col items-center gap-1 text-gray-700 hover:text-orange-500 transition-colors relative"
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
            
            {/* Account Button - Updated */}
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-medium">{user?.name}</span>
                    <span className="text-xs text-gray-500">Tài khoản</span>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      onClick={() => {
                        navigate('/account');
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Quản lý tài khoản
                    </button>
                    <div className="border-t border-gray-200"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 text-red-600"
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
                className="flex flex-col items-center gap-1 text-gray-700 hover:text-orange-500 transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="text-xs">Tài khoản</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </header>
  );
}