import { Bot, CalendarDays, Loader2, Megaphone, Package, Percent, Sparkles, TrendingUp, Users } from 'lucide-react';
import type { AdminMarketingPlan, AdminMarketingProgram, AdminPromotion } from '../../services/admin.service';

type MarketingViewProps = {
  plan: AdminMarketingPlan | null;
  promotions: AdminPromotion[];
  isLoading?: boolean;
  creatingDraftInsightId?: string | null;
  goToBooks: () => void;
  goToCustomers: () => void;
  goToOrders: () => void;
  onCreateCampaignDraft: (program: AdminMarketingProgram) => void;
};

const vi = {
  title: 'Marketing Intelligence',
  helper: 'Trung tâm đề xuất chương trình hành động cho admin: chọn vấn đề cần xử lý, tạo bản nháp chiến dịch, rồi kiểm duyệt trước khi lưu.',
  runningCampaigns: 'Chiến dịch đang chạy',
  programTypes: 'Loại chương trình có thể triển khai',
  recommendedPrograms: 'Chương trình nên thực hiện',
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
  promotions,
  isLoading,
  creatingDraftInsightId,
  goToBooks,
  goToCustomers,
  goToOrders,
  onCreateCampaignDraft,
}: MarketingViewProps) {
  const programs = plan?.recommendedPrograms || [];
  const runningPromotions = promotions.filter(isPromotionRunning).slice(0, 4);
  const recommendedProgramIds = new Set(programs.map((program) => program.id));

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
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
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
      </div>

      {isLoading ? (
        <div className="flex min-h-48 items-center justify-center rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-500 shadow-sm">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-orange-500" />
          Đang phân tích dữ liệu marketing...
        </div>
      ) : (
        <>
          <SummaryStrip plan={plan} />

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-orange-500" />
                <h4 className="font-bold text-gray-900">{vi.runningCampaigns}</h4>
              </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
              {runningPromotions.map((promotion) => (
                <RunningPromotionCard key={promotion.id} promotion={promotion} />
              ))}
              {runningPromotions.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 p-5 text-sm text-gray-500 lg:col-span-2 xl:col-span-4">
                  Hiện chưa có chiến dịch khuyến mãi đang chạy. Hãy chọn một chương trình đề xuất bên dưới để tạo bản nháp và kích hoạt.
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-orange-500" />
              <h4 className="font-bold text-gray-900">{vi.recommendedPrograms}</h4>
            </div>
            <div className="grid gap-4">
              {programs.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  isCreatingDraft={creatingDraftInsightId === program.id}
                  onAction={() => handleProgramAction(program)}
                />
              ))}
              {programs.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-600">
                  <h5 className="font-bold text-gray-900">Chuẩn bị dữ liệu để chạy marketing</h5>
                  <p className="mt-2">
                    Hệ thống chưa tìm được nhóm sách đủ điều kiện để tạo chương trình tự động. Hướng tốt nhất lúc này là kiểm tra tồn kho,
                    bổ sung sách còn hàng và xử lý đơn đang chờ để tạo tín hiệu bán hàng đầu tiên.
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
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Package className="h-5 w-5 text-orange-500" />
              <h4 className="font-bold text-gray-900">{vi.programTypes}</h4>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PROGRAM_TYPES.map((programType) => (
                <ProgramTypeCard
                  key={programType.id}
                  programType={programType}
                  isRecommended={programType.recommendedIds.some((id) => recommendedProgramIds.has(id))}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const PROGRAM_TYPES = [
  {
    id: 'starter',
    title: 'Chiến dịch khởi động doanh thu',
    goal: 'Tạo đơn hoàn thành đầu tiên và dữ liệu bán hàng ban đầu.',
    bestFor: 'Kho mới, ít đơn hoàn thành, chưa đủ dữ liệu tối ưu sâu.',
    recommendedIds: ['revenue-starter-campaign'],
  },
  {
    id: 'clearance',
    title: 'Chiến dịch xả tồn kho thông minh',
    goal: 'Giảm tồn kho cao nhưng vẫn kiểm soát nhóm sách áp dụng.',
    bestFor: 'Sách tồn cao, bán chậm, còn nhiều vốn nằm trong hàng tồn.',
    recommendedIds: ['inventory-smart-clearance'],
  },
  {
    id: 'stock-balance',
    title: 'Chiến dịch cân bằng tồn kho',
    goal: 'Thử nhu cầu với nhóm tồn nhiều trước khi giảm sâu.',
    bestFor: 'Có tồn kho cao nhưng chưa đủ bằng chứng là bán chậm.',
    recommendedIds: ['inventory-stock-balance'],
  },
  {
    id: 'bestseller',
    title: 'Chiến dịch sách bán chạy',
    goal: 'Tận dụng nhu cầu sẵn có bằng banner và giảm nhẹ.',
    bestFor: 'Sách có soldCount tốt nhưng chưa nằm trong khuyến mãi.',
    recommendedIds: ['revenue-bestseller-boost'],
  },
  {
    id: 'new-arrivals',
    title: 'Chiến dịch sách mới',
    goal: 'Tăng nhận diện và lượt xem cho sách mới nhập hoặc mới phát hành.',
    bestFor: 'Sách có releaseDate/createdAt gần đây và còn hàng.',
    recommendedIds: ['revenue-new-arrivals'],
  },
  {
    id: 'first-active',
    title: 'Tạo chương trình khuyến mãi đang chạy',
    goal: 'Kích hoạt trang khuyến mãi và tạo điểm nhấn bán hàng.',
    bestFor: 'Chưa có chương trình ACTIVE trong thời điểm hiện tại.',
    recommendedIds: ['promotion-first-active'],
  },
  {
    id: 'vip',
    title: 'Chăm sóc khách VIP',
    goal: 'Giữ chân khách hàng giá trị cao bằng ưu đãi riêng.',
    bestFor: 'Khách có tổng chi tiêu cao hoặc mua lặp lại.',
    recommendedIds: ['customer-vip-care'],
  },
  {
    id: 'operations',
    title: 'Ổn định vận hành nếu tỷ lệ hủy đơn cao',
    goal: 'Giảm rủi ro marketing tạo đơn nhưng không thành doanh thu.',
    bestFor: 'Tỷ lệ hủy đơn cao, tồn kho/ship/thanh toán cần kiểm tra.',
    recommendedIds: ['operation-cancel-rate'],
  },
  {
    id: 'low-stock',
    title: 'Không giảm sâu sách sắp hết hàng',
    goal: 'Bảo vệ tồn kho và tránh bán vượt khả năng giao hàng.',
    bestFor: 'Sách tồn thấp nhưng vẫn có khả năng được thêm vào sale.',
    recommendedIds: ['inventory-low-stock-guard'],
  },
];

function isPromotionRunning(promotion: AdminPromotion) {
  const now = Date.now();
  const startsAt = promotion.startsAt ? new Date(promotion.startsAt).getTime() : Number.NEGATIVE_INFINITY;
  const endsAt = promotion.endsAt ? new Date(promotion.endsAt).getTime() : Number.POSITIVE_INFINITY;

  return promotion.status === 'ACTIVE' && Number(promotion.discountPercent || 0) > 0 && startsAt <= now && endsAt >= now;
}

function RunningPromotionCard({ promotion }: { promotion: AdminPromotion }) {
  return (
    <article className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <h5 className="line-clamp-2 font-bold text-gray-900">{promotion.name}</h5>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
          Đang chạy
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-orange-700 ring-1 ring-orange-100">
          <Percent className="h-3.5 w-3.5" />
          Giảm {promotion.discountPercent}%
        </span>
        <span className="rounded-full bg-white px-2.5 py-1 text-gray-700 ring-1 ring-gray-100">
          {promotion.bookCount || promotion.books?.length || 0} sách
        </span>
      </div>
      <p className="mt-3 text-xs text-gray-600">
        {formatPromotionDate(promotion.startsAt)} - {formatPromotionDate(promotion.endsAt)}
      </p>
    </article>
  );
}

function ProgramTypeCard({
  programType,
  isRecommended,
}: {
  programType: (typeof PROGRAM_TYPES)[number];
  isRecommended: boolean;
}) {
  return (
    <article className={`rounded-xl border p-4 ${isRecommended ? 'border-orange-200 bg-orange-50/70' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <h5 className="font-bold text-gray-900">{programType.title}</h5>
        {isRecommended && (
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
            Đang đề xuất
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-gray-700">{programType.goal}</p>
      <p className="mt-3 text-xs text-gray-500">{programType.bestFor}</p>
    </article>
  );
}

function formatPromotionDate(value?: string | null) {
  if (!value) return 'Không giới hạn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Không rõ';
  return date.toLocaleDateString('vi-VN');
}

function SummaryStrip({ plan }: { plan: AdminMarketingPlan | null }) {
  const summary = plan?.summary;
  const items = [
    { label: 'Sách trong kho', value: summary?.totalBooks ?? 0, icon: Package },
    { label: 'Đơn hoàn thành', value: summary?.completedOrders ?? 0, icon: TrendingUp },
    { label: 'Khuyến mãi chạy', value: summary?.activePromotions ?? 0, icon: Megaphone },
    { label: 'Sách tồn cao', value: summary?.highStockBooks ?? 0, icon: Package },
    { label: 'Khách VIP', value: summary?.vipCustomers ?? 0, icon: Users },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-400">{item.label}</p>
                <p className="mt-2 text-xl font-bold text-gray-900">{typeof item.value === 'number' ? item.value.toLocaleString('vi-VN') : item.value}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
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

  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-lg font-bold text-gray-900">{program.title}</h5>
            <PriorityBadge priority={program.priority} />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <InfoBlock label="Vấn đề" value={program.problem} />
            <InfoBlock label="Hướng thực hiện" value={program.recommendation} />
            <InfoBlock label="Đối tượng áp dụng" value={program.target} />
            <InfoBlock label="Tác động kỳ vọng" value={program.expectedImpact} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
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

function InfoBlock({ label, value }: { label: string; value: string }) {
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
