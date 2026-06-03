import { Bot, CalendarDays, Loader2, Sparkles } from 'lucide-react';
import type { AdminMarketingPlan, AdminMarketingProgram } from '../../services/admin.service';

type MarketingViewProps = {
  plan: AdminMarketingPlan | null;
  isLoading?: boolean;
  creatingDraftInsightId?: string | null;
  goToBooks: () => void;
  goToCustomers: () => void;
  goToOrders: () => void;
  onCreateCampaignDraft: (program: AdminMarketingProgram) => void;
};

const vi = {
  title: 'Gợi ý tạo khuyến mãi',
  helper: 'Đề xuất nhanh dựa trên tồn kho, đơn hàng, nhóm sách nổi bật và các ngày đặc biệt trong tháng.',
  createDraft: 'Tạo bản nháp bằng AI',
  viewBooks: 'Xem sách',
  viewCustomers: 'Xem khách hàng',
  viewOrders: 'Xem đơn hàng',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
};

export function MarketingView({
  plan,
  isLoading,
  creatingDraftInsightId,
  goToBooks,
  goToCustomers,
  goToOrders,
  onCreateCampaignDraft,
}: MarketingViewProps) {
  const programs = (plan?.recommendedPrograms || []).slice(0, 3);

  const handleProgramAction = (program: AdminMarketingProgram) => {
    if (program.actionType === 'create_promotion') {
      onCreateCampaignDraft(program);
      return;
    }
    if (program.actionType === 'view_books') goToBooks();
    if (program.actionType === 'view_customers') goToCustomers();
    if (program.actionType === 'view_orders') goToOrders();
  };

  return (
    <section className="rounded-2xl border border-orange-100 bg-orange-50/50 p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-xl bg-white p-3 text-orange-600 ring-1 ring-orange-100">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-950">{vi.title}</h3>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">{vi.helper}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-28 items-center justify-center rounded-xl border border-orange-100 bg-white text-sm font-semibold text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-500" />
          Đang phân tích dữ liệu marketing...
        </div>
      ) : (
        <div className="grid gap-3">
          {programs.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              isCreatingDraft={creatingDraftInsightId === program.id}
              onAction={() => handleProgramAction(program)}
            />
          ))}
          {programs.length === 0 && (
            <div className="rounded-xl border border-dashed border-orange-200 bg-white p-5 text-sm text-gray-600">
              <h5 className="font-bold text-gray-900">Chưa có gợi ý tự động</h5>
              <p className="mt-2">
                Hãy kiểm tra tồn kho, bổ sung sách còn hàng hoặc xử lý đơn đang chờ để hệ thống có thêm dữ liệu tạo gợi ý.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={goToBooks}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {vi.viewBooks}
                </button>
                <button
                  type="button"
                  onClick={goToOrders}
                  className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  {vi.viewOrders}
                </button>
              </div>
            </div>
          )}
          {plan?.recommendedPrograms && plan.recommendedPrograms.length > programs.length && (
            <p className="px-1 text-xs font-medium text-gray-500">
              Hiển thị {programs.length} gợi ý ưu tiên nhất trong {plan.recommendedPrograms.length} gợi ý hiện có.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ProgramCard({
  program,
  isCreatingDraft,
  onAction,
}: {
  program: AdminMarketingProgram;
  isCreatingDraft: boolean;
  onAction: () => void;
}) {
  const actionLabel = {
    create_promotion: vi.createDraft,
    view_books: vi.viewBooks,
    view_customers: vi.viewCustomers,
    view_orders: vi.viewOrders,
  }[program.actionType];
  const canCreateDraft = program.actionType === 'create_promotion';
  const isOccasion = program.id.startsWith('occasion-');

  return (
    <article className="rounded-xl border border-orange-100 bg-white p-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-bold text-gray-900">{program.title}</h5>
            <PriorityBadge priority={program.priority} />
            {isOccasion && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-700 ring-1 ring-pink-100">
                <CalendarDays className="h-3.5 w-3.5" />
                Dịp đặc biệt
              </span>
            )}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
            <SuggestionInfo label="Lý do gợi ý" value={program.reason || program.problem} />
            <SuggestionInfo label="Mô tả khuyến mãi" value={program.recommendation} />
            <SuggestionInfo label="Áp dụng cho" value={program.target} />
            <SuggestionInfo label="Kỳ vọng" value={program.expectedImpact} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            {program.discountPercent > 0 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700 ring-1 ring-orange-100">
                Giảm đề xuất {program.discountPercent}%
              </span>
            )}
            {program.durationDays > 0 && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 ring-1 ring-blue-100">
                Chạy {program.durationDays} ngày
              </span>
            )}
            {program.bookIds.length > 0 && (
              <span className="rounded-full bg-gray-50 px-3 py-1 text-gray-700 ring-1 ring-gray-100">
                {program.bookIds.length} sách gợi ý
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onAction}
          disabled={isCreatingDraft}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isCreatingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : canCreateDraft ? <Bot className="h-4 w-4" /> : null}
          {isCreatingDraft ? 'Đang tạo bản nháp...' : actionLabel}
        </button>
      </div>
    </article>
  );
}

function SuggestionInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase text-gray-400">{label}</p>
      <p className="mt-1 text-sm text-gray-700">{value}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: AdminMarketingProgram['priority'] }) {
  const priorityStyle = {
    high: 'bg-red-50 text-red-700 ring-red-100',
    medium: 'bg-amber-50 text-amber-700 ring-amber-100',
    low: 'bg-blue-50 text-blue-700 ring-blue-100',
  }[priority];
  const priorityLabel = { high: vi.high, medium: vi.medium, low: vi.low }[priority];

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${priorityStyle}`}>{priorityLabel}</span>;
}
