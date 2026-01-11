
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
