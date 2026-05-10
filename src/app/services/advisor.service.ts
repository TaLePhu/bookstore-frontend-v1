import api from './api';
import type { ApiBook } from './book.service';

export interface AdvisorBook extends ApiBook {
  reason: string;
}

export interface AdvisorResponse {
  answer: string;
  books: AdvisorBook[];
}

export interface AdvisorHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const getAIAdvisorRecommendations = async (
  question: string,
  limit = 4,
  history: AdvisorHistoryMessage[] = []
): Promise<AdvisorResponse> => {
  const res = await api.post('/ai-advisor/recommendations', {
    question,
    limit,
    history,
  });

  return res.data.data;
};
