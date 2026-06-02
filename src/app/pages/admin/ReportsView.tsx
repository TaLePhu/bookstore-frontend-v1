import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import type { ApiBook } from '../../services/book.service';
import type { AdminOrder, AdminUser } from '../../services/admin.service';
import { formatCurrency, formatDate, getOrderStatusText, getPaymentMethodText } from './utils';

type ReportsViewProps = {
  orders: AdminOrder[];
  books: ApiBook[];
  customers: AdminUser[];
};

const vi = {
  title: 'B\u00e1o c\u00e1o',
  helper: 'Theo d\u00f5i doanh thu, \u0111\u01a1n h\u00e0ng, t\u1ed3n kho v\u00e0 kh\u00e1ch h\u00e0ng theo kho\u1ea3ng ng\u00e0y.',
  from: 'T\u1eeb ng\u00e0y',
  to: '\u0110\u1ebfn ng\u00e0y',
  exportCsv: 'Export CSV',
  revenue: 'Doanh thu',
  orders: 'S\u1ed1 \u0111\u01a1n',
  cancelRate: 'T\u1ef7 l\u1ec7 h\u1ee7y',
  averageOrder: 'Gi\u00e1 tr\u1ecb TB',
  compare: 'So v\u1edbi k\u1ef3 tr\u01b0\u1edbc',
  revenueByDay: 'Doanh thu theo ng\u00e0y',
  revenueByMonth: 'Doanh thu theo th\u00e1ng',
  orderStatus: 'S\u1ed1 \u0111\u01a1n theo tr\u1ea1ng th\u00e1i',
  topBooks: 'S\u00e1ch b\u00e1n ch\u1ea1y',
  lowStock: 'S\u00e1ch t\u1ed3n kho th\u1ea5p',
  topCustomers: 'Kh\u00e1ch h\u00e0ng mua nhi\u1ec1u',
  paymentRevenue: 'Doanh thu theo thanh to\u00e1n',
  noData: 'Ch\u01b0a c\u00f3 d\u1eef li\u1ec7u.',
};

