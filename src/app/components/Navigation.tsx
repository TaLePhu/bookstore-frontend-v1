import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router';

export function Navigation() {
  const navigate = useNavigate();

  const categories = [
    { name: 'Văn học', icon: Bookmark, link: '/category/van-hoc' },
    { name: 'Kinh tế - Kinh doanh', icon: Bookmark, link: '/category/kinh-te' },
    { name: 'Phát triển bản thân', icon: Bookmark, link: '/category/phat-trien-ban-than' },
    { name: 'Công nghệ', icon: Bookmark, link: '/category/cong-nghe' },
    { name: 'Thiếu nhi', icon: Bookmark, link: '/category/thieu-nhi' },
  ];

  return (
    <nav className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-center justify-between">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <li key={index}>
                <button
                  onClick={() => navigate(category.link)}
                  className="flex items-center gap-2 px-6 py-4 text-white hover:bg-orange-700 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}