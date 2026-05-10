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
import { requestCancelOrder, submitOrderReview, trackOrderPublic, type OrderDto } from '../services/account.service';
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
  const [reviewedBookIds, setReviewedBookIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<'cancel' | 'review' | null>(initialState?.action || null);

  const trackingSteps = useMemo(
    () => [
      { id: 0, title: 'Đơn hàng đã đặt', description: 'Đơn hàng đã được tạo thành công', icon: ClipboardCheck },
      { id: 1, title: 'Đã xác nhận', description: 'Đơn hàng đang chờ cửa hàng xác nhận', icon: CheckCircle2 },
      { id: 2, title: 'Đang xử lý', description: 'Sách đang được chuẩn bị và đóng gói', icon: Box },
      { id: 3, title: 'Đang giao hàng', description: 'Đơn hàng đang trên đường giao đến bạn', icon: Truck },
      { id: 4, title: 'Giao hàng thành công', description: 'Đơn hàng đã được giao thành công', icon: PackageCheck },
    ],
    []
  );

  const currentStatus = selectedOrder ? statusToStep(selectedOrder.status) : 0;
  const address = selectedOrder?.address;
  const payment = selectedOrder?.payments?.[0];
  const displayOrderCode = selectedOrder?.orderCode || (selectedOrder?.id ? formatOrderCode(selectedOrder.id) : '');
  const subtotal = selectedOrder?.items.reduce((sum, item) => sum + Number(item.subTotal || 0), 0) || 0;
  const hasCancelRequest = Boolean(
    selectedOrder?.statusLogs?.some((log) => log.note?.startsWith('Khách yêu cầu hủy:') && log.fromStatus === log.toStatus)
  );
  const canRequestCancel = selectedOrder ? ['PENDING', 'PROCESSING'].includes(selectedOrder.status) && !hasCancelRequest : false;
  const canReviewOrder = selectedOrder?.status === 'COMPLETED';
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
      if (canReviewOrder && selectedOrder.items[0]?.bookId) {
        openReviewModal(selectedOrder.items[0].bookId);
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
      await submitOrderReview({
        orderCode: code,
        bookId: reviewingBookId,
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });
      setReviewedBookIds((prev) => Array.from(new Set([...prev, reviewingBookId])));
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
                    <div className="text-xl font-bold">{getStatusLabel(selectedOrder.status)}</div>
                    <div className="mt-2 text-sm opacity-90">Tổng tiền</div>
                    <div className="text-xl font-bold">{formatCurrency(Number(selectedOrder.totalAmount))}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h2 className="mb-6 text-2xl font-bold text-gray-900">Lộ trình đơn hàng</h2>
                <div className="relative">
                  <div className="absolute bottom-0 left-6 top-0 w-1 bg-gray-200" />
                  <div
                    className="absolute left-6 top-0 w-1 bg-orange-500 transition-all"
                    style={{ height: `${(currentStatus / (trackingSteps.length - 1)) * 100}%` }}
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
                                  {formatDateTime(step.id === 0 ? selectedOrder.createdAt : selectedOrder.updatedAt)}
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
                  {selectedOrder.items.map((item) => (
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
                        {canReviewOrder && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={() => openReviewModal(item.bookId)}
                              className="inline-flex items-center gap-2 rounded-lg border border-yellow-300 bg-white px-3 py-2 text-sm font-semibold text-yellow-700 transition-colors hover:bg-yellow-50"
                            >
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              {reviewedBookIds.includes(item.bookId) ? 'Cập nhật đánh giá' : 'Đánh giá sách'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
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
