
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, X, Edit3, Quote, Book } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Note } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 9);

const NotesScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const bookIdParam = searchParams.get('bookId');
  const navigate = useNavigate();
  const { state, dispatch } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note>>({});
  
  // Filter only by bookId if param exists
  const filteredNotes = state.notes.filter(note => {
    if (bookIdParam && note.bookId !== bookIdParam) return false;
    return true;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getBookTitle = (id: string) => state.books.find(b => b.id === id)?.title || 'Unknown Book';

  const handleSaveNote = () => {
    if (!editingNote.text || !editingNote.bookId) return;

    if (editingNote.id) {
        dispatch({ 
            type: 'UPDATE_NOTE', 
            payload: { 
                ...state.notes.find(n => n.id === editingNote.id)!, 
                text: editingNote.text, 
                pageReference: editingNote.pageReference,
                updatedAt: new Date().toISOString()
            } 
        });
    } else {
        dispatch({ 
            type: 'ADD_NOTE', 
            payload: {
                id: generateId(),
                bookId: editingNote.bookId,
                text: editingNote.text,
                pageReference: editingNote.pageReference,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        });
    }
    setIsModalOpen(false);
    setEditingNote({});
  };

  const openAddModal = () => {
      setEditingNote({ bookId: bookIdParam || (state.books.length > 0 ? state.books[0].id : '') });
      setIsModalOpen(true);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 relative transition-colors duration-300">
        {/* Modern Header */}
        <div className="bg-white dark:bg-gray-800 px-8 py-8 border-b border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                        {bookIdParam ? 'Book Notes' : 'My Notebook'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                        {filteredNotes.length} {filteredNotes.length === 1 ? 'Entry' : 'Entries'}
                    </p>
                </div>
                {bookIdParam && (
                    <button onClick={() => navigate(-1)} className="px-4 py-2 text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                        Back to Library
                    </button>
                )}
            </div>
        </div>

        {/* Notes Masonry Layout */}
        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
            {filteredNotes.length > 0 ? (
                <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                    {filteredNotes.map(note => (
                        <div 
                            key={note.id} 
                            onClick={() => { setEditingNote(note); setIsModalOpen(true); }} 
                            className="break-inside-avoid group relative bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 cursor-pointer flex flex-col mb-6 transform hover:-translate-y-1"
                        >
                            {/* Decorative Quote Icon */}
                            <Quote size={24} className="absolute top-6 right-6 text-gray-100 dark:text-gray-700 group-hover:text-[#2E7D32]/20 dark:group-hover:text-green-500/20 transition-colors" />

                            <div className="mb-4">
                                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                                     <Book size={12} />
                                     <span className="truncate max-w-[150px]">{getBookTitle(note.bookId)}</span>
                                </div>
                                <h3 className="text-gray-800 dark:text-gray-200 text-base leading-relaxed font-medium">
                                    {note.text}
                                </h3>
                            </div>

                            <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-xs font-semibold text-gray-400">
                                    {new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                                </span>
                                {note.pageReference && (
                                    <span className="px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-md text-[10px] font-bold text-gray-500 dark:text-gray-400">
                                        Page {note.pageReference}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 text-gray-300 dark:text-gray-600">
                        <Edit3 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your notebook is empty</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        Start capturing ideas, quotes, and thoughts from your favorite books.
                    </p>
                </div>
            )}
        </div>

        {/* FAB */}
        <button 
            onClick={openAddModal}
            className="absolute bottom-8 right-8 w-16 h-16 bg-[#2E7D32] rounded-2xl flex items-center justify-center text-white shadow-2xl hover:bg-[#1b5e20] hover:scale-105 transition-all z-10"
        >
            <Plus size={32} />
        </button>

        {/* Refined Edit/Add Modal Overlay */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl p-8 shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{editingNote.id ? 'Edit Entry' : 'New Entry'}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Capture your thoughts</p>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                        {!bookIdParam && !editingNote.id && (
                             <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Book Reference</label>
                                <div className="relative">
                                    <select 
                                        className="w-full p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-[#2E7D32] outline-none transition-all appearance-none font-medium"
                                        value={editingNote.bookId}
                                        onChange={(e) => setEditingNote({...editingNote, bookId: e.target.value})}
                                    >
                                        {state.books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                        <Book size={16} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Page No. (Optional)</label>
                                <input 
                                    type="number"
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl border-none focus:ring-2 focus:ring-[#2E7D32] outline-none transition-all font-medium"
                                    placeholder="#"
                                    value={editingNote.pageReference || ''}
                                    onChange={(e) => setEditingNote({...editingNote, pageReference: parseInt(e.target.value)})}
                                />
                            </div>
                            <div className="flex-[3]"></div>
                        </div>

                        <div>
                             <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Your Note</label>
                             <textarea 
                                className="w-full h-64 p-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-2xl resize-none border-none focus:ring-2 focus:ring-[#2E7D32] outline-none transition-all leading-relaxed placeholder-gray-400 text-base"
                                placeholder="Write something insightful..."
                                value={editingNote.text || ''}
                                onChange={(e) => setEditingNote({...editingNote, text: e.target.value})}
                             ></textarea>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                        {editingNote.id ? (
                             <button 
                                onClick={() => {
                                    if(confirm('Delete this note?')) {
                                        dispatch({ type: 'DELETE_NOTE', payload: editingNote.id! });
                                        setIsModalOpen(false);
                                    }
                                }}
                                className="px-5 py-3 text-red-500 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors flex items-center"
                            >
                                <Trash2 size={20} className="mr-2" />
                                Delete
                            </button>
                        ) : <div></div>}
                        
                        <button 
                            onClick={handleSaveNote}
                            disabled={!editingNote.text}
                            className="px-8 py-3 bg-[#2E7D32] text-white font-bold rounded-xl shadow-lg hover:bg-[#1b5e20] hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95"
                        >
                            Save Entry
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default NotesScreen;
