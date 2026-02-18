import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import { savePDF } from '../utils/db';
import { generateThumbnail } from '../utils/pdf';
import { Book } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const HomeScreen: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) return;

    setIsProcessing(true);

    try {
        for (const file of pdfFiles) {
            const bookId = generateId();
            
            // 1. Generate Cover Thumbnail first (async)
            const coverUrl = await generateThumbnail(file);

            // 2. Save PDF to IndexedDB
            await savePDF(bookId, file);

            // 3. Create Book Entry with Cover
            const newBook: Book = {
                id: bookId,
                title: file.name.replace('.pdf', ''),
                author: 'Unknown Author', 
                totalPages: 0, 
                currentPage: 0,
                status: 'planned',
                startDate: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                coverUrl: coverUrl, // Use generated cover
                pdfFileKey: bookId,
                isbn: ''
            };

            dispatch({ type: 'ADD_BOOK', payload: newBook });
        }
    } catch (error) {
        console.error("Error saving PDF", error);
        alert("Failed to save some files.");
    } finally {
        setIsProcessing(false);
    }

  }, [dispatch]);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
      
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[#2E7D32]/10 z-50 flex items-center justify-center border-4 border-[#2E7D32] border-dashed m-4 rounded-3xl pointer-events-none backdrop-blur-sm">
            <div className="text-[#2E7D32] dark:text-green-400 font-bold text-2xl flex flex-col items-center animate-bounce">
                <UploadCloud size={64} className="mb-4" />
                <span>Drop PDFs here to add to Library</span>
            </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-8 flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Library</h1>
                <p className="text-gray-500 dark:text-gray-400">Drag & drop PDFs here to start reading.</p>
            </div>
        </div>

        {isProcessing && (
            <div className="flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-xl mb-6">
                <Loader2 className="animate-spin mr-2" />
                <span>Processing PDF files...</span>
            </div>
        )}

        {state.books.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.books.map((book) => (
                <div key={book.id} className="w-full">
                    <BookCard book={book} />
                </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-800 transition-colors">
            <div className="w-24 h-24 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-sm text-[#2E7D32] dark:text-green-500">
                <UploadCloud size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">Your library is empty</h3>
            <p className="text-gray-500 dark:text-gray-400 text-base max-w-sm mx-auto mb-8 leading-relaxed">
                Drag and drop your PDF books right here to get started. We'll store them locally for you.
            </p>
            <button 
                onClick={() => navigate('/add-book')}
                className="px-6 py-3 bg-[#2E7D32] text-white font-semibold rounded-xl shadow-md hover:bg-[#1b5e20] transition-colors flex items-center"
            >
                <Plus size={20} className="mr-2"/>
                Manually Add Book
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;