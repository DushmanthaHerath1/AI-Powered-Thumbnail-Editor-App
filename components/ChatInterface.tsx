
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onFileUpload: (file: File) => void;
  onRemoveBackground: () => void;
  isGenerating: boolean;
  hasImage: boolean;
  onClose?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  onSendMessage, 
  onFileUpload, 
  onRemoveBackground,
  isGenerating, 
  hasImage,
  onClose
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isGenerating) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  const suggestions = [
    { text: "Bright arrows", icon: "🏹" },
    { text: "Glow edge", icon: "✨" },
    { text: "Blur background", icon: "🌫️" },
    { text: "Pop colors", icon: "🌈" },
    { text: "Add vignette", icon: "📸" },
    { text: "Shadow subject", icon: "👤" }
  ];

  return (
    <div className="flex flex-col h-full bg-white lg:max-h-none max-h-[85vh] shadow-2xl lg:shadow-none">
      {/* Header */}
      <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-slate-900 leading-tight">ClickGenius Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">AI ACTIVE</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-[9px] font-medium text-slate-400">V2.5 LITE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2.5 hover:bg-[#F1F5F9] rounded-xl text-slate-400 hover:text-[#2563EB] transition-all touch-target active:scale-95"
            title="Upload Reference Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2.5 text-slate-400 hover:text-slate-600 touch-target transition-all">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} className="hidden" accept="image/*" />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin bg-slate-50/30">
        {messages.length === 0 && (
          <div className="space-y-8 py-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="text-blue-500 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Welcome to Genius Mode</h3>
                <p className="text-slate-500 text-[12px] leading-relaxed">
                  I can generate backgrounds, add text, or professionally retouch your visuals. Try saying:
                  <span className="block mt-2 italic text-blue-600/80">"Make me look like I'm in a high-stakes poker game with cinematic lighting..."</span>
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Smart Shortcuts</span>
                <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="flex flex-wrap lg:grid lg:grid-cols-2 gap-2 overflow-x-auto lg:overflow-visible pb-2 scrollbar-hide">
                {suggestions.map(s => (
                  <button 
                    key={s.text} 
                    onClick={() => onSendMessage(s.text)} 
                    className="whitespace-nowrap flex items-center gap-2 text-[11px] font-bold bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-200 transition-all shadow-sm active:scale-95 touch-target"
                  >
                    <span>{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`group relative max-w-[88%] px-4 py-3 text-[13px] leading-relaxed shadow-sm transition-all ${
              m.role === 'user' 
                ? 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white rounded-2xl rounded-tr-none' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-2xl rounded-tl-none'
            }`}>
              {m.text}
            </div>
            <span className="text-[9px] font-bold text-slate-300 mt-1.5 uppercase tracking-tighter px-1">
              {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isGenerating && (
          <div className="flex flex-col items-start">
            <div className="bg-white rounded-2xl rounded-tl-none px-5 py-4 border border-slate-200 shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-duration:0.8s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></div>
                <span className="ml-2 text-[10px] font-black text-blue-500 uppercase tracking-widest">Rendering</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 pb-10 lg:pb-5">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl focus-within:border-blue-500 transition-all shadow-inner overflow-hidden">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isGenerating}
              placeholder="Describe your vision..."
              className="flex-1 bg-transparent py-4 pl-5 pr-12 text-[13px] focus:outline-none placeholder:text-slate-400 font-medium"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || isGenerating} 
              className={`absolute right-2 p-2 rounded-xl transition-all active:scale-90 ${
                inputText.trim() && !isGenerating 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
        <p className="mt-2.5 text-center text-[9px] font-bold text-slate-300 uppercase tracking-widest">
          AI generated images may vary • 16:9 Canvas Locked
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
