import { Book, Flame, Brain, Library } from "lucide-react";
import { useNavigate } from 'react-router';
import { useEffect, useState } from "react";
import { getCategories } from "../services/category.service";

interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}


export function Navigation() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const iconMap: Record<string, any> = {
  "Văn học": Book,
  "Kinh tế": Flame,
  "Kỹ năng sống": Brain,
  "Tiểu thuyết": Library,
};
const mappedCategories = categories.map((c) => ({
  ...c,
  icon: iconMap[c.name] || Book,
  link: '/category/van-hoc',  //sửa cái này lại sau khi cập nhật api
}));


  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Lỗi khi gọi API:", error);
      }
    };

    fetchData();
  }, []);
 /*const categories = [
    { name: 'Văn học', icon: Bookmark, link: '/category/van-hoc' },
    { name: 'Kinh tế - Kinh doanh', icon: Bookmark, link: '/category/kinh-te' },
    { name: 'Phát triển bản thân', icon: Bookmark, link: '/category/phat-trien-ban-than' },
    { name: 'Công nghệ', icon: Bookmark, link: '/category/cong-nghe' },
    { name: 'Thiếu nhi', icon: Bookmark, link: '/category/thieu-nhi' },
  ];
*/
  return (
    <nav className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <ul className="flex items-stretch gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {mappedCategories.map((category) => {
          const Icon = category.icon;
           return (
             <li key={category.id}>
                <button
                  onClick={() => navigate(category.link)}
                  className="flex whitespace-nowrap rounded-lg px-4 py-3 text-sm text-white transition-colors hover:bg-orange-600 sm:items-center sm:gap-2 sm:px-5 sm:text-base"
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{category.name}</span>
              </button>
          </li>
  );
})}
        {/* {categories.map((category, index) => {
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
          */}
        </ul>
      </div>
    </nav>
  );
}
