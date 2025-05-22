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
    const colorParam = searchParams.get("color") || "0066ff";

    // Get scale factor for high DPI (default to 2x)
    const scaleFactor = Number.parseInt(searchParams.get("scale") || "2", 10);
    const validScaleFactor = Math.min(Math.max(scaleFactor, 1), 4);

    // Get width param (optional)
    const widthParam = searchParams.get("width");
    const baseWidth = 400;
    const baseHeight = 480;

    // Clamp width to a reasonable range
    const customWidth = widthParam
      ? Math.min(Math.max(parseInt(widthParam, 10), 100), 2000)
      : baseWidth * validScaleFactor;

    // Calculate height proportionally
    const height = Math.round((customWidth / baseWidth) * baseHeight);

    // Calculate the "unit" for scaling
    const unit = customWidth / baseWidth;

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

    // Generate the image
    return new ImageResponse(
      (
        <div
          style={{
            width: customWidth,
            height: height,
            padding: 24 * unit,
            display: "flex",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              padding: 20 * unit,
              boxShadow:
                "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
              backgroundColor: darkMode
                ? "rgba(9, 9, 11, 0.7)"
                : "rgba(255, 255, 255, 0.7)",
              color: darkMode ? "#fafafa" : "#09090b",
              fontFamily: "Inter, sans-serif",
              borderRadius: 24 * unit,
              border: `${unit}px solid ${darkMode ? "#27272a" : "#e4e4e7"}`,
              overflow: "hidden",
            }}
          >
            {/* Header with color name */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 16 * unit,
                fontSize: 24 * unit,
                fontWeight: "bold",
              }}
            >
              <div
                style={{
                  width: 24 * unit,
                  height: 24 * unit,
                  backgroundColor: color,
                  borderRadius: 4 * unit,
                  marginRight: 12 * unit,
                  border: `${unit}px solid rgba(0,0,0,0.1)`,
                }}
              />
              {colorName}
            </div>

            {/* Main color display */}
            <div
              style={{
                backgroundColor: color,
                width: "100%",
                height: 120 * unit,
                borderRadius: 8 * unit,
                marginBottom: 16 * unit,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                padding: 8 * unit,
                color: textColor,
                fontWeight: "bold",
                fontSize: 16 * unit,
              }}
            >
              {color.toUpperCase()}
            </div>

            {/* Color information */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8 * unit,
                fontSize: 14 * unit,
                marginBottom: 16 * unit,
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
                gap: 6 * unit,
                marginBottom: 16 * unit,
              }}
            >
              {attributes.slice(0, 3).map((attr, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: darkMode
                      ? "rgba(255, 255, 255, 0.1)"
                      : "rgba(0, 0, 0, 0.05)",
                    padding: `${4 * unit}px ${8 * unit}px`,
                    borderRadius: 4 * unit,
                    fontSize: 12 * unit,
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
                gap: 8 * unit,
                marginBottom: 16 * unit,
              }}
            >
              <div
                style={{
                  width: 32 * unit,
                  height: 32 * unit,
                  backgroundColor: color,
                  borderRadius: 4 * unit,
                  border: `${unit}px solid rgba(0,0,0,0.1)`,
                }}
              />
              <div
                style={{
                  width: 32 * unit,
                  height: 32 * unit,
                  backgroundColor: complementary,
                  borderRadius: 4 * unit,
                  border: `${unit}px solid rgba(0,0,0,0.1)`,
                }}
              />
              {analogous.map((analogColor, index) => (
                <div
                  key={index}
                  style={{
                    width: 32 * unit,
                    height: 32 * unit,
                    backgroundColor: analogColor,
                    borderRadius: 4 * unit,
                    border: `${unit}px solid rgba(0,0,0,0.1)`,
                  }}
                />
              ))}
            </div>

            {/* Color blindness simulation */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8 * unit,
                fontSize: 12 * unit,
              }}
            >
              <div style={{ fontWeight: "medium" }}>
                Color Blindness Simulation:
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8 * unit,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4 * unit,
                  }}
                >
                  <div
                    style={{
                      width: 24 * unit,
                      height: 24 * unit,
                      backgroundColor: colorBlindness.protanopia,
                      borderRadius: 4 * unit,
                      border: `${unit}px solid rgba(0,0,0,0.1)`,
                    }}
                  />
                  <div style={{ fontSize: 10 * unit }}>Protanopia</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4 * unit,
                  }}
                >
                  <div
                    style={{
                      width: 24 * unit,
                      height: 24 * unit,
                      backgroundColor: colorBlindness.deuteranopia,
                      borderRadius: 4 * unit,
                      border: `${unit}px solid rgba(0,0,0,0.1)`,
                    }}
                  />
                  <div style={{ fontSize: 10 * unit }}>Deuteranopia</div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4 * unit,
                  }}
                >
                  <div
                    style={{
                      width: 24 * unit,
                      height: 24 * unit,
                      backgroundColor: colorBlindness.tritanopia,
                      borderRadius: 4 * unit,
                      border: `${unit}px solid rgba(0,0,0,0.1)`,
                    }}
                  />
                  <div style={{ fontSize: 10 * unit }}>Tritanopia</div>
                </div>
              </div>
            </div>

            {/* Footer with branding */}
            <div
              style={{
                fontSize: 12 * unit,
                opacity: 0.7,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8 * unit,
                marginTop: 16 * unit,
              }}
            >
              <span>mirrorlake.ldwid.com</span>
            </div>
          </div>
        </div>
      ),
      {
        width: customWidth,
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
