import type React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type {
  AdminCategory,
  AdminPromotionPayload,
} from '../../services/admin.service';
import type { ApiBook } from '../../services/book.service';
import { getBookImage } from '../../utils/book-display';
import type { PromotionBookStockFilter, PromotionModalMode } from './types';
import { formatCurrency } from './utils';

type PromotionModalProps = {
  promotionModalMode: Exclude<PromotionModalMode, null>;
  promotionForm: AdminPromotionPayload;
  promotionFormError: string;
  promotionBannerPreview: string;
  promotionBannerInputRef: React.RefObject<HTMLInputElement | null>;
  promotionBooks: ApiBook[];
  filteredPromotionModalBooks: ApiBook[];
  activeCategories: AdminCategory[];
  promotionBookSearch: string;
  setPromotionBookSearch: (value: string) => void;
  promotionCategoryFilter: string;
  setPromotionCategoryFilter: (value: string) => void;
  promotionStockFilter: PromotionBookStockFilter;
  setPromotionStockFilter: (value: PromotionBookStockFilter) => void;
  showSelectedPromotionBooksOnly: boolean;
  setShowSelectedPromotionBooksOnly: (value: boolean) => void;
  savingPromotion: boolean;
  closePromotionModal: () => void;
  handlePromotionFormInput: (
    field: keyof AdminPromotionPayload,
    value: AdminPromotionPayload[keyof AdminPromotionPayload]
  ) => void;
  handlePromotionBannerChange: (fileList: FileList | null) => boolean;
  clearPromotionBanner: () => void;
  togglePromotionBook: (bookId: string) => void;
  handleSavePromotionProgram: () => Promise<void>;
};

export function PromotionModal({
  promotionModalMode,
  promotionForm,
  promotionFormError,
  promotionBannerPreview,
  promotionBannerInputRef,
  promotionBooks,
  filteredPromotionModalBooks,
  activeCategories,
  promotionBookSearch,
  setPromotionBookSearch,
  promotionCategoryFilter,
  setPromotionCategoryFilter,
  promotionStockFilter,
  setPromotionStockFilter,
  showSelectedPromotionBooksOnly,
  setShowSelectedPromotionBooksOnly,
  savingPromotion,
  closePromotionModal,
  handlePromotionFormInput,
  handlePromotionBannerChange,
  clearPromotionBanner,
  togglePromotionBook,
  handleSavePromotionProgram,
}: PromotionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {promotionModalMode === 'edit' ? 'Sửa chương trình khuyến mãi' : 'Tạo chương trình khuyến mãi'}
            </h3>
            <p className="text-sm text-gray-500">Chọn sách để áp dụng giá khuyến mãi tự động.</p>
          </div>
          <button
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={closePromotionModal}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {promotionFormError && (
            <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{promotionFormError}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tên chương trình</label>
              <input
                value={promotionForm.name}
                onChange={(event) => handlePromotionFormInput('name', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Ví dụ: Sale hè 2026"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Phần trăm giảm</label>
              <input
                type="number"
                min="1"
                max="100"
                value={promotionForm.discountPercent}
                onChange={(event) => handlePromotionFormInput('discountPercent', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
              <input
                type="date"
                value={promotionForm.startsAt || ''}
                onChange={(event) => handlePromotionFormInput('startsAt', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Ngày kết thúc</label>
              <input
                type="date"
                value={promotionForm.endsAt || ''}
                onChange={(event) => handlePromotionFormInput('endsAt', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                value={promotionForm.status}
                onChange={(event) => handlePromotionFormInput('status', event.target.value as AdminPromotionPayload['status'])}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ACTIVE">Đang áp dụng</option>
                <option value="INACTIVE">Tạm tắt</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Số sách đã chọn</label>
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 font-semibold text-orange-700">
                {promotionForm.bookIds.length} / {promotionBooks.length} sách
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              rows={3}
              value={promotionForm.description || ''}
              onChange={(event) => handlePromotionFormInput('description', event.target.value)}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Ghi chú ngắn về chương trình"
            />
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Ảnh banner slider {promotionModalMode === 'create' && <span className="text-red-500">*</span>}
              </label>
              {(promotionBannerPreview || promotionForm.bannerImageUrl) && (
                <button
                  type="button"
                  onClick={clearPromotionBanner}
                  className="text-xs font-medium text-orange-600 hover:text-orange-700"
                >
                  Bỏ chọn ảnh
                </button>
              )}
            </div>
            <input
              ref={promotionBannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const isValid = handlePromotionBannerChange(event.target.files);
                if (!isValid) event.currentTarget.value = '';
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="mt-2 text-xs text-gray-500">Hỗ trợ jpg, png, webp. Tối đa 2MB. Ảnh này sẽ hiển thị trên slider trang chủ khi chương trình đang áp dụng.</p>
            {(promotionBannerPreview || promotionForm.bannerImageUrl) && (
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <img
                  src={promotionBannerPreview || promotionForm.bannerImageUrl || ''}
                  alt="Ảnh banner khuyến mãi"
                  className="h-48 w-full object-cover"
                />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200">
            <div className="border-b border-gray-100 px-4 py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h4 className="font-semibold text-gray-900">Sách áp dụng</h4>
                <span className="text-sm text-gray-500">
                  Đang hiện {filteredPromotionModalBooks.length} / {promotionBooks.length} sách
                </span>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.3fr_0.9fr_0.9fr_auto]">
                <input
                  value={promotionBookSearch}
                  onChange={(event) => setPromotionBookSearch(event.target.value)}
                  placeholder="Tìm theo tên sách, tác giả, ISBN..."
                  className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <select
                  value={promotionCategoryFilter}
                  onChange={(event) => setPromotionCategoryFilter(event.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả danh mục</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  value={promotionStockFilter}
                  onChange={(event) => setPromotionStockFilter(event.target.value as PromotionBookStockFilter)}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">Tất cả tồn kho</option>
                  <option value="in_stock">Còn hàng</option>
                  <option value="low_stock">Sắp hết hàng</option>
                  <option value="out_of_stock">Hết hàng</option>
                </select>
                <label className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700">
                  <input
                    type="checkbox"
                    checked={showSelectedPromotionBooksOnly}
                    onChange={(event) => setShowSelectedPromotionBooksOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  Đã chọn
                </label>
              </div>
            </div>
            <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto p-4 md:grid-cols-2">
              {filteredPromotionModalBooks.map((book) => {
                const checked = promotionForm.bookIds.includes(book.id);
                return (
                  <label key={book.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${checked ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePromotionBook(book.id)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <img src={getBookImage(book)} alt={book.title} className="h-14 w-10 rounded object-cover ring-1 ring-gray-200" />
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900">{book.title}</p>
                      <p className="text-xs text-gray-500">{book.author}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(book.price)}</p>
                    </div>
                  </label>
                );
              })}
              {filteredPromotionModalBooks.length === 0 && (
                <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  Không có sách phù hợp với bộ lọc.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-100"
            onClick={closePromotionModal}
          >
            Hủy
          </button>
          <button
            onClick={handleSavePromotionProgram}
            disabled={savingPromotion}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <CheckCircle2 className="h-5 w-5" />
            {savingPromotion ? 'Đang lưu...' : 'Lưu chương trình'}
          </button>
        </div>
      </div>
    </div>
  );
}
