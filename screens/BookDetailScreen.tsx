import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Edit2, Trash2, PlayCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { COLORS } from '../types';

const BookDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const book = state.books.find((b) => b.id === id);

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this book?')) {
      if (id) {
        dispatch({ type: 'DELETE_BOOK', payload: id });
        navigate('/');
      }
    }
  };

  const recentNotes = useMemo(() => {
     if(!id) return [];
     return state.notes.filter(n => n.bookId === id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 2);
  }, [state.notes, id]);

  if (!book) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Book not found</p>
        <button onClick={() => navigate('/')} className="ml-2 text-blue-600">Go Home</button>
      </div>
    );
  }

  const progressPercentage = book.totalPages > 0 ? Math.round((book.currentPage / book.totalPages) * 100) : 0;
  const statusColors = {
    reading: COLORS.status.reading,
    completed: COLORS.status.completed,
    paused: COLORS.status.paused,
    planned: COLORS.status.planned,
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 relative transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ChevronLeft size={20} className="mr-1" />
          <span className="font-medium">Back</span>
        </button>
        <button onClick={() => navigate(`/edit-book/${book.id}`)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Edit2 size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="max-w-3xl mx-auto w-full">
            {/* Book Hero */}
            <div className="flex flex-col md:flex-row items-center md:items-start pt-8 px-6 gap-8">
            <div className="w-40 h-60 bg-gray-200 dark:bg-gray-700 rounded-lg shadow-xl shrink-0 overflow-hidden relative group">
                {book.coverUrl ? (
                    <img src={book.coverUrl} className="w-full h-full object-cover" alt="Cover"/>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-100 dark:bg-gray-800">
                        <BookOpen size={40} className="mb-2 opacity-20" />
                        <span className="text-xs">No Cover</span>
                    </div>
                )}
                {book.pdfFileKey && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">PDF</div>
                )}
            </div>
            
            <div className="flex-1 text-center md:text-left">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
                    style={{ backgroundColor: `${statusColors[book.status]}20`, color: statusColors[book.status] }}>
                    {book.status}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white leading-tight mb-2">{book.title}</h1>
                <p className="text-xl text-gray-500 dark:text-gray-400 mb-6">{book.author}</p>
                
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {book.pdfFileKey ? (
                        <button 
                            onClick={() => navigate(`/read/${book.id}`)}
                            className="px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-bold shadow-md hover:bg-[#1b5e20] transition-all flex items-center gap-2 transform active:scale-95"
                        >
                            <PlayCircle size={20} />
                            Read Now
                        </button>
                    ) : (
                         <button 
                            onClick={() => navigate(`/update-progress/${book.id}`)}
                            className="px-6 py-3 bg-[#2E7D32] text-white rounded-xl font-bold shadow-md hover:bg-[#1b5e20] transition-all flex items-center gap-2"
                        >
                            <Edit2 size={20} />
                            Log Progress
                        </button>
                    )}
                </div>
            </div>
            </div>

            {/* Progress Section */}
            <div className="px-6 mt-10">
                <div className="flex justify-between items-center mb-2 text-sm font-medium">
                    <span className="text-gray-900 dark:text-white">Progress</span>
                    <span className="text-gray-500 dark:text-gray-400">{progressPercentage}% ({book.currentPage} / {book.totalPages})</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
                    <div 
                        className="h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%`, backgroundColor: statusColors[book.status] }}
                    ></div>
                </div>
            </div>

            {/* Notes Section */}
            <div className="px-6 mt-10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Notes</h3>
                    <button 
                        onClick={() => navigate(`/notes?bookId=${book.id}`)} 
                        className="text-sm text-[#2E7D32] dark:text-green-400 font-semibold hover:underline"
                    >
                        Manage Notes
                    </button>
                </div>
                
                {recentNotes.length > 0 ? (
                    <div className="grid gap-4">
                        {recentNotes.map(note => (
                            <div key={note.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <p className="text-gray-700 dark:text-gray-300 mb-2 leading-relaxed">{note.text}</p>
                                <div className="flex justify-between items-center text-xs text-gray-400">
                                    <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                                    {note.pageReference && <span className="bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-100 dark:border-gray-600">Page {note.pageReference}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-400 mb-3">Capture your thoughts while reading</p>
                        <button onClick={() => navigate(`/notes?bookId=${book.id}`)} className="text-sm font-semibold text-[#2E7D32] dark:text-green-400">Add First Note</button>
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="px-6 mt-12 pb-10">
                <button 
                    onClick={handleDelete}
                    className="flex items-center text-red-500 dark:text-red-400 text-sm font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors"
                >
                    <Trash2 size={16} className="mr-2" />
                    Delete Book
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailScreen;