
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { 
  Upload, 
  ChevronDown, 
  Bolt, 
  ArrowRight, 
  Sparkles,
  Cloud,
  Palette,
  Camera,
  User,
  ArrowUpRight
} from 'lucide-react';

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
    { text: "Bright arrows", Icon: ArrowUpRight, color: 'text-blue-500' },
    { text: "Glow edge", Icon: Sparkles, color: 'text-yellow-500' },
    { text: "Blur background", Icon: Cloud, color: 'text-slate-400' },
    { text: "Pop colors", Icon: Palette, color: 'text-purple-500' },
    { text: "Add vignette", Icon: Camera, color: 'text-rose-500' },
    { text: "Shadow subject", Icon: User, color: 'text-slate-600 dark:text-slate-400' }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 lg:max-h-none max-h-[85vh] shadow-2xl lg:shadow-none">
      <div className="p-4 border-b border-[#E2E8F0] dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-900/30">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-slate-900 dark:text-white leading-tight">ClickGenius Assistant</h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">AI ACTIVE</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">V2.5 LITE</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="p-2.5 hover:bg-[#F1F5F9] dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-[#2563EB] transition-all touch-target active:scale-95"
            title="Upload Reference Image"
          >
            <Upload className="w-5 h-5" />
          </button>
          {onClose && (
            <button onClick={onClose} className="lg:hidden p-2.5 text-slate-400 hover:text-slate-600 transition-all">
               <ChevronDown className="w-6 h-6" />
            </button>
          )}
        </div>
        <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} className="hidden" accept="image/*" />
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin bg-slate-50/30 dark:bg-slate-950/20">
        {messages.length === 0 && (
          <div className="space-y-8 py-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900 dark:to-indigo-900 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                <div className="text-blue-500 mb-3">
                  <Bolt className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Welcome to Genius Mode</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[12px] leading-relaxed">
                  I can generate backgrounds, add text, or professionally retouch your visuals. Try saying:
                  <span className="block mt-2 italic text-blue-600/80 dark:text-blue-400/80">"Make me look like I'm in a high-stakes poker game with cinematic lighting..."</span>
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Smart Shortcuts</span>
                <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
              </div>
              <div className="flex flex-wrap lg:grid lg:grid-cols-2 gap-2 overflow-x-auto lg:overflow-visible pb-2 scrollbar-hide">
                {suggestions.map(({ text, Icon, color }) => (
                  <button 
                    key={text} 
                    onClick={() => onSendMessage(text)} 
                    className="whitespace-nowrap flex items-center gap-2 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-500 transition-all shadow-sm active:scale-95 touch-target"
                  >
                    <Icon className={`w-4 h-4 ${color}`} />
                    {text}
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
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-none'
            }`}>
              {m.text}
            </div>
            <span className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1.5 uppercase tracking-tighter px-1">
              {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isGenerating && (
          <div className="flex flex-col items-start">
            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-5 py-4 border border-slate-200 dark:border-slate-700 shadow-sm">
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

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-10 lg:pb-5">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-0 group-focus-within:opacity-10 transition duration-500"></div>
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:border-blue-500 transition-all shadow-inner overflow-hidden">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isGenerating}
              placeholder="Describe your vision..."
              className="flex-1 bg-transparent py-4 pl-5 pr-12 text-[13px] focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 font-medium dark:text-slate-100"
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || isGenerating} 
              className={`absolute right-2 p-2 rounded-xl transition-all active:scale-90 ${
                inputText.trim() && !isGenerating 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
        <p className="mt-2.5 text-center text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
          AI generated images may vary • 16:9 Canvas Locked
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
