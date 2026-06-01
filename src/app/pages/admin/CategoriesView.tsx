import { ArchiveX, Edit, FolderTree, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import type { AdminCategory } from '../../services/admin.service';
import { EmptyState, SearchBox, TableCell, TableHead } from './components';
import type { CategoryBookFilter, CategoryVisibilityFilter } from './types';
import { formatDate } from './utils';

type CategoriesViewProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  categoryVisibilityFilter: CategoryVisibilityFilter;
  setCategoryVisibilityFilter: (value: CategoryVisibilityFilter) => void;
  categoryBookFilter: CategoryBookFilter;
  setCategoryBookFilter: (value: CategoryBookFilter) => void;
  activeCategories: AdminCategory[];
  filteredCategories: AdminCategory[];
  openCreateCategory: () => void;
  openEditCategory: (category: AdminCategory) => void;
  handleSoftDeleteCategory: (category: AdminCategory) => Promise<void>;
  handleRestoreCategory: (category: AdminCategory) => Promise<void>;
  handleHardDeleteCategory: (category: AdminCategory) => void;
  deletingCategoryId: string | null;
  getCategoryBookCount: (categoryId: string) => number;
  isCategoryDeleted: (category: AdminCategory) => boolean;
};

export function CategoriesView({
  searchQuery,
  setSearchQuery,
  categoryVisibilityFilter,
  setCategoryVisibilityFilter,
  categoryBookFilter,
  setCategoryBookFilter,
  activeCategories,
  filteredCategories,
  openCreateCategory,
  openEditCategory,
  handleSoftDeleteCategory,
  handleRestoreCategory,
  handleHardDeleteCategory,
  deletingCategoryId,
  getCategoryBookCount,
  isCategoryDeleted,
}: CategoriesViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm danh mục theo tên hoặc mô tả..." />
        <select
          value={categoryVisibilityFilter}
          onChange={(event) => setCategoryVisibilityFilter(event.target.value as CategoryVisibilityFilter)}
          className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="active">Danh mục đang dùng</option>
          <option value="deleted">Danh mục đã xóa mềm</option>
          <option value="all">Tất cả danh mục</option>
        </select>
        <select
          value={categoryBookFilter}
          onChange={(event) => setCategoryBookFilter(event.target.value as CategoryBookFilter)}
          className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tất cả số sách</option>
          <option value="with_books">Có sách</option>
          <option value="empty">Không có sách</option>
        </select>
        <button
          onClick={openCreateCategory}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-5 w-5" />
          Thêm danh mục
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng danh mục</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{activeCategories.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Đang có sách</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">
            {activeCategories.filter((category) => getCategoryBookCount(category.id) > 0).length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Chưa có sách</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {activeCategories.filter((category) => getCategoryBookCount(category.id) === 0).length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách danh mục</h3>
          <p className="text-sm text-gray-500">
            {filteredCategories.length.toLocaleString('vi-VN')} danh mục phù hợp với bộ lọc hiện tại
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50/80">
              <tr>
                <TableHead>Danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số sách</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead align="right">Thao tác</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.map((category) => {
                const bookCount = getCategoryBookCount(category.id);
                const deleted = isCategoryDeleted(category);
                return (
                  <tr key={category.id} className={`transition-colors hover:bg-orange-50/30 ${deleted ? 'bg-gray-50/80 opacity-80' : 'bg-white'}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                          <FolderTree className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-950">{category.name}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <p className="text-xs text-gray-500">{category.id.slice(0, 8)}</p>
                            {deleted && (
                              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-700">
                                Đã xóa mềm
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-xl line-clamp-2 text-gray-600">
                        {category.description || 'Chưa có mô tả'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
                        bookCount > 0
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          : 'bg-gray-100 text-gray-600 ring-gray-200'
                      }`}>
                        {bookCount.toLocaleString('vi-VN')} sách
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(category.createdAt)}</TableCell>
                    <TableCell align="right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => openEditCategory(category)}
                          disabled={deleted}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Chỉnh sửa danh mục"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleSoftDeleteCategory(category)}
                          disabled={deletingCategoryId === category.id || deleted}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Xóa mềm danh mục"
                        >
                          <ArchiveX className="h-4 w-4" />
                        </button>
                        {deleted && (
                          <button
                            onClick={() => handleRestoreCategory(category)}
                            disabled={deletingCategoryId === category.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 ring-1 ring-green-100 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Khôi phục danh mục"
                          >
                            <RefreshCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleHardDeleteCategory(category)}
                          disabled={deletingCategoryId === category.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                          title="Xóa cứng danh mục"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCategories.length === 0 && <EmptyState text="Không có danh mục phù hợp." />}
      </div>
    </div>
  );
}