const todayInput = () => new Date().toISOString().slice(0, 10);
const daysAgoInput = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export function ReportsView({ orders, books, customers }: ReportsViewProps) {
  const [dateFrom, setDateFrom] = useState(daysAgoInput(30));
  const [dateTo, setDateTo] = useState(todayInput());

  const report = useMemo(() => buildReport(orders, books, customers, dateFrom, dateTo), [books, customers, dateFrom, dateTo, orders]);

  const exportCsv = () => {
    const rows = [
      ['Bao cao', `${dateFrom} - ${dateTo}`],
      ['Doanh thu', report.revenue],
      ['So don', report.orderCount],
      ['Ty le huy', `${report.cancelRate}%`],
      [],
      ['Doanh thu theo ngay'],
      ['Ngay', 'Doanh thu', 'So don'],
      ...report.revenueByDay.map((item) => [item.date, item.revenue, item.orders]),
      [],
      ['Trang thai don'],
      ['Trang thai', 'So don'],
      ...report.statusRows.map((item) => [item.label, item.count]),
      [],
      ['Thanh toan'],
      ['Phuong thuc', 'Doanh thu', 'So don'],
      ...report.paymentRows.map((item) => [item.label, item.revenue, item.orders]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-${dateFrom}-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{vi.title}</h3>
          <p className="mt-1 text-sm text-gray-500">{vi.helper}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[160px_160px_auto]">
          <DateInput label={vi.from} value={dateFrom} onChange={setDateFrom} />
          <DateInput label={vi.to} value={dateTo} onChange={setDateTo} />
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
          >
            <Download className="h-4 w-4" />
            {vi.exportCsv}
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <KpiCard label={vi.revenue} value={formatCurrency(report.revenue)} compare={report.revenueCompare} />
        <KpiCard label={vi.orders} value={report.orderCount.toLocaleString('vi-VN')} compare={report.orderCompare} />
        <KpiCard label={vi.cancelRate} value={`${report.cancelRate}%`} />
        <KpiCard label={vi.averageOrder} value={formatCurrency(report.averageOrder)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ReportPanel title={vi.revenueByMonth}>
          <BarList rows={report.revenueByMonth.map((item) => ({ label: item.month, value: item.revenue, valueText: formatCurrency(item.revenue), subText: `${item.orders} đơn` }))} />
        </ReportPanel>
        <ReportPanel title={vi.revenueByDay}>
          <BarList rows={report.revenueByDay.map((item) => ({ label: formatDate(item.date), value: item.revenue, valueText: formatCurrency(item.revenue), subText: `${item.orders} đơn` }))} />
        </ReportPanel>
        <ReportPanel title={vi.orderStatus}>
          <BarList rows={report.statusRows.map((item) => ({ label: item.label, value: item.count, valueText: item.count.toLocaleString('vi-VN') }))} />
        </ReportPanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <ReportPanel title={vi.topBooks}>
          <RankList rows={report.topBooks.map((book) => ({ label: book.title, value: `${Number(book.soldCount || 0).toLocaleString('vi-VN')} bán` }))} />
        </ReportPanel>
        <ReportPanel title={vi.lowStock}>
          <RankList rows={report.lowStockBooks.map((book) => ({ label: book.title, value: `${Number(book.stock || 0).toLocaleString('vi-VN')} còn` }))} />
        </ReportPanel>
        <ReportPanel title={vi.topCustomers}>
          <RankList rows={report.topCustomers.map((customer) => ({ label: customer.fullName || customer.userName, value: formatCurrency(Number(customer.totalSpent || 0)) }))} />
        </ReportPanel>
      </div>

      <ReportPanel title={vi.paymentRevenue}>
        <BarList rows={report.paymentRows.map((item) => ({ label: item.label, value: item.revenue, valueText: formatCurrency(item.revenue), subText: `${item.orders} đơn` }))} />
      </ReportPanel>
    </div>
  );
}

function buildReport(orders: AdminOrder[], books: ApiBook[], customers: AdminUser[], dateFrom: string, dateTo: string) {
  const start = new Date(`${dateFrom}T00:00:00`);
  const end = new Date(`${dateTo}T23:59:59`);
  const rangeMs = Math.max(1, end.getTime() - start.getTime());
  const previousStart = new Date(start.getTime() - rangeMs);
  const previousEnd = new Date(start.getTime() - 1);
  const inRange = (order: AdminOrder, left: Date, right: Date) => {
    const time = new Date(order.createdAt).getTime();
    return time >= left.getTime() && time <= right.getTime();
  };
  const currentOrders = orders.filter((order) => inRange(order, start, end));
  const previousOrders = orders.filter((order) => inRange(order, previousStart, previousEnd));
  const completed = currentOrders.filter((order) => order.status === 'COMPLETED');
  const previousCompleted = previousOrders.filter((order) => order.status === 'COMPLETED');
  const revenue = completed.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const previousRevenue = previousCompleted.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const revenueByDayMap = new Map<string, { date: string; revenue: number; orders: number }>();
  const revenueByMonthMap = new Map<string, { month: string; revenue: number; orders: number }>();
  completed.forEach((order) => {
    const date = new Date(order.createdAt).toISOString().slice(0, 10);
    const month = date.slice(0, 7);
    const item = revenueByDayMap.get(date) || { date, revenue: 0, orders: 0 };
    item.revenue += Number(order.totalAmount || 0);
    item.orders += 1;
    revenueByDayMap.set(date, item);
    const monthItem = revenueByMonthMap.get(month) || { month, revenue: 0, orders: 0 };
    monthItem.revenue += Number(order.totalAmount || 0);
    monthItem.orders += 1;
    revenueByMonthMap.set(month, monthItem);
  });
  const statusMap = new Map<string, number>();
  currentOrders.forEach((order) => statusMap.set(order.status, (statusMap.get(order.status) || 0) + 1));
  const paymentMap = new Map<string, { label: string; revenue: number; orders: number }>();
  completed.forEach((order) => {
    const method = order.paymentMethod || 'COD';
    const item = paymentMap.get(method) || { label: getPaymentMethodText(method as any), revenue: 0, orders: 0 };
    item.revenue += Number(order.totalAmount || 0);
    item.orders += 1;
    paymentMap.set(method, item);
  });
  const compare = (current: number, previous: number) => previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;

  return {
    revenue,
    orderCount: currentOrders.length,
    cancelRate: currentOrders.length > 0 ? Math.round((currentOrders.filter((order) => order.status === 'CANCELLED').length / currentOrders.length) * 100) : 0,
    averageOrder: completed.length > 0 ? revenue / completed.length : 0,
    revenueCompare: compare(revenue, previousRevenue),
    orderCompare: compare(currentOrders.length, previousOrders.length),
    revenueByMonth: Array.from(revenueByMonthMap.values()).sort((left, right) => left.month.localeCompare(right.month)),
    revenueByDay: Array.from(revenueByDayMap.values()).sort((left, right) => left.date.localeCompare(right.date)),
    statusRows: Array.from(statusMap.entries()).map(([status, count]) => ({ label: getOrderStatusText(status as any), count })),
    paymentRows: Array.from(paymentMap.values()).sort((left, right) => right.revenue - left.revenue),
    topBooks: [...books].sort((left, right) => Number(right.soldCount || 0) - Number(left.soldCount || 0)).slice(0, 8),
    lowStockBooks: [...books].filter((book) => Number(book.stock || 0) <= 10).sort((left, right) => Number(left.stock || 0) - Number(right.stock || 0)).slice(0, 8),
    topCustomers: [...customers].filter((customer) => customer.role === 'CUSTOMER').sort((left, right) => Number(right.totalSpent || 0) - Number(left.totalSpent || 0)).slice(0, 8),
  };
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="font-medium text-gray-600">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" />
    </label>
  );
}

function KpiCard({ label, value, compare }: { label: string; value: string; compare?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {typeof compare === 'number' && <p className={`mt-2 text-sm font-semibold ${compare >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{compare >= 0 ? '+' : ''}{compare}% {vi.compare}</p>}
    </div>
  );
}

function ReportPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h4 className="font-bold text-gray-900">{title}</h4>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function BarList({ rows }: { rows: Array<{ label: string; value: number; valueText: string; subText?: string }> }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  if (rows.length === 0) return <p className="text-sm text-gray-500">{vi.noData}</p>;
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="font-medium text-gray-700">{row.label}</span>
            <span className="text-gray-500">{row.valueText}{row.subText ? ` · ${row.subText}` : ''}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(6, (row.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RankList({ rows }: { rows: Array<{ label: string; value: string }> }) {
  if (rows.length === 0) return <p className="text-sm text-gray-500">{vi.noData}</p>;
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.label} className="flex items-center justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="min-w-0 truncate font-medium text-gray-800">{index + 1}. {row.label}</span>
          <span className="shrink-0 font-semibold text-gray-600">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
