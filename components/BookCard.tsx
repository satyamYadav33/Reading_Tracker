import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, COLORS } from '../types';

interface BookCardProps {
  book: Book;
}

const BookCard: React.FC<BookCardProps> = ({ book }) => {
  const navigate = useNavigate();

  const progressPercentage = Math.min(100, Math.round((book.currentPage / book.totalPages) * 100));

  const statusColors = {
    reading: COLORS.status.reading,
    completed: COLORS.status.completed,
    paused: COLORS.status.paused,
    planned: COLORS.status.planned,
  };

  const statusLabels = {
      reading: 'Reading',
      completed: 'Completed',
      paused: 'Paused',
      planned: 'Planned'
  }

  return (
    <div
      onClick={() => navigate(`/book/${book.id}`)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 flex space-x-4 mb-3 active:scale-[0.98] transition-all duration-150 cursor-pointer hover:shadow-md"
    >
      <div className="shrink-0 w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded-md overflow-hidden shadow-inner">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-xs text-center p-1">
            No Cover
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 justify-between py-0.5">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight line-clamp-1">
            {book.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{book.author}</p>
        </div>

        <div className="mt-2">
            <div className="flex justify-between items-end mb-1">
                <span 
                    className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${statusColors[book.status]}20`, color: statusColors[book.status] }}
                >
                    {statusLabels[book.status]}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {progressPercentage}%
                </span>
            </div>
          
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: statusColors[book.status],
              }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {book.currentPage} of {book.totalPages} pages
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookCard;