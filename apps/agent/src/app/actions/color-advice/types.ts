// Response type for color advice
export type ColorAdviceResponse = {
  advice: string;
  error?: boolean;
  message?: string;
  palette?: string[];
};

// Advanced color data
export type AdvancedColorData = {
  palette: string[];
};
