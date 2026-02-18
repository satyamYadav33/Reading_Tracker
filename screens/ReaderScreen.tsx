
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Moon, Sun, Timer, StickyNote, X, Play, Pause, RotateCcw, Send, Loader2, ZoomIn, ZoomOut, Maximize, Minimize, BookOpen, Clock, ChevronRight, PenTool, Highlighter, Pen, Eraser, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getPDF } from '../utils/db';
import { Annotation } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

interface PdfPageProps {
  pageNumber: number;
  pdfDoc: any;
  scale: number;
  isDarkMode: boolean;
  onPageVisible: (pageNumber: number) => void;
  // Annotation props
  isAnnotationMode: boolean;
  currentTool: 'pen' | 'highlight';
  currentColor: string;
  annotations: Annotation[];
  onAddAnnotation: (annotation: Annotation) => void;
  onDeleteAnnotation: (id: string) => void;
}

const PdfPage: React.FC<PdfPageProps> = ({ 
    pageNumber, pdfDoc, scale, isDarkMode, onPageVisible, 
    isAnnotationMode, currentTool, currentColor, annotations, onAddAnnotation, onDeleteAnnotation 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const annotationCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [pageHeight, setPageHeight] = useState(500);
  const [viewport, setViewport] = useState<any>(null);

  // Drawing State
  const isDrawing = useRef(false);
  const currentPath = useRef<{x: number, y: number}[]>([]);

  // Intersection Observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                if (entry.intersectionRatio > 0.3) {
                    onPageVisible(pageNumber);
                }
            }
        },
        { threshold: [0, 0.5], rootMargin: '200px' }
    );
    
    if (containerRef.current) {
        observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [pageNumber, onPageVisible]);

  // Render PDF Content
  useEffect(() => {
    if (!isVisible || !pdfDoc || !canvasRef.current || isRendered) return;

    let renderTask: any;

    const render = async () => {
        try {
            const page = await pdfDoc.getPage(pageNumber);
            const newViewport = page.getViewport({ scale });
            setViewport(newViewport);
            setPageHeight(newViewport.height);

            const canvas = canvasRef.current;
            if (canvas) {
                const context = canvas.getContext('2d');
                canvas.height = newViewport.height;
                canvas.width = newViewport.width;

                const renderContext = {
                    canvasContext: context!,
                    viewport: newViewport,
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;
                setIsRendered(true);
            }
        } catch (error: any) {
             // Ignore rendering cancelled errors
        }
    };

    render();

    return () => {
        if (renderTask) renderTask.cancel();
    };
  }, [isVisible, pdfDoc, pageNumber, scale, isRendered]);

  // Handle Scale Change trigger
  useEffect(() => {
      if (isRendered) setIsRendered(false);
  }, [scale]);

  // --- Annotation Rendering ---
  const drawAnnotations = useCallback(() => {
      const canvas = annotationCanvasRef.current;
      if (!canvas || !viewport) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match size to PDF canvas
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      annotations.forEach(ann => {
          if (ann.points.length < 2) return;
          
          ctx.beginPath();
          ctx.strokeStyle = ann.color;
          ctx.lineWidth = ann.strokeWidth * scale; // Scale stroke width
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          // Highlighter effect
          if (ann.type === 'highlight') {
              ctx.globalAlpha = 0.4;
              ctx.globalCompositeOperation = 'multiply'; // Better highlighter blending
          } else {
              ctx.globalAlpha = 1.0;
              ctx.globalCompositeOperation = 'source-over';
          }

          const startX = ann.points[0].x * viewport.width;
          const startY = ann.points[0].y * viewport.height;
          ctx.moveTo(startX, startY);

          for (let i = 1; i < ann.points.length; i++) {
              ctx.lineTo(ann.points[i].x * viewport.width, ann.points[i].y * viewport.height);
          }
          ctx.stroke();
      });
  }, [annotations, viewport, scale]);

  useEffect(() => {
      drawAnnotations();
  }, [drawAnnotations]);


  // --- Drawing Handlers ---
  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = annotationCanvasRef.current;
      if (!canvas || !viewport) return null;
      
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;
      
      if ('touches' in e) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = (e as React.MouseEvent).clientX;
          clientY = (e as React.MouseEvent).clientY;
      }

      const x = (clientX - rect.left) / rect.width; // Normalize 0-1
      const y = (clientY - rect.top) / rect.height;
      return { x, y };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isAnnotationMode) return;
      // If we are in annotation mode, we prevent default to stop scrolling
      if ('touches' in e && e.cancelable) {
           // e.preventDefault(); // Optional: depending on if we want to block scroll immediately
      }
      isDrawing.current = true;
      const coords = getCoords(e);
      if (coords) currentPath.current = [coords];
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing.current || !isAnnotationMode) return;
      e.preventDefault(); // Stop scrolling while drawing
      const coords = getCoords(e);
      
      if (coords) {
          currentPath.current.push(coords);
          
          // Live render logic (simple optimization)
          const canvas = annotationCanvasRef.current;
          const ctx = canvas?.getContext('2d');
          if (canvas && ctx && viewport) {
              const last = currentPath.current[currentPath.current.length - 2];
              const curr = coords;
              
              ctx.beginPath();
              ctx.strokeStyle = currentColor;
              ctx.lineWidth = (currentTool === 'highlight' ? 24 : 3) * scale;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';
              
              if (currentTool === 'highlight') {
                  ctx.globalAlpha = 0.4;
                  ctx.globalCompositeOperation = 'multiply';
              } else {
                  ctx.globalAlpha = 1.0;
                  ctx.globalCompositeOperation = 'source-over';
              }

              ctx.moveTo(last.x * viewport.width, last.y * viewport.height);
              ctx.lineTo(curr.x * viewport.width, curr.y * viewport.height);
              ctx.stroke();
          }
      }
  };

  const handleEnd = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      
      if (currentPath.current.length > 1) {
          onAddAnnotation({
              id: Math.random().toString(36).substr(2, 9),
              bookId: '', // Filled by parent
              pageNumber,
              type: currentTool,
              color: currentColor,
              points: currentPath.current,
              strokeWidth: currentTool === 'highlight' ? 24 : 3,
              createdAt: new Date().toISOString()
          });
      }
      currentPath.current = [];
      drawAnnotations(); // Redraw full state to ensure clean layers
  };

  // Hit detection for deleting annotations
  const handleCanvasClick = (e: React.MouseEvent) => {
      if (isAnnotationMode) return;
      
      const canvas = annotationCanvasRef.current;
      if (!canvas || !viewport) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Hit test
      const HIT_RADIUS_PX = 20;
      
      const clickedAnnotation = annotations.find(ann => {
           return ann.points.some(p => {
               const px = p.x * viewport.width;
               const py = p.y * viewport.height;
               const ex = x * viewport.width;
               const ey = y * viewport.height;
               return Math.hypot(px - ex, py - ey) < HIT_RADIUS_PX;
           });
      });

      if (clickedAnnotation) {
          if (window.confirm('Delete this annotation?')) {
              onDeleteAnnotation(clickedAnnotation.id);
          }
      }
  };

  return (
    <div 
        ref={containerRef} 
        id={`page_${pageNumber}`}
        className="flex justify-center mb-4 transition-all duration-200 relative group"
        style={{ minHeight: `${pageHeight}px` }}
    >
       <div className={`relative shadow-md bg-white ${isDarkMode ? 'pdf-dark-filter' : ''}`}>
           <canvas ref={canvasRef} className="block max-w-full h-auto" />
           {/* Annotation Layer */}
           <canvas 
                ref={annotationCanvasRef}
                className={`absolute inset-0 z-10 ${isAnnotationMode ? 'cursor-crosshair touch-none' : 'cursor-pointer'}`}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
                onClick={handleCanvasClick}
           />
           {!isRendered && (
               <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                    <Loader2 className="animate-spin mb-2" size={24} />
               </div>
           )}
       </div>
       <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] px-2 rounded pointer-events-none z-20">
           Page {pageNumber}
       </div>
    </div>
  );
};

const ReaderScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const book = state.books.find((b) => b.id === id);
  const isDarkMode = state.theme === 'dark';

  const [activeTab, setActiveTab] = useState<'none' | 'notes' | 'timer'>('none');
  const [loading, setLoading] = useState(true);

  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  
  // Annotation State
  const [isAnnotationMode, setIsAnnotationMode] = useState(false);
  const [currentTool, setCurrentTool] = useState<'pen' | 'highlight'>('pen');
  const [currentColor, setCurrentColor] = useState('#ff0000');
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [timerOpacity, setTimerOpacity] = useState(1);
  const timerInteractTimeout = useRef<any>(null);
  
  // Debounce Ref
  const updateProgressTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Note State
  const [noteText, setNoteText] = useState('');
  const bookNotes = state.notes.filter(n => n.bookId === id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Refs
  const screenRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Colors
  const palette = [
      '#000000', '#FF0000', '#2E7D32', '#1565C0', // Pens
      '#FFEB3B', '#FF9800', '#00BCD4', '#E91E63'  // Highlighters
  ];

  // Load PDF
  useEffect(() => {
    let loadingTask: any;
    const loadPdf = async () => {
      // Small delay for animation
      await new Promise(r => setTimeout(r, 600));
      if (book?.pdfFileKey) {
        try {
          const file = await getPDF(book.pdfFileKey);
          if (file) {
            const fileUrl = URL.createObjectURL(file);
            loadingTask = pdfjsLib.getDocument(fileUrl);
            const doc = await loadingTask.promise;
            setPdfDoc(doc);
            setNumPages(doc.numPages);
            setCurrentPage(book.currentPage || 1);
            setPageInput((book.currentPage || 1).toString());
            
            // Auto scroll to saved page
            setTimeout(() => {
                const savedPage = book.currentPage || 1;
                document.getElementById(`page_${savedPage}`)?.scrollIntoView({ behavior: 'auto' });
            }, 100);

            // Auto Scale logic
            const firstPage = await doc.getPage(1);
            const viewport = firstPage.getViewport({ scale: 1.0 });
            // Calculate scale to fit width minus margins
            const screenWidth = window.innerWidth;
            const isMobile = screenWidth < 768;
            const targetWidth = isMobile ? screenWidth - 32 : screenWidth * 0.7;
            const autoScale = Math.min(Math.max(targetWidth / viewport.width, 0.5), 2.0);
            setScale(autoScale);
          }
        } catch (e) {
          console.error("Error loading PDF", e);
        }
      }
      setLoading(false);
    };
    loadPdf();
    return () => { if (loadingTask) loadingTask.destroy(); }
    // Critical: Only reload if book ID or PDF key changes, NOT when book progress changes
  }, [book?.id, book?.pdfFileKey]);

  // Sync page input when scrolling
  useEffect(() => {
    if (!document.activeElement?.className.includes('page-input')) {
        setPageInput(currentPage.toString());
    }
  }, [currentPage]);

  // Keyboard Navigation
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (activeTab === 'notes') return; // Disable if typing in notes
          if (document.activeElement?.tagName === 'INPUT') return; // Disable if typing in page input

          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
              e.preventDefault();
              scrollToPage(currentPage + 1);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
              e.preventDefault();
              scrollToPage(currentPage - 1);
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, activeTab]);

  // Timer Logic
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      if (isTimerRunning && timeLeft > 0) {
          interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      } else if (timeLeft === 0) setIsTimerRunning(false);
      return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Timer Helpers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const resetTimer = () => { setIsTimerRunning(false); setTimeLeft(timerMode === 'focus' ? 25 * 60 : 5 * 60); };
  const switchTimerMode = (mode: 'focus' | 'break') => {
    setTimerMode(mode);
    setIsTimerRunning(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  // Timer Fade
  const resetTimerFade = () => {
      setTimerOpacity(1);
      if (timerInteractTimeout.current) clearTimeout(timerInteractTimeout.current);
      timerInteractTimeout.current = setTimeout(() => setTimerOpacity(0.4), 2500);
  };

  useEffect(() => {
      if (activeTab === 'timer') resetTimerFade();
      return () => clearTimeout(timerInteractTimeout.current);
  }, [activeTab, timeLeft, isTimerRunning]);

  const toggleFullScreen = () => {
    if (!isFullScreen) {
        screenRef.current?.requestFullscreen().catch(console.error);
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const debounceSaveProgress = (pageNum: number) => {
      if (updateProgressTimeout.current) clearTimeout(updateProgressTimeout.current);
      updateProgressTimeout.current = setTimeout(() => {
          if (book) {
              dispatch({ 
                  type: 'UPDATE_BOOK', 
                  payload: { ...book, currentPage: pageNum, updatedAt: new Date().toISOString() } 
              });
          }
      }, 1000); // 1 Second debounce
  };

  const scrollToPage = (pageNum: number) => {
      if (pageNum < 1 || pageNum > numPages) return;
      const el = document.getElementById(`page_${pageNum}`);
      if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setCurrentPage(pageNum);
          debounceSaveProgress(pageNum);
      }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const page = parseInt(pageInput);
      if (!isNaN(page)) {
          scrollToPage(page);
      } else {
          setPageInput(currentPage.toString());
      }
  };

  const handleSaveNote = () => {
      if(!noteText.trim()) return;
      dispatch({
          type: 'ADD_NOTE',
          payload: {
              id: Math.random().toString(36).substring(2, 9),
              bookId: id!,
              text: noteText,
              pageReference: currentPage,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
          }
      });
      setNoteText('');
  }

  const handleAddAnnotation = (ann: Annotation) => {
      dispatch({ 
          type: 'ADD_ANNOTATION', 
          payload: { ...ann, bookId: id! } 
      });
  };

  const handleDeleteAnnotation = (annId: string) => {
      dispatch({
          type: 'DELETE_ANNOTATION',
          payload: annId
      });
  };

  if (!book) return <div className="p-10">Book not found</div>;

  return (
    <div 
        ref={screenRef}
        className={`flex flex-col h-full ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} relative transition-colors duration-300`}
    >
      
      {/* --- Top Toolbar (Organized) --- */}
      <div className={`h-16 shrink-0 flex items-center justify-between px-4 border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} z-30 shadow-sm`}>
        {/* Left: Nav & Title */}
        <div className="flex items-center space-x-3 w-1/3">
            <button 
                onClick={() => navigate(-1)} 
                className={`p-2 rounded-xl transition-all ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                title="Back to Library"
            >
                <ChevronLeft size={22} />
            </button>
            <div className="flex flex-col hidden sm:flex">
                <h1 className="font-bold text-sm leading-tight line-clamp-1">{book.title}</h1>
                <span className="text-[10px] opacity-60">Reading Mode</span>
            </div>
        </div>

        {/* Center: Page Navigation */}
        <div className="flex items-center justify-center space-x-1 w-1/3">
             <button 
                onClick={() => scrollToPage(currentPage - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 disabled:opacity-30"
                disabled={currentPage <= 1}
                title="Previous Page"
            >
                <ChevronLeft size={20} />
            </button>
            
            <form onSubmit={handlePageInputSubmit} className="flex items-center px-1">
                <input 
                    type="text"
                    inputMode="numeric" 
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onBlur={handlePageInputSubmit}
                    className="page-input w-10 text-center bg-transparent font-bold text-gray-800 dark:text-white outline-none focus:bg-gray-100 dark:focus:bg-gray-700 rounded p-1 text-sm"
                    title="Jump to page"
                />
                <span className="text-xs text-gray-400 font-medium whitespace-nowrap">/ {numPages}</span>
            </form>

            <button 
                onClick={() => scrollToPage(currentPage + 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 disabled:opacity-30"
                disabled={currentPage >= numPages}
                title="Next Page"
            >
                <ChevronRight size={20} />
            </button>
        </div>

        {/* Right: Tools & View */}
        <div className="flex items-center justify-end space-x-1 w-1/3">
             <button 
                onClick={() => setScale(s => Math.min(3, s + 0.1))} 
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 hidden sm:block"
                title="Zoom In"
            >
                <ZoomIn size={18} />
            </button>
             
             <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

             <button 
                onClick={() => setIsAnnotationMode(!isAnnotationMode)}
                className={`p-2 rounded-xl transition-all ${isAnnotationMode ? 'bg-[#2E7D32] text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                title="Annotate"
            >
                <PenTool size={18} />
            </button>

            <button 
                onClick={() => setActiveTab(activeTab === 'notes' ? 'none' : 'notes')}
                className={`p-2 rounded-xl transition-all ${activeTab === 'notes' ? 'bg-[#2E7D32] text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                title="Notes"
            >
                <StickyNote size={18} />
            </button>

             <button 
                onClick={() => { setActiveTab(activeTab === 'timer' ? 'none' : 'timer'); resetTimerFade(); }}
                className={`p-2 rounded-xl transition-all ${activeTab === 'timer' ? 'bg-[#2E7D32] text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}`}
                title="Focus Timer"
            >
                <Timer size={18} />
            </button>
            
            <button 
                onClick={() => dispatch({ type: 'TOGGLE_THEME' })} 
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Toggle Theme"
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="flex-1 relative flex overflow-hidden">
          
          {/* PDF Scroll Area */}
          <div className={`flex-1 h-full w-full overflow-y-auto overflow-x-hidden relative transition-all duration-300 p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-200'} scroll-smooth`}>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-fade-in">
                    <div className="relative mb-6">
                        <div className="text-[#2E7D32] dark:text-green-500 animate-pulse-ring rounded-full w-20 h-20 flex items-center justify-center">
                            <BookOpen size={48} className="animate-bounce" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">Opening Book</h2>
                    <p className="text-gray-500 dark:text-gray-400">Preparing pages for you...</p>
                </div>
            ) : pdfDoc ? (
                <div className="max-w-full flex flex-col items-center pb-32">
                     {Array.from({ length: numPages }, (_, index) => (
                        <PdfPage 
                            key={`page_${index + 1}`} 
                            pageNumber={index + 1} 
                            pdfDoc={pdfDoc} 
                            scale={scale} 
                            isDarkMode={isDarkMode}
                            onPageVisible={(pageNum) => setCurrentPage(pageNum)}
                            // Annotation Props
                            isAnnotationMode={isAnnotationMode}
                            currentTool={currentTool}
                            currentColor={currentColor}
                            annotations={state.annotations.filter(a => a.bookId === id && a.pageNumber === index + 1)}
                            onAddAnnotation={handleAddAnnotation}
                            onDeleteAnnotation={handleDeleteAnnotation}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">PDF source unavailable</div>
            )}
          </div>

          {/* --- Annotation Palette (Bottom Center) --- */}
          {isAnnotationMode && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center z-40 animate-slide-up">
                  <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 flex flex-col items-center space-y-3">
                        {/* Tool Selection */}
                        <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button 
                                onClick={() => setCurrentTool('pen')}
                                className={`p-3 rounded-lg flex items-center space-x-2 transition-all ${currentTool === 'pen' ? 'bg-white dark:bg-gray-600 shadow-sm text-[#2E7D32] dark:text-white' : 'text-gray-400'}`}
                                title="Pen Tool"
                            >
                                <Pen size={20} />
                                <span className="text-xs font-bold">Pen</span>
                            </button>
                            <button 
                                onClick={() => setCurrentTool('highlight')}
                                className={`p-3 rounded-lg flex items-center space-x-2 transition-all ${currentTool === 'highlight' ? 'bg-white dark:bg-gray-600 shadow-sm text-[#2E7D32] dark:text-white' : 'text-gray-400'}`}
                                title="Highlighter"
                            >
                                <Highlighter size={20} />
                                <span className="text-xs font-bold">Marker</span>
                            </button>
                        </div>
                        
                        {/* Divider */}
                        <div className="w-full h-px bg-gray-100 dark:bg-gray-700"></div>

                        {/* Colors */}
                        <div className="flex space-x-2 px-2">
                            {palette.map(c => (
                                <button 
                                    key={c}
                                    onClick={() => setCurrentColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${currentColor === c ? 'border-gray-400 scale-110 shadow-md' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                    title={c}
                                />
                            ))}
                        </div>

                        {/* Close */}
                         <button 
                            onClick={() => setIsAnnotationMode(false)}
                            className="w-full py-2 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-semibold"
                            title="Close Tools"
                        >
                            <X size={14} className="mr-1"/>
                            Done
                        </button>
                  </div>
              </div>
          )}

          {/* Floating Focus Timer */}
          {activeTab === 'timer' && (
              <div 
                className={`absolute top-4 right-4 z-40 w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-600 transition-all duration-1000 ease-in-out`}
                style={{ opacity: timerOpacity }}
                onMouseEnter={() => setTimerOpacity(1)}
                onMouseMove={() => setTimerOpacity(1)}
                onClick={() => setTimerOpacity(1)}
              >
                  <div className="p-4 flex flex-col items-center">
                        <div className="w-full flex justify-between items-center mb-2">
                             <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Focus Mode</h3>
                             <button onClick={() => setActiveTab('none')} className="text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={16}/></button>
                        </div>
                        <div className="text-5xl font-mono font-bold text-[#2E7D32] dark:text-green-400 mb-4 tracking-tighter">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="flex items-center justify-between w-full space-x-3">
                             <button onClick={resetTimer} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><RotateCcw size={16} /></button>
                             <button 
                                onClick={toggleTimer} 
                                className={`flex-1 py-2 rounded-xl flex items-center justify-center space-x-2 text-white font-bold shadow-md transition-all active:scale-95 ${isTimerRunning ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#2E7D32] hover:bg-[#1b5e20]'}`}
                              >
                                  {isTimerRunning ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                  <span className="text-sm">{isTimerRunning ? 'Pause' : 'Start'}</span>
                              </button>
                        </div>
                        <div className="flex w-full mt-3 bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
                            <button onClick={() => switchTimerMode('focus')} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${timerMode === 'focus' ? 'bg-white dark:bg-gray-600 shadow text-[#2E7D32] dark:text-white' : 'text-gray-400'}`}>Focus</button>
                            <button onClick={() => switchTimerMode('break')} className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${timerMode === 'break' ? 'bg-white dark:bg-gray-600 shadow text-blue-500 dark:text-blue-400' : 'text-gray-400'}`}>Break</button>
                        </div>
                  </div>
              </div>
          )}

          {/* Notes Sidebar (Refined) */}
          {activeTab === 'notes' && (
              <div className={`absolute right-0 top-0 bottom-0 w-80 shadow-2xl z-30 flex flex-col ${isDarkMode ? 'bg-gray-800 border-l border-gray-700' : 'bg-white border-l border-gray-200'} animate-slide-in-right`}>
                   <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
                        {/* Header */}
                        <div className="px-5 py-4 border-b bg-white dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center shadow-sm z-10">
                            <div>
                                <h2 className="font-bold text-lg text-gray-800 dark:text-white">Quick Notes</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Highlights for Page {currentPage}</p>
                            </div>
                            <button onClick={() => setActiveTab('none')} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"><X size={20}/></button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {bookNotes.length > 0 ? (
                                bookNotes.map(note => (
                                    <div key={note.id} className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                            {note.text}
                                        </p>
                                        <div className="mt-2 flex items-center justify-between border-t border-gray-50 dark:border-gray-700 pt-2">
                                            <div className="flex items-center text-[10px] text-gray-400 font-medium">
                                                <Clock size={10} className="mr-1" />
                                                {new Date(note.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                            {note.pageReference && (
                                                <button onClick={() => scrollToPage(note.pageReference!)} className="text-[10px] font-bold text-[#2E7D32] bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded hover:underline">
                                                    Pg {note.pageReference}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-48 text-center opacity-60">
                                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3 text-gray-400">
                                        <StickyNote size={20} />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No notes yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                            <div className="relative">
                                <textarea
                                    className={`w-full min-h-[5rem] p-3 pr-12 rounded-xl text-sm outline-none resize-none border focus:ring-2 focus:ring-[#2E7D32] focus:border-transparent transition-all ${isDarkMode ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'}`}
                                    placeholder="Type a note..."
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSaveNote();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={handleSaveNote}
                                    disabled={!noteText.trim()}
                                    className="absolute bottom-3 right-3 p-2 bg-[#2E7D32] text-white rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#1b5e20] transition-transform active:scale-95"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                   </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default ReaderScreen;
