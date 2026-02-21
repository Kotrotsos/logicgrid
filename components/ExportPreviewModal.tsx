import React, { useMemo, useRef, useEffect } from 'react';
import { Category, GridState, GridSettings } from '../types';
import { generateSVG } from '../services/exportService';

interface ExportPreviewModalProps {
  open: boolean;
  categories: Category[];
  gridState: GridState;
  gridSettings: GridSettings;
  onExport: () => void;
  onClose: () => void;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  open, categories, gridState, gridSettings, onExport, onClose,
}) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const svgString = useMemo(() => {
    if (!open) return '';
    return generateSVG(categories, gridState, gridSettings);
  }, [open, categories, gridState, gridSettings]);

  // Safely inject SVG by parsing it as XML first, which avoids script execution
  useEffect(() => {
    const container = previewRef.current;
    if (!container || !svgString) return;

    container.textContent = '';
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.documentElement;
    if (svgEl.tagName === 'svg') {
      svgEl.style.maxWidth = '100%';
      svgEl.style.height = 'auto';
      container.appendChild(document.importNode(svgEl, true));
    }
  }, [svgString]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Export Preview</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="flex justify-center">
            <div
              ref={previewRef}
              className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 max-w-full overflow-auto"
            />
          </div>
          <p className="text-xs text-slate-400 text-center mt-3">
            This is what the exported SVG will look like. A Markdown file with clues and metadata will also be downloaded.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};
