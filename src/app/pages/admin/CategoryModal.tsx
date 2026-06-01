import { X } from 'lucide-react';
import type { AdminCategoryPayload } from '../../services/admin.service';

type CategoryModalProps = {
  categoryModalMode: 'create' | 'edit';
  categoryForm: AdminCategoryPayload;
  savingCategory: boolean;
  closeCategoryModal: () => void;
  handleCategoryInput: (field: keyof AdminCategoryPayload, value: string) => void;
  handleSaveCategory: () => void | Promise<void>;
};

export function CategoryModal({
  categoryModalMode,
  categoryForm,
  savingCategory,
  closeCategoryModal,
  handleCategoryInput,
  handleSaveCategory,
}: CategoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {categoryModalMode === 'create' ? 'Thêm danh mục' : 'Chỉnh sửa danh mục'}
            </h3>
            <p className="text-sm text-gray-500">Quản lý nhóm sách hiển thị trên website.</p>
          </div>
          <button
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            onClick={closeCategoryModal}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              value={categoryForm.name}
              onChange={(event) => handleCategoryInput('name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
              placeholder="Ví dụ: Kỹ năng sống"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Mô tả <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={categoryForm.description}
              onChange={(event) => handleCategoryInput('description', event.target.value)}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:ring-2 focus:ring-orange-500"
              placeholder="Mô tả ngắn giúp khách hàng hiểu nhóm sách này"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeCategoryModal}
            className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSaveCategory}
            disabled={savingCategory}
            className="rounded-lg bg-orange-500 px-5 py-2.5 font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingCategory ? 'Đang lưu...' : 'Lưu danh mục'}
          </button>
        </div>
      </div>
    </div>
  );
}
