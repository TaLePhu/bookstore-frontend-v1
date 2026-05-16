import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ArrowLeft, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { PromotionBookCard } from '../components/PromotionBookCard';
import { useCart } from '../context/CartContext';
import { getPromotions, type PromotionBook, type PromotionsResponse } from '../services/promotion.service';

const formatCurrency = (value: number | string | null | undefined) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const priceRanges = [
  { value: 'all', label: 'Tất cả khoảng giá', min: null, max: null },
  { value: '0-100000', label: 'Dưới 100.000đ', min: 0, max: 100000 },
  { value: '100000-200000', label: '100.000đ - 200.000đ', min: 100000, max: 200000 },
  { value: '200000-500000', label: '200.000đ - 500.000đ', min: 200000, max: 500000 },
  { value: '500000-up', label: 'Trên 500.000đ', min: 500000, max: null },
];

type PromotionBookResult = PromotionBook & {
  promotionId: string;
  promotionName: string;
  promotionDiscountPercent: number;
};

export function PromotionBooksPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [searchParams] = useSearchParams();
  const [promotions, setPromotions] = useState<PromotionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [programName, setProgramName] = useState(searchParams.get('program') || '');
  const [discountFrom, setDiscountFrom] = useState('all');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    let isMounted = true;

    const loadPromotions = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await getPromotions();

        if (isMounted) {
          setPromotions(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Không thể tải dữ liệu khuyến mãi.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPromotions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setProgramName(searchParams.get('program') || '');
  }, [searchParams]);

  const allPromotionBooks = useMemo<PromotionBookResult[]>(() => {
    const programs = promotions?.programs || [];

    return programs.flatMap((program) =>
      (program.books || []).map((book) => ({
        ...book,
        promotionId: program.id,
        promotionName: program.name,
        promotionDiscountPercent: Number(program.discountPercent || book.discount || 0),
      }))
    );
  }, [promotions]);

  const programOptions = useMemo(() => promotions?.programs || [], [promotions]);

  const filteredBooks = useMemo(() => {
    const discountValue = discountFrom === 'all' ? 0 : Number(discountFrom);
    const selectedPriceRange = priceRanges.find((range) => range.value === priceRange) || priceRanges[0];

    return allPromotionBooks.filter((book) => {
      const matchedProgram = !programName || book.promotionName === programName;
      const matchedDiscount = Math.max(book.discount, book.promotionDiscountPercent) >= discountValue;
      const matchedMinPrice = selectedPriceRange.min === null || book.price >= selectedPriceRange.min;
      const matchedMaxPrice = selectedPriceRange.max === null || book.price <= selectedPriceRange.max;

      return matchedProgram && matchedDiscount && matchedMinPrice && matchedMaxPrice;
    });
  }, [allPromotionBooks, discountFrom, priceRange, programName]);

  const hasFilters = Boolean(programName || discountFrom !== 'all' || priceRange !== 'all');
  const maxDiscount = Math.max(...allPromotionBooks.map((book) => Math.max(book.discount, book.promotionDiscountPercent)), 0);

  const resetFilters = () => {
    setProgramName('');
    setDiscountFrom('all');
    setPriceRange('all');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Link
            to="/promotions"
            className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition-colors hover:text-orange-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại chương trình khuyến mãi
          </Link>
          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 ring-1 ring-orange-100">
                <SlidersHorizontal className="h-4 w-4" />
                Bộ lọc sách khuyến mãi
              </div>
              <h1 className="text-3xl font-bold text-gray-950 sm:text-4xl">Toàn bộ sách khuyến mãi</h1>
              <p className="mt-3 max-w-2xl text-gray-600">
                Lọc sách theo tên chương trình, phần trăm giảm và khoảng giá bán đang áp dụng.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-0">
              <Stat label="Sách khuyến mãi" value={allPromotionBooks.length.toLocaleString('vi-VN')} />
              <Stat label="Đang hiển thị" value={filteredBooks.length.toLocaleString('vi-VN')} />
              <Stat label="Giảm cao nhất" value={`${maxDiscount}%`} />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.9fr_auto] lg:items-end">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Search className="h-4 w-4 text-orange-500" />
                Tên chương trình
              </span>
              <select
                value={programName}
                onChange={(event) => setProgramName(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Tất cả chương trình</option>
                {programOptions.map((program) => (
                  <option key={program.id} value={program.name}>
                    {program.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Filter className="h-4 w-4 text-orange-500" />
                % khuyến mãi
              </span>
              <select
                value={discountFrom}
                onChange={(event) => setDiscountFrom(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">Tất cả</option>
                <option value="10">Từ 10%</option>
                <option value="20">Từ 20%</option>
                <option value="30">Từ 30%</option>
                <option value="40">Từ 40%</option>
                <option value="50">Từ 50%</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">Khoảng giá</span>
              <select
                value={priceRange}
                onChange={(event) => setPriceRange(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              Xóa lọc
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-orange-100 bg-white p-6 text-gray-600 shadow-sm">
            Đang tải dữ liệu khuyến mãi...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && filteredBooks.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900">Không tìm thấy sách phù hợp</h2>
            <p className="mx-auto mt-2 max-w-xl text-gray-600">
              Thử đổi tên chương trình, giảm mức % khuyến mãi hoặc mở rộng khoảng giá.
            </p>
          </div>
        )}

        {filteredBooks.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBooks.map((book) => (
              <PromotionBookCard
                key={`${book.promotionId}-${book.id}`}
                book={book}
                promotionLabel={`${book.promotionName} - giảm ${book.promotionDiscountPercent}%`}
                onOpen={() => navigate(`/book/${book.id}`)}
                onAddToCart={() =>
                  addToCart({
                    id: book.id,
                    title: book.title,
                    author: book.author,
                    price: formatCurrency(book.price),
                    image: book.image,
                  })
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
      <div className="text-2xl font-bold text-gray-950">{value}</div>
      <div className="mt-1 text-sm text-gray-500">{label}</div>
    </div>
  );
}
