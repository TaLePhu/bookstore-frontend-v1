import { Bot, Loader2, Megaphone, Sparkles } from 'lucide-react';
import type { AdminMarketingInsight } from '../../services/admin.service';

type MarketingViewProps = {
  insights: AdminMarketingInsight[];
  isLoading?: boolean;
  creatingDraftInsightId?: string | null;
  goToBooks: () => void;
  goToPromotions: () => void;
  goToCustomers: () => void;
  goToOrders: () => void;
  onCreateCampaignDraft: (insight: AdminMarketingInsight) => void;
};

const vi = {
  title: 'Marketing Intelligence',
  helper: 'Gợi ý marketing thông minh dựa trên tồn kho, doanh thu, đơn hàng, khuyến mãi và hành vi khách hàng.',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
  revenue: 'Cơ hội tăng doanh thu',
  inventory: 'Xử lý tồn kho',
  customer: 'Chăm sóc khách hàng',
  alert: 'Cảnh báo marketing',
  action: 'Hành động',
  reason: 'Lý do',
  impact: 'Tác động',
  empty: 'Chưa có gợi ý phù hợp.',
  createPromotion: 'Tạo chiến dịch bằng AI',
  viewBooks: 'Xem sách',
  viewCustomers: 'Xem khách hàng',
  viewOrders: 'Xem đơn hàng',
  viewPromotions: 'Xem khuyến mãi',
};

export function MarketingView({
  insights,
  isLoading,
  creatingDraftInsightId,
  goToBooks,
  goToPromotions,
  goToCustomers,
  goToOrders,
  onCreateCampaignDraft,
}: MarketingViewProps) {
  const sections = [
    { key: 'inventory', title: vi.inventory, items: insights.filter((item) => item.category === 'inventory') },
    { key: 'revenue', title: vi.revenue, items: insights.filter((item) => item.category === 'revenue') },
    { key: 'customer', title: vi.customer, items: insights.filter((item) => item.category === 'customer') },
    { key: 'alert', title: vi.alert, items: insights.filter((item) => item.category === 'alert') },
  ];

  const handleInsightAction = (insight: AdminMarketingInsight) => {
    if (insight.actionType === 'create_promotion') {
      onCreateCampaignDraft(insight);
      return;
    }
    if (insight.actionType === 'view_books') goToBooks();
    if (insight.actionType === 'view_customers') goToCustomers();
    if (insight.actionType === 'view_orders') goToOrders();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{vi.title}</h3>
              <p className="mt-1 max-w-3xl text-sm text-gray-500">{vi.helper}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={goToPromotions}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
          >
            <Megaphone className="h-4 w-4" />
            {vi.viewPromotions}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-500 shadow-sm">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-500" />
          Đang phân tích dữ liệu marketing...
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {sections.map((section) => (
            <section key={section.key} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <Megaphone className="h-5 w-5 text-orange-500" />
                <h4 className="font-bold text-gray-900">{section.title}</h4>
              </div>
              <div className="space-y-4 p-5">
                {section.items.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    isCreatingDraft={creatingDraftInsightId === insight.id}
                    onAction={() => handleInsightAction(insight)}
                  />
                ))}
                {section.items.length === 0 && <p className="text-sm text-gray-500">{vi.empty}</p>}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightCard({
  insight,
  isCreatingDraft,
  onAction,
}: {
  insight: AdminMarketingInsight;
  isCreatingDraft: boolean;
  onAction: () => void;
}) {
  const priorityStyle = {
    high: 'bg-red-50 text-red-700 ring-red-100',
    medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    low: 'bg-blue-50 text-blue-700 ring-blue-100',
  }[insight.priority];
  const priorityLabel = { high: vi.high, medium: vi.medium, low: vi.low }[insight.priority];
  const actionLabel = {
    create_promotion: vi.createPromotion,
    view_books: vi.viewBooks,
    view_customers: vi.viewCustomers,
    view_orders: vi.viewOrders,
  }[insight.actionType];
  const canCreateDraft = insight.actionType === 'create_promotion';

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
        onClick={onAction}
        disabled={isCreatingDraft}
        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCreatingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : canCreateDraft ? <Bot className="h-4 w-4" /> : null}
        {isCreatingDraft ? 'Đang tạo bản nháp...' : actionLabel}
      </button>
    </article>
  );
}
