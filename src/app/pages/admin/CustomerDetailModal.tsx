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

const vi = {
  detailTitle: 'Chi ti\u1ebft kh\u00e1ch h\u00e0ng',
  loyal: 'Th\u00e2n thi\u1ebft',
  newCustomer: 'M\u1edbi',
  phone: 'S\u1ed1 \u0111i\u1ec7n tho\u1ea1i',
  none: 'Ch\u01b0a c\u00f3',
  verified: 'X\u00e1c th\u1ef1c',
  verifiedYes: '\u0110\u00e3 x\u00e1c th\u1ef1c',
  verifiedNo: 'Ch\u01b0a x\u00e1c th\u1ef1c',
  status: 'Tr\u1ea1ng th\u00e1i',
  locked: '\u0110\u00e3 kh\u00f3a',
  active: 'Ho\u1ea1t \u0111\u1ed9ng',
  joined: 'Ng\u00e0y tham gia',
  lastOrder: '\u0110\u01a1n g\u1ea7n nh\u1ea5t',
  totalSpent: 'T\u1ed5ng chi ti\u00eau',
  orderCount: 'S\u1ed1 \u0111\u01a1n h\u00e0ng',
  tier: 'H\u1ea1ng kh\u00e1ch',
  noteTitle: 'Ghi ch\u00fa n\u1ed9i b\u1ed9',
  noteHelp: 'Ch\u1ec9 admin nh\u00ecn th\u1ea5y ghi ch\u00fa n\u00e0y.',
  saving: '\u0110ang l\u01b0u...',
  saveNote: 'L\u01b0u ghi ch\u00fa',
  notePlaceholder: 'V\u00ed d\u1ee5: kh\u00e1ch VIP, \u01b0u ti\u00ean g\u1ecdi x\u00e1c nh\u1eadn tr\u01b0\u1edbc khi giao...',
  orderHistory: 'L\u1ecbch s\u1eed \u0111\u01a1n h\u00e0ng',
  orderHistoryHelp: 'Hi\u1ec3n th\u1ecb t\u1ed1i \u0111a 8 \u0111\u01a1n g\u1ea7n nh\u1ea5t.',
  orderCode: 'M\u00e3 \u0111\u01a1n',
  orderDate: 'Ng\u00e0y \u0111\u1eb7t',
  totalAmount: 'T\u1ed5ng ti\u1ec1n',
  payment: 'Thanh to\u00e1n',
  noOrders: 'Kh\u00e1ch h\u00e0ng ch\u01b0a c\u00f3 \u0111\u01a1n h\u00e0ng.',
};

const getCustomerTier = (totalSpent: number) => {
  if (totalSpent >= 5_000_000) {
    return { label: 'VIP', className: 'bg-purple-50 text-purple-700 ring-purple-100' };
  }
  if (totalSpent >= 1_000_000) {
    return { label: vi.loyal, className: 'bg-orange-50 text-orange-700 ring-orange-100' };
  }
  return { label: vi.newCustomer, className: 'bg-gray-50 text-gray-700 ring-gray-100' };
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
            <h3 className="text-xl font-bold text-gray-900">{vi.detailTitle}</h3>
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
                    <InfoLine label={vi.phone} value={customer.phone || vi.none} />
                    <InfoLine label={vi.verified} value={customer.isVerified ? vi.verifiedYes : vi.verifiedNo} />
                    <InfoLine label={vi.status} value={customer.isLocked ? vi.locked : vi.active} />
                    <InfoLine label={vi.joined} value={formatDate(customer.createdAt)} />
                    <InfoLine label={vi.lastOrder} value={customer.lastOrderAt ? formatDate(customer.lastOrderAt) : vi.none} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <SummaryCard label={vi.totalSpent} value={formatCurrency(totalSpent)} />
              <SummaryCard label={vi.orderCount} value={customer.totalOrders.toLocaleString('vi-VN')} />
              <SummaryCard label={vi.tier} value={tier.label} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-gray-900">{vi.noteTitle}</h4>
                <p className="text-sm text-gray-500">{vi.noteHelp}</p>
              </div>
              <button
                type="button"
                onClick={onSaveNote}
                disabled={savingNote}
                className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingNote ? vi.saving : vi.saveNote}
              </button>
            </div>
            <textarea
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value.slice(0, 1000))}
              rows={4}
              placeholder={vi.notePlaceholder}
              className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <p className="mt-2 text-right text-xs text-gray-400">{noteDraft.length}/1000</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="border-b border-gray-100 px-5 py-4">
              <h4 className="font-bold text-gray-900">{vi.orderHistory}</h4>
              <p className="text-sm text-gray-500">{vi.orderHistoryHelp}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-5 py-3">{vi.orderCode}</th>
                    <th className="px-5 py-3">{vi.orderDate}</th>
                    <th className="px-5 py-3">{vi.totalAmount}</th>
                    <th className="px-5 py-3">{vi.payment}</th>
                    <th className="px-5 py-3">{vi.status}</th>
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
              <div className="p-6 text-center text-sm text-gray-500">{vi.noOrders}</div>
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
