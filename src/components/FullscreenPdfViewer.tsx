import { useState, useEffect } from 'react';
import { FileText, X, Download, ExternalLink, Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getMediaUrl } from '../services/api';
import { Button } from '@/components/ui/button';

interface FullscreenPdfViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export default function FullscreenPdfViewer({ pdfUrl, title, onClose }: FullscreenPdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fullUrl = getMediaUrl(pdfUrl);

  // Keyboard shortcut to close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Header Controls Toolbar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 text-slate-100">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-100 truncate">{title || 'PDF Document'}</h1>
            <p className="text-[10px] text-slate-400 truncate">Dedicated Full-Screen Reader</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 bg-slate-800 rounded-lg p-1 mr-2 border border-slate-700">
            <button
              type="button"
              onClick={() => setZoom(z => Math.max(50, z - 15))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono px-2 text-slate-300 min-w-[45px] text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(200, z + 15))}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoom !== 100 && (
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <a
            href={fullUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 font-medium border border-transparent hover:border-slate-700"
            title="Open in new browser tab"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline">Open New Tab</span>
          </a>

          <a
            href={fullUrl}
            download
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5 font-medium border border-transparent hover:border-slate-700"
            title="Download PDF file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Download</span>
          </a>

          <button
            type="button"
            onClick={toggleBrowserFullscreen}
            className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Toggle Browser Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <Button
            type="button"
            onClick={onClose}
            variant="destructive"
            size="sm"
            className="ml-2 h-9 text-xs font-bold gap-1"
          >
            <X className="w-4 h-4" />
            <span>Close</span>
          </Button>
        </div>
      </header>

      {/* Main PDF Viewport Container */}
      <main className="flex-1 bg-slate-900/60 p-2 sm:p-4 overflow-auto flex items-center justify-center">
        <div
          className="w-full h-full max-w-6xl rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl transition-all duration-150"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          <iframe
            src={`${fullUrl}#toolbar=1&navpanes=1&view=FitH`}
            className="w-full h-full border-0 rounded-xl"
            title={title}
          />
        </div>
      </main>
    </div>
  );
}
