import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import {
  hexToRgb,
  hexToHsl,
  rgbToHex,
  getReadableTextColor,
  getColorName,
  getColorAttributes,
  calculateComplementary,
  calculateAnalogous,
  getContrastRatio,
  isValidHexColor,
  isColorDark,
  simulateColorBlindness,
} from "@mirrorlake/color-tools";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const colorParam = searchParams.get("color") || "0066ff";
    const widthParam = searchParams.get("width");
    const themeParam = searchParams.get("theme");
    const baseWidth = 600;
    const customWidth = widthParam
      ? Math.min(Math.max(parseInt(widthParam, 10), 200), 2000)
      : baseWidth;
    const height = Math.round(customWidth / 2);
    const unit = customWidth / baseWidth;

    // Validate color
    const cleanColor = colorParam.trim().replace(/^#/, "");
    if (!isValidHexColor(cleanColor)) {
      return new Response(
        `Invalid color format: ${colorParam}. Please provide a valid hex color (e.g., 0066ff).`,
        {
          status: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }
    const color = `#${cleanColor}`;

    // Theme logic
    let darkMode: boolean;
    if (themeParam === "dark") {
      darkMode = true;
    } else if (themeParam === "light") {
      darkMode = false;
    } else {
      darkMode = isColorDark(color);
    }

    // Card foreground color (shadcn/ui style)
    const cardForeground = darkMode ? "#fafafa" : "#09090b";

    // Color info
    const rgb = hexToRgb(color);
    const hsl = hexToHsl(color);
    const textColor = getReadableTextColor(color);
    const colorName = (await getColorName(color)) || "Custom Color";
    const attributes = getColorAttributes(colorName, hsl);
    const complementary = calculateComplementary(color);
    const analogous = calculateAnalogous(color);
    const colorBlindness = simulateColorBlindness(color);
    const contrastWhite = getContrastRatio(color, "#fff");
    const contrastBlack = getContrastRatio(color, "#000");

    // Format
    const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
    const hslString = `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
    const contrastLabel =
      contrastWhite > contrastBlack
        ? `White (${contrastWhite.toFixed(2)})`
        : `Black (${contrastBlack.toFixed(2)})`;
    const contrastBg = contrastWhite > contrastBlack ? "#fff" : "#000";
    const contrastFg = contrastWhite > contrastBlack ? "#000" : "#fff";

    return new ImageResponse(
      (
        <div
          style={{
            width: customWidth,
            height,
            display: "flex",
            flexDirection: "column",
            background: darkMode ? "hsl(240, 10%, 3.9%)" : "hsl(0, 0%, 100%)",
            color: cardForeground,
            fontFamily: "Inter, sans-serif",
            borderRadius: 18 * unit,
            border: `${unit}px solid ${darkMode ? "#27272a" : "#e4e4e7"}`,
            overflow: "hidden",
            boxShadow:
              "0 4px 24px 0 rgb(0 0 0 / 0.10), 0 2px 8px -1px rgb(0 0 0 / 0.08)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16 * unit,
              padding: `${18 * unit}px ${28 * unit}px ${12 * unit}px ${28 * unit}px`,
              borderBottom: `${unit}px solid ${darkMode ? "#23272f" : "#e4e4e7"}`,
            }}
          >
            <div
              style={{
                width: 48 * unit,
                height: 48 * unit,
                borderRadius: 12 * unit,
                background: color,
                border: `${unit * 2}px solid ${textColor}22`,
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2 * unit,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontSize: 20 * unit,
                  fontWeight: 900,
                  letterSpacing: 0.5 * unit,
                  lineHeight: 1.1,
                  textShadow: "0 1px 4px rgba(0,0,0,0.10)",
                  wordBreak: "break-all",
                  color: cardForeground, // Use card foreground, not textColor
                }}
              >
                {colorName}
              </span>
              <span
                style={{
                  fontSize: 13 * unit,
                  fontWeight: 500,
                  opacity: 0.85,
                  letterSpacing: 0.2 * unit,
                  color: cardForeground, // Use card foreground, not textColor
                }}
              >
                {color.toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1 }} />
            <div
              style={{
                display: "flex",
                gap: 6 * unit,
              }}
            >
              {attributes.slice(0, 2).map((attr, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 11 * unit,
                    background: darkMode ? "#23272f" : "#f4f4f5",
                    color: darkMode ? "#fafafa" : "#09090b",
                    borderRadius: 4 * unit,
                    padding: `2px ${6 * unit}px`,
                    fontWeight: 500,
                    opacity: 0.8,
                  }}
                >
                  {attr}
                </span>
              ))}
            </div>
          </div>

          {/* Row 2: Color Info - all in one line */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 24 * unit,
              padding: `${16 * unit}px ${28 * unit}px 0 ${28 * unit}px`,
              fontSize: 14 * unit,
              fontWeight: 500,
              letterSpacing: 0.2 * unit,
              flex: "0 0 auto",
              whiteSpace: "nowrap",
              color: cardForeground, // Use card foreground for info row
            }}
          >
            <span
              style={{
                fontWeight: 600,
                opacity: 0.7,
                textAlign: "right",
                color: cardForeground,
              }}
            >
              Detail
            </span>
            <span>{color.toUpperCase()}</span>
            <span>{rgbString}</span>
            <span>{hslString}</span>
            <span style={{ display: "flex", alignItems: "center" }}>
              Contrast:
              <span
                style={{
                  color: contrastFg,
                  background: contrastBg,
                  borderRadius: 3 * unit,
                  padding: `0 ${4 * unit}px`,
                  marginLeft: 2 * unit,
                  fontWeight: 600,
                  opacity: 0.85,
                }}
              >
                {contrastLabel}
              </span>
            </span>
          </div>

          {/* Row 3: Harmony */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 18 * unit,
              padding: `${18 * unit}px ${28 * unit}px 0 ${28 * unit}px`,
              flex: "0 0 auto",
              fontSize: 14 * unit,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                opacity: 0.7,
                minWidth: 80 * unit,
                textAlign: "right",
                color: cardForeground,
              }}
            >
              Harmony
            </span>
            <div style={{ display: "flex", gap: 8 * unit }}>
              <div
                style={{
                  width: 26 * unit,
                  height: 26 * unit,
                  backgroundColor: complementary,
                  borderRadius: 6 * unit,
                  border: `${unit}px solid rgba(0,0,0,0.08)`,
                }}
                title="Complementary"
              />
              {analogous.map((analogColor, index) => (
                <div
                  key={index}
                  style={{
                    width: 26 * unit,
                    height: 26 * unit,
                    backgroundColor: analogColor,
                    borderRadius: 6 * unit,
                    border: `${unit}px solid rgba(0,0,0,0.08)`,
                  }}
                  title="Analogous"
                />
              ))}
            </div>
          </div>

          {/* Row 4: Color Blindness */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: 18 * unit,
              padding: `${18 * unit}px ${28 * unit}px 0 ${28 * unit}px`,
              flex: "0 0 auto",
              fontSize: 14 * unit,
            }}
          >
            <span
              style={{
                fontWeight: 600,
                opacity: 0.7,
                minWidth: 120 * unit,
                textAlign: "right",
                color: cardForeground,
              }}
            >
              Color Blindness
            </span>
            <div style={{ display: "flex", gap: 8 * unit }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2 * unit,
                }}
              >
                <div
                  style={{
                    width: 16 * unit,
                    height: 16 * unit,
                    backgroundColor: colorBlindness.protanopia,
                    borderRadius: 4 * unit,
                    border: `${unit}px solid rgba(0,0,0,0.08)`,
                  }}
                />
                <div
                  style={{
                    fontSize: 12 * unit,
                    opacity: 0.7,
                    marginTop: 1 * unit,
                    color: cardForeground,
                  }}
                >
                  Protanopia
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2 * unit,
                }}
              >
                <div
                  style={{
                    width: 16 * unit,
                    height: 16 * unit,
                    backgroundColor: colorBlindness.deuteranopia,
                    borderRadius: 4 * unit,
                    border: `${unit}px solid rgba(0,0,0,0.08)`,
                  }}
                />
                <div
                  style={{
                    fontSize: 12 * unit,
                    opacity: 0.7,
                    marginTop: 1 * unit,
                    color: cardForeground,
                  }}
                >
                  Deuteranopia
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2 * unit,
                }}
              >
                <div
                  style={{
                    width: 16 * unit,
                    height: 16 * unit,
                    backgroundColor: colorBlindness.tritanopia,
                    borderRadius: 4 * unit,
                    border: `${unit}px solid rgba(0,0,0,0.08)`,
                  }}
                />
                <div
                  style={{
                    fontSize: 12 * unit,
                    opacity: 0.7,
                    marginTop: 1 * unit,
                    color: cardForeground,
                  }}
                >
                  Tritanopia
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              fontSize: 11 * unit,
              opacity: 0.6,
              alignItems: "center",
              justifyContent: "flex-start",
              padding: `${8 * unit}px ${20 * unit}px`,
              borderTop: `${unit}px solid ${darkMode ? "#23272f" : "#e4e4e7"}`,
              letterSpacing: 0.5 * unit,
              marginTop: "auto",
              color: cardForeground,
            }}
          >
            <span>mirrorlake.ldwid.com</span>
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
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error generating color card:", error);
    return new Response(`Failed to generate color card: ${error}`, {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
