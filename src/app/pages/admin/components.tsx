import type React from 'react';
import { BarChart3, Search } from 'lucide-react';
import type { ExistingBookImage } from './types';

export function SearchBox({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

export function BookInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

export function UserInput({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

export function BookImageGallery({
  images,
  compact = false,
  deletedImageIds = [],
  onToggleDelete,
}: {
  images: ExistingBookImage[];
  compact?: boolean;
  deletedImageIds?: string[];
  onToggleDelete?: (imageId?: string) => void;
}) {
  if (images.length === 0) {
    return <p className="text-sm text-gray-500">Chưa có ảnh sách.</p>;
  }

  return (
    <div className={`grid gap-3 ${compact ? 'grid-cols-3 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'}`}>
      {images.map((image, index) => {
        const isDeleted = Boolean(image.id && deletedImageIds.includes(image.id));

        return (
          <div
            key={`${image.url}-${index}`}
            className={`relative overflow-hidden rounded-lg border bg-white ${
              isDeleted ? 'border-red-300 opacity-60' : 'border-gray-200'
            }`}
          >
            <img
              src={image.url}
              alt={`Ảnh sách ${index + 1}`}
              className={`${compact ? 'h-24' : 'h-32'} w-full object-cover`}
            />
            {onToggleDelete && image.id && (
              <button
                type="button"
                onClick={() => onToggleDelete(image.id)}
                className={`absolute right-2 top-2 rounded-md px-2 py-1 text-xs font-medium shadow-sm ${
                  isDeleted
                    ? 'bg-white text-red-600 hover:bg-red-50'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isDeleted ? 'Hoàn tác' : 'Xóa'}
              </button>
            )}
            {image.isPrimary && !isDeleted && (
              <div className="absolute left-2 top-2 rounded-md bg-orange-500 px-2 py-1 text-xs font-medium text-white">
                Chính
              </div>
            )}
            {isDeleted && (
              <div className="absolute inset-x-0 bottom-0 bg-red-600/90 px-2 py-1 text-center text-xs font-medium text-white">
                Sẽ xóa khi lưu
              </div>
            )}
            {!compact && (
              <div className="px-2 py-1 text-center text-xs text-gray-500">
                Ảnh {index + 1}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TableHead({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return (
    <th className={`px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  className = '',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}) {
  return <td className={`px-5 py-4 align-top text-sm text-gray-700 ${align === 'right' ? 'text-right' : 'text-left'} ${className}`}>{children}</td>;
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 px-6 py-10 text-gray-500">
      <BarChart3 className="w-5 h-5" />
      {text}
    </div>
  );
}

export function InfoBlock({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-500 mb-3">{title}</h4>
      <div className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium text-gray-800 text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
