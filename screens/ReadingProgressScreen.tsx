import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLORS } from '../types';

const ReadingProgressScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const book = state.books.find((b) => b.id === id);

  const [page, setPage] = useState<number | string>(book?.currentPage || 0);

  if (!book) return null;

  const handleSave = () => {
    const newPage = typeof page === 'string' ? parseInt(page) : page;
    
    if (newPage < 0) return;

    let newStatus = book.status;
    // Auto-update status logic
    if (newPage >= book.totalPages) {
        newStatus = 'completed';
    } else if (newPage > 0 && book.status === 'planned') {
        newStatus = 'reading';
    }

    const updatedBook = {
        ...book,
        currentPage: Math.min(newPage, book.totalPages),
        status: newStatus,
        updatedAt: new Date().toISOString()
    };

    dispatch({ type: 'UPDATE_BOOK', payload: updatedBook });
    navigate(-1);
  };

  const currentVal = typeof page === 'string' ? parseInt(page) || 0 : page;
  const percentage = Math.min(100, Math.round((currentVal / book.totalPages) * 100));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 transition-colors duration-300">
        {/* Navbar */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft size={24} />
        </button>
        <h1 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">Log Progress</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col items-center">
        
        {/* Book Mini Info */}
        <div className="mb-8 text-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{book.title}</h2>
            <p className="text-gray-500 dark:text-gray-400">{book.author}</p>
        </div>

        {/* Circular Progress Input Visual */}
        <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
            {/* SVG Circle */}
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="128"
                    cy="128"
                    r="110"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-gray-100 dark:text-gray-800"
                />
                <circle
                    cx="128"
                    cy="128"
                    r="110"
                    stroke={COLORS.primary}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 110}
                    strokeDashoffset={2 * Math.PI * 110 * (1 - percentage / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-out"
                />
            </svg>
            
            {/* Input Overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline">
                    <input
                        type="number"
                        value={page}
                        onChange={(e) => setPage(e.target.value)}
                        className="w-24 text-center text-4xl font-bold text-gray-900 dark:text-white bg-transparent outline-none focus:border-b-2 border-gray-200 dark:border-gray-700"
                        autoFocus
                    />
                </div>
                <span className="text-gray-400 dark:text-gray-500 mt-2">of {book.totalPages} pages</span>
                <span className="text-[#2E7D32] dark:text-green-500 font-semibold mt-4 text-lg">{percentage}%</span>
            </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="grid grid-cols-4 gap-3 w-full max-w-sm mb-auto">
            {[5, 10, 20, 50].map(amt => (
                <button
                    key={amt}
                    onClick={() => setPage(Math.min(book.totalPages, (typeof page === 'string' ? parseInt(page)||0 : page) + amt))}
                    className="py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 transition-colors"
                >
                    +{amt}
                </button>
            ))}
        </div>

        {/* Save Button */}
        <button
            onClick={handleSave}
            className="w-full max-w-sm py-4 bg-[#2E7D32] text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2 mt-6"
        >
            <CheckCircle2 size={24} />
            <span>Update Progress</span>
        </button>
      </div>
    </div>
  );
};

export default ReadingProgressScreen;