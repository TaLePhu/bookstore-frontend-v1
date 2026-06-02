import type React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { AdminCategory, AdminPromotionPayload } from '../../services/admin.service';
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
  const bannerPreviewSource = promotionBannerPreview || promotionForm.bannerImageUrl || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {promotionModalMode === 'edit' ? 'Sửa chương trình khuyến mãi' : 'Tạo chương trình khuyến mãi'}
            </h3>
            <p className="text-sm text-gray-500">Chọn sách, banner và thời gian áp dụng cho chương trình.</p>
          </div>
          <button
            type="button"
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
            <PromotionInput
              label="Tên chương trình"
              value={promotionForm.name}
              onChange={(value) => handlePromotionFormInput('name', value)}
              placeholder="Ví dụ: Sale hè 2026"
            />
            <PromotionInput
              label="Phần trăm giảm"
              type="number"
              value={String(promotionForm.discountPercent)}
              onChange={(value) => handlePromotionFormInput('discountPercent', value)}
            />
            <PromotionInput
              label="Ngày bắt đầu"
              type="date"
              value={promotionForm.startsAt || ''}
              onChange={(value) => handlePromotionFormInput('startsAt', value)}
            />
            <PromotionInput
              label="Ngày kết thúc"
              type="date"
              value={promotionForm.endsAt || ''}
              onChange={(value) => handlePromotionFormInput('endsAt', value)}
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Trạng thái</label>
              <select
                value={promotionForm.status}
                onChange={(event) => handlePromotionFormInput('status', event.target.value as AdminPromotionPayload['status'])}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="ACTIVE">Bật</option>
                <option value="INACTIVE">Tạm tắt</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Sách đã chọn</label>
              <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 font-semibold text-orange-700">
                {promotionForm.bookIds.length} / {promotionBooks.length} sách
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              value={promotionForm.description || ''}
              onChange={(event) => handlePromotionFormInput('description', event.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Nội dung ngắn hiển thị trên trang khuyến mãi"
            />
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Banner slider {promotionModalMode === 'create' && <span className="text-red-500">*</span>}
              </label>
              {bannerPreviewSource && (
                <button
                  type="button"
                  onClick={clearPromotionBanner}
                  className="text-sm font-semibold text-red-600 hover:text-red-700"
                >
                  Xóa banner
                </button>
              )}
            </div>
            <input
              ref={promotionBannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                const accepted = handlePromotionBannerChange(event.target.files);
                if (!accepted && promotionBannerInputRef.current) promotionBannerInputRef.current.value = '';
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <div className="mt-3">
              <label className="mb-2 block text-sm font-medium text-gray-700">Hoặc nhập URL banner</label>
              <input
                value={promotionForm.bannerImageUrl || ''}
                onChange={(event) => handlePromotionFormInput('bannerImageUrl', event.target.value)}
                placeholder="https://res.cloudinary.com/.../banner.jpg"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Nên dùng banner 1200x420 hoặc 1440x480. Banner sẽ được ưu tiên trên slider trang chủ khi chương trình đang hiệu lực.
            </p>
            {bannerPreviewSource && (
              <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                <img src={bannerPreviewSource} alt="Banner khuyến mãi" className="h-48 w-full object-cover" />
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row">
              <input
                value={promotionBookSearch}
                onChange={(event) => setPromotionBookSearch(event.target.value)}
                placeholder="Tìm sách trong chương trình..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={promotionCategoryFilter}
                onChange={(event) => setPromotionCategoryFilter(event.target.value)}
                className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tất cả danh mục</option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={promotionStockFilter}
                onChange={(event) => setPromotionStockFilter(event.target.value as PromotionBookStockFilter)}
                className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">Tất cả tồn kho</option>
                <option value="in_stock">Còn hàng</option>
                <option value="low_stock">Sắp hết hàng</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
            </div>

            <label className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={showSelectedPromotionBooksOnly}
                onChange={(event) => setShowSelectedPromotionBooksOnly(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              Chỉ xem sách đã chọn
            </label>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredPromotionModalBooks.map((book) => {
                const checked = promotionForm.bookIds.includes(book.id);
                return (
                  <label
                    key={book.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                      checked ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePromotionBook(book.id)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    <img src={getBookImage(book)} alt={book.title} className="h-14 w-10 rounded object-cover ring-1 ring-gray-200" />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-semibold text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-500">{book.author}</p>
                      <p className="text-xs text-gray-400">{book.category?.name || 'Chưa phân loại'} · Tồn: {book.stock}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-gray-900">{formatCurrency(book.price)}</p>
                      {checked && <CheckCircle2 className="ml-auto mt-1 h-4 w-4 text-orange-500" />}
                    </div>
                  </label>
                );
              })}
              {filteredPromotionModalBooks.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  Không có sách phù hợp.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 transition-colors hover:bg-gray-100"
            onClick={closePromotionModal}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSavePromotionProgram}
            disabled={savingPromotion}
            className="flex items-center gap-2 rounded-lg bg-orange-500 px-6 py-3 text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            {savingPromotion ? 'Đang lưu...' : promotionModalMode === 'edit' ? 'Lưu thay đổi' : 'Tạo chương trình'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromotionInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}
