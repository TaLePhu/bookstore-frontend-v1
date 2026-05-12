import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../utils/api';

interface User {
  id: string;
  name: string;
  userName?: string;
  fullName?: string;
  email: string;
  role?: string;
  avatar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<string>;
  checkEmailExists: (email: string) => Promise<boolean>;
  verifyEmail: (email: string, code: string) => Promise<User>;
  resendVerificationCode: (email: string) => Promise<string>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getResponseData = (response: any) => response.data?.data || response.data;

interface RegisterPayload {
  userName: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

const normalizeUser = (data: any): User => {
  const rawUser = data?.user || data;
  const displayName = rawUser?.name || rawUser?.fullName || rawUser?.userName || rawUser?.email || 'User';

  return {
    id: rawUser?.id,
    name: displayName,
    userName: rawUser?.userName || displayName,
    fullName: rawUser?.fullName,
    email: rawUser?.email,
    role: rawUser?.role,
    avatar: rawUser?.avatar,
    phone: rawUser?.phone,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const response = await api.get('/users/me');
          setUser(normalizeUser(getResponseData(response)));
        } catch (error) {
          console.error('Failed to fetch user profile', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.post('auth/login', { email, password });
    const data = getResponseData(response);
    const userData = normalizeUser(data);
    
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.deviceId) localStorage.setItem('deviceId', data.deviceId);
    
    setUser(userData);
    return userData;
  };

  const register = async (payload: RegisterPayload) => {
    const response = await api.post('auth/register', payload);
    return getResponseData(response)?.message || response.data?.message || 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.';
  };

  const checkEmailExists = async (email: string) => {
    const response = await api.get('/auth/check-email', { params: { email } });
    return Boolean(getResponseData(response)?.exists);
  };

  const verifyEmail = async (email: string, code: string) => {
    const response = await api.post('auth/verify-email', { email, code });
    const data = getResponseData(response);
    const userData = normalizeUser(data);

    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    if (data.deviceId) localStorage.setItem('deviceId', data.deviceId);

    setUser(userData);
    return userData;
  };

  const resendVerificationCode = async (email: string) => {
    const response = await api.post('auth/resend-code', { email });
    return getResponseData(response)?.message || response.data?.message || 'Đã gửi lại mã xác thực.';
  };

  const logout = async () => {
    try {
      if (localStorage.getItem('accessToken')) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('deviceId');
      setUser(null);
    }
  };

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        checkEmailExists,
        verifyEmail,
        resendVerificationCode,
        logout,
        updateUser,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
