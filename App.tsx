import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import HomeScreen from './screens/HomeScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import AddEditBookScreen from './screens/AddEditBookScreen';
import ReadingProgressScreen from './screens/ReadingProgressScreen';
import NotesScreen from './screens/NotesScreen';
import SettingsScreen from './screens/SettingsScreen';
import ReaderScreen from './screens/ReaderScreen';

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onComplete, 500); // Wait for exit animation
    }, 2500); // Display time

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#2E7D32] text-white transition-all duration-500 ${exiting ? 'opacity-0 -translate-y-10' : 'opacity-100'}`}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
        <BookOpen size={80} className="relative z-10 animate-float drop-shadow-lg" />
      </div>
      <h1 className="text-3xl font-bold tracking-wider mb-2 animate-fade-in">READING TRACKER</h1>
      <p className="text-green-100 text-sm font-medium tracking-widest opacity-80">YOUR PERSONAL LIBRARY</p>
      
      <div className="mt-8 w-48 h-1 bg-green-800/30 rounded-full overflow-hidden">
        <div className="h-full bg-white/80 w-full animate-[slide-up_2s_ease-out_infinite] origin-left scale-x-0" style={{ animationName: 'progress', animationDuration: '2s', animationIterationCount: 1, animationFillMode: 'forwards' }}></div>
      </div>
      <style>{`
        @keyframes progress {
          0% { transform: scaleX(0); }
          100% { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <AppProvider>
      <HashRouter>
        <div className="animate-fade-in h-full w-full">
          <Layout>
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/book/:id" element={<BookDetailScreen />} />
              <Route path="/read/:id" element={<ReaderScreen />} />
              <Route path="/add-book" element={<AddEditBookScreen />} />
              <Route path="/edit-book/:id" element={<AddEditBookScreen />} />
              <Route path="/update-progress/:id" element={<ReadingProgressScreen />} />
              <Route path="/notes" element={<NotesScreen />} />
              <Route path="/settings" element={<SettingsScreen />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </div>
      </HashRouter>
    </AppProvider>
  );
};

export default App;