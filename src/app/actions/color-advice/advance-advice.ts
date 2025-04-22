import type { AdvancedColorData } from "./types";

/**
 * Fetch advanced color analysis from Python API
 */
export async function fetchAdvancedColorData(
  hexColor: string,
  baseUrl: string
): Promise<AdvancedColorData> {
  try {
    const apiUrl = `${baseUrl}/api/py/advanced-color`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        color: hexColor,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        palette: data.palette || [],
        emotions: data.emotions || [],
        primary_emotion: data.primary_emotion || "",
        emotion_confidence:
          typeof data.emotion_confidence === "number"
            ? data.emotion_confidence
            : 0,
        cultural_variations: data.cultural_variations || {},
        similar_colors: data.similar_colors || [],
        contrasting_emotions: data.contrasting_emotions || [],
      };
    }

    return {
      palette: [],
      emotions: [],
      primary_emotion: "",
      emotion_confidence: 0,
      cultural_variations: {},
      similar_colors: [],
      contrasting_emotions: [],
    };
  } catch (error) {
    console.error("Error fetching advanced color data:", error);
    // Return empty data with default values if there's an error
    return {
      palette: [],
      emotions: [],
      primary_emotion: "",
      emotion_confidence: 0,
      cultural_variations: {},
      similar_colors: [],
      contrasting_emotions: [],
    };
  }
}
