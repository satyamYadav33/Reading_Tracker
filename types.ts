
export type BookStatus = 'reading' | 'completed' | 'paused' | 'planned';

export interface Note {
  id: string;
  bookId: string;
  text: string;
  pageReference?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Annotation {
  id: string;
  bookId: string;
  pageNumber: number;
  type: 'pen' | 'highlight';
  color: string;
  points: { x: number; y: number }[]; // Normalized 0-1
  strokeWidth: number;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  startDate: string;
  completionDate?: string;
  coverUrl?: string; // Placeholder mainly
  pdfFileKey?: string | null; // Key for IndexedDB storage
  createdAt: string;
  updatedAt: string;
}

export type BookFilter = 'all' | BookStatus;

// Helper constants for colors
export const COLORS = {
  primary: '#2E7D32', // Forest Green
  secondary: '#1565C0', // Deep Blue
  status: {
    reading: '#1565C0',
    completed: '#4CAF50',
    paused: '#FF9800',
    planned: '#9E9E9E',
  },
  bg: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#212121',
  textSecondary: '#757575',
  error: '#F44336'
};
