import type React from 'react';
import { AlertCircle, ArchiveX, Edit, Eye, Plus, RefreshCcw, Trash2 } from 'lucide-react';
import type { AdminCategory, AdminPromotion } from '../../services/admin.service';
import type { ApiBook } from '../../services/book.service';
import { getBookImage } from '../../utils/book-display';
import { LOW_STOCK_THRESHOLD } from './constants';
import { EmptyState, SearchBox, TableCell, TableHead } from './components';
import type { BookCategoryFilter, BookStockFilter, BookVisibilityFilter } from './types';
import { formatCurrency, getBookStatusMeta } from './utils';

type BooksViewProps = {
  isAdmin: boolean;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  books: ApiBook[];
  filteredBooks: ApiBook[];
  paginatedBooks: ApiBook[];
  outOfStockBooks: ApiBook[];
  lowStockBooks: ApiBook[];
  activeCategories: AdminCategory[];
  bookVisibilityFilter: BookVisibilityFilter;
  setBookVisibilityFilter: (value: BookVisibilityFilter) => void;
  bookStockFilter: BookStockFilter;
  setBookStockFilter: (value: BookStockFilter) => void;
  bookCategoryFilter: BookCategoryFilter;
  setBookCategoryFilter: (value: BookCategoryFilter) => void;
  openCreateBook: () => void;
  openBookDetail: (book: ApiBook, mode: 'detail' | 'edit') => Promise<void>;
  handleSoftDeleteBook: (book: ApiBook) => Promise<void>;
  handleRestoreDeletedBook: (book: ApiBook) => Promise<void>;
  handlePermanentDeleteBook: (book: ApiBook) => void;
  deletingBookId: string | null;
  isBookDeleted: (book: ApiBook) => boolean;
  getPromotionForBook: (bookId?: string | null) => AdminPromotion | undefined;
  isPromotionCurrentlyActive: (promotion?: AdminPromotion) => boolean;
  getPromotionStatusLabel: (promotion?: AdminPromotion) => string;
  bookCurrentPage: number;
  totalBookPages: number;
  setBookCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

export function BooksView({
  isAdmin,
  searchQuery,
  setSearchQuery,
  books,
  filteredBooks,
  paginatedBooks,
  outOfStockBooks,
  lowStockBooks,
  activeCategories,
  bookVisibilityFilter,
  setBookVisibilityFilter,
  bookStockFilter,
  setBookStockFilter,
  bookCategoryFilter,
  setBookCategoryFilter,
  openCreateBook,
  openBookDetail,
  handleSoftDeleteBook,
  handleRestoreDeletedBook,
  handlePermanentDeleteBook,
  deletingBookId,
  isBookDeleted,
  getPromotionForBook,
  isPromotionCurrentlyActive,
  getPromotionStatusLabel,
  bookCurrentPage,
  totalBookPages,
  setBookCurrentPage,
}: BooksViewProps) {
  return (
    <div className="space-y-6">
      {outOfStockBooks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-800">Có {outOfStockBooks.length} sách hết hàng</h4>
            <p className="text-sm text-red-700">{outOfStockBooks.map((book) => book.title).join(', ')}</p>
          </div>
        </div>
      )}

      {lowStockBooks.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800">
              Có {lowStockBooks.length} sách sắp hết hàng
            </h4>
            <p className="text-sm text-yellow-700">
              {lowStockBooks.map((book) => `${book.title} (${Number(book.stock || 0)} cuốn)`).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm sách theo tên, tác giả, danh mục..." />
        {isAdmin && (
          <select
            value={bookVisibilityFilter}
            onChange={(event) => setBookVisibilityFilter(event.target.value as BookVisibilityFilter)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="active">Sách đang bán</option>
            <option value="deleted">Sách đã xóa mềm</option>
            <option value="all">Tất cả sách</option>
          </select>
        )}
        <select
          value={bookStockFilter}
          onChange={(event) => setBookStockFilter(event.target.value as BookStockFilter)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tất cả tồn kho</option>
          <option value="in_stock">Còn hàng</option>
          <option value="low_stock">Sắp hết hàng</option>
          <option value="out_of_stock">Hết hàng</option>
        </select>
        <select
          value={bookCategoryFilter}
          onChange={(event) => setBookCategoryFilter(event.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">Tất cả danh mục</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
          <option value="uncategorized">Chưa phân loại</option>
        </select>
        {isAdmin && (
          <button
            onClick={openCreateBook}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 md:w-auto"
          >
            <Plus className="w-5 h-5" />
            Thêm sách mới
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sách</h3>
            <p className="text-sm text-gray-500">
              {filteredBooks.length.toLocaleString('vi-VN')} mục phù hợp với bộ lọc hiện tại
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
              Còn hàng: {books.filter((book) => !isBookDeleted(book) && Number(book.stock || 0) > LOW_STOCK_THRESHOLD).length}
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
              Sắp hết: {lowStockBooks.length}
            </span>
            <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">
              Hết hàng: {outOfStockBooks.length}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="bg-slate-50/80">
              <tr>
                <TableHead>Sách</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Đã bán</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead align="right">Thao tác</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedBooks.map((book) => {
                const statusMeta = getBookStatusMeta(book);
                const stock = Number(book.stock || 0);
                const bookPromotion = getPromotionForBook(book.id);
                const promotionActive = isPromotionCurrentlyActive(bookPromotion);
                const hasDiscount = Number(book.discount || 0) > 0;

                return (
                  <tr key={book.id} title={statusMeta.label} className={`transition-colors hover:bg-orange-50/30 ${isBookDeleted(book) ? 'bg-gray-50/80' : 'bg-white'}`}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm ring-1 ring-gray-200">
                          <img
                            src={getBookImage(book)}
                            alt={book.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm font-semibold leading-6 text-gray-950">{book.title}</p>
                          <p className="mt-1 text-sm text-gray-500">{book.author}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                            {book.isbn && (
                              <span className="rounded-full bg-gray-100 px-2 py-1">ISBN {book.isbn}</span>
                            )}
                            {book.publisher && (
                              <span className="rounded-full bg-gray-100 px-2 py-1">{book.publisher}</span>
                            )}
                            {bookPromotion && (
                              <span
                                className={`rounded-full px-2 py-1 font-semibold ${
                                  promotionActive
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                KM {bookPromotion.discountPercent}% - {getPromotionStatusLabel(bookPromotion)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{book.category?.name || 'Chưa phân loại'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <span className={`font-semibold ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatCurrency(book.price)}
                        </span>
                        {hasDiscount && (
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-400 line-through">
                              {formatCurrency(book.originalPrice)}
                            </span>
                            <span className="w-fit rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                              -{Number(book.discount || 0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${stock <= 0 ? 'text-red-600' : stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-gray-900'}`}>
                        {stock.toLocaleString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell>{Number(book.soldCount || 0).toLocaleString('vi-VN')}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {isBookDeleted(book) ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">Đã xóa mềm</span>
                      ) : Number(book.stock || 0) > 0 && Number(book.stock || 0) <= LOW_STOCK_THRESHOLD ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Sắp hết hàng</span>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full ${Number(book.stock || 0) > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {Number(book.stock || 0) > 0 ? 'Còn hàng' : 'Hết hàng'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => openBookDetail(book, 'detail')}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 transition-colors hover:bg-blue-100"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => openBookDetail(book, 'edit')}
                            disabled={isBookDeleted(book)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleSoftDeleteBook(book)}
                            disabled={deletingBookId === book.id || isBookDeleted(book)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-100 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Xóa mềm: ẩn sách khỏi trang bán hàng"
                          >
                            <ArchiveX className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && isBookDeleted(book) && (
                          <button
                            onClick={() => handleRestoreDeletedBook(book)}
                            disabled={deletingBookId === book.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600 ring-1 ring-green-100 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Khôi phục sách đã xóa mềm"
                          >
                            <RefreshCcw className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handlePermanentDeleteBook(book)}
                            disabled={deletingBookId === book.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-700 ring-1 ring-rose-100 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                            title="Xóa cứng vĩnh viễn"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredBooks.length === 0 && <EmptyState text="Không có sách phù hợp." />}
        {filteredBooks.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              Trang {bookCurrentPage}/{totalBookPages} • Hiển thị {paginatedBooks.length} / {filteredBooks.length} sách
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setBookCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={bookCurrentPage === 1}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalBookPages }, (_, index) => index + 1)
                .slice(Math.max(0, bookCurrentPage - 3), Math.max(5, Math.min(totalBookPages, bookCurrentPage + 2)))
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setBookCurrentPage(page)}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors ${
                      page === bookCurrentPage
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => setBookCurrentPage((prev) => Math.min(totalBookPages, prev + 1))}
                disabled={bookCurrentPage === totalBookPages}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
