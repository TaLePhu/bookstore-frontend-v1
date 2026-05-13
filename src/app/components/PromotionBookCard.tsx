import { ShoppingCart, Star } from 'lucide-react';
import type { PromotionBook } from '../services/promotion.service';

const formatCurrency = (value: number | string | null | undefined) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export function PromotionBookCard({
  book,
  onOpen,
  onAddToCart,
  promotionLabel,
}: {
  book: PromotionBook;
  onOpen: () => void;
  onAddToCart: () => void;
  promotionLabel?: string;
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
        {promotionLabel && (
          <div className="mb-3 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700">
            {promotionLabel}
          </div>
        )}

        <button
          type="button"
          onClick={onOpen}
          className="line-clamp-2 text-left font-bold text-gray-950 transition-colors hover:text-orange-600"
        >
          {book.title}
        </button>
        <div className="mt-2 flex items-center gap-1">
          {[...Array(5)].map((_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < Math.floor(book.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
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
