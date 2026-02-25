// Type definitions for apiClient.js
// Generated for JavaScript module with JSDoc annotations

export interface User {
  id: number;
  username: string;
  email: string;
  group_id: number;
  is_active: number;
  joined: string;
  last_visit?: string;
}

export interface Forum {
  id: number;
  name: string;
  description?: string;
  parent_id?: number;
  sort_order: number;
  is_active: number;
  thread_count?: number;
  post_count?: number;
  sub_forums?: Forum[];
  latest_post?: Post;
}

export interface Topic {
  id: number;
  forum_id: number;
  user_id: number;
  title: string;
  created: string;
  views: number;
  closed: number;
  pinned: number;
  last_post_id?: number;
  author_name?: string;
  reply_count?: number;
}

export interface Post {
  id: number;
  topic_id: number;
  user_id: number;
  content: string;
  created: string;
  edited?: string;
  is_edited: number;
  is_deleted: number;
  deleted_reason?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiForumListResponse {
  success: boolean;
  forums: Forum[];
}

export interface ApiForumSingleResponse {
  success: boolean;
  forum: Forum;
}

export interface ApiTopicListResponse {
  success: boolean;
  topics: Topic[];
  pagination: Pagination;
}

export interface ApiTopicSingleResponse {
  success: boolean;
  topic: Topic;
  posts: Post[];
  pagination: Pagination;
}

export interface ApiPostResponse {
  success: boolean;
  post: Post;
}

export interface ApiAuthResponse {
  success: boolean;
  token?: string;
  user?: User;
}

export interface ApiErrorResponse {
  success: boolean;
  error: string;
}

export type ApiResponse<T> = ApiErrorResponse | T;

export async function apiRequest(endpoint: string, options?: RequestInit): Promise<Response>;

export const api: {
  auth: {
    login: (username: string, password: string) => Promise<ApiAuthResponse>;
    register: (username: string, email: string, password: string) => Promise<ApiAuthResponse>;
    logout: () => Promise<ApiAuthResponse>;
    me: () => Promise<ApiAuthResponse>;
  };
  forums: {
    list: () => Promise<ApiForumListResponse>;
    get: (id: number | string) => Promise<ApiForumSingleResponse>;
    create: (data: { name: string; description?: string; parent_id?: number }) => Promise<ApiForumSingleResponse>;
    update: (id: number, data: Partial<Forum>) => Promise<ApiForumSingleResponse>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
    markRead: (id: number) => Promise<ApiResponse<{}>>;
  };
  topics: {
    list: (data: { forum_id: number | string }, page?: number, limit?: number, sort?: string) => Promise<ApiTopicListResponse>;
    get: (id: number | string, page?: number, limit?: number) => Promise<ApiTopicSingleResponse>;
    create: (data: { forum_id: number; title: string; content: string }) => Promise<{ success: boolean; topic: Topic; post: Post }>;
    update: (id: number, data: Partial<Topic>) => Promise<ApiTopicSingleResponse>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
    lock: (id: number) => Promise<ApiTopicSingleResponse>;
    unlock: (id: number) => Promise<ApiTopicSingleResponse>;
    pin: (id: number) => Promise<ApiTopicSingleResponse>;
    unpin: (id: number) => Promise<ApiTopicSingleResponse>;
    incrementViews: (id: number) => Promise<ApiTopicSingleResponse>;
  };
  posts: {
    get: (id: number) => Promise<ApiPostResponse>;
    create: (data: { topic_id: number; content: string }) => Promise<ApiPostResponse>;
    update: (id: number, data: { content: string }) => Promise<ApiPostResponse>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
  };
  search: {
    search: (query: string, type?: string, page?: number, limit?: number) => Promise<{ success: boolean; results: any[]; pagination: Pagination }>;
  };
  users: {
    get: (id: number | string) => Promise<{ success: boolean; user: User }>;
    update: (id: number, data: Partial<User>) => Promise<{ success: boolean; user: User }>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
    getTopics: (id: number | string) => Promise<{ success: boolean; topics: Topic[]; pagination: Pagination }>;
    getPosts: (id: number | string) => Promise<{ success: boolean; posts: Post[]; pagination: Pagination }>;
    listMembers: (page?: number, limit?: number, sort?: string) => Promise<{ success: boolean; users: User[]; pagination: Pagination }>;
  };
};
