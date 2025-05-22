// Response type for color advice
export type ColorAdviceResponse = {
  advice: string;
  error?: boolean;
  message?: string;
  // Advanced ML features
  palette?: string[];
  cultural_variations?: Record<string, string>;
  similar_colors?: string[];
};

// Advanced color data from API
export type AdvancedColorData = {
  palette: string[];
  cultural_variations: Record<string, string>;
  similar_colors: string[];
  contrasting_emotions: string[];
};
