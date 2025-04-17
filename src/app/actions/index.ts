"use server";

// From https://github.com/digitros/nextjs-fastapi/issues/29
const BASE_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV == null ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
    ? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_VERCEL_ENV === "preview"
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;

export interface ColorAdviceResponse {
  advice: string;
  error?: boolean;
  message?: string;
}

/**
 * Gets color advice from the Python API for a given hex color
 * @param hexColor - The hex color code (with or without #)
 * @returns An object containing the advice or error information
 */
export async function getColorAdvice(
  hexColor: string
): Promise<ColorAdviceResponse> {
  try {
    // Normalize the hex color (ensure it has a # prefix)
    if (!hexColor.startsWith("#")) {
      hexColor = `#${hexColor}`;
    }

    // Validate hex color format
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
      return {
        advice: "",
        error: true,
        message:
          "Invalid hex color format. Please provide a color in the format #RRGGBB.",
      };
    }

    const apiUrl = `${BASE_URL}/api/py/color-advice`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        color: hexColor,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error response: ${errorText}`);
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data as ColorAdviceResponse;
  } catch (error) {
    console.error("Error fetching color advice:", error);
    return {
      advice: "",
      error: true,
      message:
        error instanceof Error ? error.message : "Failed to get color advice",
    };
  }
}
