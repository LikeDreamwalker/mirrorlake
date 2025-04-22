// Response type for color advice
export type ColorAdviceResponse = {
  advice: string;
  error?: boolean;
  message?: string;
  // Advanced ML features
  palette?: string[];
  emotions?: string[];
  primary_emotion?: string;
  emotion_confidence?: number;
  cultural_variations?: Record<string, string>;
  similar_colors?: string[];
  contrasting_emotions?: string[];
};

// Advanced color data from API
export type AdvancedColorData = {
  palette: string[];
  emotions: string[];
  primary_emotion: string;
  emotion_confidence: number;
  cultural_variations: Record<string, string>;
  similar_colors: string[];
  contrasting_emotions: string[];
};
