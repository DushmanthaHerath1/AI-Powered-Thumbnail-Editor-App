
import React from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface ThumbnailPreviewProps {
  imageUrl: string | null;
  isGenerating: boolean;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({ imageUrl, isGenerating }) => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-video bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#E2E8F0] dark:border-slate-800 group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Thumbnail" 
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 bg-[#F1F5F9]/30 dark:bg-slate-800/20">
            <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed border-[#E2E8F0] dark:border-slate-800 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <ImageIcon className="w-8 h-8 md:w-10 md:h-10 text-slate-300 dark:text-slate-700" />
            </div>
            <p className="text-xs md:text-sm font-semibold text-slate-400 dark:text-slate-600 px-6 text-center">Describe what you want or drop an image</p>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
            <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin mb-4 shadow-sm" />
            <p className="text-[#2563EB] dark:text-blue-400 text-[10px] md:text-[11px] font-bold tracking-widest uppercase animate-pulse">AI Synthesis in Progress</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 md:mt-5 flex items-center gap-2 md:gap-3 opacity-60">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Optimized for CTR, Search & reach</span>
      </div>
    </div>
  );
};

export default ThumbnailPreview;
