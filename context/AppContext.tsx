
import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { Book, Note, Annotation } from '../types';
import { deletePDF } from '../utils/db';

// Define State
interface AppState {
  books: Book[];
  notes: Note[];
  annotations: Annotation[];
  theme: 'light' | 'dark';
}

// Define Actions
type Action =
  | { type: 'LOAD_DATA'; payload: Partial<AppState> }
  | { type: 'ADD_BOOK'; payload: Book }
  | { type: 'UPDATE_BOOK'; payload: Book }
  | { type: 'DELETE_BOOK'; payload: string }
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'ADD_ANNOTATION'; payload: Annotation }
  | { type: 'DELETE_ANNOTATION'; payload: string }
  | { type: 'CLEAR_DATA' }
  | { type: 'TOGGLE_THEME' };

const initialState: AppState = {
  books: [],
  notes: [],
  annotations: [],
  theme: 'light',
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

const STORAGE_KEY = 'reading_tracker_data_v1';

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'LOAD_DATA':
      return { ...state, ...action.payload };
    case 'ADD_BOOK':
      return { ...state, books: [action.payload, ...state.books] };
    case 'UPDATE_BOOK':
      return {
        ...state,
        books: state.books.map((b) => (b.id === action.payload.id ? action.payload : b)),
      };
    case 'DELETE_BOOK':
      // Check if book had a PDF and delete from IndexedDB
      const bookToDelete = state.books.find(b => b.id === action.payload);
      if (bookToDelete?.pdfFileKey) {
          deletePDF(bookToDelete.pdfFileKey).catch(err => console.error("Failed to delete PDF blob", err));
      }

      return {
        ...state,
        books: state.books.filter((b) => b.id !== action.payload),
        notes: state.notes.filter((n) => n.bookId !== action.payload), // Cascade delete notes
        annotations: state.annotations.filter((a) => a.bookId !== action.payload), // Cascade delete annotations
      };
    case 'ADD_NOTE':
      return { ...state, notes: [action.payload, ...state.notes] };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === action.payload.id ? action.payload : n)),
      };
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter((n) => n.id !== action.payload),
      };
    case 'ADD_ANNOTATION':
      return { ...state, annotations: [...state.annotations, action.payload] };
    case 'DELETE_ANNOTATION':
        return { ...state, annotations: state.annotations.filter(a => a.id !== action.payload) };
    case 'CLEAR_DATA':
      return { ...initialState, theme: state.theme }; // Preserve theme
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize data
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure annotations array exists for old data
        if (!parsed.annotations) parsed.annotations = [];
        dispatch({ type: 'LOAD_DATA', payload: parsed });
      } catch (e) {
        console.error("Failed to load data", e);
      }
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // Auto-detect system theme if no data
        dispatch({ type: 'LOAD_DATA', payload: { theme: 'dark' } });
    }
    setIsLoaded(true);
  }, []);

  // Persist State logic moved here to ensure it runs only after load
  useEffect(() => {
    if (isLoaded) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error("Failed to save state to localStorage", e);
        }
    }
  }, [state, isLoaded]);

  // Apply Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
  }, [state.theme]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
