import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { AlertCircle, BookOpen, Lock, Mail, Phone, RefreshCw, ShieldCheck, User, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAuthErrorMessage } from '../utils/auth-error';

const isStrongPassword = (value: string) =>
  value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
type EmailCheckStatus = 'idle' | 'checking' | 'available' | 'taken' | 'error';

export function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    userName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [emailCheckStatus, setEmailCheckStatus] = useState<EmailCheckStatus>('idle');
  const { register, checkEmailExists, verifyEmail, resendVerificationCode } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (step !== 'register') {
      setEmailCheckStatus('idle');
      return;
    }

    const email = form.email.trim();
    if (!email || !isValidEmail(email)) {
      setEmailCheckStatus('idle');
      return;
    }

    let isCurrent = true;
    setEmailCheckStatus('checking');
    const timer = window.setTimeout(async () => {
      try {
        const exists = await checkEmailExists(email);
        if (isCurrent) {
          setEmailCheckStatus(exists ? 'taken' : 'available');
        }
      } catch {
        if (isCurrent) {
          setEmailCheckStatus('idle');
        }
      }
    }, 450);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [checkEmailExists, form.email, step]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (emailCheckStatus === 'taken' || emailCheckStatus === 'checking') {
      setError('Vui lòng dùng email chưa tồn tại trong hệ thống.');
      return;
    }

    if (!isStrongPassword(form.password)) {
      setError('Mật khẩu cần ít nhất 8 ký tự, có chữ hoa, chữ thường và số.');
      return;
    }

    setLoading(true);
    try {
      const message = await register({
        userName: form.userName.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        password: form.password,
      });
      setSuccess(message);
      setStep('verify');
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Đăng ký thất bại. Bạn vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (verificationCode.trim().length !== 6) {
      setError('Vui lòng nhập mã xác thực gồm 6 chữ số.');
      return;
    }

    setLoading(true);
    try {
      const verifiedUser = await verifyEmail(form.email.trim(), verificationCode.trim());
      navigate(verifiedUser.role?.toUpperCase() === 'ADMIN' ? '/admin' : '/');
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Mã xác thực không hợp lệ hoặc đã hết hạn.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setResending(true);
    try {
      const message = await resendVerificationCode(form.email.trim());
      setSuccess(message);
    } catch (err: any) {
      setError(getAuthErrorMessage(err, 'Không thể gửi lại mã xác thực. Vui lòng thử lại.'));
    } finally {
      setResending(false);
    }
  };

  const isRegisterReady =
    Boolean(form.fullName.trim()) &&
    Boolean(form.userName.trim()) &&
    isValidEmail(form.email.trim()) &&
    emailCheckStatus !== 'taken' &&
    emailCheckStatus !== 'checking' &&
    isStrongPassword(form.password) &&
    form.password === form.confirmPassword;
  const isVerifyReady = verificationCode.trim().length === 6;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center text-orange-500">
          <BookOpen className="h-16 w-16" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900">
          {step === 'register' ? 'Đăng ký tài khoản' : 'Xác thực email'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {step === 'register' ? (
            <>
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-orange-600 hover:text-orange-500">
                Đăng nhập tại đây
              </Link>
            </>
          ) : (
            <>
              Mã xác thực đã được gửi đến <span className="font-medium text-gray-900">{form.email}</span>
            </>
          )}
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-lg bg-white px-6 py-8 shadow sm:px-10">
          {error && (
            <div className="mb-6 border-l-4 border-red-400 bg-red-50 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <p className="ml-3 text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {success}
            </div>
          )}

          {step === 'register' ? (
            <form className="space-y-6" onSubmit={handleRegister}>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <TextField
                  id="fullName"
                  label="Họ và tên"
                  icon={User}
                  value={form.fullName}
                  onChange={(value) => updateField('fullName', value)}
                  placeholder="Nguyễn Văn A"
                  required
                />
                <TextField
                  id="userName"
                  label="Tên đăng nhập"
                  icon={User}
                  value={form.userName}
                  onChange={(value) => updateField('userName', value)}
                  placeholder="nguyenvana"
                  required
                />
                <TextField
                  id="email"
                  label="Địa chỉ Email"
                  type="email"
                  icon={Mail}
                  value={form.email}
                  onChange={(value) => updateField('email', value)}
                  placeholder="nguyenvana@example.com"
                  required
                />
                <EmailCheckMessage status={emailCheckStatus} email={form.email} />
                <TextField
                  id="phone"
                  label="Số điện thoại"
                  type="tel"
                  icon={Phone}
                  value={form.phone}
                  onChange={(value) => updateField('phone', value)}
                  placeholder="0901234567"
                />
                <TextField
                  id="password"
                  label="Mật khẩu"
                  type="password"
                  icon={Lock}
                  value={form.password}
                  onChange={(value) => updateField('password', value)}
                  placeholder="Aa123456"
                  required
                />
                <TextField
                  id="confirmPassword"
                  label="Xác nhận mật khẩu"
                  type="password"
                  icon={Lock}
                  value={form.confirmPassword}
                  onChange={(value) => updateField('confirmPassword', value)}
                  placeholder="Aa123456"
                  required
                />
              </div>

              <p className="text-xs text-gray-500">
                Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.
              </p>

              <button
                type="submit"
                disabled={loading || !isRegisterReady}
                className="flex w-full justify-center rounded-md bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Đang gửi mã xác thực...' : 'Đăng ký tài khoản'}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleVerify}>
              <div>
                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                  Mã xác thực
                </label>
                <div className="relative mt-1 rounded-md shadow-sm">
                  <ShieldCheck className="absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
                  <input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full rounded-md border border-gray-300 py-3 pl-10 text-center text-lg font-bold tracking-[0.5em] focus:border-orange-500 focus:ring-orange-500"
                    placeholder="000000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isVerifyReady}
                className="flex w-full justify-center rounded-md bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Đang xác thực...' : 'Xác thực và đăng nhập'}
              </button>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="flex-1 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Sửa thông tin
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md border border-orange-300 px-4 py-3 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  {resending ? 'Đang gửi...' : 'Gửi lại mã'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  icon: Icon,
  placeholder,
  type = 'text',
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1 rounded-md shadow-sm">
        <Icon className="absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 py-3 pl-10 text-sm focus:border-orange-500 focus:ring-orange-500"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
}

function EmailCheckMessage({ status, email }: { status: EmailCheckStatus; email: string }) {
  const className = 'md:col-span-2 -mt-4 text-xs';

  if (!email.trim() || !isValidEmail(email.trim())) {
    return <p className={`${className} text-gray-500`}>Nhập email hợp lệ để kiểm tra trước khi đăng ký.</p>;
  }

  if (status === 'checking') {
    return <p className={`${className} text-gray-500`}>Đang kiểm tra email...</p>;
  }

  if (status === 'available') {
    return <p className={`${className} text-green-600`}>Email này có thể sử dụng.</p>;
  }

  if (status === 'taken') {
    return <p className={`${className} text-red-600`}>Email này đã tồn tại trong hệ thống.</p>;
  }

  if (status === 'error') {
    return null;
  }

  return null;
}
