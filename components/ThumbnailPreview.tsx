
import React from 'react';

interface ThumbnailPreviewProps {
  imageUrl: string | null;
  isGenerating: boolean;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({ imageUrl, isGenerating }) => {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="relative w-full aspect-video bg-white rounded-xl md:rounded-2xl overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#E2E8F0] group transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Thumbnail" 
            className="w-full h-full object-cover select-none pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-[#F1F5F9]/30">
            <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-dashed border-[#E2E8F0] rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 md:h-10 md:w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs md:text-sm font-semibold text-slate-400 px-6 text-center">Describe what you want or drop an image</p>
          </div>
        )}

        {isGenerating && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-20">
            <div className="w-10 h-10 border-[3px] border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4 shadow-sm shadow-blue-500/20"></div>
            <p className="text-[#2563EB] text-[10px] md:text-[11px] font-bold tracking-widest uppercase animate-pulse">AI Synthesis in Progress</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 md:mt-5 flex items-center gap-2 md:gap-3 opacity-60">
        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Optimized for CTR, Search & reach</span>
      </div>
    </div>
  );
};

export default ThumbnailPreview;
