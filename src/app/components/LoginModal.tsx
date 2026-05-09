import { useState } from 'react';
import type { HTMLAttributes } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldCheck,
  User as UserIcon,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getErrorMessage = (err: any, fallback: string) => err?.response?.data?.message || fallback;
const isStrongPassword = (value: string) =>
  value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, register, verifyEmail, resendVerificationCode } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isResendingCode, setIsResendingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');

  if (!isOpen) return null;

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetMessages = () => {
    setError('');
    setSuccessMessage('');
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      userName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    });
    setVerificationCode('');
    setShowPassword(false);
  };

  const closeModal = () => {
    resetMessages();
    resetForm();
    setMode('login');
    onClose();
  };

  const switchMode = () => {
    resetMessages();
    setVerificationCode('');
    updateField('password', '');
    updateField('confirmPassword', '');
    setMode(mode === 'login' ? 'register' : 'login');
  };

  const backToLogin = () => {
    resetMessages();
    setVerificationCode('');
    updateField('password', '');
    updateField('confirmPassword', '');
    setMode('login');
  };

  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!form.email || !form.password) {
          setError('Vui lòng điền đầy đủ thông tin');
          return;
        }

        const loggedInUser = await login(form.email.trim(), form.password);
        closeModal();
        if (loggedInUser.role?.toUpperCase() === 'ADMIN') {
          navigate('/admin');
        }
        return;
      }

      if (!form.fullName || !form.userName || !form.email || !form.password || !form.confirmPassword) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      if (form.password !== form.confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }

      if (!isStrongPassword(form.password)) {
        setError('Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường và số');
        return;
      }

      const message = await register({
        userName: form.userName.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      updateField('password', '');
      updateField('confirmPassword', '');
      setMode('verify');
      setSuccessMessage(message);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Đã có lỗi xảy ra. Vui lòng thử lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (verificationCode.trim().length !== 6) {
      setError('Vui lòng nhập mã xác thực gồm 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      const verifiedUser = await verifyEmail(form.email.trim(), verificationCode.trim());
      closeModal();
      if (verifiedUser.role?.toUpperCase() === 'ADMIN') {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Mã xác thực không hợp lệ hoặc đã hết hạn.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    resetMessages();
    setIsResendingCode(true);
    try {
      const message = await resendVerificationCode(form.email.trim());
      setSuccessMessage(message);
    } catch (err: any) {
      setError(getErrorMessage(err, 'Không thể gửi lại mã xác thực. Vui lòng thử lại.'));
    } finally {
      setIsResendingCode(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      if (!form.email) {
        setError('Vui lòng nhập địa chỉ email');
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage('Chúng tôi đã ghi nhận yêu cầu đặt lại mật khẩu.');
    } catch {
      setError('Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const title = mode === 'forgot' ? 'Quên mật khẩu' : mode === 'verify' ? 'Xác thực email' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký';
  const subtitle =
    mode === 'forgot'
      ? 'Nhập email để nhận hướng dẫn đặt lại mật khẩu'
      : mode === 'verify'
      ? `Nhập mã 6 số đã gửi đến ${form.email}`
      : mode === 'login'
      ? 'Chào mừng bạn quay trở lại Trạm Sách!'
      : 'Điền thông tin để tạo tài khoản mới';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal}></div>

      <div className="relative mx-4 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          {(mode === 'forgot' || mode === 'verify') && (
            <button type="button" onClick={backToLogin} className="absolute left-4 top-4 rounded-full p-2 hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <button type="button" onClick={closeModal} className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <h2 className="mb-2 text-2xl font-bold">{title}</h2>
          <p className="text-orange-100">{subtitle}</p>
        </div>

        {mode === 'forgot' ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 p-6">
            <Message error={error} successMessage={successMessage} />
            <TextField label="Email" type="email" icon={Mail} value={form.email} onChange={(value) => updateField('email', value)} placeholder="example@email.com" />
            <SubmitButton loading={isLoading} label="Gửi hướng dẫn" loadingLabel="Đang gửi..." />
          </form>
        ) : mode === 'verify' ? (
          <form onSubmit={handleVerifyEmail} className="space-y-4 p-6">
            <Message error={error} successMessage={successMessage} />
            <TextField
              label="Mã xác thực"
              icon={ShieldCheck}
              value={verificationCode}
              onChange={(value) => setVerificationCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              centered
            />
            <SubmitButton loading={isLoading} label="Xác thực và đăng nhập" loadingLabel="Đang xác thực..." />
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResendingCode}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-orange-300 py-3 font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              {isResendingCode ? 'Đang gửi...' : 'Gửi lại mã xác thực'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginOrRegister} className="space-y-4 p-6">
            <Message error={error} successMessage={successMessage} />

            {mode === 'register' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField label="Họ và tên" icon={UserIcon} value={form.fullName} onChange={(value) => updateField('fullName', value)} placeholder="Nguyễn Văn A" />
                <TextField label="Tên đăng nhập" icon={UserIcon} value={form.userName} onChange={(value) => updateField('userName', value)} placeholder="nguyenvana" />
                <TextField label="Số điện thoại" type="tel" icon={Phone} value={form.phone} onChange={(value) => updateField('phone', value)} placeholder="0901234567" />
              </div>
            )}

            <TextField label="Email" type="email" icon={Mail} value={form.email} onChange={(value) => updateField('email', value)} placeholder="example@email.com" />

            <PasswordField value={form.password} onChange={(value) => updateField('password', value)} showPassword={showPassword} setShowPassword={setShowPassword} />

            {mode === 'register' && (
              <>
                <TextField
                  label="Xác nhận mật khẩu"
                  type="password"
                  icon={Lock}
                  value={form.confirmPassword}
                  onChange={(value) => updateField('confirmPassword', value)}
                  placeholder="Aa123456"
                />
                <p className="text-xs text-gray-500">Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.</p>
              </>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" className="h-4 w-4 rounded text-orange-500" />
                  <span className="text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
                <button type="button" className="text-orange-500 hover:text-orange-600" onClick={() => setMode('forgot')}>
                  Quên mật khẩu?
                </button>
              </div>
            )}

            <SubmitButton loading={isLoading} label={mode === 'login' ? 'Đăng nhập' : 'Đăng ký'} loadingLabel="Đang xử lý..." />

            <div className="mt-6 text-center text-sm text-gray-600">
              {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
              <button type="button" onClick={switchMode} className="font-medium text-orange-500 hover:text-orange-600">
                {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Message({ error, successMessage }: { error: string; successMessage: string }) {
  return (
    <>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
      {successMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </>
  );
}

function TextField({
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  type = 'text',
  inputMode,
  maxLength,
  centered = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  placeholder: string;
  type?: string;
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  centered?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          inputMode={inputMode}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500 ${centered ? 'text-center text-lg font-bold tracking-[0.45em]' : ''}`}
        />
      </div>
    </div>
  );
}

function PasswordField({
  value,
  onChange,
  showPassword,
  setShowPassword,
}: {
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">Mật khẩu</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Aa123456"
          className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}

function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-lg bg-orange-500 py-3 font-medium text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
