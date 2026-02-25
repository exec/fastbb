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
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function apiRequest(endpoint: string, options?: RequestInit): Promise<Response>;

export const api: {
  auth: {
    login: (username: string, password: string) => Promise<ApiResponse<{ token: string }>>;
    register: (username: string, email: string, password: string) => Promise<ApiResponse<User>>;
    logout: () => Promise<ApiResponse<{}>>;
    me: () => Promise<ApiResponse<User>>;
  };
  forums: {
    list: () => Promise<ApiResponse<Forum[]>>;
    get: (id: number) => Promise<ApiResponse<Forum>>;
    create: (data: { name: string; description?: string; parent_id?: number }) => Promise<ApiResponse<Forum>>;
    update: (id: number, data: Partial<Forum>) => Promise<ApiResponse<Forum>>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
    markRead: (id: number) => Promise<ApiResponse<{}>>;
  };
  topics: {
    list: (forumId: number, page?: number, limit?: number, sort?: string) => Promise<ApiResponse<{ topics: Topic[]; pagination: Pagination }>>;
    get: (id: number, page?: number, limit?: number) => Promise<ApiResponse<{ topic: Topic; posts: Post[]; pagination: Pagination }>>;
    create: (data: { forum_id: number; title: string; content: string }) => Promise<ApiResponse<{ topic: Topic; post: Post }>>;
    update: (id: number, data: Partial<Topic>) => Promise<ApiResponse<Topic>>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
    lock: (id: number) => Promise<ApiResponse<Topic>>;
    unlock: (id: number) => Promise<ApiResponse<Topic>>;
    pin: (id: number) => Promise<ApiResponse<Topic>>;
    unpin: (id: number) => Promise<ApiResponse<Topic>>;
    incrementViews: (id: number) => Promise<ApiResponse<Topic>>;
  };
  posts: {
    get: (id: number) => Promise<ApiResponse<Post>>;
    create: (data: { topic_id: number; content: string }) => Promise<ApiResponse<Post>>;
    update: (id: number, data: { content: string }) => Promise<ApiResponse<Post>>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
  };
  search: {
    search: (query: string, type?: 'all' | 'posts' | 'topics', page?: number, limit?: number) => Promise<ApiResponse<any>>;
  };
  users: {
    get: (id: number) => Promise<ApiResponse<User>>;
    update: (id: number, data: Partial<User>) => Promise<ApiResponse<User>>;
    delete: (id: number) => Promise<ApiResponse<{}>>;
    getTopics: (id: number) => Promise<ApiResponse<{ topics: Topic[]; pagination: Pagination }>>;
    getPosts: (id: number) => Promise<ApiResponse<{ posts: Post[]; pagination: Pagination }>>;
    listMembers: (page?: number, limit?: number, sort?: string) => Promise<ApiResponse<{ users: User[]; pagination: Pagination }>>;
  };
};
