import { Save, X } from 'lucide-react';
import type { AdminCustomerSummary } from '../../services/admin.service';
import { formatCurrency, formatDate, getOrderStatusText, getPaymentMethodText } from './utils';

type CustomerDetailModalProps = {
  customer: AdminCustomerSummary;
  noteDraft: string;
  setNoteDraft: (value: string) => void;
  savingNote: boolean;
  onSaveNote: () => void | Promise<void>;
  onClose: () => void;
};

const getCustomerTier = (totalSpent: number) => {
  if (totalSpent >= 5_000_000) {
    return { label: 'VIP', className: 'bg-purple-50 text-purple-700 ring-purple-100' };
  }
  if (totalSpent >= 1_000_000) {
    return { label: 'Thân thiết', className: 'bg-orange-50 text-orange-700 ring-orange-100' };
  }
  return { label: 'Mới', className: 'bg-gray-50 text-gray-700 ring-gray-100' };
};

export function CustomerDetailModal({
  customer,
  noteDraft,
  setNoteDraft,
  savingNote,
  onSaveNote,
  onClose,
}: CustomerDetailModalProps) {
  const totalSpent = Number(customer.totalSpent || 0);
  const tier = getCustomerTier(totalSpent);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Chi tiết khách hàng</h3>
            <p className="text-sm text-gray-500">{customer.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="flex items-start gap-4">
                <img
                  src={customer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.fullName || customer.userName)}&background=F97316&color=fff`}
                  alt={customer.fullName || customer.userName}
                  className="h-16 w-16 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-bold text-gray-900">{customer.fullName || customer.userName}</h4>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${tier.className}`}>
                      {tier.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">@{customer.userName}</p>
                  <div className="mt-4 grid gap-3 text-sm text-gray-600 md:grid-cols-2">
                    <InfoLine label="Email" value={customer.email} />
                    <InfoLine label="Số điện thoại" value={customer.phone || 'Chưa có'} />
                    <InfoLine label="Xác thực" value={customer.isVerified ? 'Đã xác thực' : 'Chưa xác thực'} />
                    <InfoLine label="Trạng thái" value={customer.isLocked ? 'Đã khóa' : 'Hoạt động'} />
                    <InfoLine label="Ngày tham gia" value={formatDate(customer.createdAt)} />
                    <InfoLine label="Đơn gần nhất" value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : 'Chưa có'} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <SummaryCard label="Tổng chi tiêu" value={formatCurrency(totalSpent)} />
              <SummaryCard label="Số đơn hàng" value={customer.totalOrders.toLocaleString('vi-VN')} />
              <SummaryCard label="Hạng khách" value={tier.label} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-900">Ghi chú nội bộ</h4>
                <p className="text-sm text-gray-500">Chỉ admin nhìn thấy ghi chú này.</p>
              </div>
              <button
                type="button"
                onClick={onSaveNote}
                disabled={savingNote}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingNote ? 'Đang lưu...' : 'Lưu ghi chú'}
              </button>
            </div>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value.slice(0, 1000))}
              rows={4}
              placeholder="Ví dụ: khách VIP, ưu tiên gọi xác nhận trước khi giao..."
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <p className="mt-2 text-right text-xs text-gray-400">{noteDraft.length}/1000</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="border-b border-gray-100 px-5 py-4">
              <h4 className="font-bold text-gray-900">Lịch sử đơn hàng</h4>
              <p className="text-sm text-gray-500">Hiển thị tối đa 8 đơn gần nhất.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-5 py-3">Mã đơn</th>
                    <th className="px-5 py-3">Ngày đặt</th>
                    <th className="px-5 py-3">Tổng tiền</th>
                    <th className="px-5 py-3">Thanh toán</th>
                    <th className="px-5 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customer.recentOrders.map((order) => (
                    <tr key={order.id} className="text-sm text-gray-700">
                      <td className="px-5 py-4 font-semibold text-gray-900">{order.orderCode || order.id.slice(0, 8)}</td>
                      <td className="px-5 py-4">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-4">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-5 py-4">{getPaymentMethodText(order.paymentMethod || undefined)}</td>
                      <td className="px-5 py-4">{getOrderStatusText(order.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customer.recentOrders.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">Khách hàng chưa có đơn hàng.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 font-medium text-gray-800">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
