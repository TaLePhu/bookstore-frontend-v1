const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid email or password': 'Email hoặc mật khẩu không đúng.',
  'Email hoặc mật khẩu không đúng': 'Email hoặc mật khẩu không đúng.',
  'Email must be a valid email address': 'Email không hợp lệ.',
  'Email không hợp lệ': 'Email không hợp lệ.',
  'Password is required': 'Vui lòng nhập mật khẩu.',
  'Vui lòng nhập mật khẩu': 'Vui lòng nhập mật khẩu.',
  Unauthorized: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  'Too many requests from this IP, please try again later.': 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
  'Bạn đã thử quá nhiều lần. Vui lòng thử lại sau.':
    'Bạn đã thử nhiều lần trong thời gian ngắn. Vui lòng đợi một chút rồi thử lại nhé.',
};

export function getAuthErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message || error?.message || '';
  const status = error?.response?.status;

  if (status === 429) {
    return 'Bạn đã thử nhiều lần trong thời gian ngắn. Vui lòng đợi một chút rồi thử lại nhé.';
  }

  return AUTH_ERROR_MESSAGES[message] || message || fallback;
}
