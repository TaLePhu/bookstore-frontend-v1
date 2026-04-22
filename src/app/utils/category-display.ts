import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Book,
  Briefcase,
  Cpu,
  GraduationCap,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export interface ApiCategory {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface DisplayCategory extends ApiCategory {
  icon: LucideIcon;
  color: string;
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const categoryMetaLibrary = [
  {
    match: ['van hoc', 'tieu thuyet', 'truyen'],
    icon: Book,
    color: 'from-purple-400 to-purple-600',
  },
  {
    match: ['kinh te', 'kinh doanh', 'tai chinh', 'marketing'],
    icon: Briefcase,
    color: 'from-blue-400 to-blue-600',
  },
  {
    match: ['phat trien ban than', 'ky nang song', 'tam ly', 'self help'],
    icon: TrendingUp,
    color: 'from-green-400 to-green-600',
  },
  {
    match: ['cong nghe', 'lap trinh', 'ky thuat'],
    icon: Cpu,
    color: 'from-cyan-400 to-cyan-600',
  },
  {
    match: ['giao khoa', 'hoc tap', 'giao duc'],
    icon: GraduationCap,
    color: 'from-orange-400 to-orange-600',
  },
  {
    match: ['thieu nhi', 'tre em'],
    icon: Baby,
    color: 'from-pink-400 to-pink-600',
  },
];

export const toDisplayCategory = (category: ApiCategory): DisplayCategory => {
  const normalizedName = normalizeText(category.name);
  const matched = categoryMetaLibrary.find((item) =>
    item.match.some((keyword) => normalizedName.includes(keyword))
  );

  return {
    ...category,
    icon: matched?.icon || Sparkles,
    color: matched?.color || 'from-slate-500 to-slate-700',
  };
};
