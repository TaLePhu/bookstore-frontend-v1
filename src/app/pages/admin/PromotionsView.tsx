import { Edit, Plus, Trash2 } from 'lucide-react';
import type { AdminPromotion } from '../../services/admin.service';
import { getBookImage } from '../../utils/book-display';
import { EmptyState, SearchBox } from './components';
import { formatDate } from './utils';

type PromotionsViewProps = {
  isAdmin: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  promotions: AdminPromotion[];
  activePromotions: AdminPromotion[];
  promotionBookTotal: number;
  filteredPromotions: AdminPromotion[];
  openCreatePromotion: () => void;
  openEditPromotion: (promotion: AdminPromotion) => void;
  handleDeletePromotionProgram: (promotion: AdminPromotion) => void;
  deletingPromotionId: string | null;
  onViewPromotionsPage: () => void;
};

export function PromotionsView({
  isAdmin,
  searchQuery,
  setSearchQuery,
  promotions,
  activePromotions,
  promotionBookTotal,
  filteredPromotions,
  openCreatePromotion,
  openEditPromotion,
  handleDeletePromotionProgram,
  deletingPromotionId,
  onViewPromotionsPage,
}: PromotionsViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Chương trình</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{promotions.length}</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Đang áp dụng</p>
          <p className="mt-2 text-3xl font-bold text-orange-600">{activePromotions.length}</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Sách trong chương trình</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{promotionBookTotal}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm chương trình hoặc sách..." />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onViewPromotionsPage}
            className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 font-semibold text-orange-700 transition-colors hover:bg-orange-100"
          >
            Xem trang khuyến mãi
          </button>
          {isAdmin && (
            <button
              onClick={openCreatePromotion}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              <Plus className="h-5 w-5" />
              Tạo chương trình
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPromotions.map((promotion) => (
          <div key={promotion.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900">{promotion.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${promotion.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {promotion.status === 'ACTIVE' ? 'Đang áp dụng' : 'Tạm tắt'}
                  </span>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                    Giảm {promotion.discountPercent}%
                  </span>
                </div>
                {promotion.description && <p className="mt-2 text-sm text-gray-600">{promotion.description}</p>}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
                  <span>Bắt đầu: {formatDate(promotion.startsAt)}</span>
                  <span>Kết thúc: {formatDate(promotion.endsAt)}</span>
                  <span>{promotion.bookCount || promotion.books?.length || 0} sách</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(promotion.books || []).slice(0, 5).map((book) => (
                    <div key={book.id} className="flex max-w-[220px] items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-2 py-2">
                      <img src={getBookImage(book)} alt={book.title} className="h-10 w-8 rounded object-cover ring-1 ring-gray-200" />
                      <span className="line-clamp-2 text-xs font-medium text-gray-700">{book.title}</span>
                    </div>
                  ))}
                  {(promotion.books?.length || 0) > 5 && (
                    <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                      +{(promotion.books?.length || 0) - 5} sách
                    </span>
                  )}
                </div>
              </div>
              {isAdmin ? (
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEditPromotion(promotion)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition-colors hover:bg-blue-100"
                    title="Sửa chương trình"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeletePromotionProgram(promotion)}
                    disabled={deletingPromotionId === promotion.id}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-700 ring-1 ring-red-100 transition-colors hover:bg-red-100 disabled:opacity-50"
                    title="Xóa chương trình"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 ring-1 ring-gray-100">
                  Chỉ xem
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredPromotions.length === 0 && <EmptyState text="Chưa có chương trình khuyến mãi phù hợp." />}
      </div>
    </div>
  );
}
