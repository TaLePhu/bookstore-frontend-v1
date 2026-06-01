import type React from 'react';
import { AlertCircle, CheckCircle2, Percent, X } from 'lucide-react';
import type {
  AdminBookPayload,
  AdminCategory,
  AdminPromotion,
} from '../../services/admin.service';
import type { ApiBook } from '../../services/book.service';
import { getBookImage } from '../../utils/book-display';
import { BookImageGallery, BookInput, InfoBlock } from './components';
import type { BookImagePreview, BookModalMode, ExistingBookImage } from './types';
import { formatCurrency, formatDate } from './utils';

type BookModalProps = {
  bookModalMode: Exclude<BookModalMode, null>;
  selectedBook: ApiBook | null;
  bookForm: AdminBookPayload;
  activeCategories: AdminCategory[];
  deletedImageIds: string[];
  setDeletedImageIds: (value: string[]) => void;
  bookImagePreviews: BookImagePreview[];
  bookFormError: string;
  savingBook: boolean;
  bookImageInputRef: React.RefObject<HTMLInputElement>;
  closeBookModal: () => void;
  handleBookInput: (field: keyof AdminBookPayload, value: string | FileList) => void;
  handleBookImagesChange: (files: FileList | null) => boolean;
  clearSelectedBookImages: () => void;
  handleSaveBook: () => Promise<void>;
  getBookImageItems: (book: ApiBook | null) => ExistingBookImage[];
  getVisibleBookImageItems: (book: ApiBook | null) => ExistingBookImage[];
  toggleDeleteImage: (imageId?: string) => void;
  getPromotionForBook: (bookId?: string | null) => AdminPromotion | undefined;
  getPromotionStatusLabel: (promotion?: AdminPromotion) => string;
  formatFileSize: (size: number) => string;
};

