import api from './api';
import type { ApiBook } from './book.service';

export interface AdvisorBook extends ApiBook {
  reason: string;
}

export interface AdvisorResponse {
  answer: string;
  books: AdvisorBook[];
}

export const getAIAdvisorRecommendations = async (
  question: string,
  limit = 4
): Promise<AdvisorResponse> => {
  const res = await api.post('/ai-advisor/recommendations', {
    question,
    limit,
  });

  return res.data.data;
};
