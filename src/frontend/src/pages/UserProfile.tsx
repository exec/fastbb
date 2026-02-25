import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/apiClient';

interface User {
  id: number;
  username: string;
  email: string;
  joined: string;
  last_visit: string | null;
  topics_count: number;
  posts_count: number;
}

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const data = await api.users.get(id);
      setUser(data.user);
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

  if (error || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'User not found'}</p>
        <Link to="/" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Back to Forums
        </Link>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-blue-600 h-32"></div>
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-16 mb-6">
            <div className="w-32 h-32 bg-white dark:bg-gray-800 rounded-full p-2">
              <div className="w-full h-full bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-300">
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="mb-2">
              {isOwnProfile ? (
                <Link to="/user/edit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                  Edit Profile
                </Link>
              ) : (
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg">
                  Message
                </button>
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{user.username}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>

          <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">{user.topics_count}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Topics Started</span>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-700">
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">{user.posts_count}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Posts Made</span>
            </div>
            <div className="text-center border-l border-gray-200 dark:border-gray-700">
              <span className="block text-2xl font-bold text-gray-900 dark:text-white">
                {new Date(user.joined).getFullYear()}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Joined</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Topics</h3>
              <Link to={`/user/${user.id}/topics`} className="text-sm text-blue-600 dark:text-blue-400">
                View All
              </Link>
            </div>
            {user.topics_count > 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Loading recent topics...</p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No topics yet.</p>
            )}
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Recent Posts</h3>
              <Link to={`/user/${user.id}/posts`} className="text-sm text-blue-600 dark:text-blue-400">
                View All
              </Link>
            </div>
            {user.posts_count > 0 ? (
              <p className="text-gray-600 dark:text-gray-400">Loading recent posts...</p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No posts yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
