import { Megaphone, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import type { ApiBook } from '../../services/book.service';
import type { AdminOrder, AdminPromotion, AdminUser } from '../../services/admin.service';
import { formatCurrency } from './utils';

type MarketingViewProps = {
  orders: AdminOrder[];
  books: ApiBook[];
  customers: AdminUser[];
  promotions: AdminPromotion[];
  goToBooks: () => void;
  goToPromotions: () => void;
  goToCustomers: () => void;
  goToOrders: () => void;
};

type Priority = 'high' | 'medium' | 'low';

type Insight = {
  id: string;
  title: string;
  reason: string;
  impact: string;
  priority: Priority;
  actionLabel: string;
  onAction: () => void;
};

const vi = {
  title: 'Marketing Intelligence',
  helper: 'G\u1ee3i \u00fd marketing th\u00f4ng minh d\u1ef1a tr\u00ean t\u1ed3n kho, doanh thu, \u0111\u01a1n h\u00e0ng v\u00e0 h\u00e0nh vi kh\u00e1ch h\u00e0ng.',
  high: 'Cao',
  medium: 'Trung b\u00ecnh',
  low: 'Th\u1ea5p',
  revenue: 'C\u01a1 h\u1ed9i t\u0103ng doanh thu',
  inventory: 'X\u1eed l\u00fd t\u1ed3n kho',
  customer: 'Ch\u0103m s\u00f3c kh\u00e1ch h\u00e0ng',
  alert: 'C\u1ea3nh b\u00e1o marketing',
  action: 'H\u00e0nh \u0111\u1ed9ng',
  reason: 'L\u00fd do',
  impact: 'T\u00e1c \u0111\u1ed9ng',
  empty: 'Ch\u01b0a c\u00f3 g\u1ee3i \u00fd ph\u00f9 h\u1ee3p.',
  createPromotion: 'T\u1ea1o khuy\u1ebfn m\u00e3i',
  viewBooks: 'Xem s\u00e1ch',
  viewCustomers: 'Xem kh\u00e1ch h\u00e0ng',
  viewOrders: 'Xem \u0111\u01a1n h\u00e0ng',
};

export function MarketingView({
  orders,
  books,
  customers,
  promotions,
  goToBooks,
  goToPromotions,
  goToCustomers,
  goToOrders,
}: MarketingViewProps) {
  const insights = useMemo(
    () => buildMarketingInsights({ orders, books, customers, promotions, goToBooks, goToPromotions, goToCustomers, goToOrders }),
    [books, customers, goToBooks, goToCustomers, goToOrders, goToPromotions, orders, promotions]
  );

  const sections = [
    { title: vi.inventory, items: insights.filter((item) => item.id.startsWith('inventory')) },
    { title: vi.revenue, items: insights.filter((item) => item.id.startsWith('revenue')) },
    { title: vi.customer, items: insights.filter((item) => item.id.startsWith('customer')) },
    { title: vi.alert, items: insights.filter((item) => item.id.startsWith('alert')) },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{vi.title}</h3>
            <p className="mt-1 max-w-3xl text-sm text-gray-500">{vi.helper}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {sections.map((section) => (
          <section key={section.title} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
              <Megaphone className="h-5 w-5 text-orange-500" />
              <h4 className="font-bold text-gray-900">{section.title}</h4>
            </div>
            <div className="space-y-4 p-5">
              {section.items.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
              {section.items.length === 0 && <p className="text-sm text-gray-500">{vi.empty}</p>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function buildMarketingInsights({
  orders,
  books,
  customers,
  promotions,
  goToBooks,
  goToPromotions,
  goToCustomers,
  goToOrders,
}: MarketingViewProps): Insight[] {
  const activePromotionBookIds = new Set(
    promotions
      .filter((promotion) => promotion.status === 'ACTIVE')
      .flatMap((promotion) => (promotion.books || []).map((book) => book.id))
  );
  const completedOrders = orders.filter((order) => order.status === 'COMPLETED');
  const cancelledOrders = orders.filter((order) => order.status === 'CANCELLED');
  const revenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const cancelRate = orders.length > 0 ? Math.round((cancelledOrders.length / orders.length) * 100) : 0;
  const highStockSlowBooks = books
    .filter((book) => Number(book.stock || 0) >= 30 && Number(book.soldCount || 0) <= 5)
    .sort((left, right) => Number(right.stock || 0) - Number(left.stock || 0));
  const bestSellersWithoutPromo = books
    .filter((book) => Number(book.soldCount || 0) >= 10 && !activePromotionBookIds.has(book.id))
    .sort((left, right) => Number(right.soldCount || 0) - Number(left.soldCount || 0));
  const vipCustomers = customers
    .filter((customer) => customer.role === 'CUSTOMER' && Number(customer.totalSpent || 0) >= 5000000)
    .sort((left, right) => Number(right.totalSpent || 0) - Number(left.totalSpent || 0));
  const inactiveCustomers = customers.filter((customer) => {
    if (customer.role !== 'CUSTOMER' || !customer.lastOrderAt) return false;
    const days = (Date.now() - new Date(customer.lastOrderAt).getTime()) / 86400000;
    return days >= 30;
  });

  return [
    highStockSlowBooks.length > 0 && {
      id: 'inventory-slow-stock',
      title: `${highStockSlowBooks.length} s\u00e1ch t\u1ed3n cao, b\u00e1n ch\u1eadm`,
      reason: `T\u1ed3n kho cao nh\u01b0ng l\u01b0\u1ee3t b\u00e1n th\u1ea5p. N\u00ean \u01b0u ti\u00ean ${highStockSlowBooks[0].title}.`,
      impact: 'Gi\u1ea3m t\u1ed3n kho v\u00e0 gi\u1ea3i ph\u00f3ng v\u1ed1n.',
      priority: 'high',
      actionLabel: vi.createPromotion,
      onAction: goToPromotions,
    },
    bestSellersWithoutPromo.length > 0 && {
      id: 'revenue-bestseller-banner',
      title: `${bestSellersWithoutPromo.length} s\u00e1ch b\u00e1n ch\u1ea1y n\u00ean \u0111\u01b0a l\u00ean banner`,
      reason: `${bestSellersWithoutPromo[0].title} \u0111ang c\u00f3 ${Number(bestSellersWithoutPromo[0].soldCount || 0).toLocaleString('vi-VN')} l\u01b0\u1ee3t b\u00e1n.`,
      impact: 'T\u0103ng t\u1ef7 l\u1ec7 click v\u00e0 doanh thu t\u1eeb nh\u00f3m s\u00e1ch \u0111ang c\u00f3 nhu c\u1ea7u cao.',
      priority: 'medium',
      actionLabel: vi.createPromotion,
      onAction: goToPromotions,
    },
    vipCustomers.length > 0 && {
      id: 'customer-vip-care',
      title: `${vipCustomers.length} kh\u00e1ch VIP n\u00ean ch\u0103m s\u00f3c ri\u00eang`,
      reason: `Kh\u00e1ch d\u1eabn \u0111\u1ea7u \u0111\u00e3 chi ${formatCurrency(Number(vipCustomers[0].totalSpent || 0))}.`,
      impact: 'T\u0103ng mua l\u1eb7p l\u1ea1i v\u00e0 gi\u1eef ch\u00e2n kh\u00e1ch h\u00e0ng gi\u00e1 tr\u1ecb cao.',
      priority: 'high',
      actionLabel: vi.viewCustomers,
      onAction: goToCustomers,
    },
    inactiveCustomers.length > 0 && {
      id: 'customer-winback',
      title: `${inactiveCustomers.length} kh\u00e1ch l\u00e2u ch\u01b0a mua l\u1ea1i`,
      reason: 'C\u00f3 \u0111\u01a1n g\u1ea7n nh\u1ea5t t\u1eeb 30 ng\u00e0y tr\u01b0\u1edbc.',
      impact: 'Ph\u00f9 h\u1ee3p chi\u1ebfn d\u1ecbch m\u00e3 quay l\u1ea1i ho\u1eb7c freeship.',
      priority: 'medium',
      actionLabel: vi.viewCustomers,
      onAction: goToCustomers,
    },
    cancelRate >= 15 && {
      id: 'alert-cancel-rate',
      title: `T\u1ef7 l\u1ec7 h\u1ee7y \u0111\u01a1n \u0111ang cao: ${cancelRate}%`,
      reason: `${cancelledOrders.length}/${orders.length} \u0111\u01a1n trong t\u1eadp b\u00e1o c\u00e1o b\u1ecb h\u1ee7y.`,
      impact: 'C\u1ea7n xem l\u1ea1i x\u00e1c nh\u1eadn \u0111\u01a1n, t\u1ed3n kho, ph\u00ed ship ho\u1eb7c ph\u01b0\u01a1ng th\u1ee9c thanh to\u00e1n.',
      priority: 'high',
      actionLabel: vi.viewOrders,
      onAction: goToOrders,
    },
    revenue === 0 && orders.length > 0 && {
      id: 'alert-no-completed-revenue',
      title: 'Ch\u01b0a c\u00f3 doanh thu ho\u00e0n th\u00e0nh',
      reason: 'C\u00f3 \u0111\u01a1n h\u00e0ng nh\u01b0ng ch\u01b0a c\u00f3 \u0111\u01a1n \u1edf tr\u1ea1ng th\u00e1i ho\u00e0n th\u00e0nh.',
      impact: 'N\u00ean \u01b0u ti\u00ean x\u1eed l\u00fd \u0111\u01a1n \u0111ang ch\u1edd \u0111\u1ec3 ghi nh\u1eadn doanh thu.',
      priority: 'high',
      actionLabel: vi.viewOrders,
      onAction: goToOrders,
    },
    books.filter((book) => Number(book.stock || 0) <= 5).length > 0 && {
      id: 'inventory-low-stock',
      title: 'C\u00f3 s\u00e1ch s\u1eafp h\u1ebft h\u00e0ng',
      reason: 'M\u1ed9t s\u1ed1 s\u00e1ch t\u1ed3n kho r\u1ea5t th\u1ea5p, kh\u00f4ng n\u00ean \u0111\u1ea9y khuy\u1ebfn m\u00e3i m\u1ea1nh.',
      impact: 'Tr\u00e1nh b\u00e1n v\u01b0\u1ee3t t\u1ed3n v\u00e0 gi\u1eef tr\u1ea3i nghi\u1ec7m kh\u00e1ch h\u00e0ng.',
      priority: 'low',
      actionLabel: vi.viewBooks,
      onAction: goToBooks,
    },
  ].filter(Boolean) as Insight[];
}

function InsightCard({ insight }: { insight: Insight }) {
  const priorityStyle = {
    high: 'bg-red-50 text-red-700 ring-red-100',
    medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    low: 'bg-blue-50 text-blue-700 ring-blue-100',
  }[insight.priority];
  const priorityLabel = { high: vi.high, medium: vi.medium, low: vi.low }[insight.priority];

  return (
    <article className="rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h5 className="font-bold text-gray-900">{insight.title}</h5>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${priorityStyle}`}>{priorityLabel}</span>
      </div>
      <div className="mt-3 space-y-2 text-sm text-gray-600">
        <p><span className="font-semibold text-gray-800">{vi.reason}:</span> {insight.reason}</p>
        <p><span className="font-semibold text-gray-800">{vi.impact}:</span> {insight.impact}</p>
      </div>
      <button
        type="button"
        onClick={insight.onAction}
        className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        {insight.actionLabel}
      </button>
    </article>
  );
}
