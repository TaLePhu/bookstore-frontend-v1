import api from "./api";

export const getCategories = async () => {
  const res = await api.get("/categories");

  // 👇 lấy đúng data từ backend của bạn
  return res.data.data;
};