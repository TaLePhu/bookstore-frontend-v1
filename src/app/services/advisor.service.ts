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

export interface AdvisorConversation {
  id: string;
  title: string;
  updatedAt: string | number;
  messages: unknown[];
}

export const getAIAdvisorRecommendations = async (
  question: string,
  limit = 4,
  history: AdvisorHistoryMessage[] = [],
  excludeBookIds: string[] = []
): Promise<AdvisorResponse> => {
  const res = await api.post('/ai-advisor/recommendations', {
    question,
    limit,
    history,
    excludeBookIds,
  });

  return res.data.data;
};

export const getAIAdvisorConversations = async (): Promise<AdvisorConversation[]> => {
  const res = await api.get('/ai-advisor/conversations');
  return res.data.data || [];
};

export const createAIAdvisorConversation = async (payload: {
  title: string;
  messages: unknown[];
}): Promise<AdvisorConversation> => {
  const res = await api.post('/ai-advisor/conversations', payload);
  return res.data.data;
};

export const updateAIAdvisorConversation = async (
  id: string,
  payload: {
    title?: string;
    messages?: unknown[];
  }
): Promise<AdvisorConversation> => {
  const res = await api.patch(`/ai-advisor/conversations/${id}`, payload);
  return res.data.data;
};

export const deleteAIAdvisorConversation = async (id: string): Promise<void> => {
  await api.delete(`/ai-advisor/conversations/${id}`);
};
