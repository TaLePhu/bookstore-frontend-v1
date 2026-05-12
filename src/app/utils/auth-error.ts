const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'Invalid email or password': 'Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
  'Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang': 'Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang.',
  'Email must be a valid email address': 'Email kh\u00f4ng h\u1ee3p l\u1ec7.',
  'Email kh\u00f4ng h\u1ee3p l\u1ec7': 'Email kh\u00f4ng h\u1ee3p l\u1ec7.',
  'Password is required': 'Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u.',
  'Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u': 'Vui l\u00f2ng nh\u1eadp m\u1eadt kh\u1ea9u.',
  Unauthorized: 'Phi\u00ean \u0111\u0103ng nh\u1eadp kh\u00f4ng h\u1ee3p l\u1ec7. Vui l\u00f2ng \u0111\u0103ng nh\u1eadp l\u1ea1i.',
  'Too many requests from this IP, please try again later.': 'B\u1ea1n thao t\u00e1c qu\u00e1 nhanh. Vui l\u00f2ng th\u1eed l\u1ea1i sau.',
};

export function getAuthErrorMessage(error: any, fallback: string): string {
  const message = error?.response?.data?.message || error?.message || '';
  return AUTH_ERROR_MESSAGES[message] || message || fallback;
}
