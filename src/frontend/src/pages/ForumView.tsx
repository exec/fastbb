import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Search, Filter } from 'lucide-react';
import { api } from '../utils/apiClient';

// Local Topic interface for forum view
interface Topic {
  id: number;
  title: string;
  author_name: string;
  reply_count: number;
  views: number;
  created: string;
  pinned: boolean;
  closed: boolean;
  last_post_id: number;
}

// Local Forum interface
interface Forum {
  id: number;
  name: string;
  description: string;
}

export function ForumView() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [forum, setForum] = useState<Forum | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForum();
  }, [id]);

  const fetchForum = async () => {
    if (!id) return;

    try {
      const [forumData, topicsData] = await Promise.all([
        api.forums.get(parseInt(id)),
        api.topics.list({ forum_id: parseInt(id) })
      ]);

      setForum((forumData.forum as Forum) ?? null);
      setTopics((topicsData.topics || []) as unknown as Topic[]);
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

  if (error || !forum) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'Forum not found'}</p>
        <button onClick={fetchForum} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forum Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <nav className="flex text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 dark:text-white">{forum.name}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{forum.name}</h1>
        {forum.description && (
          <p className="text-gray-600 dark:text-gray-400">{forum.description}</p>
        )}
      </div>

      {/* Topic List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">Topics</h2>
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">{topics.length}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search topics..."
                className="pl-9 pr-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border-none text-sm focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
            </div>
            <button className="p-2 text-gray-600 dark:text-gray-400">
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Topics Table */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {topics.length > 0 ? (
            topics.map((topic) => (
              <div key={topic.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                <div className="flex items-start">
                  <div className="mt-1">
                    {topic.pinned && <span className="text-yellow-500 text-lg">📌</span>}
                    {topic.closed && <span className="text-gray-400 text-lg ml-2">🔒</span>}
                  </div>
                  <div className="ml-3 flex-1">
                    <Link to={`/topic/${topic.id}`} className="text-lg font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      {topic.title}
                    </Link>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        Started by <span className="font-medium">{topic.author_name}</span>
                      </span>
                      <span>•</span>
                      <span>{topic.reply_count} replies</span>
                      <span>•</span>
                      <span>{topic.views} views</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No topics yet. Be the first to create one!
            </div>
          )}
        </div>

        {/* Create Topic Button */}
        {isAuthenticated && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              onClick={() => navigate(`/forum/${id}/new-topic`)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Create Topic</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
