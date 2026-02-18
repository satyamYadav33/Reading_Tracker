import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Save, UploadCloud, FileText, X, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Book, BookStatus } from '../types';
import { savePDF } from '../utils/db';
import { generateThumbnail } from '../utils/pdf';

const generateId = () => Math.random().toString(36).substring(2, 9);

const AddEditBookScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const isEditing = Boolean(id);

  // Mode state: 'upload' shows the drag & drop UI, 'manual' shows the form
  const [mode, setMode] = useState<'upload' | 'manual'>(isEditing ? 'manual' : 'upload');
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    isbn: '',
    totalPages: 0,
    currentPage: 0,
    status: 'planned',
    startDate: new Date().toISOString().split('T')[0],
    coverUrl: '',
    pdfFileKey: null,
  });

  useEffect(() => {
    if (isEditing && id) {
      const book = state.books.find((b) => b.id === id);
      if (book) {
        setFormData({
            ...book,
            startDate: book.startDate ? new Date(book.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        setMode('manual');
      }
    }
  }, [id, isEditing, state.books]);

  // Drag and Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
        const bookId = generateId();
        
        // 1. Generate Cover
        const coverUrl = await generateThumbnail(file);

        // 2. Save PDF to IndexedDB
        await savePDF(bookId, file);

        // 3. Create Book Object
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
        // Navigate to the edit screen for this new book so they can fill in author/pages
        navigate(`/edit-book/${bookId}`);
    } catch (error) {
        console.error("Error saving PDF", error);
        alert("Failed to save file.");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    const pdfFile = files.find(file => file.type === 'application/pdf');

    if (pdfFile) {
        await processFile(pdfFile);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          await processFile(file);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.author || !formData.totalPages) return;

    const bookData: Book = {
      id: isEditing && id ? id : generateId(),
      title: formData.title!,
      author: formData.author!,
      isbn: formData.isbn,
      totalPages: Number(formData.totalPages),
      currentPage: Number(formData.currentPage) || 0,
      status: formData.status as BookStatus,
      startDate: new Date(formData.startDate!).toISOString(),
      coverUrl: formData.coverUrl || '',
      pdfFileKey: formData.pdfFileKey, // Preserve PDF key
      createdAt: isEditing ? (state.books.find(b => b.id === id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isEditing) {
      dispatch({ type: 'UPDATE_BOOK', payload: bookData });
    } else {
      dispatch({ type: 'ADD_BOOK', payload: bookData });
    }

    // Redirect to Home instead of back
    navigate('/');
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Navbar */}
      <div className="flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
          <ChevronLeft size={24} />
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">{isEditing ? 'Edit Book' : 'Add Book'}</span>
        <div className="w-10" /> 
      </div>

      {/* Mode Switcher (Only in Add Mode) */}
      {!isEditing && (
          <div className="flex p-4 pb-0 justify-center">
              <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl">
                  <button 
                    onClick={() => setMode('upload')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'upload' ? 'bg-white dark:bg-gray-600 shadow text-[#2E7D32] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                      Upload PDF
                  </button>
                  <button 
                    onClick={() => setMode('manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'manual' ? 'bg-white dark:bg-gray-600 shadow text-[#2E7D32] dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                  >
                      Manual Entry
                  </button>
              </div>
          </div>
      )}

      {mode === 'upload' && !isEditing ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center animate-fade-in">
                <div 
                    className={`w-full max-w-lg h-96 border-4 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 transition-all duration-200 
                        ${isDragging 
                            ? 'border-[#2E7D32] bg-[#2E7D32]/10 scale-105' 
                            : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {isProcessing ? (
                         <div className="flex flex-col items-center text-[#2E7D32] dark:text-green-400">
                            <Loader2 size={64} className="animate-spin mb-4" />
                            <h3 className="text-xl font-bold">Processing PDF...</h3>
                         </div>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-sm text-[#2E7D32] dark:text-green-500">
                                <UploadCloud size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-3 text-center">Drag & Drop PDF</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-8 max-w-xs">
                                Drop your book file here, or click to browse.
                            </p>
                            <label className="px-8 py-3 bg-[#2E7D32] text-white font-semibold rounded-xl shadow-md hover:bg-[#1b5e20] cursor-pointer transition-colors flex items-center">
                                <FileText size={20} className="mr-2"/>
                                <span>Select PDF File</span>
                                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
                            </label>
                        </>
                    )}
                </div>
          </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6 animate-slide-up">
            
            {/* Title */}
            <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Title <span className="text-red-500">*</span></label>
            <input
                required
                type="text"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                placeholder="e.g. The Hobbit"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
            </div>

            {/* Author */}
            <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Author <span className="text-red-500">*</span></label>
            <input
                required
                type="text"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                placeholder="e.g. J.R.R. Tolkien"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Total Pages */}
                <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Pages <span className="text-red-500">*</span></label>
                <input
                    required
                    type="number"
                    min="1"
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                    placeholder="0"
                    value={formData.totalPages || ''}
                    onChange={(e) => setFormData({ ...formData, totalPages: parseInt(e.target.value) })}
                />
                </div>
                
                {/* Status */}
                <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                    className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all appearance-none text-gray-900 dark:text-white"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
                >
                    <option value="planned">Planned</option>
                    <option value="reading">Reading</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                </select>
                </div>
            </div>

            {/* Start Date */}
            <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
            <input
                type="date"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />
            </div>

             {/* Cover URL (Optional for Manual) */}
             <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cover Image <span className="text-gray-400 font-normal">(Auto-generated for PDFs)</span></label>
                {formData.coverUrl ? (
                    <div className="relative w-24 h-36 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-2 group">
                        <img src={formData.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                        <button 
                            type="button"
                            onClick={() => setFormData({...formData, coverUrl: ''})}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                     <input
                        type="url"
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                        placeholder="https://example.com/cover.jpg"
                        value={formData.coverUrl}
                        onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                    />
                )}
            </div>

            {/* ISBN (Optional) */}
            <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ISBN <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input
                type="text"
                className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent outline-none transition-all text-gray-900 dark:text-white"
                placeholder="978-3-16-148410-0"
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            />
            </div>

            {/* Spacer for bottom button */}
            <div className="h-20" />
            
            {/* Floating Submit Button Area */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10 md:static md:bg-transparent md:border-t-0">
                <button
                type="submit"
                className="w-full py-3 bg-[#2E7D32] text-white rounded-xl font-bold text-lg shadow-md active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                >
                <Save size={20} />
                <span>{isEditing ? 'Save Changes' : 'Add Book'}</span>
                </button>
            </div>
        </form>
      )}
    </div>
  );
};

export default AddEditBookScreen;