import React, { useState } from 'react';
import { ExportSettings, DEFAULT_EXPORT_SETTINGS } from '../services/exportService';

interface ExportSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-20 text-xs font-mono px-2 py-1 border border-slate-200 rounded bg-white"
        />
      </div>
    </label>
  );
}

export const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({ open, onClose, onExport }) => {
  const [settings, setSettings] = useState<ExportSettings>({ ...DEFAULT_EXPORT_SETTINGS });

  if (!open) return null;

  const update = <K extends keyof ExportSettings>(key: K, value: ExportSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setSettings({ ...DEFAULT_EXPORT_SETTINGS });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Export Settings</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-6 overflow-y-auto">

          {/* Border thickness */}
          <div>
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-700">Border thickness</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.5}
                  max={5}
                  step={0.5}
                  value={settings.borderThickness}
                  onChange={e => update('borderThickness', parseFloat(e.target.value))}
                  className="w-28 accent-slate-700"
                />
                <span className="text-xs font-mono text-slate-500 w-8 text-right">{settings.borderThickness}px</span>
              </div>
            </label>
          </div>

          {/* Show logo */}
          <div>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="text-sm font-medium text-slate-700">Show "LOGICGRID" cell</span>
                <p className="text-xs text-slate-400 mt-0.5">The dark header cell in the top-left corner</p>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors ${settings.showLogo ? 'bg-slate-700' : 'bg-slate-200'}`}
                onClick={() => update('showLogo', !settings.showLogo)}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.showLogo ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          {/* Colors */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700">Colors</p>
            <div className="space-y-3 pl-1">
              <ColorInput label="Background" value={settings.backgroundColor} onChange={v => update('backgroundColor', v)} />
              <ColorInput label="Cell background" value={settings.cellColor} onChange={v => update('cellColor', v)} />
              <ColorInput label="Header background" value={settings.headerColor} onChange={v => update('headerColor', v)} />
              <ColorInput label="Thick borders" value={settings.borderColor} onChange={v => update('borderColor', v)} />
              <ColorInput label="Cell borders" value={settings.cellBorderColor} onChange={v => update('cellBorderColor', v)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Reset defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onExport(settings)}
              className="px-5 py-2 text-sm font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
