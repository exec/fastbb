import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';

interface Forum {
  id: number;
  name: string;
  description: string;
  thread_count: number;
  post_count: number;
  latest_post?: {
    title: string;
    author: string;
    date: string;
    url: string;
  };
}

interface Category {
  id: number;
  name: string;
  description: string;
  forums: Forum[];
}

export function ForumsList() {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForums();
  }, []);

  const fetchForums = async () => {
    try {
      const data = await api.forums.list();
      setCategories(data.forums || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button onClick={fetchForums} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Forum Index</h1>
        {isAuthenticated && (
          <Link to="/forums/-1/new-topic" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            New Topic
          </Link>
        )}
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{category.name}</h2>
              {category.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">{category.description}</p>
              )}
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {category.forums.map((forum) => (
                <div key={forum.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex-1">
                    <Link to={`/forum/${forum.id}`} className="block">
                      <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {forum.name}
                      </h3>
                      {forum.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">{forum.description}</p>
                      )}
                      {forum.latest_post && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="mr-2">Latest: </span>
                          <Link to={forum.latest_post.url} className="hover:underline text-blue-500">
                            {forum.latest_post.title}
                          </Link>
                          <span className="mx-2">by</span>
                          <span className="font-medium">{forum.latest_post.author}</span>
                        </div>
                      )}
                    </Link>
                  </div>
                  <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                    <div className="mb-1">
                      <span className="font-semibold">{forum.thread_count}</span> threads
                    </div>
                    <div>
                      <span className="font-semibold">{forum.post_count}</span> posts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
