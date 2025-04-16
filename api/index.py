from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import colorsys
import math
import random
import re

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Color name mapping - a simplified version
COLOR_NAMES = {
    # Reds
    (355, 10): {"en": "red", "attributes": ["energetic", "passionate", "attention-grabbing"]},
    # Oranges
    (10, 45): {"en": "orange", "attributes": ["warm", "energetic", "friendly"]},
    # Yellows
    (45, 70): {"en": "yellow", "attributes": ["cheerful", "optimistic", "stimulating"]},
    # Greens
    (70, 170): {"en": "green", "attributes": ["natural", "fresh", "growth-oriented"]},
    # Cyans
    (170, 200): {"en": "cyan", "attributes": ["calm", "refreshing", "technological"]},
    # Blues
    (200, 260): {"en": "blue", "attributes": ["trustworthy", "calm", "professional"]},
    # Purples
    (260, 290): {"en": "purple", "attributes": ["creative", "luxurious", "mysterious"]},
    # Magentas
    (290, 355): {"en": "magenta", "attributes": ["innovative", "energetic", "emotional"]},
}

# Lightness modifiers
LIGHTNESS_MODIFIERS = {
    (0, 20): "very dark",
    (20, 40): "dark",
    (40, 60): "medium",
    (60, 80): "light",
    (80, 100): "very light"
}

