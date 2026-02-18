import * as pdfjsLib from 'pdfjs-dist';

// Ensure worker is set up
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

export const generateThumbnail = async (file: File): Promise<string> => {
  try {
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument(buffer);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    // Scale to width of ~300px for the thumbnail
    const viewportRaw = page.getViewport({ scale: 1.0 });
    const scale = Math.min(1.0, 300 / viewportRaw.width);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const context = canvas.getContext('2d');
    if (!context) return '';

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Return as JPEG to save space in localStorage (approx 10-15kb)
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (e) {
    console.error("Thumbnail generation failed", e);
    return '';
  }
};