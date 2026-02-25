import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../utils/apiClient';

interface SearchResult {
  id: number;
  title: string;
  type: 'topic' | 'post';
  username: string;
  created: string;
  forum_id?: number;
  topic_id?: number;
}

export function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length >= 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.search.search(query, 'all');
      setResults(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Search</h1>
        <form onSubmit={(e) => e.preventDefault()} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => window.history.pushState({}, '', `/search?q=${e.target.value}`)}
            placeholder="Search forums..."
            className="w-full px-12 py-4 text-lg rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white"
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Search
            </button>
          </div>
        </form>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div>
          {query.length < 2 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p>Enter at least 2 characters to search</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Found {results.length} result(s) for "{query}"
              </h2>
              <div className="space-y-4">
                {results.map((result) => (
                  <div key={result.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs uppercase font-semibold">
                            {result.type}
                          </span>
                          <span>by {result.username}</span>
                          <span>•</span>
                          <span>{new Date(result.created).toLocaleDateString()}</span>
                        </div>
                        <Link to={`/topic/${result.topic_id || result.id}`} className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline">
                          {result.title}
                        </Link>
                      </div>
                      <div className="text-gray-500 dark:text-gray-400 text-sm">
                        {result.type === 'topic' ? 'Topic' : 'Post'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
