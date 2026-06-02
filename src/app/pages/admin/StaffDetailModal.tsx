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
  dailyStatsHelp: 'X\u00e1c nh\u1eadn / \u0111\u00f3ng g\u00f3i / ho\u00e0n th\u00e0nh',
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
              <SectionHeader title={vi.dailyStats} subtitle={vi.dailyStatsHelp} />
              <div className="space-y-3 p-4">
                {staff.dailyStats.slice(0, 14).map((day) => (
                  <DailyStatsCard key={day.date} day={day} />
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

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-gray-100 px-5 py-4">
      <h4 className="font-bold text-gray-900">{title}</h4>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function DailyStatsCard({
  day,
}: {
  day: AdminStaffSummary['dailyStats'][number];
}) {
  const total = day.confirmed + day.packed + day.completed;
  const getWidth = (value: number) => (total > 0 ? `${Math.max(8, (value / total) * 100)}%` : '0%');

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-gray-900">{formatDate(day.date)}</p>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
          {total.toLocaleString('vi-VN')} thao t\u00e1c
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        <StatsRow label={vi.confirmed} value={day.confirmed} colorClass="bg-orange-500" width={getWidth(day.confirmed)} />
        <StatsRow label={vi.packed} value={day.packed} colorClass="bg-blue-500" width={getWidth(day.packed)} />
        <StatsRow label={vi.completed} value={day.completed} colorClass="bg-emerald-500" width={getWidth(day.completed)} />
      </div>
    </div>
  );
}

function StatsRow({
  label,
  value,
  colorClass,
  width,
}: {
  label: string;
  value: number;
  colorClass: string;
  width: string;
}) {
  return (
    <div className="grid grid-cols-[92px_1fr_32px] items-center gap-2 text-xs">
      <span className="font-medium text-gray-600">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-white">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width }} />
      </div>
      <span className="text-right font-semibold text-gray-800">{value.toLocaleString('vi-VN')}</span>
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
