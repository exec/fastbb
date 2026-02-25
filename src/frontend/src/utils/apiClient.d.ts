// Type definitions for apiClient.js
// Generated for JavaScript module with JSDoc annotations

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

export type ApiSuccessResponse<T> = {
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

export const api: {
  auth: {
    login: (username: string, password: string) => Promise<ApiSuccessResponse<{ token: string }>>;
    register: (username: string, email: string, password: string) => Promise<ApiSuccessResponse<User>>;
    logout: () => Promise<ApiSuccessResponse<{}>>;
    me: () => Promise<ApiSuccessResponse<User>>;
  };
  forums: {
    list: () => Promise<ApiSuccessResponse<Forum[]>>;
    get: (id: number | string) => Promise<ApiSuccessResponse<Forum>>;
    create: (data: { name: string; description?: string; parent_id?: number }) => Promise<ApiSuccessResponse<Forum>>;
    update: (id: number, data: Partial<Forum>) => Promise<ApiSuccessResponse<Forum>>;
    delete: (id: number) => Promise<ApiSuccessResponse<{}>>;
    markRead: (id: number) => Promise<ApiSuccessResponse<{}>>;
  };
  topics: {
    list: (data: { forum_id: number | string }, page?: number, limit?: number, sort?: string) => Promise<ApiSuccessResponse<{ topics: Topic[]; pagination: Pagination }>>;
    get: (id: number | string, page?: number, limit?: number) => Promise<ApiSuccessResponse<{ topic: Topic; posts: Post[]; pagination: Pagination }>>;
    create: (data: { forum_id: number; title: string; content: string }) => Promise<{ success: boolean; topic: Topic; post: Post }>;
    update: (id: number, data: Partial<Topic>) => Promise<ApiSuccessResponse<Topic>>;
    delete: (id: number) => Promise<ApiSuccessResponse<{}>>;
    lock: (id: number) => Promise<ApiSuccessResponse<Topic>>;
    unlock: (id: number) => Promise<ApiSuccessResponse<Topic>>;
    pin: (id: number) => Promise<ApiSuccessResponse<Topic>>;
    unpin: (id: number) => Promise<ApiSuccessResponse<Topic>>;
    incrementViews: (id: number) => Promise<ApiSuccessResponse<Topic>>;
  };
  posts: {
    get: (id: number) => Promise<ApiSuccessResponse<Post>>;
    create: (data: { topic_id: number; content: string }) => Promise<ApiSuccessResponse<Post>>;
    update: (id: number, data: { content: string }) => Promise<ApiSuccessResponse<Post>>;
    delete: (id: number) => Promise<ApiSuccessResponse<{}>>;
  };
  search: {
    search: (query: string, type?: string, page?: number, limit?: number) => Promise<ApiSuccessResponse<{ results: any[]; pagination: Pagination }>>;
  };
  users: {
    get: (id: number | string) => Promise<ApiSuccessResponse<User>>;
    update: (id: number, data: Partial<User>) => Promise<ApiSuccessResponse<User>>;
    delete: (id: number) => Promise<ApiSuccessResponse<{}>>;
    getTopics: (id: number | string) => Promise<ApiSuccessResponse<{ topics: Topic[]; pagination: Pagination }>>;
    getPosts: (id: number | string) => Promise<ApiSuccessResponse<{ posts: Post[]; pagination: Pagination }>>;
    listMembers: (page?: number, limit?: number, sort?: string) => Promise<ApiSuccessResponse<{ users: User[]; pagination: Pagination }>>;
  };
};
