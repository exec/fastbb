// Type definitions for apiClient.js
// Generated for JavaScript module with JSDoc annotations
// Note: These are basic type definitions. For production, consider generating full types from JSDoc

export interface User {
  id: number;
  username: string;
  email: string;
  group_id: number;
  is_active: number;
  joined: string;
}

export interface Forum {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  is_active: number;
}

export interface Topic {
  id: number;
  forum_id: number;
  title: string;
  created: string;
  views: number;
  closed: number;
  pinned: number;
}

export interface Post {
  id: number;
  topic_id: number;
  user_id: number;
  content: string;
  created: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  forums?: Forum[];
  forum?: Forum;
  topics?: Topic[];
  topic?: Topic;
  posts?: Post[];
  post?: Post;
  user?: User;
  results?: any[];
  error?: string;
  token?: string;
  pagination?: Pagination;
};

export async function apiRequest(endpoint: string, options?: RequestInit): Promise<Response>;

export const api: any;
