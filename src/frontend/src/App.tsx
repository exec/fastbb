import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { ForumsList } from './pages/ForumsList.tsx';
import { ForumView } from './pages/ForumView.tsx';
import { TopicView } from './pages/TopicView.tsx';
import { NewTopic } from './pages/NewTopic.tsx';
import { NewPost } from './pages/NewPost.tsx';
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { UserProfile } from './pages/UserProfile.tsx';
import { Search } from './pages/Search.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('fastbb-theme');
    return saved === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fastbb-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fastbb-theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          <Header />

          <main className="container mx-auto px-4 py-6">
            <Routes>
              <Route path="/" element={<ForumsList />} />
              <Route path="/forum/:id" element={<ForumView />} />
              <Route path="/topic/:id" element={<TopicView />} />
              <Route path="/topic/:id/new-post" element={
                <ProtectedRoute>
                  <NewPost />
                </ProtectedRoute>
              } />
              <Route path="/forum/:id/new-topic" element={
                <ProtectedRoute>
                  <NewTopic />
                </ProtectedRoute>
              } />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/search" element={<Search />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
