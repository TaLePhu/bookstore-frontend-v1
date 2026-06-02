import type React from 'react';
import { Copy, Edit, Eye, Plus, Tag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { AdminPromotion } from '../../services/admin.service';
import { getBookImage } from '../../utils/book-display';
import { EmptyState, SearchBox } from './components';
import type { PromotionEffectiveStatus } from './types';
import { formatDate, getPromotionEffectiveMeta, getPromotionEffectiveStatus } from './utils';

type PromotionsViewProps = {
  isAdmin: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  promotions: AdminPromotion[];
  activePromotions: AdminPromotion[];
  promotionBookTotal: number;
  filteredPromotions: AdminPromotion[];
  promotionEffectiveStatusFilter: PromotionEffectiveStatus;
  setPromotionEffectiveStatusFilter: (value: PromotionEffectiveStatus) => void;
  openCreatePromotion: () => void;
  openEditPromotion: (promotion: AdminPromotion) => void;
  openClonePromotion: (promotion: AdminPromotion) => void;
  handleTogglePromotionStatus: (promotion: AdminPromotion) => void;
  handleDeletePromotionProgram: (promotion: AdminPromotion) => void;
  deletingPromotionId: string | null;
  updatingPromotionStatusId: string | null;
  onViewPromotionsPage: () => void;
};

const promotionStatusFilters: Array<{ value: PromotionEffectiveStatus; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'running', label: 'Đang chạy' },
  { value: 'upcoming', label: 'Sắp diễn ra' },
  { value: 'ending_soon', label: 'Sắp hết hạn' },
  { value: 'expired', label: 'Đã hết hạn' },
  { value: 'inactive', label: 'Tạm tắt' },
];

export function PromotionsView({
  isAdmin,
  searchQuery,
  setSearchQuery,
  promotions,
  activePromotions,
  promotionBookTotal,
  filteredPromotions,
  promotionEffectiveStatusFilter,
  setPromotionEffectiveStatusFilter,
  openCreatePromotion,
  openEditPromotion,
  openClonePromotion,
  handleTogglePromotionStatus,
  handleDeletePromotionProgram,
  deletingPromotionId,
  updatingPromotionStatusId,
  onViewPromotionsPage,
}: PromotionsViewProps) {
  const runningCount = promotions.filter((promotion) =>
    ['running', 'ending_soon'].includes(getPromotionEffectiveStatus(promotion))
  ).length;
  const endingSoonCount = promotions.filter((promotion) => getPromotionEffectiveStatus(promotion) === 'ending_soon').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PromotionMetric label="Chương trình" value={promotions.length} tone="gray" />
        <PromotionMetric label="Đang hiệu lực" value={runningCount} tone="emerald" />
        <PromotionMetric label="Sắp hết hạn" value={endingSoonCount} tone="amber" />
        <PromotionMetric label="Sách áp dụng" value={promotionBookTotal} tone="orange" />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Quản lý khuyến mãi</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filteredPromotions.length.toLocaleString('vi-VN')} chương trình phù hợp. {activePromotions.length.toLocaleString('vi-VN')} chương trình đang bật.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onViewPromotionsPage}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100"
              >
                <Eye className="h-4 w-4" />
                Xem trang khuyến mãi
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreatePromotion}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Tạo chương trình
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_260px]">
            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm chương trình, mô tả hoặc sách..." />
            <select
              value={promotionEffectiveStatusFilter}
              onChange={(event) => setPromotionEffectiveStatusFilter(event.target.value as PromotionEffectiveStatus)}
              className="rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {promotionStatusFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPromotions.map((promotion) => {
          const meta = getPromotionEffectiveMeta(promotion);
          const books = promotion.books || [];
          const bookCount = promotion.bookCount || books.length || 0;

          return (
            <div key={promotion.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="grid gap-5 p-5 lg:grid-cols-[280px_1fr_auto]">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  {promotion.bannerImageUrl ? (
                    <img src={promotion.bannerImageUrl} alt={promotion.name} className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm font-medium text-gray-500">
                      Chưa có banner
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-950">{promotion.name}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${meta.className}`}>
                      {meta.label}
                    </span>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
                      Giảm {promotion.discountPercent}%
                    </span>
                  </div>
                  {promotion.description && <p className="mt-2 line-clamp-2 text-sm text-gray-600">{promotion.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span>Bắt đầu: {formatDate(promotion.startsAt)}</span>
                    <span>Kết thúc: {formatDate(promotion.endsAt)}</span>
                    <span>{bookCount.toLocaleString('vi-VN')} sách áp dụng</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {books.slice(0, 5).map((book) => (
                      <div key={book.id} className="flex max-w-[220px] items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-2">
                        <img src={getBookImage(book)} alt={book.title} className="h-10 w-8 rounded object-cover ring-1 ring-gray-200" />
                        <span className="line-clamp-2 text-xs font-medium text-gray-700">{book.title}</span>
                      </div>
                    ))}
                    {bookCount > 5 && (
                      <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                        +{bookCount - 5} sách
                      </span>
                    )}
                  </div>
                </div>

                {isAdmin ? (
                  <div className="flex shrink-0 gap-2 lg:flex-col">
                    <IconAction
                      title={promotion.status === 'ACTIVE' ? 'Tắt chương trình' : 'Bật chương trình'}
                      tone={promotion.status === 'ACTIVE' ? 'emerald' : 'gray'}
                      onClick={() => handleTogglePromotionStatus(promotion)}
                      disabled={updatingPromotionStatusId === promotion.id}
                    >
                      {promotion.status === 'ACTIVE' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </IconAction>
                    <IconAction title="Sửa chương trình" tone="blue" onClick={() => openEditPromotion(promotion)}>
                      <Edit className="h-4 w-4" />
                    </IconAction>
                    <IconAction title="Clone chương trình" tone="orange" onClick={() => openClonePromotion(promotion)}>
                      <Copy className="h-4 w-4" />
                    </IconAction>
                    <IconAction
                      title="Xóa chương trình"
                      tone="red"
                      onClick={() => handleDeletePromotionProgram(promotion)}
                      disabled={deletingPromotionId === promotion.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconAction>
                  </div>
                ) : (
                  <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">
                    Chỉ xem
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredPromotions.length === 0 && <EmptyState text="Chưa có chương trình khuyến mãi phù hợp." />}
      </div>
    </div>
  );
}

function PromotionMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'gray' | 'emerald' | 'amber' | 'orange';
}) {
  const tones = {
    gray: 'border-gray-200 bg-white text-gray-900',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    orange: 'border-orange-100 bg-orange-50 text-orange-700',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value.toLocaleString('vi-VN')}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70">
          <Tag className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function IconAction({
  children,
  title,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone: 'blue' | 'orange' | 'red' | 'emerald' | 'gray';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100 hover:bg-blue-100',
    orange: 'bg-orange-50 text-orange-700 ring-orange-100 hover:bg-orange-100',
    red: 'bg-red-50 text-red-700 ring-red-100 hover:bg-red-100',
    emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100',
    gray: 'bg-gray-50 text-gray-600 ring-gray-100 hover:bg-gray-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ring-1 transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
