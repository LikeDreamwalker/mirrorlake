import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import {
  hexToRgb,
  hexToHsl,
  getReadableTextColor,
  getColorName,
  getColorAttributes,
  calculateComplementary,
  calculateAnalogous,
  simulateColorBlindness,
  isValidHexColor,
  isColorDark,
} from "@mirrorlake/color-tools";

export async function GET(request: NextRequest) {
  try {
    // Get color from query params
    const searchParams = request.nextUrl.searchParams;
    const colorParam = searchParams.get("color") || "0066ff"; // Default to a nice purple if no color provided

    // Get scale factor for high DPI (default to 2x)
    const scaleFactor = Number.parseInt(searchParams.get("scale") || "2", 10);

    // Validate scale factor (between 1 and 4)
    const validScaleFactor = Math.min(Math.max(scaleFactor, 1), 4);

    // Clean the color input and add # prefix
    const cleanColor = colorParam.trim().replace(/^#/, "");

    // Validate the hex color
    if (!isValidHexColor(cleanColor)) {
      return new Response(
        `Invalid color format: ${colorParam}. Please provide a valid hex color (e.g., 0066ff).`,
        {
          status: 400,
        }
      );
    }

    // Add the # prefix
    const color = `#${cleanColor}`;
    const darkMode = isColorDark(color);

    // Get color information
    const rgb = hexToRgb(color);
    const hsl = hexToHsl(color);
    const textColor = getReadableTextColor(color);
    const colorName = (await getColorName(color)) || "Custom Color";
    const attributes = getColorAttributes(colorName, hsl);
    const complementary = calculateComplementary(color);
    const analogous = calculateAnalogous(color);
    const colorBlindness = simulateColorBlindness(color);

    // Format values for display
    const rgbString = `RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}`;
    const hslString = `HSL: ${Math.round(hsl.h)}°, ${Math.round(
      hsl.s
    )}%, ${Math.round(hsl.l)}%`;

    // Base width and height (will be multiplied by scale factor)
    const baseWidth = 400;
    const baseHeight = 480;

    // Calculate actual dimensions
    const width = baseWidth * validScaleFactor;
    const height = baseHeight * validScaleFactor;

    // Generate the image
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: 24,
            display: "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              padding: 20 * validScaleFactor,
              boxShadow:
                "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)", // From --card: 0 0% 100% / 0.7 (light) or 240 10% 3.9% / 0.7 (dark)
              backgroundColor: darkMode
                ? "rgba(9, 9, 11, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              // From --card-foreground: 240 10% 3.9% (light) or 0 0% 98% (dark)
              color: darkMode ? "#fafafa" : "#09090b",
              fontFamily: "Inter, sans-serif",
              borderRadius: 24 * validScaleFactor,
              // From --border: 240 5.9% 90% (light) or 240 3.7% 15.9% (dark)
              border: `${validScaleFactor}px solid ${
                darkMode ? "#27272a" : "#e4e4e7"
              }`,
              overflow: "hidden",
            }}
          >
            {/* Header with color name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16 * validScaleFactor,
                fontSize: 24 * validScaleFactor,
                fontWeight: "bold",
              }}
            >
              <div
                style={{
                  width: 24 * validScaleFactor,
                  height: 24 * validScaleFactor,
                  backgroundColor: color,
                  borderRadius: 4 * validScaleFactor,
                  marginRight: 12 * validScaleFactor,
                  border: `${validScaleFactor}px solid rgba(0,0,0,0.1)`,
                }}
              />
              {colorName}
            </div>

            {/* Main color display */}
            <div
              style={{
                backgroundColor: color,
                width: "100%",
                height: 120 * validScaleFactor,
                borderRadius: 8 * validScaleFactor,
                marginBottom: 16 * validScaleFactor,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                padding: 8 * validScaleFactor,
                color: textColor,
                fontWeight: "bold",
                fontSize: 16 * validScaleFactor,
              }}
            >
              {color.toUpperCase()}
            </div>

            {/* Color information */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8 * validScaleFactor,
                fontSize: 14 * validScaleFactor,
                marginBottom: 16 * validScaleFactor,
              }}
            >
              <div>{rgbString}</div>
              <div>{hslString}</div>
            </div>

            {/* Color attributes */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6 * validScaleFactor,
                marginBottom: 16 * validScaleFactor,
              }}
            >
              {attributes.slice(0, 3).map((attr, index) => (
                <div
                  key={index}
                  style={{
                    // From --muted: with adjusted opacity
                    backgroundColor: darkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                    padding: `${4 * validScaleFactor}px ${
                      8 * validScaleFactor
                    }px`,
                    borderRadius: 4 * validScaleFactor,
                    fontSize: 12 * validScaleFactor,
                  }}
                >
                  {attr}
                </div>
              ))}
            </div>

            {/* Harmony colors */}
            <div
              style={{
                display: "flex",
                gap: 8 * validScaleFactor,
                marginBottom: 16 * validScaleFactor,
              }}
            >
              <div
                style={{
                  width: 32 * validScaleFactor,
                  height: 32 * validScaleFactor,
                  backgroundColor: color,
                  borderRadius: 4 * validScaleFactor,
                  border: `${validScaleFactor}px solid rgba(0,0,0,0.1)`,
                }}
              />
              <div
                style={{
                  width: 32 * validScaleFactor,
                  height: 32 * validScaleFactor,
                  backgroundColor: complementary,
                  borderRadius: 4 * validScaleFactor,
                  border: `${validScaleFactor}px solid rgba(0,0,0,0.1)`,
                }}
              />
              {analogous.map((analogColor, index) => (
                <div
                  key={index}
                  style={{
                    width: 32 * validScaleFactor,
                    height: 32 * validScaleFactor,
                    backgroundColor: analogColor,
                    borderRadius: 4 * validScaleFactor,
                    border: `${validScaleFactor}px solid rgba(0,0,0,0.1)`,
                  }}
                />
              ))}
            </div>

            {/* Color blindness simulation */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8 * validScaleFactor,
                fontSize: 12 * validScaleFactor,
              }}
            >
              <div style={{ fontWeight: "medium" }}>
                Color Blindness Simulation:
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8 * validScaleFactor,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4 * validScaleFactor,
                  }}
                >
                  <div
                    style={{
                      width: 24 * validScaleFactor,
                      height: 24 * validScaleFactor,
                      backgroundColor: colorBlindness.protanopia,
                      borderRadius: 4 * validScaleFactor,
                      border: `${validScaleFactor}px solid rgba(0,0,0,0.1)`,
                    }}
                  />
                  <div style={{ fontSize: 10 * validScaleFactor }}>
                    Protanopia
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4 * validScaleFactor,
                  }}
                >
                  <div
                    style={{
                      width: 24 * validScaleFactor,
                      height: 24 * validScaleFactor,
                      backgroundColor: colorBlindness.deuteranopia,
                      borderRadius: 4 * validScaleFactor,
                      border: `${validScaleFactor}px solid rgba(0,0,0,0.1)`,
                    }}
                  />
                  <div style={{ fontSize: 10 * validScaleFactor }}>
                    Deuteranopia
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4 * validScaleFactor,
                  }}
                >
                  <div
                    style={{
                      width: 24 * validScaleFactor,
                      height: 24 * validScaleFactor,
                      backgroundColor: colorBlindness.tritanopia,
                      borderRadius: 4 * validScaleFactor,
                      border: `${validScaleFactor}px solid rgba(0,0,0,0.1)`,
                    }}
                  />
                  <div style={{ fontSize: 10 * validScaleFactor }}>
                    Tritanopia
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with branding */}
            <div
              style={{
                marginTop: "auto",
                fontSize: 12 * validScaleFactor,
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8 * validScaleFactor,
              }}
            >
              <span>Generated by MirrorLake</span>
            </div>
          </div>
        </div>
      ),
      {
        width,
        height,
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=86400, s-maxage=86400",
          "content-disposition": `inline; filename="${colorName}.png"`,
        },
      }
    );
  } catch (error) {
    console.error("Error generating color card:", error);
    return new Response(`Failed to generate color card: ${error}`, {
      status: 500,
    });
  }
}
