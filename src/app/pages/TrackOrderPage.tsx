import { type ComponentType, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import {
  AlertCircle,
  ArrowLeft,
  Box,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Home,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Phone,
  Search,
  Star,
  Truck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getCancelLogMessage,
  getCancelRequestState,
  requestCancelOrder,
  submitOrderReview,
  trackOrderPublic,
  type OrderDto,
} from '../services/account.service';
import { formatCurrency, getBookImage } from '../utils/book-display';

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  PROCESSING: 'Đang xử lý',
  SHIPPED: 'Đang giao hàng',
  COMPLETED: 'Đã giao hàng',
  CANCELLED: 'Đã hủy',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  COD: 'Thanh toán khi nhận hàng (COD)',
  CREDIT_CARD: 'Thẻ tín dụng',
  DEBIT_CARD: 'Thẻ ghi nợ',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
  WALLET: 'Ví điện tử',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  COMPLETED: 'Đã thanh toán',
  FAILED: 'Thanh toán thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const formatOrderCode = (id: string) => `#${id.slice(0, 8).toUpperCase()}`;
const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('vi-VN') : 'Đang cập nhật');
const getStatusLabel = (status?: string) => ORDER_STATUS_LABELS[status || ''] || status || 'Đang cập nhật';
const getDisplayStatusLabel = (order?: OrderDto | null) => {
  const cancelState = getCancelRequestState(order);
  if (cancelState.status === 'pending') return 'Đã gửi yêu cầu hủy';
  if (cancelState.status === 'rejected') return 'Yêu cầu hủy bị từ chối';
  return getStatusLabel(order?.status);
};
const getPaymentMethodLabel = (method?: string) => PAYMENT_METHOD_LABELS[method || ''] || method || 'Đang cập nhật';
const getPaymentStatusLabel = (status?: string) => PAYMENT_STATUS_LABELS[status || ''] || status || 'Đang cập nhật';

const statusToStep = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 0;
    case 'PROCESSING':
      return 2;
    case 'SHIPPED':
      return 3;
    case 'COMPLETED':
      return 4;
    case 'CANCELLED':
      return 1;
    default:
      return 0;
  }
};

