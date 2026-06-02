import type React from 'react';
import { useRef, useState } from 'react';
import {
  AlertCircle,
  ArchiveX,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  Filter,
  Package,
  Plus,
  RefreshCcw,
  RotateCcw,
  Tags,
  Trash2,
  Upload,
} from 'lucide-react';
import type {
  AdminBookImportPayload,
  AdminBookImportResult,
  AdminCategory,
  AdminPromotion,
} from '../../services/admin.service';
import type { ApiBook } from '../../services/book.service';
import { getBookImage } from '../../utils/book-display';
import { LOW_STOCK_THRESHOLD } from './constants';
import { EmptyState, SearchBox, TableCell, TableHead } from './components';
import type {
  BookCategoryFilter,
  BookPriceFilter,
  BookPromotionFilter,
  BookSortOption,
  BookStockFilter,
  BookVisibilityFilter,
} from './types';
import { formatCurrency, formatDate, getBookStatusMeta } from './utils';

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
  bookPromotionFilter: BookPromotionFilter;
  setBookPromotionFilter: (value: BookPromotionFilter) => void;
  bookPriceFilter: BookPriceFilter;
  setBookPriceFilter: (value: BookPriceFilter) => void;
  bookSortOption: BookSortOption;
  setBookSortOption: (value: BookSortOption) => void;
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
  handleImportBooks: (payload: AdminBookImportPayload[]) => Promise<AdminBookImportResult>;
  bookCurrentPage: number;
  totalBookPages: number;
  setBookCurrentPage: React.Dispatch<React.SetStateAction<number>>;
};

const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const IMPORT_COLUMNS = [
  'title',
  'author',
  'isbn',
  'categoryName',
  'categoryId',
  'originalPrice',
  'stock',
  'description',
  'publisher',
  'publishYear',
  'pages',
  'language',
  'releaseDate',
  'imageUrl',
];

const parseCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
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
  bookPromotionFilter,
  setBookPromotionFilter,
  bookPriceFilter,
  setBookPriceFilter,
  bookSortOption,
  setBookSortOption,
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
  handleImportBooks,
  bookCurrentPage,
  totalBookPages,
  setBookCurrentPage,
}: BooksViewProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [importingBooks, setImportingBooks] = useState(false);
  const [importResult, setImportResult] = useState<AdminBookImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const activeBookCount = books.filter((book) => !isBookDeleted(book)).length;
  const discountedBookCount = books.filter((book) => !isBookDeleted(book) && Number(book.discount || 0) > 0).length;
  const deletedBookCount = books.filter(isBookDeleted).length;

  const resetFilters = () => {
    setSearchQuery('');
    setBookStockFilter('all');
    setBookCategoryFilter('all');
    setBookPromotionFilter('all');
    setBookPriceFilter('all');
    setBookSortOption('latest');
    if (isAdmin) setBookVisibilityFilter('active');
  };

  const exportBooks = () => {
    const rows = [
      ['Ten sach', 'Tac gia', 'ISBN', 'Danh muc', 'Gia ban', 'Ton kho', 'Da ban', 'Trang thai'],
      ...filteredBooks.map((book) => [
        book.title,
        book.author,
        book.isbn || '',
        book.category?.name || 'Chua phan loai',
        Number(book.price || 0),
        Number(book.stock || 0),
        Number(book.soldCount || 0),
        getBookStatusMeta(book).label,
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'danh-sach-sach.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadImportTemplate = () => {
    const sampleCategory = activeCategories[0]?.name || 'Tên danh mục đang có';
    const rows = [
      IMPORT_COLUMNS,
      [
        'Sách mẫu',
        'Tác giả mẫu',
        '9786040000001',
        sampleCategory,
        '',
        '120000',
        '20',
        'Mô tả sách mẫu',
        'NXB Trẻ',
        '2025',
        '256',
        'Tiếng Việt',
        '2026-06-01',
        '',
      ],
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mau-import-sach.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const parseImportCsv = (content: string): AdminBookImportPayload[] => {
    const lines = content
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      throw new Error('File CSV cần có dòng tiêu đề và ít nhất một dòng sách.');
    }

    const headers = parseCsvLine(lines[0]).map((header) => header.trim());
    const categoryByName = new Map(activeCategories.map((category) => [category.name.trim().toLowerCase(), category.id]));

    return lines.slice(1).map((line) => {
      const values = parseCsvLine(line);
      const row = headers.reduce<Record<string, string>>((acc, header, cellIndex) => {
        acc[header] = values[cellIndex] || '';
        return acc;
      }, {});
      const categoryId = row.categoryId || categoryByName.get((row.categoryName || '').trim().toLowerCase()) || '';

      return {
        title: row.title,
        author: row.author,
        isbn: row.isbn,
        categoryId,
        originalPrice: row.originalPrice,
        stock: row.stock,
        description: row.description,
        publisher: row.publisher,
        publishYear: row.publishYear,
        pages: row.pages,
        language: row.language || 'Tiếng Việt',
        releaseDate: row.releaseDate,
        imageUrl: row.imageUrl,
      };
    });
  };

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImportError('');
    setImportResult(null);

    try {
      setImportingBooks(true);
      const content = await file.text();
      const payload = parseImportCsv(content);
      const result = await handleImportBooks(payload);
      setImportResult(result);
    } catch (error: any) {
      setImportError(error?.message || 'Không thể import file CSV.');
    } finally {
      setImportingBooks(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <BookMetricCard icon={Package} label="Sách đang bán" value={activeBookCount} tone="emerald" />
        <BookMetricCard icon={AlertCircle} label="Sắp hết hàng" value={lowStockBooks.length} tone="amber" />
        <BookMetricCard icon={ArchiveX} label="Hết hàng" value={outOfStockBooks.length} tone="rose" />
        <BookMetricCard icon={Tags} label="Đang khuyến mãi" value={discountedBookCount} tone="orange" />
      </div>

      {(outOfStockBooks.length > 0 || lowStockBooks.length > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h4 className="font-semibold text-amber-900">Cảnh báo tồn kho</h4>
              <p className="mt-1 text-sm text-amber-800">
                Có {outOfStockBooks.length} sách hết hàng và {lowStockBooks.length} sách sắp hết hàng. Staff chỉ xem chi tiết, admin xử lý cập nhật trong form sửa sách.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-950">Quản lý sách</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filteredBooks.length.toLocaleString('vi-VN')} sách phù hợp. {isAdmin ? `${deletedBookCount} sách đã xóa mềm.` : 'Staff chỉ có quyền xem thông tin sách.'}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={downloadImportTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Tải mẫu
              </button>
              {isAdmin && (
                <>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleImportFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importingBooks}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
                  >
                    <Upload className="h-4 w-4" />
                    {importingBooks ? 'Đang import...' : 'Import CSV'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={exportBooks}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Xuất CSV
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={openCreateBook}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4" />
                  Thêm sách
                </button>
              )}
            </div>
          </div>

          {(importError || importResult) && (
            <div className={`rounded-xl border px-4 py-3 text-sm ${importError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              {importError ? (
                <p>{importError}</p>
              ) : importResult ? (
                <div>
                  <p className="font-semibold">
                    Đã import {importResult.created} sách, bỏ qua {importResult.skipped} dòng.
                  </p>
                  {importResult.errors.length > 0 && (
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
                      {importResult.errors.slice(0, 5).map((item) => (
                        <li key={`${item.row}-${item.isbn || item.title || item.message}`}>
                          Dòng {item.row}: {item.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto]">
            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo tên, tác giả, ISBN, NXB..." />
            {isAdmin && (
              <select
                value={bookVisibilityFilter}
                onChange={(event) => setBookVisibilityFilter(event.target.value as BookVisibilityFilter)}
                className="rounded-lg border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="active">Đang bán</option>
                <option value="deleted">Đã xóa mềm</option>
                <option value="all">Tất cả</option>
              </select>
            )}
            <select
              value={bookStockFilter}
              onChange={(event) => setBookStockFilter(event.target.value as BookStockFilter)}
              className="rounded-lg border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tất cả tồn kho</option>
              <option value="in_stock">Còn hàng</option>
              <option value="low_stock">Sắp hết</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
            <select
              value={bookCategoryFilter}
              onChange={(event) => setBookCategoryFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tất cả danh mục</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              <option value="uncategorized">Chưa phân loại</option>
            </select>
            <select
              value={bookPromotionFilter}
              onChange={(event) => setBookPromotionFilter(event.target.value as BookPromotionFilter)}
              className="rounded-lg border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tất cả khuyến mãi</option>
              <option value="discounted">Đang giảm giá</option>
              <option value="not_discounted">Không giảm giá</option>
            </select>
            <select
              value={bookPriceFilter}
              onChange={(event) => setBookPriceFilter(event.target.value as BookPriceFilter)}
              className="rounded-lg border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tất cả giá</option>
              <option value="under_100">Dưới 100k</option>
              <option value="100_200">100k - 200k</option>
              <option value="over_200">Trên 200k</option>
            </select>
            <select
              value={bookSortOption}
              onChange={(event) => setBookSortOption(event.target.value as BookSortOption)}
              className="rounded-lg border border-gray-300 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="latest">Mới nhất</option>
              <option value="bestseller">Bán chạy</option>
              <option value="stock_low">Tồn thấp</option>
              <option value="price_asc">Giá tăng</option>
              <option value="price_desc">Giá giảm</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900">Danh sách sách</h3>
          </div>
          <p className="text-sm text-gray-500">
            Trang {bookCurrentPage}/{totalBookPages}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px]">
            <thead className="bg-slate-50/80">
              <tr>
                <TableHead>Sách</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Giá bán</TableHead>
                <TableHead>Tồn kho</TableHead>
                <TableHead>Bán</TableHead>
                <TableHead>Khuyến mãi</TableHead>
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
                  <tr key={book.id} className={`transition-colors hover:bg-orange-50/30 ${isBookDeleted(book) ? 'bg-gray-50/80' : 'bg-white'}`}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-4">
                        <img src={getBookImage(book)} alt={book.title} className="h-20 w-14 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-gray-200" />
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-semibold leading-6 text-gray-950">{book.title}</p>
                          <p className="mt-1 text-sm text-gray-500">{book.author}</p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                            {book.isbn && <span className="rounded-full bg-gray-100 px-2 py-1">ISBN {book.isbn}</span>}
                            {book.publisher && <span className="rounded-full bg-gray-100 px-2 py-1">{book.publisher}</span>}
                            {book.releaseDate && <span className="rounded-full bg-gray-100 px-2 py-1">{formatDate(book.releaseDate)}</span>}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{book.category?.name || 'Chưa phân loại'}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className={`font-semibold ${hasDiscount ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(book.price)}</p>
                        {hasDiscount && (
                          <>
                            <p className="text-xs text-gray-400 line-through">{formatCurrency(book.originalPrice)}</p>
                            <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                              -{Number(book.discount || 0)}%
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${stock <= 0 ? 'text-red-600' : stock <= LOW_STOCK_THRESHOLD ? 'text-amber-600' : 'text-gray-900'}`}>
                        {stock.toLocaleString('vi-VN')}
                      </span>
                    </TableCell>
                    <TableCell>{Number(book.soldCount || 0).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>
                      {bookPromotion ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${promotionActive ? 'bg-orange-50 text-orange-700 ring-orange-100' : 'bg-gray-50 text-gray-600 ring-gray-100'}`}>
                          {bookPromotion.discountPercent}% - {getPromotionStatusLabel(bookPromotion)}
                        </span>
                      ) : hasDiscount ? (
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-100">Giảm trực tiếp</span>
                      ) : (
                        <span className="text-sm text-gray-400">Không</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusMeta.className}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                        {statusMeta.label}
                      </span>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <IconButton title="Xem chi tiết" onClick={() => openBookDetail(book, 'detail')} tone="blue">
                          <Eye className="h-4 w-4" />
                        </IconButton>
                        {isAdmin && (
                          <IconButton title="Chỉnh sửa" onClick={() => openBookDetail(book, 'edit')} disabled={isBookDeleted(book)} tone="orange">
                            <Edit className="h-4 w-4" />
                          </IconButton>
                        )}
                        {isAdmin && !isBookDeleted(book) && (
                          <IconButton title="Xóa mềm: ẩn khỏi trang bán hàng" onClick={() => handleSoftDeleteBook(book)} disabled={deletingBookId === book.id} tone="red">
                            <ArchiveX className="h-4 w-4" />
                          </IconButton>
                        )}
                        {isAdmin && isBookDeleted(book) && (
                          <IconButton title="Khôi phục sách" onClick={() => handleRestoreDeletedBook(book)} disabled={deletingBookId === book.id} tone="green">
                            <RefreshCcw className="h-4 w-4" />
                          </IconButton>
                        )}
                        {isAdmin && (
                          <IconButton title="Xóa vĩnh viễn" onClick={() => handlePermanentDeleteBook(book)} disabled={deletingBookId === book.id} tone="rose">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
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
              Hiển thị {paginatedBooks.length} / {filteredBooks.length} sách
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
                      page === bookCurrentPage ? 'bg-orange-500 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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

function BookMetricCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  tone: 'emerald' | 'amber' | 'rose' | 'orange';
}) {
  const tones = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
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
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}

function IconButton({
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
  tone: 'blue' | 'orange' | 'red' | 'green' | 'rose';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-600 ring-blue-100 hover:bg-blue-100',
    orange: 'bg-orange-50 text-orange-600 ring-orange-100 hover:bg-orange-100',
    red: 'bg-red-50 text-red-600 ring-red-100 hover:bg-red-100',
    green: 'bg-green-50 text-green-600 ring-green-100 hover:bg-green-100',
    rose: 'bg-rose-50 text-rose-700 ring-rose-100 hover:bg-rose-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}
