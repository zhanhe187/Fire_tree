import { request, send, sendForm } from '../../../services/http';

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiNavigationSuggestion {
  title: string;
  route: string;
  audience: 'portal' | 'admin' | 'shared';
  reason: string;
}

export interface AiChatRequest {
  message: string;
  history?: AiChatMessage[];
  audience?: 'portal' | 'admin';
  currentRoute?: string;
  roleCodes?: string[];
}

export interface AiChatResponse {
  answer: string;
  suggestions: AiNavigationSuggestion[];
  source: string;
}

export function sendAiChat(payload: AiChatRequest) {
  return send<AiChatResponse>('/api/ai/chat', 'POST', payload);
}

