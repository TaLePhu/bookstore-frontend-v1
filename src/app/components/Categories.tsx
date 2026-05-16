import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { getCategories } from '../services/category.service';
import { toDisplayCategory, type DisplayCategory } from '../utils/category-display';

export function Categories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<DisplayCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getCategories();
        setCategories(data.map(toDisplayCategory));
      } catch (error) {
        console.error('Fetch featured categories error:', error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Danh mục nổi bật</h2>

      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-center sm:p-8 text-gray-500">
          Đang tải danh mục...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border bg-white p-4 text-center sm:p-8 text-gray-500">
          Chưa có dữ liệu danh mục.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => navigate(`/category/${category.id}`)}
                className={`bg-gradient-to-br ${category.color} cursor-pointer rounded-2xl p-6 text-left text-white transition-all hover:-translate-y-2 hover:shadow-2xl sm:p-8`}
              >
                <Icon className="w-12 h-12 mb-4" />
                <h3 className="text-2xl font-bold mb-2">{category.name}</h3>
                <p className="text-white/90 line-clamp-2">{category.description}</p>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