export function TrackOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialState = location.state as { orderId?: string; orderCode?: string; action?: 'cancel' | 'review' } | null;

  const [orderCode, setOrderCode] = useState(
    searchParams.get('orderCode') || searchParams.get('code') || initialState?.orderCode || initialState?.orderId || ''
  );
  const [selectedOrder, setSelectedOrder] = useState<OrderDto | null>(null);
  const [searching, setSearching] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [reviewingBookId, setReviewingBookId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [viewingReviewBookId, setViewingReviewBookId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'cancel' | 'review' | null>(initialState?.action || null);

  const address = selectedOrder?.address;
  const payment = selectedOrder?.payments?.[0];
  const displayOrderCode = selectedOrder?.orderCode || (selectedOrder?.id ? formatOrderCode(selectedOrder.id) : '');
  const subtotal = selectedOrder?.items.reduce((sum, item) => sum + Number(item.subTotal || 0), 0) || 0;
  const cancelRequestState = getCancelRequestState(selectedOrder);
  const hasCancelRequest = cancelRequestState.status === 'pending';
  const trackingSteps = useMemo(() => {
    const baseSteps = [
      { id: 0, title: 'Đơn hàng đã đặt', description: 'Đơn hàng đã được tạo thành công', icon: ClipboardCheck, date: selectedOrder?.createdAt },
      { id: 1, title: 'Đã xác nhận', description: 'Đơn hàng đang chờ cửa hàng xác nhận', icon: CheckCircle2, date: selectedOrder?.updatedAt },
      { id: 2, title: 'Đang xử lý', description: 'Sách đang được chuẩn bị và đóng gói', icon: Box, date: selectedOrder?.updatedAt },
      { id: 3, title: 'Đang giao hàng', description: 'Đơn hàng đang trên đường giao đến bạn', icon: Truck, date: selectedOrder?.updatedAt },
      { id: 4, title: 'Giao hàng thành công', description: 'Đơn hàng đã được giao thành công', icon: PackageCheck, date: selectedOrder?.updatedAt },
    ];

    if (cancelRequestState.status === 'pending') {
      return [
        baseSteps[0],
        {
          id: 0.5,
          title: 'Đã gửi yêu cầu hủy',
          description: 'Yêu cầu hủy đang chờ cửa hàng xử lý',
          icon: AlertCircle,
          date: cancelRequestState.requestLog?.createdAt,
        },
        ...baseSteps.slice(1),
      ];
    }

    if (cancelRequestState.status === 'rejected') {
      return [
        baseSteps[0],
        {
          id: 0.5,
          title: 'Đã gửi yêu cầu hủy',
          description: getCancelLogMessage(cancelRequestState.requestLog) || 'Khách đã gửi yêu cầu hủy đơn hàng',
          icon: AlertCircle,
          date: cancelRequestState.requestLog?.createdAt,
        },
        {
          id: 0.75,
          title: 'Yêu cầu hủy bị từ chối',
          description: getCancelLogMessage(cancelRequestState.resolutionLog) || 'Cửa hàng từ chối yêu cầu hủy',
          icon: XCircle,
          date: cancelRequestState.resolutionLog?.createdAt,
        },
        ...baseSteps.slice(1),
      ];
    }

    if (cancelRequestState.status === 'cancelled') {
      return [
        baseSteps[0],
        ...(cancelRequestState.requestLog
          ? [
              {
                id: 0.5,
                title: 'Đã gửi yêu cầu hủy',
                description: getCancelLogMessage(cancelRequestState.requestLog) || 'Khách đã gửi yêu cầu hủy đơn hàng',
                icon: AlertCircle,
                date: cancelRequestState.requestLog.createdAt,
              },
            ]
          : []),
        {
          id: 1,
          title: 'Đã hủy đơn hàng',
          description: getCancelLogMessage(cancelRequestState.resolutionLog) || 'Đơn hàng đã được cửa hàng hủy',
          icon: XCircle,
          date: cancelRequestState.resolutionLog?.createdAt || selectedOrder?.updatedAt,
        },
      ];
    }

    return baseSteps;
  }, [cancelRequestState, selectedOrder?.createdAt, selectedOrder?.updatedAt]);
  const currentStatus =
    cancelRequestState.status === 'pending'
      ? 0.5
      : cancelRequestState.status === 'rejected'
        ? 0.75
        : selectedOrder
          ? statusToStep(selectedOrder.status)
          : 0;
  const currentStepIndex = trackingSteps.reduce((latestIndex, step, index) => (step.id <= currentStatus ? index : latestIndex), 0);
  const canRequestCancel = selectedOrder ? ['PENDING', 'PROCESSING'].includes(selectedOrder.status) && !hasCancelRequest : false;
  const canReviewOrder = selectedOrder?.status === 'COMPLETED';
  const viewingReviewItem = selectedOrder?.items.find((item) => item.bookId === viewingReviewBookId);
  const shippingAddress = address
    ? [address.addressLine, address.wardName, address.districtName, address.provinceName, address.country]
        .filter(Boolean)
        .join(', ')
    : '';

  useEffect(() => {
    if (orderCode) {
      void searchOrder(orderCode, false);
    }
  }, []);

  useEffect(() => {
    if (!selectedOrder || !pendingAction) return;

    if (pendingAction === 'cancel') {
      if (canRequestCancel) {
        openCancelModal();
      } else {
        toast.error('Đơn hàng hiện không đủ điều kiện hủy.');
      }
      setPendingAction(null);
      return;
    }

    if (pendingAction === 'review') {
      const nextReviewItem = selectedOrder.items.find((item) => !item.review);
      if (canReviewOrder && nextReviewItem?.bookId) {
        openReviewModal(nextReviewItem.bookId);
      } else if (canReviewOrder) {
        toast.info('Tất cả sản phẩm trong đơn hàng này đã được đánh giá.');
      } else {
        toast.error('Chỉ có thể đánh giá sau khi đơn hàng hoàn thành.');
      }
      setPendingAction(null);
    }
  }, [selectedOrder, pendingAction, canRequestCancel, canReviewOrder]);

  const searchOrder = async (code: string, showToast = true) => {
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      toast.error('Vui lòng nhập mã đơn hàng');
      return;
    }

    try {
      setSearching(true);
      const detail = await trackOrderPublic(normalizedCode);
      setSelectedOrder(detail);
      setOrderCode(detail.orderCode || normalizedCode);
      if (showToast) toast.success('Đã tìm thấy đơn hàng');
    } catch (error: any) {
      console.error('Track order error:', error);
      setSelectedOrder(null);
      toast.error(error?.response?.data?.message || 'Không tìm thấy đơn hàng phù hợp');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void searchOrder(orderCode);
  };

  const openCancelModal = () => {
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelOrder = async (event: React.FormEvent) => {
    event.preventDefault();
    const reason = cancelReason.trim();
    const code = selectedOrder?.orderCode || orderCode.trim();

    if (!code) {
      toast.error('Không tìm thấy mã đơn hàng để hủy.');
      return;
    }

    if (!reason) {
      toast.error('Vui lòng nhập lý do hủy đơn hàng.');
      return;
    }

    try {
      setIsCancelling(true);
      const updatedOrder = await requestCancelOrder(code, reason);
      setSelectedOrder(updatedOrder);
      setShowCancelModal(false);
      setCancelReason('');
      toast.success('Yêu cầu hủy đơn hàng đã được ghi nhận.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi yêu cầu hủy đơn hàng.');
    } finally {
      setIsCancelling(false);
    }
  };

  const openReviewModal = (bookId: string) => {
    const item = selectedOrder?.items.find((orderItem) => orderItem.bookId === bookId);
    if (item?.review) {
      setViewingReviewBookId(bookId);
      return;
    }

    setReviewingBookId(bookId);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = selectedOrder?.orderCode || orderCode.trim();

    if (!reviewingBookId || !code) {
      toast.error('Không tìm thấy thông tin đánh giá.');
      return;
    }

    try {
      setIsSubmittingReview(true);
      const result = await submitOrderReview({
        orderCode: code,
        bookId: reviewingBookId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      const reviewUpdate = {
        bookId: reviewingBookId,
        rating: result.bookRating.rating,
        totalReviews: result.bookRating.totalReviews,
        review: result.review,
        updatedAt: Date.now(),
      };
      sessionStorage.setItem(`tram-sach-review-updated-${reviewingBookId}`, JSON.stringify(reviewUpdate));
      window.dispatchEvent(new CustomEvent('tram-sach-review-updated', { detail: reviewUpdate }));
      setSelectedOrder((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.bookId === reviewingBookId ? { ...item, review: result.review } : item
              ),
            }
          : current
      );
      setReviewingBookId(null);
      setReviewComment('');
      toast.success('Cảm ơn bạn đã đánh giá sản phẩm.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể gửi đánh giá.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Về trang chủ
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8 text-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                  <Package className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold">Tra cứu đơn hàng</h1>
                <p className="mt-2 text-white/90">Nhập mã đơn hàng để xem trạng thái giao hàng.</p>
              </div>
              <div className="rounded-xl bg-white/15 p-4 text-sm">
                <div className="font-semibold">Bạn có thể tìm mã đơn trong email xác nhận.</div>
                <div className="mt-1 text-white/85">Ví dụ: ORD-090526-ABCD</div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch} className="p-6">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Mã đơn hàng</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(event) => setOrderCode(event.target.value)}
                    placeholder="ORD-..."
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 text-gray-900 outline-none transition-colors focus:border-orange-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={searching}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-60"
              >
                <Search className="h-5 w-5" />
                {searching ? 'Đang tra cứu...' : 'Tra cứu'}
              </button>
            </div>
          </form>
        </div>

        {!selectedOrder ? (
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Truck,
                title: 'Theo dõi giao hàng',
                desc: 'Xem trạng thái đơn hàng chỉ bằng mã đơn.',
                color: 'bg-blue-100 text-blue-600',
              },
              {
                icon: PackageCheck,
                title: 'Thông tin rõ ràng',
                desc: 'Xem sản phẩm, tổng tiền, địa chỉ và phương thức thanh toán.',
                color: 'bg-green-100 text-green-600',
              },
              {
                icon: MessageCircle,
                title: 'Cần hỗ trợ?',
                desc: 'Liên hệ cửa hàng nếu bạn chưa tìm thấy mã đơn trong email.',
                color: 'bg-orange-100 text-orange-600',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-2xl bg-white p-6 text-center shadow-lg">
                  <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${item.color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid gap-8 xl:grid-cols-12">
            <div className="space-y-8 xl:col-span-8">
              <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white shadow-lg">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm opacity-90">Mã đơn hàng</div>
                    <div className="mt-1 text-3xl font-bold">{displayOrderCode}</div>
                    <div className="mt-2 text-sm opacity-90">Ngày đặt: {formatDateTime(selectedOrder.createdAt)}</div>
                  </div>
                  <div className="rounded-xl bg-white/15 p-4 md:text-right">
                    <div className="text-sm opacity-90">Trạng thái</div>
                    <div className="text-xl font-bold">{getDisplayStatusLabel(selectedOrder)}</div>
                    <div className="mt-2 text-sm opacity-90">Tổng tiền</div>
                    <div className="text-xl font-bold">{formatCurrency(Number(selectedOrder.totalAmount))}</div>
                  </div>
                </div>
              </div>

              {cancelRequestState.status !== 'none' && (
                <div
                  className={`rounded-2xl border p-5 shadow-sm ${
                    cancelRequestState.status === 'pending'
                      ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
                      : cancelRequestState.status === 'rejected'
                        ? 'border-orange-200 bg-orange-50 text-orange-800'
                        : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1 text-sm leading-6">
                      <div className="font-bold">
                        {cancelRequestState.status === 'pending'
                          ? 'Yêu cầu hủy đang chờ cửa hàng xử lý'
                          : cancelRequestState.status === 'rejected'
                            ? 'Yêu cầu hủy đã bị từ chối'
                            : 'Đơn hàng đã được hủy'}
                      </div>
                      {cancelRequestState.requestLog && (
                        <div>Lý do khách yêu cầu: {getCancelLogMessage(cancelRequestState.requestLog) || 'Không có ghi chú'}</div>
                      )}
                      {cancelRequestState.resolutionLog && (
                        <div>
                          Phản hồi cửa hàng: {getCancelLogMessage(cancelRequestState.resolutionLog) || getStatusLabel(selectedOrder.status)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">Lộ trình đơn hàng</h2>
                <div className="relative">
                  <div className="absolute bottom-0 left-6 top-0 w-1 bg-gray-200" />
                  <div
                    className="absolute left-6 top-0 w-1 bg-orange-500 transition-all"
                    style={{ height: `${(currentStepIndex / Math.max(trackingSteps.length - 1, 1)) * 100}%` }}
                  />

                  <div className="space-y-7">
                    {trackingSteps.map((step) => {
                      const Icon = step.icon;
                      const isActive = step.id <= currentStatus;
                      const isCurrent = step.id === currentStatus;
                      return (
                        <div key={step.id} className="relative flex gap-5">
                          <div
                            className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-md ${
                              isActive ? 'bg-orange-500 text-white' : 'bg-gray-200 text-white'
                            } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}
                          >
                            <Icon className="h-6 w-6" />
                          </div>
                          <div className="flex-1 pt-1">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                              <h3 className={`text-lg font-bold ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                {step.title}
                              </h3>
                              {isActive && (
                                <div className="text-sm text-gray-500">
                                  {formatDateTime(step.date)}
                                </div>
                              )}
                            </div>
                            <p className={isActive ? 'text-gray-600' : 'text-gray-400'}>{step.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">Sản phẩm ({selectedOrder.items.length})</h2>
                <div className="space-y-4">
                  {selectedOrder.items.map((item) => {
                    const hasReview = Boolean(item.review);

                    return (
                    <div key={item.id} className="flex gap-4 rounded-xl bg-gray-50 p-4">
                      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        {item.book ? (
                          <img src={getBookImage(item.book as any)} alt={item.book.title} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 font-bold text-gray-900">{item.book?.title || item.bookId}</h3>
                        <p className="mt-1 text-sm text-gray-600">{item.book?.author || 'Đang cập nhật tác giả'}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <span className="text-sm text-gray-600">Số lượng: {item.quantity}</span>
                          <div className="text-right">
                            <div className="font-bold text-orange-600">{formatCurrency(Number(item.subTotal || 0))}</div>
                            <div className="text-xs text-gray-500">Đơn giá: {formatCurrency(Number(item.price || 0))}</div>
                          </div>
                        </div>
                        {(canReviewOrder || hasReview) && (
                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            {hasReview ? (
                              <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700 ring-1 ring-green-100">
                                <CheckCircle2 className="h-4 w-4" />
                                Đã đánh giá
                              </span>
                            ) : (
                              <span />
                            )}
                            <button
                              type="button"
                              onClick={() => openReviewModal(item.bookId)}
                              className={`inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold transition-colors ${
                                hasReview
                                  ? 'border-green-300 text-green-700 hover:bg-green-50'
                                  : 'border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                              }`}
                            >
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {hasReview ? 'Xem đánh giá' : 'Đánh giá sách'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-3 border-t pt-6">
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium">{formatCurrency(Number(selectedOrder.shippingFee || 0))}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-3 text-xl font-bold text-gray-900">
                    <span>Tổng cộng</span>
                    <span className="text-orange-600">{formatCurrency(Number(selectedOrder.totalAmount))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 xl:col-span-4">
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                    <Home className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Địa chỉ nhận hàng</h3>
                </div>

                {address ? (
                  <div className="space-y-4">
                    <InfoRow icon={User} label="Người nhận" value={address.receiverName} />
                    <InfoRow icon={Phone} label="Số điện thoại" value={address.phone} />
                    <InfoRow icon={MapPin} label="Địa chỉ" value={shippingAddress} />
                  </div>
                ) : (
                  <div className="flex gap-2 rounded-xl bg-yellow-50 p-4 text-sm text-yellow-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    Đơn hàng chưa có địa chỉ chi tiết.
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Thanh toán</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                    <span className="text-gray-600">Phương thức</span>
                    <span className="font-bold text-gray-900">{getPaymentMethodLabel(payment?.method)}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
                    <span className="text-gray-600">Trạng thái</span>
                    <span className="font-bold text-gray-900">{getPaymentStatusLabel(payment?.status)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Yêu cầu hủy đơn hàng</h3>
                </div>

                {hasCancelRequest ? (
                  <div className="flex gap-2 rounded-xl bg-yellow-50 p-4 text-sm leading-6 text-yellow-700">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-600" />
                    Yêu cầu hủy của bạn đã được gửi và đang chờ cửa hàng xử lý.
                  </div>
                ) : cancelRequestState.status === 'rejected' ? (
                  <>
                    <div className="mb-4 flex gap-2 rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-700">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                      <div>
                        Yêu cầu hủy trước đó đã bị từ chối.
                        {cancelRequestState.resolutionLog && (
                          <div className="mt-1 font-medium">
                            {getCancelLogMessage(cancelRequestState.resolutionLog)}
                          </div>
                        )}
                      </div>
                    </div>
                    {canRequestCancel && (
                      <button
                        type="button"
                        onClick={openCancelModal}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition-colors hover:bg-red-700"
                      >
                        <XCircle className="h-5 w-5" />
                        Gửi lại yêu cầu hủy
                      </button>
                    )}
                  </>
                ) : canRequestCancel ? (
                  <>
                    <p className="mb-4 text-sm leading-6 text-gray-600">
                      Bạn có thể gửi yêu cầu hủy khi đơn hàng còn ở trạng thái chờ xác nhận hoặc đang xử lý.
                    </p>
                    <button
                      type="button"
                      onClick={openCancelModal}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition-colors hover:bg-red-700"
                    >
                      <XCircle className="h-5 w-5" />
                      Yêu cầu hủy đơn
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                    Đơn hàng ở trạng thái {getStatusLabel(selectedOrder.status).toLowerCase()} nên không thể gửi yêu cầu hủy từ trang tra cứu.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showCancelModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCancelOrder} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Yêu cầu hủy đơn hàng</h3>
                <p className="mt-1 text-sm text-gray-600">Đơn hàng {displayOrderCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-700">
                Sau khi gửi yêu cầu, đơn hàng sẽ chuyển sang trạng thái đã hủy nếu còn đủ điều kiện hủy.
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Lý do hủy</label>
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value.slice(0, 500))}
                  rows={4}
                  required
                  placeholder="Nhập lý do bạn muốn hủy đơn hàng..."
                  className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 outline-none transition-colors focus:border-red-500"
                />
                <div className="mt-1 text-right text-xs text-gray-500">{cancelReason.length}/500</div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isCancelling}
                className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isCancelling ? 'Đang gửi...' : 'Gửi yêu cầu hủy'}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewingReviewItem?.review && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Đánh giá đã gửi</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {viewingReviewItem.book?.title || 'Sách đã mua'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingReviewBookId(null)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <div className="mb-2 text-sm font-semibold text-gray-700">Số sao</div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Star
                      key={rating}
                      className={`h-8 w-8 ${
                        rating <= Number(viewingReviewItem.review?.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-gray-700">Nhận xét</div>
                <div className="min-h-28 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700">
                  {viewingReviewItem.review.comment?.trim() || 'Bạn đã đánh giá sao cho sản phẩm này.'}
                </div>
                {viewingReviewItem.review.createdAt && (
                  <div className="mt-2 text-right text-xs text-gray-500">
                    Đã gửi: {formatDateTime(viewingReviewItem.review.createdAt)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setViewingReviewBookId(null)}
                className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewingBookId && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleSubmitReview} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Đánh giá sản phẩm</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {selectedOrder.items.find((item) => item.bookId === reviewingBookId)?.book?.title || 'Sách đã mua'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReviewingBookId(null)}
                disabled={isSubmittingReview}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Số sao</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      className="rounded-lg p-1 transition-transform hover:scale-105"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          rating <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">Nhận xét</label>
                <textarea
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value.slice(0, 1000))}
                  rows={5}
                  placeholder="Chia sẻ cảm nhận của bạn về cuốn sách..."
                  className="w-full resize-none rounded-xl border-2 border-gray-200 px-4 py-3 outline-none transition-colors focus:border-orange-500"
                />
                <div className="mt-1 text-right text-xs text-gray-500">{reviewComment.length}/1000</div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setReviewingBookId(null)}
                disabled={isSubmittingReview}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="rounded-lg bg-orange-500 px-5 py-2.5 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
      <div>
        <div className="mb-1 text-sm text-gray-600">{label}</div>
        <div className="font-medium text-gray-900">{value || 'Đang cập nhật'}</div>
      </div>
    </div>
  );
}
