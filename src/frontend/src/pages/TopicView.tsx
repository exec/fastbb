import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';
import { sanitizePostContent } from '../utils/sanitize';

interface Post {
  id: number;
  content: string;
  user_id: number;
  username: string;
  email: string;
  joined: string;
  is_active: number;
  created: string;
  post_count: number;
}

export function TopicView() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [topic, setTopic] = useState<{ id: number; title: string; forum_id: number } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopic();
  }, [id]);

  const fetchTopic = async () => {
    try {
      const topicData = await api.topics.get(id);
      setTopic(topicData.topic);
      // Note: The API returns all posts on one page, which is fine for demo
      // In production, implement proper pagination
      setPosts(topicData.posts || []);
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

  if (error || !topic) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'Topic not found'}</p>
        <button onClick={fetchTopic} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topic Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <nav className="flex text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/forum/${topic.forum_id}`} className="hover:text-blue-600">Forum</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{topic.title}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{topic.title}</h1>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold">
                  {post.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{post.username}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    Joined {new Date(post.joined).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">{post.post_count}</span> posts
              </div>
            </div>
            <div className="px-6 py-4">
              <div
                className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizePostContent(post.content) }}
              />
            </div>
            <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-4">
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Reply
              </button>
              <button className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                Quote
              </button>
              {isAuthenticated && (
                <>
                  <button className="text-sm text-gray-600 dark:text-gray-400 hover:underline">
                    Edit
                  </button>
                  <button className="text-sm text-red-600 dark:text-red-400 hover:underline">
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reply Button */}
      {isAuthenticated && (
        <div className="flex justify-center">
          <button
            onClick={() => alert('Reply functionality coming soon!')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Reply to Topic
          </button>
        </div>
      )}
    </div>
  );
}
