
import React, { useState, useEffect, useCallback } from 'react';
import { Message, ThumbnailState, Project, Template } from './types';
import ChatInterface from './components/ChatInterface';
import ThumbnailPreview from './components/ThumbnailPreview';
import { geminiService } from './services/geminiService';
import { projectService } from './services/projectService';
import { fileToBase64 } from './utils/imageUtils';
import { 
  Menu, 
  X, 
  Download, 
  Undo2, 
  Redo2, 
  Rocket, 
  Target, 
  Wand2, 
  Zap, 
  Sun, 
  Moon,
  RefreshCw,
  MessageSquare,
  Upload,
  Plus,
  LayoutGrid,
  Clock,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Image as ImageIcon,
  ArrowUpRight,
  Sparkles,
  MousePointer2,
  Trophy,
  AlertTriangle,
  Gamepad2,
  Cpu,
  Tv,
  Users,
  Search
} from 'lucide-react';

const TEMPLATES: Template[] = [
  { id: '1', name: 'Tech Review Pro', category: 'Tech', description: 'Clean desk with glowing gadgets and sharp rim lighting.', prompt: 'A professional tech review thumbnail featuring a high-end smartphone on a dark mahogany desk with blue neon rim lighting and soft bokeh background. Cinematic lighting.', icon: 'Cpu' },
  { id: '2', name: 'Epic Gaming', category: 'Gaming', description: 'Action-packed background with high contrast and fire elements.', prompt: 'Hyper-realistic gaming thumbnail with intense fire and ice particles in the background. High contrast, saturated colors, epic perspective.', icon: 'Gamepad2' },
  { id: '3', name: 'Storytime Vlog', category: 'Vlog', description: 'Close-up face with dramatic lighting and vibrant surroundings.', prompt: 'Close-up emotional expression, vibrant outdoor background with golden hour lighting, cinematic bokeh, and high clarity on the face.', icon: 'Tv' },
  { id: '4', name: 'Podcast Setup', category: 'Lifestyle', description: 'Dual mic setup with cozy studio vibes and warm lighting.', prompt: 'Warm cozy podcast studio with two high-end microphones, acoustic foam walls, and ambient warm string lights. Professional broadcast look.', icon: 'Users' },
  { id: '5', name: 'Mystery Box', category: 'Unboxing', description: 'Floating box with mystery glow and high-impact shadows.', prompt: 'A mysterious black box floating in the air with glowing light leaking from the edges. Dark cinematic background with blue highlights.', icon: 'Sparkles' },
  { id: '6', name: 'Fitness Transformation', category: 'Lifestyle', description: 'High intensity gym background with grit and sweat texture.', prompt: 'Professional fitness thumbnail, high-contrast gym environment with dramatic shadows and sweat textures. Hard rim lighting.', icon: 'Zap' },
];

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'editor' | 'library' | 'templates'>('dashboard');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [generationMode, setGenerationMode] = useState<'fast' | 'ctr' | 'inpainting'>('ctr');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [thumbnail, setThumbnail] = useState<ThumbnailState>({
    currentImageUrl: null,
    history: [],
    historyIndex: -1,
    isGenerating: false,
  });

  const dragCounter = React.useRef(0);

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      const loaded = await projectService.getAllProjects();
      setProjects(loaded);
    };
    loadProjects();
  }, [view]);

  // Auto-save logic
  const saveCurrentProject = useCallback(async (updates: Partial<Project>) => {
    if (!currentProjectId) return;
    
    const existing = projects.find(p => p.id === currentProjectId);
    const updatedProject: Project = {
      id: currentProjectId,
      name: existing?.name || `Project ${new Date().toLocaleDateString()}`,
      lastImageUrl: thumbnail.currentImageUrl,
      history: thumbnail.history,
      historyIndex: thumbnail.historyIndex,
      messages: messages,
      updatedAt: Date.now(),
      ...updates
    };
    
    await projectService.saveProject(updatedProject);
    const updatedList = await projectService.getAllProjects();
    setProjects(updatedList);
  }, [currentProjectId, thumbnail, messages, projects]);

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

  // Sync state to DB after history updates
  useEffect(() => {
    if (currentProjectId && thumbnail.currentImageUrl) {
      saveCurrentProject({});
    }
  }, [thumbnail.currentImageUrl, thumbnail.historyIndex, messages.length]);

  const undo = useCallback(() => {
    setThumbnail(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        return { ...prev, historyIndex: newIndex, currentImageUrl: prev.history[newIndex] };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setThumbnail(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        return { ...prev, historyIndex: newIndex, currentImageUrl: prev.history[newIndex] };
      }
      return prev;
    });
  }, []);

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

  const startNewProject = () => {
    const id = Date.now().toString();
    const newProject: Project = {
      id,
      name: `Untitled Thumbnail ${projects.length + 1}`,
      lastImageUrl: null,
      history: [],
      historyIndex: -1,
      messages: [],
      updatedAt: Date.now()
    };
    setCurrentProjectId(id);
    setMessages([]);
    setThumbnail({ currentImageUrl: null, history: [], historyIndex: -1, isGenerating: false });
    setView('editor');
  };

  const applyTemplate = (template: Template) => {
    const id = Date.now().toString();
    const newProject: Project = {
      id,
      name: `Template: ${template.name}`,
      lastImageUrl: null,
      history: [],
      historyIndex: -1,
      messages: [],
      updatedAt: Date.now()
    };
    setCurrentProjectId(id);
    setMessages([]);
    setThumbnail({ currentImageUrl: null, history: [], historyIndex: -1, isGenerating: true });
    setView('editor');
    
    // Auto-trigger generation for the template
    handleSendMessage(template.prompt);
  };

  const loadProject = (project: Project) => {
    setCurrentProjectId(project.id);
    setMessages(project.messages);
    setThumbnail({
      currentImageUrl: project.lastImageUrl,
      history: project.history,
      historyIndex: project.historyIndex,
      isGenerating: false
    });
    setView('editor');
  };

  const deleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      await projectService.deleteProject(id);
      const updated = await projectService.getAllProjects();
      setProjects(updated);
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

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false); dragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (view === 'dashboard' || view === 'library' || view === 'templates') {
         startNewProject();
         setTimeout(() => handleFileUpload(file), 100);
      } else {
         handleFileUpload(file);
      }
    }
  };

  const QuickActionButtons = () => (
    <div className="grid grid-cols-1 gap-2">
      <button onClick={() => handleSendMessage("remove background and use professional lighting")} disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating} className="flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:border-[#2563EB] dark:hover:border-blue-500 hover:bg-[#EFF6FF] dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold transition-all disabled:opacity-50 touch-target dark:text-slate-200">
        <Wand2 className="w-4 h-4 text-blue-500" /> Remove BG
      </button>
      <button onClick={() => handleSendMessage("boost saturation and improve contrast")} disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating} className="flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:border-[#2563EB] dark:hover:border-blue-500 hover:bg-[#EFF6FF] dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold transition-all disabled:opacity-50 touch-target dark:text-slate-200">
        <Zap className="w-4 h-4 text-amber-500" /> Color Boost
      </button>
      <button onClick={() => handleSendMessage("add a white stroke glow around the subject")} disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating} className="flex items-center gap-3 w-full px-4 py-3 bg-white dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 hover:border-[#2563EB] dark:hover:border-blue-500 hover:bg-[#EFF6FF] dark:hover:bg-slate-800/50 rounded-xl text-xs font-bold transition-all disabled:opacity-50 touch-target dark:text-slate-200">
        <Sun className="w-4 h-4 text-yellow-500" /> Rim Light
      </button>
    </div>
  );

  const ProjectCard = ({ project }: { project: Project }) => (
    <div 
      onClick={() => loadProject(project)}
      className="group flex-shrink-0 w-64 md:w-72 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-500 hover:-translate-y-1"
    >
      <div className="aspect-video bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
        {project.lastImageUrl ? (
          <img src={project.lastImageUrl} className="w-full h-full object-cover" alt="" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}
        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors flex items-center justify-center">
           <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur px-4 py-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Edit Project</span>
           </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate pr-2 text-sm">{project.name}</h4>
          <button onClick={(e) => deleteProject(e, project.id)} className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
          <Clock className="w-3 h-3" />
          {new Date(project.updatedAt).toLocaleDateString()} at {new Date(project.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );

  const TemplateIcon = ({ name, className }: { name: string, className?: string }) => {
    switch(name) {
      case 'Gamepad2': return <Gamepad2 className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Tv': return <Tv className={className} />;
      case 'Users': return <Users className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Zap': return <Zap className={className} />;
      default: return <ImageIcon className={className} />;
    }
  };

  return (
    <div 
      className="flex flex-col h-screen bg-[#F8F9FB] dark:bg-[#020617] text-slate-800 dark:text-slate-100 relative overflow-hidden" 
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="fixed inset-0 z-[100] bg-primary/10 dark:bg-primary/20 backdrop-blur-md flex items-center justify-center pointer-events-none">
          <div className="bg-white dark:bg-slate-900 p-12 rounded-[40px] shadow-2xl border-4 border-dashed border-primary flex flex-col items-center animate-bounce">
            <Upload className="w-12 h-12 text-primary mb-6" />
            <h2 className="text-3xl font-black text-primary tracking-tight">Drop to Edit</h2>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Reset Canvas?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              This will clear your current thumbnail progress and history. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setThumbnail({ currentImageUrl: null, history: [], historyIndex: -1, isGenerating: false });
                  setShowResetConfirm(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-sm bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all active:scale-95"
              >
                Reset Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Header */}
      <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 bg-white dark:bg-slate-900/80 dark:backdrop-blur-xl border-b border-[#E2E8F0] dark:border-slate-800 z-40 transition-colors duration-300">
        <div className="flex items-center gap-4">
          {(view !== 'dashboard') && (
            <button onClick={() => setView('dashboard')} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">CG</div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight hidden xs:block">ClickGenius</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-primary dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-all shadow-sm active:scale-90"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {view === 'editor' && (
            <button 
              disabled={!thumbnail.currentImageUrl || thumbnail.isGenerating}
              onClick={() => { const link = document.createElement('a'); link.href = thumbnail.currentImageUrl!; link.download = 'thumbnail.png'; link.click(); }}
              className="flex items-center gap-2 bg-primary hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold px-4 md:px-6 py-2.5 rounded-lg transition-all shadow-md active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">EXPORT</span>
            </button>
          )}
          {view === 'dashboard' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setView('templates')} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                <Sparkles className="w-4 h-4" />
                <span>Templates</span>
              </button>
              <button onClick={() => setView('library')} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-blue-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm">
                <LayoutGrid className="w-4 h-4" />
                <span>Library</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative transition-colors duration-300">
        
        {/* DASHBOARD VIEW */}
        {view === 'dashboard' && (
          <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
            {/* ENHANCED HERO BANNER */}
            <section className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-600 rounded-[40px] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className={`
                relative overflow-hidden rounded-[40px] p-8 md:p-16 lg:flex items-center justify-between gap-12 border shadow-2xl transition-all duration-500
                ${theme === 'light' 
                  ? 'bg-gradient-to-br from-primary to-indigo-700 border-white/20' 
                  : 'bg-slate-900 border-slate-800'}
              `}>
                {/* Background Sparkle Elements */}
                <div className="absolute top-10 right-1/4 opacity-10 animate-pulse"><Sparkles className="w-24 h-24 text-white" /></div>
                <div className="absolute bottom-10 left-10 opacity-5"><MousePointer2 className="w-40 h-40 text-white rotate-12" /></div>
                
                <div className="lg:w-1/2 text-left z-10">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/10">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Viral Optimized AI 2.5</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]">
                    Stop scrolling, <br />
                    <span className="text-blue-300 drop-shadow-sm">start clicking.</span>
                  </h2>
                  <p className="text-blue-100/80 text-lg max-w-md mb-10 font-medium leading-relaxed">
                    The only AI thumbnail editor designed specifically for YouTube creators. Turn ideas into visuals that dominate the feed.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={startNewProject}
                      className="group inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-sm tracking-wide transition-all hover:scale-105 active:scale-95 shadow-2xl hover:bg-slate-50"
                    >
                      <Plus className="w-5 h-5 text-primary" />
                      CREATE NEW THUMBNAIL
                    </button>
                    <button 
                      onClick={() => setView('templates')}
                      className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur-xl text-white px-8 py-5 rounded-2xl font-bold text-sm border border-white/10 hover:bg-white/20 transition-all"
                    >
                      <Sparkles className="w-5 h-5" />
                      BROWSE TEMPLATES
                    </button>
                  </div>
                </div>

                {/* Floating Preview Graphic */}
                <div className="hidden lg:block lg:w-[45%] relative">
                   <div className="aspect-video bg-white/5 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative group/canvas">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-40 group-hover/canvas:opacity-100 transition-opacity">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center border border-white/20 mb-4 animate-bounce">
                           <ImageIcon className="w-10 h-10 text-white" />
                        </div>
                        <span className="text-white text-xs font-black tracking-widest uppercase">16:9 Canvas Locked</span>
                      </div>
                      {/* Decorative accents */}
                      <div className="absolute top-4 right-4 h-4 w-4 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
                      <div className="absolute bottom-6 left-6 h-2 w-32 bg-white/10 rounded-full"></div>
                      <div className="absolute bottom-6 left-40 h-2 w-12 bg-white/10 rounded-full"></div>
                   </div>
                   {/* Tooltip hint */}
                   <div className="absolute -bottom-6 -right-6 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold shadow-xl border border-slate-800 flex items-center gap-2 animate-float">
                      <Sparkles className="w-3 h-3 text-yellow-400" />
                      AI ENHANCED CTR PREVIEW
                   </div>
                </div>
              </div>
            </section>

            {/* Featured Templates Row */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Jumpstart with Templates</h3>
                </div>
                <button onClick={() => setView('templates')} className="text-primary dark:text-blue-400 text-sm font-bold flex items-center gap-2 hover:underline">
                  All Templates <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {TEMPLATES.slice(0, 6).map(template => (
                  <button 
                    key={template.id}
                    onClick={() => applyTemplate(template)}
                    className="flex flex-col items-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-blue-500 hover:shadow-xl transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 group-hover:text-primary transition-colors">
                      <TemplateIcon name={template.icon} className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest text-center">{template.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Recent Projects Row */}
            {projects.length > 0 && (
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Recent Visuals</h3>
                  </div>
                  <button onClick={() => setView('library')} className="text-primary dark:text-blue-400 text-sm font-bold flex items-center gap-2 hover:underline">
                    View Full Library <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                  {projects.slice(0, 5).map(project => (
                    <div key={project.id} className="snap-start">
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* TEMPLATES VIEW */}
        {view === 'templates' && (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Thumbnail Library</h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Select a professional base to customize with AI.</p>
              </div>
              <div className="relative group max-w-sm w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {TEMPLATES.map(template => (
                <div 
                  key={template.id} 
                  onClick={() => applyTemplate(template)}
                  className="group bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:shadow-2xl transition-all hover:-translate-y-1 border-b-4 hover:border-b-primary"
                >
                  <div className="aspect-video bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                    <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-600 mb-2 shadow-lg group-hover:scale-110 group-hover:text-primary transition-all duration-500">
                      <TemplateIcon name={template.icon} className="w-10 h-10" />
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-full flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase text-primary tracking-widest">{template.category}</span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase">16:9 Canvas</span>
                    </div>
                  </div>
                  <div className="p-8">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight group-hover:text-primary transition-colors">{template.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">{template.description}</p>
                    <div className="flex items-center justify-between">
                       <button className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
                          Select Template <ArrowRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LIBRARY GRID VIEW */}
        {view === 'library' && (
          <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Project Library</h2>
              <button onClick={startNewProject} className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                <Plus className="w-5 h-5" /> New Project
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {projects.map(project => (
                <div key={project.id} className="w-full">
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDITOR VIEW */}
        {view === 'editor' && (
          <div className="flex h-full">
            {/* Left Sidebar */}
            <aside className="hidden lg:flex w-64 bg-white dark:bg-slate-900 border-r border-[#E2E8F0] dark:border-slate-800 p-6 flex-col gap-8 overflow-y-auto">
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Generation Mode</h3>
                <div className="flex flex-col bg-[#F1F5F9] dark:bg-slate-800 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  {[{ id: 'fast', label: 'Fast Gen', Icon: Rocket }, { id: 'ctr', label: 'CTR Optimized', Icon: Target }].map(({ id, label, Icon }) => (
                    <button key={id} onClick={() => setGenerationMode(id as any)} className={`flex items-center gap-3 px-3 py-3 rounded-lg text-xs font-semibold transition-all ${generationMode === id ? 'bg-white dark:bg-slate-700 text-primary dark:text-blue-400 shadow-md ring-1 ring-black/5 dark:ring-white/10' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                      <Icon className="w-4 h-4" /> {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
                <QuickActionButtons />
              </div>
            </aside>

            {/* Canvas */}
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 relative overflow-y-auto scrollbar-thin">
              <div className="w-full max-w-5xl">
                <ThumbnailPreview imageUrl={thumbnail.currentImageUrl} isGenerating={thumbnail.isGenerating} />
                {thumbnail.currentImageUrl && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <button onClick={undo} disabled={thumbnail.historyIndex <= 0 || thumbnail.isGenerating} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 rounded-xl transition-all"><Undo2 className="w-5 h-5" /></button>
                      <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-1"></div>
                      <button onClick={redo} disabled={thumbnail.historyIndex >= thumbnail.history.length - 1 || thumbnail.isGenerating} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 disabled:opacity-30 rounded-xl transition-all"><Redo2 className="w-5 h-5" /></button>
                    </div>
                    <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-2 text-[10px] font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/30 uppercase tracking-widest"><RefreshCw className="w-3 h-3" /> RESET CANVAS</button>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Sidebar */}
            <aside className={`fixed inset-0 z-50 lg:relative lg:block lg:w-[400px] bg-white dark:bg-slate-900 border-l border-[#E2E8F0] dark:border-slate-800 transition-transform duration-300 ${isChatOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'} ${isChatOpen ? 'flex flex-col' : 'hidden lg:flex'}`}>
              <ChatInterface 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                onFileUpload={handleFileUpload}
                onRemoveBackground={() => {}} 
                isGenerating={thumbnail.isGenerating}
                hasImage={!!thumbnail.currentImageUrl}
                onClose={() => setIsChatOpen(false)}
              />
            </aside>
          </div>
        )}
      </main>

      {/* Floating Toggle for Mobile Chat */}
      {view === 'editor' && !isChatOpen && (
        <button 
          onClick={() => setIsChatOpen(true)}
          className="lg:hidden fixed bottom-8 right-8 z-40 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center ring-4 ring-white dark:ring-slate-800 transition-all active:scale-90"
        >
          <MessageSquare className="w-7 h-7" />
        </button>
      )}
    </div>
  );
};

export default App;
