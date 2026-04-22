import api from "./api";
export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: string;
  stock: number;
  image?: string;
}

export const getCategories = async () => {
  const res = await api.get("/categories");

  // 👇 lấy đúng data từ backend của bạn
  return res.data.data;
};

export const getBooksByCategory = async (
  categoryId: string
): Promise<Book[]> => {
  try {
    const res = await api.get(`/books/category/${categoryId}`);

    // API của bạn: { success: true, data: [...] }
    return res.data.data;
  } catch (error) {
    console.error("Error fetching books by category:", error);
    throw error;
  }
};