import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import authApi from '../utils/api';

type MomoPaymentStatus = {
  id: string;
  amount: string | number;
  method: string;
  status: string;
  paymentUrl?: string | null;
  qrCodeUrl?: string | null;
  deeplink?: string | null;
  paidAt?: string | null;
  orderCode?: string | null;
};

const formatMoney = (value?: string | number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export function MomoDemoPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get('orderCode') || '';
  const [payment, setPayment] = useState<MomoPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(8);
  const completedRef = useRef(false);

  const qrImageUrl = useMemo(() => {
    if (!payment?.qrCodeUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(payment.qrCodeUrl)}`;
  }, [payment?.qrCodeUrl]);

  useEffect(() => {
    const loadPayment = async () => {
      if (!orderCode) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.get('/payments/momo/status', { params: { orderCode } });
        const data = res.data?.data || null;
        setPayment(data);

        if (data?.status === 'COMPLETED') {
          completedRef.current = true;
          navigate(`/track-order?orderCode=${encodeURIComponent(orderCode)}`, { replace: true });
        }
      } catch (error: any) {
        console.error('Load MoMo payment error:', error);
        toast.error(error?.response?.data?.message || 'Không tải được thông tin thanh toán');
      } finally {
        setLoading(false);
      }
    };

    loadPayment();
  }, [navigate, orderCode]);

  useEffect(() => {
    if (loading || !payment || payment.status === 'COMPLETED' || completedRef.current) return;

    const countdown = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0));
    }, 1000);

    const complete = window.setTimeout(async () => {
      if (completedRef.current) return;
      completedRef.current = true;

      try {
        setProcessing(true);
        const res = await authApi.post('/payments/momo/demo-complete', { orderCode });
        setPayment(res.data?.data || payment);
        toast.success('Thanh toán thành công');
        window.setTimeout(() => {
          navigate(`/track-order?orderCode=${encodeURIComponent(orderCode)}`, { replace: true });
        }, 1200);
      } catch (error: any) {
        completedRef.current = false;
        console.error('Complete MoMo payment error:', error);
        toast.error(error?.response?.data?.message || 'Không thể xác nhận thanh toán');
      } finally {
        setProcessing(false);
      }
    }, 8000);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(complete);
    };
  }, [loading, navigate, orderCode, payment]);

  if (!orderCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-lg">
          <h1 className="text-xl font-bold text-gray-900">Không tìm thấy mã đơn hàng</h1>
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="mt-5 rounded-lg bg-pink-600 px-5 py-3 font-semibold text-white hover:bg-pink-700"
          >
            Quay lại checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
          <div className="flex items-center gap-2 font-bold text-pink-700">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-600 text-white">M</div>
            MoMo
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Thanh toán bằng MoMo</h1>
              <p className="mt-1 text-sm text-gray-500">Quét mã QR để thanh toán đơn hàng</p>
            </div>
            <div className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
              {processing ? 'Đang xác nhận' : `Còn ${secondsLeft}s`}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-[300px_1fr]">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 text-center">
              {loading ? (
                <div className="flex h-[260px] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
                </div>
              ) : qrImageUrl ? (
                <img src={qrImageUrl} alt="MoMo QR" className="mx-auto h-[260px] w-[260px] rounded-lg bg-white p-3" />
              ) : (
                <div className="flex h-[260px] items-center justify-center rounded-lg bg-white text-gray-500">
                  <QrCode className="h-10 w-10" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-sm text-gray-500">Mã đơn hàng</div>
                <div className="mt-1 text-lg font-bold text-gray-900">{payment?.orderCode || orderCode}</div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="text-sm text-gray-500">Số tiền thanh toán</div>
                <div className="mt-1 text-3xl font-bold text-pink-700">{formatMoney(payment?.amount)}</div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Clock3 className="h-4 w-4" />
                  Trạng thái giao dịch
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  {processing ? <Loader2 className="h-5 w-5 animate-spin text-pink-600" /> : <QrCode className="h-5 w-5 text-pink-600" />}
                  {processing ? 'Đang xác nhận thanh toán...' : 'Đang chờ thanh toán'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="rounded-xl bg-white p-6 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-pink-50">
            <ShieldCheck className="h-6 w-6 text-pink-700" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Xác nhận an toàn</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Sau khi giao dịch được xác nhận, hệ thống sẽ tự động chuyển về trang tra cứu đơn hàng.
          </p>
          <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
            Môi trường mô phỏng phục vụ trình diễn dự án. Không phát sinh giao dịch thật.
          </div>
          {payment?.status === 'COMPLETED' && (
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-green-50 p-3 font-semibold text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Thanh toán thành công
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
