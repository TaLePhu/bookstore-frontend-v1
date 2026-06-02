import { X } from 'lucide-react';
import type { AdminStaffSummary } from '../../services/admin.service';
import { formatCurrency, formatDate, getOrderStatusText } from './utils';

type StaffDetailModalProps = {
  staff: AdminStaffSummary;
  onClose: () => void;
};

const vi = {
  title: 'Chi ti\u1ebft nh\u00e2n vi\u00ean',
  performance: 'Hi\u1ec7u su\u1ea5t x\u1eed l\u00fd',
  handledOrders: '\u0110\u01a1n \u0111\u00e3 x\u1eed l\u00fd',
  totalActions: 'T\u1ed5ng thao t\u00e1c',
  confirmed: 'X\u00e1c nh\u1eadn',
  packed: '\u0110\u00f3ng g\u00f3i / giao',
  completed: 'Ho\u00e0n th\u00e0nh',
  dailyStats: 'Th\u1ed1ng k\u00ea theo ng\u00e0y',
  recentOrders: '\u0110\u01a1n \u0111\u00e3 x\u1eed l\u00fd g\u1ea7n \u0111\u00e2y',
  activityLog: 'Nh\u1eadt k\u00fd thao t\u00e1c',
  orderCode: 'M\u00e3 \u0111\u01a1n',
  totalAmount: 'T\u1ed5ng ti\u1ec1n',
  status: 'Tr\u1ea1ng th\u00e1i',
  updatedAt: 'C\u1eadp nh\u1eadt',
  action: 'Thao t\u00e1c',
  time: 'Th\u1eddi gian',
  note: 'Ghi ch\u00fa',
  noData: 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u.',
};

export function StaffDetailModal({ staff, onClose }: StaffDetailModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{vi.title}</h3>
            <p className="text-sm text-gray-500">{staff.fullName || staff.userName} - {staff.email}</p>
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
          <div className="grid gap-4 md:grid-cols-5">
            <MetricCard label={vi.handledOrders} value={staff.totals.handledOrders} />
            <MetricCard label={vi.totalActions} value={staff.totals.totalActions} />
            <MetricCard label={vi.confirmed} value={staff.totals.confirmed} tone="orange" />
            <MetricCard label={vi.packed} value={staff.totals.packed} tone="blue" />
            <MetricCard label={vi.completed} value={staff.totals.completed} tone="green" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <section className="overflow-hidden rounded-xl border border-gray-200">
              <SectionHeader title={vi.dailyStats} />
              <div className="divide-y divide-gray-100">
                {staff.dailyStats.slice(0, 14).map((day) => (
                  <div key={day.date} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3 text-sm">
                    <span className="font-semibold text-gray-800">{formatDate(day.date)}</span>
                    <span className="text-gray-500">
                      {day.confirmed}/{day.packed}/{day.completed}
                    </span>
                  </div>
                ))}
                {staff.dailyStats.length === 0 && <EmptyLine />}
              </div>
            </section>

            <section className="overflow-hidden rounded-xl border border-gray-200">
              <SectionHeader title={vi.recentOrders} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px]">
                  <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <tr>
                      <th className="px-5 py-3">{vi.orderCode}</th>
                      <th className="px-5 py-3">{vi.totalAmount}</th>
                      <th className="px-5 py-3">{vi.status}</th>
                      <th className="px-5 py-3">{vi.updatedAt}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {staff.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-5 py-4 font-semibold text-gray-900">{order.orderCode || order.id.slice(0, 8)}</td>
                        <td className="px-5 py-4">{formatCurrency(order.totalAmount)}</td>
                        <td className="px-5 py-4">{getOrderStatusText(order.status)}</td>
                        <td className="px-5 py-4">{formatDate(order.updatedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {staff.recentOrders.length === 0 && <EmptyLine />}
              </div>
            </section>
          </div>

          <section className="overflow-hidden rounded-xl border border-gray-200">
            <SectionHeader title={vi.activityLog} />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-3">{vi.time}</th>
                    <th className="px-5 py-3">{vi.orderCode}</th>
                    <th className="px-5 py-3">{vi.action}</th>
                    <th className="px-5 py-3">{vi.note}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {staff.activityLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-5 py-4 text-gray-600">{formatDate(log.createdAt)}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">{log.orderCode || log.orderId.slice(0, 8)}</td>
                      <td className="px-5 py-4">
                        {getOrderStatusText(log.fromStatus)} {'->'} {getOrderStatusText(log.toStatus)}
                      </td>
                      <td className="px-5 py-4 text-gray-500">{log.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {staff.activityLogs.length === 0 && <EmptyLine />}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <h4 className="font-bold text-gray-900">{title}</h4>
    </div>
  );
}

function EmptyLine() {
  return <div className="p-6 text-center text-sm text-gray-500">{vi.noData}</div>;
}

function MetricCard({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: number;
  tone?: 'gray' | 'orange' | 'blue' | 'green';
}) {
  const tones = {
    gray: 'text-gray-900',
    orange: 'text-orange-600',
    blue: 'text-blue-600',
    green: 'text-emerald-600',
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value.toLocaleString('vi-VN')}</p>
    </div>
  );
}
