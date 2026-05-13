import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowRight, CalendarDays, Flame, ShoppingCart, Star, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getPromotions, type PromotionBook, type PromotionsResponse } from '../services/promotion.service';

const formatCurrency = (value: number | string | null | undefined) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDate = (value?: string | null) => {
  if (!value) return 'Không giới hạn';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không giới hạn' : date.toLocaleDateString('vi-VN');
};

export function PromotionsPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [promotions, setPromotions] = useState<PromotionsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const programs = promotions?.programs || [];
  const allPromotionBooks = useMemo(() => {
    const books = programs.flatMap((program) => program.books || []);
    return Array.from(new Map(books.map((book) => [book.id, book])).values());
  }, [programs]);
  const maxDiscount = useMemo(
    () => Math.max(...programs.map((program) => Number(program.discountPercent || 0)), 0),
    [programs]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-600 ring-1 ring-orange-100">
              <Flame className="h-4 w-4" />
              Chương trình đang áp dụng
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight text-gray-950 sm:text-5xl">
              Khuyến mãi sách hôm nay
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">
              Chỉ hiển thị các chương trình khuyến mãi đang hoạt động và còn trong thời gian áp dụng.
            </p>
            <button
              type="button"
              onClick={() => navigate('/promotions/books')}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
            >
              Xem toàn bộ sách khuyến mãi
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <Stat label="Chương trình" value={programs.length.toLocaleString('vi-VN')} />
            <Stat label="Sách khuyến mãi" value={allPromotionBooks.length.toLocaleString('vi-VN')} />
            <Stat label="Giảm cao nhất" value={`${maxDiscount}%`} />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {isLoading && (
          <div className="mb-8 rounded-2xl border border-orange-100 bg-white p-6 text-gray-600 shadow-sm">
            Đang tải dữ liệu khuyến mãi...
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && programs.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <Flame className="mx-auto mb-4 h-12 w-12 text-orange-500" />
            <h2 className="text-2xl font-bold text-gray-900">Chưa có chương trình khuyến mãi đang áp dụng</h2>
            <p className="mx-auto mt-2 max-w-xl text-gray-600">
              Khi admin tạo chương trình khuyến mãi ở trạng thái đang áp dụng và còn hiệu lực, chương trình sẽ xuất hiện tại đây.
            </p>
          </div>
        )}

        {programs.length > 0 && (
          <div className="space-y-8">
            {programs.map((program) => (
              <section key={program.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {program.bannerImageUrl && (
                  <button
                    type="button"
                    onClick={() => navigate(`/promotions/books?program=${encodeURIComponent(program.name)}`)}
                    className="block h-56 w-full overflow-hidden bg-gray-100 text-left sm:h-72"
                  >
                    <img
                      src={program.bannerImageUrl}
                      alt={program.name}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </button>
                )}

                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                          <Tag className="h-4 w-4" />
                          Giảm {program.discountPercent}%
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
                          <CalendarDays className="h-4 w-4" />
                          {formatDate(program.startsAt)} - {formatDate(program.endsAt)}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-950">{program.name}</h2>
                      {program.description && (
                        <p className="mt-2 max-w-3xl text-gray-600">{program.description}</p>
                      )}
                      <p className="mt-3 text-sm font-semibold text-orange-600">
                        {program.bookCount.toLocaleString('vi-VN')} sách trong chương trình
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => navigate(`/promotions/books?program=${encodeURIComponent(program.name)}`)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 font-semibold text-orange-700 transition-colors hover:bg-orange-100"
                    >
                      Xem toàn bộ sách
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {(program.books || []).slice(0, 4).map((book) => (
                      <PromotionBookCard
                        key={`${program.id}-${book.id}`}
                        book={book}
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
                </div>
              </section>
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

function PromotionBookCard({
  book,
  onOpen,
  onAddToCart,
}: {
  book: PromotionBook;
  onOpen: () => void;
  onAddToCart: () => void;
}) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-gray-100 text-left"
      >
        <img
          src={book.image}
          alt={book.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow">
          -{book.discount}%
        </div>
      </button>

      <div className="p-4">
        <div className="mb-2 flex items-center gap-1">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="line-clamp-2 text-left font-bold text-gray-950 transition-colors hover:text-orange-600"
        >
          {book.title}
        </button>
        <p className="mt-1 text-sm text-gray-600">{book.author}</p>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-xl font-bold text-red-600">{formatCurrency(book.price)}</span>
          <span className="text-sm text-gray-400 line-through">{formatCurrency(book.originalPrice)}</span>
        </div>

        <button
          onClick={onAddToCart}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <ShoppingCart className="h-4 w-4" />
          Thêm vào giỏ
        </button>
      </div>
    </div>
  );
}
