import React from 'react';

export const ThinkingScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto p-12 text-center">
      <div className="relative w-24 h-24 mb-10">
        <div className="absolute inset-0 grid grid-cols-2 gap-2 transform rotate-45">
          <div className="bg-primary rounded-lg animate-pulse" style={{ animationDelay: '0s' }}></div>
          <div className="bg-slate-800 rounded-lg animate-pulse" style={{ animationDelay: '0.1s' }}></div>
          <div className="bg-slate-300 rounded-lg animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="bg-primary/50 rounded-lg animate-pulse" style={{ animationDelay: '0.3s' }}></div>
        </div>
      </div>
      
      <h2 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">
        Constructing Puzzle
      </h2>
      <div className="space-y-1 text-sm font-medium text-slate-500 font-mono">
        <p className="animate-pulse">Generating clues...</p>
        <p className="animate-pulse delay-75">Validating logic matrix...</p>
        <p className="animate-pulse delay-150">Calibrating difficulty...</p>
      </div>
    </div>
  );
};
