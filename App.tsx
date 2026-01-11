
import React, { useState, useEffect, useCallback } from 'react';
import { Message, ThumbnailState } from './types';
import ChatInterface from './components/ChatInterface';
import ThumbnailPreview from './components/ThumbnailPreview';
import { geminiService } from './services/geminiService';
import { fileToBase64 } from './utils/imageUtils';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [generationMode, setGenerationMode] = useState<'fast' | 'ctr' | 'inpainting'>('ctr');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({
    currentImageUrl: null,
    history: [],
    historyIndex: -1,
    isGenerating: false,
  });

  // Track drag depth to prevent flickering when hovering over child elements
  const dragCounter = React.useRef(0);

  const addMessage = (role: 'user' | 'assistant', text: string, imageUrl?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      text,
      imageUrl,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const updateHistory = (newImageUrl: string) => {
    setThumbnail(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newImageUrl);
      return {
        ...prev,
        currentImageUrl: newImageUrl,
        history: newHistory,
        historyIndex: newHistory.length - 1
      };
    });
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  const undo = useCallback(() => {
    triggerHaptic();
    setThumbnail(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return { ...prev, historyIndex: newIndex, currentImageUrl: prev.history[newIndex] };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    triggerHaptic();
    setThumbnail(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return { ...prev, historyIndex: newIndex, currentImageUrl: prev.history[newIndex] };
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) redo(); else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleSendMessage = async (text: string) => {
    addMessage('user', text);
    setThumbnail(prev => ({ ...prev, isGenerating: true }));
    try {
      const response = await geminiService.processThumbnail(text, thumbnail.currentImageUrl);
      if (response.imageUrl) updateHistory(response.imageUrl);
      addMessage('assistant', response.text);
    } catch (error) {
      addMessage('assistant', "Encountered an error. Please try again.");
    } finally {
      setThumbnail(prev => ({ ...prev, isGenerating: false }));
    }
  };

  const handleFileUpload = async (file: File) => {
    if (thumbnail.isGenerating) return;
    if (!file.type.startsWith('image/')) return;
    
    try {
      const base64 = await fileToBase64(file);
      const dataUrl = `data:${file.type};base64,${base64}`;
      updateHistory(dataUrl);
      addMessage('user', `Uploaded: ${file.name}`);
      addMessage('assistant', "Image loaded. How should we optimize it?");
      if (window.innerWidth < 768) setIsChatOpen(true);
    } catch (error) {
      addMessage('assistant', "Upload failed.");
    }
  };

  // Drag and Drop Handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRemoveBackground = () => {
    if (thumbnail.currentImageUrl) handleSendMessage("remove background and use professional lighting");
  };

  const QuickActionButtons = ({ className = "" }: { className?: string }) => (
    <div className={`grid grid-cols-1 gap-2 ${className}`}>
      <button onClick={handleRemoveBackground} disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating} className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF] rounded-xl text-xs font-bold transition-all disabled:opacity-50 touch-target">
        <span>🪄</span> Remove BG
      </button>
      <button onClick={() => handleSendMessage("boost saturation and improve contrast")} disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating} className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF] rounded-xl text-xs font-bold transition-all disabled:opacity-50 touch-target">
        <span>🌈</span> Color Boost
      </button>
      <button onClick={() => handleSendMessage("add a white stroke glow around the subject")} disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating} className="flex items-center gap-3 w-full px-4 py-3 bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF] rounded-xl text-xs font-bold transition-all disabled:opacity-50 touch-target">
        <span>✨</span> Rim Light
      </button>
    </div>
  );

  return (
    <div 
      className="flex flex-col h-screen bg-[#F8F9FB] text-slate-800 relative" 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Global Drag and Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-[#2563EB]/10 backdrop-blur-md flex items-center justify-center pointer-events-none">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl border-4 border-dashed border-[#2563EB] flex flex-col items-center animate-bounce">
            <div className="w-24 h-24 bg-[#2563EB] text-white rounded-3xl flex items-center justify-center mb-6 text-4xl shadow-lg">📥</div>
            <h2 className="text-3xl font-black text-[#2563EB] tracking-tight">Drop Image Here</h2>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-xs">Release to start editing</p>
          </div>
        </div>
      )}
      
      {/* Top Header */}
      <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-white border-b border-[#E2E8F0] z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-[#2563EB] touch-target">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-bold text-sm">CG</div>
            <h1 className="hidden sm:block text-lg font-bold text-slate-900 tracking-tight">ClickGenius</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:block bg-[#EFF6FF] text-[#2563EB] text-[10px] md:text-xs font-bold px-3 md:px-4 py-1.5 rounded-full border border-[#DBEAFE]">
            1920 × 1080 (16:9)
          </div>
          <button 
            disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating}
            onClick={() => { const link = document.createElement('a'); link.href = thumbnail.currentImageUrl!; link.download = 'thumbnail.png'; link.click(); }}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white text-[10px] md:text-xs font-bold px-4 md:px-6 py-2 rounded-lg transition-all shadow-sm touch-target"
          >
            <span className="hidden sm:inline">EXPORT PROJECT</span>
            <span className="sm:hidden">EXPORT</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Sidebar Overlay (Drawer) */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-2xl p-6 flex flex-col animate-slide-right">
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-[#2563EB]">Tools</span>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 -mr-2 text-slate-400 touch-target">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Generation Mode</h3>
              <div className="flex flex-col bg-[#F1F5F9] p-1 rounded-xl mb-8">
                {['fast', 'ctr', 'inpainting'].map(m => (
                  <button key={m} onClick={() => setGenerationMode(m as any)} className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${generationMode === m ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500'}`}>{m.toUpperCase()}</button>
                ))}
              </div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h3>
              <QuickActionButtons />
            </aside>
          </div>
        )}

        {/* Desktop/Tablet Left Sidebar (Rail/Panel) */}
        <aside className="hidden lg:flex w-[240px] xl:w-[280px] bg-white border-r border-[#E2E8F0] p-6 flex-col gap-8 overflow-y-auto">
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Generation Mode</h3>
            <div className="flex flex-col bg-[#F1F5F9] p-1 rounded-xl">
              {[
                { id: 'fast', label: 'Fast Gen', icon: '🚀' },
                { id: 'ctr', label: 'CTR Optimized', icon: '🎯' },
                { id: 'inpainting', label: 'Inpainting', icon: '🪄' }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setGenerationMode(mode.id as any)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    generationMode === mode.id ? 'bg-white text-[#2563EB] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>{mode.icon}</span> {mode.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Actions</h3>
            <QuickActionButtons />
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-[#F8F9FB] relative overflow-y-auto overflow-x-hidden scrollbar-thin">
          <div className="w-full flex flex-col items-center max-w-5xl">
            <ThumbnailPreview imageUrl={thumbnail.currentImageUrl} isGenerating={thumbnail.isGenerating} />
            
            {/* Canvas Toolbar - Responsive spacing and icons */}
            {thumbnail.currentImageUrl && (
              <div className="w-full flex flex-col sm:flex-row items-center justify-between mt-4 md:mt-6 gap-4">
                <div className="flex items-center gap-1 bg-white sm:bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0] shadow-sm sm:shadow-none">
                  <button onClick={undo} disabled={thumbnail.historyIndex <= 0 || thumbnail.isGenerating} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 hover:bg-white text-slate-600 touch-target">
                    <span>↶</span> <span className="hidden xs:inline">UNDO</span>
                  </button>
                  <div className="w-px h-4 bg-slate-300 mx-1"></div>
                  <button onClick={redo} disabled={thumbnail.historyIndex >= thumbnail.history.length - 1 || thumbnail.isGenerating} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-30 hover:bg-white text-slate-600 touch-target">
                    <span className="hidden xs:inline">REDO</span> <span>↷</span>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                   <div className="hidden xs:flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase">
                     <span>Zoom</span>
                     <div className="flex items-center bg-[#F1F5F9] rounded-lg px-2 py-1">100%</div>
                   </div>
                   <button onClick={() => setThumbnail({ currentImageUrl: null, history: [], historyIndex: -1, isGenerating: false })} className="text-[10px] font-black text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition-all touch-target">
                     RESET CANVAS
                   </button>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right Sidebar (Chat) - Adapts to Bottom Sheet on Mobile */}
        <aside className={`
          fixed inset-0 z-50 lg:relative lg:block lg:w-[300px] xl:w-[380px] bg-white border-l border-[#E2E8F0] transition-transform duration-300
          ${isChatOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
          ${isChatOpen ? 'flex flex-col' : 'hidden lg:flex'}
        `}>
          {/* Mobile Bottom Sheet Handle */}
          <div className="lg:hidden h-1.5 w-12 bg-slate-200 rounded-full mx-auto my-3" onClick={() => setIsChatOpen(false)}></div>
          
          <ChatInterface 
            messages={messages} 
            onSendMessage={handleSendMessage} 
            onFileUpload={handleFileUpload}
            onRemoveBackground={handleRemoveBackground}
            isGenerating={thumbnail.isGenerating}
            hasImage={!!thumbnail.currentImageUrl}
            onClose={() => setIsChatOpen(false)}
          />
        </aside>
      </div>

      {/* Mobile Sticky Chat Toggle */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className={`lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 bg-[#2563EB] text-white rounded-full shadow-xl flex items-center justify-center ring-4 ring-white transition-transform ${isChatOpen ? 'scale-0' : 'scale-100'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      </button>

      {/* Mobile Sticky Undo/Redo Bar (Only when image exists and chat is closed) */}
      {!isChatOpen && thumbnail.currentImageUrl && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-[#E2E8F0] px-6 flex items-center justify-center gap-8 z-30 sm:hidden">
          <button onClick={undo} disabled={thumbnail.historyIndex <= 0 || thumbnail.isGenerating} className="p-3 text-slate-500 disabled:opacity-20 touch-target"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
          <button onClick={redo} disabled={thumbnail.historyIndex >= thumbnail.history.length - 1 || thumbnail.isGenerating} className="p-3 text-slate-500 disabled:opacity-20 touch-target"><svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
        </div>
      )}
    </div>
  );
};

export default App;
