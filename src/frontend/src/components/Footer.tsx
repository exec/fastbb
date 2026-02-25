import { Link } from 'react-router-dom';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">FastBB</span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              FastBB is a fast, lightweight forum software built with modern web technologies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><Link to="/" className="hover:text-blue-600 dark:hover:text-blue-400">Forum Index</Link></li>
              <li><Link to="/search" className="hover:text-blue-600 dark:hover:text-blue-400">Search</Link></li>
              <li><Link to="/register" className="hover:text-blue-600 dark:hover:text-blue-400">Register</Link></li>
              <li><Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-400">Login</Link></li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Community</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Rules</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Terms of Service</a></li>
              <li><a href="#" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</a></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Information</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              FastBB provides a fast, lightweight forum solution with modern features and a clean interface.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-500 dark:text-gray-500 text-sm">
            &copy; {year} FastBB. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
