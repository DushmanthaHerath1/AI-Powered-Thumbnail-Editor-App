
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  imageUrl?: string;
  timestamp: Date;
}

export interface ThumbnailState {
  currentImageUrl: string | null;
  history: string[];
  historyIndex: number;
  isGenerating: boolean;
}

export interface Project {
  id: string;
  name: string;
  lastImageUrl: string | null;
  history: string[];
  historyIndex: number;
  messages: Message[];
  updatedAt: number;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  prompt: string;
  icon: string;
}