# Saturation modifiers
SATURATION_MODIFIERS = {
    (0, 20): "grayish",
    (20, 40): "muted",
    (40, 70): "moderate",
    (70, 90): "vibrant",
    (90, 100): "intense"
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hsl(rgb):
    """Convert RGB to HSL."""
    r, g, b = [x/255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return (h*360, s*100, l*100)

def get_color_name(h, s, l):
    """Get the color name based on HSL values."""
    # Find the base color name from hue
    base_name = None
    for (hue_min, hue_max), data in COLOR_NAMES.items():
        if hue_min <= h <= hue_max or (hue_min > hue_max and (h >= hue_min or h <= hue_max)):
            base_name = data["en"]
            attributes = data["attributes"]
            break
    
    if not base_name:
        base_name = "neutral"
        attributes = ["balanced", "versatile", "calm"]
    
    # Get lightness modifier
    lightness_mod = ""
    for (l_min, l_max), mod in LIGHTNESS_MODIFIERS.items():
        if l_min <= l < l_max:
            lightness_mod = mod
            break
    
    # Get saturation modifier
    saturation_mod = ""
    for (s_min, s_max), mod in SATURATION_MODIFIERS.items():
        if s_min <= s < s_max:
            saturation_mod = mod
            break
    
    # Construct full color name
    if s < 10:  # Very low saturation = grayscale
        if l < 20:
            return "near black", ["elegant", "sophisticated", "formal"]
        elif l > 80:
            return "near white", ["clean", "pure", "minimalist"]
        else:
            return f"{lightness_mod} gray", ["neutral", "balanced", "conservative"]
    
    full_name = f"{lightness_mod} {saturation_mod} {base_name}"
    return full_name.strip(), attributes

def get_complementary(h, s, l):
    """Get the complementary color."""
    h_comp = (h + 180) % 360
    return h_comp, s, l

def get_analogous(h, s, l):
    """Get analogous colors."""
    h1 = (h + 30) % 360
    h2 = (h - 30) % 360
    return [(h1, s, l), (h2, s, l)]

def get_triadic(h, s, l):
    """Get triadic colors."""
    h1 = (h + 120) % 360
    h2 = (h + 240) % 360
    return [(h1, s, l), (h2, s, l)]

def hsl_to_hex(h, s, l):
    """Convert HSL to hex color."""
    h, s, l = h/360, s/100, l/100
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    r, g, b = int(r*255), int(g*255), int(b*255)
    return f"#{r:02x}{g:02x}{b:02x}"

def calculate_contrast(rgb1, rgb2):
    """Calculate contrast ratio between two RGB colors."""
    def luminance(rgb):
        r, g, b = [x/255.0 for x in rgb]
        r = r/12.92 if r <= 0.03928 else ((r+0.055)/1.055)**2.4
        g = g/12.92 if g <= 0.03928 else ((g+0.055)/1.055)**2.4
        b = b/12.92 if b <= 0.03928 else ((b+0.055)/1.055)**2.4
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
    
    l1 = luminance(rgb1)
    l2 = luminance(rgb2)
    
    if l1 > l2:
        return (l1 + 0.05) / (l2 + 0.05)
    else:
        return (l2 + 0.05) / (l1 + 0.05)

def get_accessibility_info(rgb):
    """Get accessibility information for a color."""
    white_contrast = calculate_contrast(rgb, (255, 255, 255))
    black_contrast = calculate_contrast(rgb, (0, 0, 0))
    
    better_text = "white" if white_contrast > black_contrast else "black"
    contrast_value = max(white_contrast, black_contrast)
    
    if contrast_value >= 7:
        level = "excellent"
    elif contrast_value >= 4.5:
        level = "good"
    elif contrast_value >= 3:
        level = "moderate"
    else:
        level = "poor"
    
    return better_text, contrast_value, level

def get_use_cases(name, attributes, contrast_level):
    """Generate use case suggestions based on color properties."""
    use_cases = []
    
    # Based on color attributes
    if "energetic" in attributes or "attention-grabbing" in attributes:
        use_cases.append("call-to-action buttons")
        use_cases.append("promotional materials")
    
    if "calm" in attributes or "trustworthy" in attributes:
        use_cases.append("financial applications")
        use_cases.append("healthcare interfaces")
    
    if "professional" in attributes or "formal" in attributes:
        use_cases.append("business websites")
        use_cases.append("corporate branding")
    
    if "fresh" in attributes or "natural" in attributes:
        use_cases.append("eco-friendly products")
        use_cases.append("wellness applications")
    
    # Based on contrast level
    if contrast_level in ["good", "excellent"]:
        use_cases.append("text elements")
        use_cases.append("navigation components")
    else:
        use_cases.append("decorative elements")
        use_cases.append("background accents")
    
    # If we don't have enough specific use cases, add some generic ones
    generic_uses = [
        "secondary branding elements",
        "accent colors",
        "background gradients",
        "infographic elements"
    ]
    
    while len(use_cases) < 3:
        random_use = random.choice(generic_uses)
        if random_use not in use_cases:
            use_cases.append(random_use)
    
    return use_cases[:3]  # Return at most 3 use cases

def generate_color_advice(hex_color):
    """Generate advice for a given hex color."""
    # Validate hex color
    if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
        return "I'm sorry, but that doesn't look like a valid hex color. Please provide a color in the format #RRGGBB, like #0066FF."
    
    # Convert to RGB and HSL
    rgb = hex_to_rgb(hex_color)
    h, s, l = rgb_to_hsl(rgb)
    
    # Get color name and attributes
    color_name, attributes = get_color_name(h, s, l)
    
    # Get color harmonies
    comp_h, comp_s, comp_l = get_complementary(h, s, l)
    comp_hex = hsl_to_hex(comp_h, comp_s, comp_l)
    
    analogous = get_analogous(h, s, l)
    analogous_hex = [hsl_to_hex(h, s, l) for h, s, l in analogous]
    
    triadic = get_triadic(h, s, l)
    triadic_hex = [hsl_to_hex(h, s, l) for h, s, l in triadic]
    
    # Get accessibility information
    better_text, contrast_value, contrast_level = get_accessibility_info(rgb)
    
    # Get use cases
    use_cases = get_use_cases(color_name, attributes, contrast_level)
    
    # Generate response
    response = f"""I see you've selected **{hex_color}**, which is a {color_name} color. This color gives off a {random.choice(attributes)} and {random.choice(attributes)} feel.

For color harmony, you could pair it with:
- Its complementary color: `{comp_hex}`
- Analogous colors: `{analogous_hex[0]}` and `{analogous_hex[1]}`
- Triadic colors: `{triadic_hex[0]}` and `{triadic_hex[1]}`

From an accessibility standpoint, this color has {contrast_level} contrast ({contrast_value:.1f}:1) with {better_text} text. {
"This meets WCAG AA standards for normal text." if contrast_value >= 4.5 else 
"This meets WCAG AA standards for large text only." if contrast_value >= 3 else
"This doesn't meet WCAG standards for text, so I'd recommend using it for decorative elements only."}

This color would work well for:
- {use_cases[0]}
- {use_cases[1]}
- {use_cases[2]}

Would you like me to suggest a complete color palette based on this color, or would you prefer advice on how to use it effectively in your design?"""

    return response

# Pydantic model for request
class ColorRequest(BaseModel):
    color: str

# Pydantic model for response
class ColorResponse(BaseModel):
    advice: str

@app.post("/api/py/color-advice", response_model=ColorResponse)
async def color_advice(request: ColorRequest):
    hex_color = request.color
    
    # Ensure the hex color is properly formatted
    if not hex_color.startswith('#'):
        hex_color = f'#{hex_color}'
    
    try:
        advice = generate_color_advice(hex_color)
        return {"advice": advice}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating color advice: {str(e)}")
