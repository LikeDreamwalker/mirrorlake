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
    console.log(response, "response");

    if (response.ok) {
      const data = await response.json();
      console.log(data, "data");
      return {
        palette: data.palette || [],
        cultural_variations: data.cultural_variations || {},
        similar_colors: data.similar_colors || [],
        contrasting_emotions: data.contrasting_emotions || [],
      };
    }

    return {
      palette: [],
      cultural_variations: {},
      similar_colors: [],
      contrasting_emotions: [],
    };
  } catch (error) {
    console.error("Error fetching advanced color data:", error);
    // Return empty data with default values if there's an error
    return {
      palette: [],
      cultural_variations: {},
      similar_colors: [],
      contrasting_emotions: [],
    };
  }
}