export function BookModal({
  bookModalMode,
  selectedBook,
  bookForm,
  activeCategories,
  deletedImageIds,
  setDeletedImageIds,
  bookImagePreviews,
  bookFormError,
  savingBook,
  bookImageInputRef,
  closeBookModal,
  handleBookInput,
  handleBookImagesChange,
  clearSelectedBookImages,
  handleSaveBook,
  getBookImageItems,
  getVisibleBookImageItems,
  toggleDeleteImage,
  getPromotionForBook,
  getPromotionStatusLabel,
  formatFileSize,
}: BookModalProps) {
  const selectedPromotion = selectedBook ? getPromotionForBook(selectedBook.id) : undefined;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            {bookModalMode === 'create' && 'Thêm sách mới'}
            {bookModalMode === 'edit' && 'Chỉnh sửa sách'}
            {bookModalMode === 'detail' && 'Chi tiết sách'}
          </h3>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={closeBookModal}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {bookModalMode === 'detail' && selectedBook ? (
          <div className="p-6 space-y-6">
            {selectedPromotion && (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Percent className="h-5 w-5 text-orange-600" />
                      <h4 className="font-bold text-orange-900">Sách đang thuộc chương trình khuyến mãi</h4>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-200">
                        {getPromotionStatusLabel(selectedPromotion)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-orange-800">
                      {selectedPromotion.name} - giảm {selectedPromotion.discountPercent}%.
                    </p>
                    <p className="mt-1 text-xs text-orange-700">
                      Thời gian: {formatDate(selectedPromotion.startsAt)} - {formatDate(selectedPromotion.endsAt)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white px-4 py-3 text-right ring-1 ring-orange-100">
                    <p className="text-xs font-medium text-gray-500">Giá sau khuyến mãi</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(selectedBook.price)}</p>
                    {Number(selectedBook.discount || 0) > 0 && (
                      <p className="text-xs text-gray-400 line-through">{formatCurrency(selectedBook.originalPrice)}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-6 md:flex-row">
              <img
                src={getBookImage(selectedBook)}
                alt={selectedBook.title}
                className="w-full max-w-48 aspect-[3/4] object-cover rounded-lg border border-gray-200"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{selectedBook.title}</h4>
                  <p className="text-gray-600">{selectedBook.author}</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <InfoBlock
                    title="Thông tin bán hàng"
                    rows={[
                      ['Danh mục', selectedBook.category?.name || 'Chưa phân loại'],
                      ['Giá bán', formatCurrency(selectedBook.price)],
                      ['Giá gốc', formatCurrency(selectedBook.originalPrice)],
                      ['Tồn kho', String(selectedBook.stock ?? 0)],
                      ['Đã bán', String(selectedBook.soldCount ?? 0)],
                    ]}
                  />
                  <InfoBlock
                    title="Thông tin xuất bản"
                    rows={[
                      ['ISBN', selectedBook.isbn || 'Đang cập nhật'],
                      ['NXB', selectedBook.publisher || 'Đang cập nhật'],
                      ['Năm XB', selectedBook.publishYear ? String(selectedBook.publishYear) : 'Đang cập nhật'],
                      ['Số trang', selectedBook.pages ? String(selectedBook.pages) : 'Đang cập nhật'],
                      ['Ngôn ngữ', selectedBook.language || 'Đang cập nhật'],
                    ]}
                  />
                </div>
              </div>
            </div>
            <BookImageGallery images={getBookImageItems(selectedBook)} />
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Mô tả</h4>
              <p className="text-gray-800 leading-6 whitespace-pre-line">{selectedBook.description}</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BookInput label="Tên sách" value={bookForm.title} onChange={(value) => handleBookInput('title', value)} required />
              <BookInput label="Tác giả" value={bookForm.author} onChange={(value) => handleBookInput('author', value)} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <select
                  value={bookForm.categoryId}
                  onChange={(event) => handleBookInput('categoryId', event.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Chọn danh mục</option>
                  {activeCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <BookInput label="ISBN" value={bookForm.isbn} onChange={(value) => handleBookInput('isbn', value)} required />
              <BookInput label="Giá gốc" type="number" value={bookForm.originalPrice} onChange={(value) => handleBookInput('originalPrice', value)} required />
              {bookModalMode === 'edit' && selectedBook && (
                <div className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3">
                  <p className="text-sm font-medium text-gray-700">Giá bán hiện tại</p>
                  <p className="mt-1 text-lg font-bold text-orange-600">{formatCurrency(selectedBook.price)}</p>
                  <p className="mt-1 text-xs text-gray-500">Tự cập nhật theo chương trình khuyến mãi.</p>
                </div>
              )}
              <BookInput label="Tồn kho" type="number" value={bookForm.stock} onChange={(value) => handleBookInput('stock', value)} required />
              <BookInput label="Nhà xuất bản" value={bookForm.publisher || ''} onChange={(value) => handleBookInput('publisher', value)} />
              <BookInput label="Năm xuất bản" type="number" value={bookForm.publishYear || ''} onChange={(value) => handleBookInput('publishYear', value)} />
              <BookInput label="Số trang" type="number" value={bookForm.pages || ''} onChange={(value) => handleBookInput('pages', value)} />
              <BookInput label="Ngôn ngữ" value={bookForm.language || ''} onChange={(value) => handleBookInput('language', value)} />
              <BookInput label="Ngày phát hành" type="date" value={bookForm.releaseDate || ''} onChange={(value) => handleBookInput('releaseDate', value)} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={bookForm.description}
                onChange={(event) => handleBookInput('description', event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Nhập mô tả sách"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ảnh sách {bookModalMode === 'create' && <span className="text-red-500">*</span>}
              </label>
              {bookModalMode === 'edit' && selectedBook && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-700">Ảnh hiện có</p>
                    {deletedImageIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDeletedImageIds([])}
                        className="text-xs font-medium text-orange-600 hover:text-orange-700"
                      >
                        Hoàn tác xóa ảnh
                      </button>
                    )}
                  </div>
                  <BookImageGallery
                    images={getBookImageItems(selectedBook)}
                    compact
                    deletedImageIds={deletedImageIds}
                    onToggleDelete={toggleDeleteImage}
                  />
                  {getVisibleBookImageItems(selectedBook).length === 0 && (
                    <p className="mt-2 text-xs text-red-600">
                      Bạn đang chọn xóa toàn bộ ảnh hiện có. Hãy upload ít nhất một ảnh mới trước khi lưu.
                    </p>
                  )}
                </div>
              )}
              <input
                ref={bookImageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => {
                  const isValid = handleBookImagesChange(event.target.files);
                  if (!isValid) event.currentTarget.value = '';
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              {bookFormError && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{bookFormError}</span>
                </div>
              )}
              {bookImagePreviews.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-gray-700">Ảnh vừa chọn</p>
                    <button
                      type="button"
                      onClick={clearSelectedBookImages}
                      className="text-xs font-medium text-orange-600 hover:text-orange-700"
                    >
                      Bỏ chọn ảnh
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
                    {bookImagePreviews.map((preview, index) => (
                      <div key={preview.url} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <img
                          src={preview.url}
                          alt={`Ảnh vừa chọn ${index + 1}`}
                          className="h-32 w-full object-cover"
                        />
                        <div className="space-y-0.5 px-2 py-1.5">
                          <p className="truncate text-xs font-medium text-gray-700" title={preview.name}>
                            {preview.name}
                          </p>
                          <p className="text-xs text-gray-500">{formatFileSize(preview.size)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Hỗ trợ jpg, png, webp. Tối đa 5 ảnh, mỗi ảnh 2MB. Khi sửa, ảnh mới sẽ được thêm vào bộ ảnh hiện có; các ảnh được đánh dấu xóa sẽ bị xóa khi lưu.
              </p>
            </div>
          </div>
        )}

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={closeBookModal}
          >
            {bookModalMode === 'detail' ? 'Đóng' : 'Hủy'}
          </button>
          {bookModalMode !== 'detail' && (
            <button
              onClick={handleSaveBook}
              disabled={savingBook}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              {savingBook ? 'Đang lưu...' : 'Lưu sách'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
