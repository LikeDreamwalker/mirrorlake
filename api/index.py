from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import colorsys
import math
import random
import re
import logging
from typing import List, Dict, Any, Tuple
import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Color name mapping with hex examples
COLOR_NAMES = {
    # Reds
    (355, 10): {"en": "red", "attributes": ["energetic", "passionate", "attention-grabbing", "bold", "exciting"], "example": "#FF0000"},
    # Oranges
    (10, 45): {"en": "orange", "attributes": ["warm", "energetic", "friendly", "playful", "inviting"], "example": "#FFA500"},
    # Yellows
    (45, 70): {"en": "yellow", "attributes": ["cheerful", "optimistic", "stimulating", "bright", "sunny"], "example": "#FFFF00"},
    # Greens
    (70, 170): {"en": "green", "attributes": ["natural", "fresh", "growth-oriented", "calming", "balanced"], "example": "#00FF00"},
    # Cyans
    (170, 200): {"en": "cyan", "attributes": ["calm", "refreshing", "technological", "clean", "modern"], "example": "#00FFFF"},
    # Blues
    (200, 260): {"en": "blue", "attributes": ["trustworthy", "calm", "professional", "reliable", "peaceful"], "example": "#0000FF"},
    # Purples
    (260, 290): {"en": "purple", "attributes": ["creative", "luxurious", "mysterious", "royal", "imaginative"], "example": "#800080"},
    # Magentas
    (290, 355): {"en": "magenta", "attributes": ["innovative", "energetic", "emotional", "romantic", "bold"], "example": "#FF00FF"},
}

# Harmony descriptions
HARMONY_DESCRIPTIONS = {
    "complementary": "Creates a strong contrast and vibrant look. Good for creating focus points.",
    "analogous": "Creates a cohesive, harmonious feel with colors that sit next to each other on the color wheel.",
    "triadic": "Offers vibrant contrast while maintaining color harmony, using three evenly spaced colors.",
    "split_complementary": "Less tension than complementary but still creates visual interest and balance.",
    "tetradic": "Rich, varied color scheme that works best when one color dominates and others are used as accents.",
    "monochromatic": "Creates a cohesive look using variations in lightness and saturation of a single color.",
    "square": "Uses four colors evenly spaced around the color wheel for a balanced but vibrant look.",
    "compound": "Combines aspects of complementary and analogous schemes for rich, sophisticated palettes."
}

# Harmony use cases
HARMONY_USES = {
    "complementary": ["logos with visual impact", "sports team branding", "call-to-action buttons", "magazine covers", "event posters"],
    "analogous": ["natural landscapes", "harmonious UI designs", "relaxing environments", "spa branding", "educational materials"],
    "triadic": ["playful designs", "children's products", "creative applications", "art portfolios", "game interfaces"],
    "split_complementary": ["balanced website color schemes", "sophisticated marketing materials", "modern interiors", "fashion design", "book covers"],
    "tetradic": ["rich illustrations", "fashion design", "seasonal promotions", "food packaging", "festival branding"],
    "monochromatic": ["elegant branding", "minimalist interfaces", "professional documents", "luxury products", "corporate identities"],
    "square": ["bold advertising", "youth-oriented brands", "creative portfolios", "digital art", "entertainment venues"],
    "compound": ["premium branding", "complex UI systems", "editorial design", "hospitality industry", "cultural institutions"]
}

# Color psychology by industry
COLOR_PSYCHOLOGY = {
    "red": {
        "industries": ["food", "retail", "entertainment"],
        "psychology": "Creates urgency, stimulates appetite, and encourages action.",
        "brands": ["Coca-Cola", "Netflix", "Target"]
    },
    "orange": {
        "industries": ["food", "e-commerce", "health"],
        "psychology": "Conveys enthusiasm, creativity, and affordability.",
        "brands": ["Fanta", "Amazon", "Nickelodeon"]
    },
    "yellow": {
        "industries": ["food", "leisure", "transportation"],
        "psychology": "Evokes optimism, clarity, and warmth.",
        "brands": ["McDonald's", "IKEA", "Hertz"]
    },
    "green": {
        "industries": ["health", "finance", "sustainability"],
        "psychology": "Represents growth, health, and wealth.",
        "brands": ["Whole Foods", "Starbucks", "John Deere"]
    },
    "cyan": {
        "industries": ["technology", "healthcare", "utilities"],
        "psychology": "Suggests clarity, cleanliness, and innovation.",
        "brands": ["Twitter", "AT&T", "GE"]
    },
    "blue": {
        "industries": ["finance", "technology", "healthcare"],
        "psychology": "Builds trust, security, and reliability.",
        "brands": ["Facebook", "IBM", "Visa"]
    },
    "purple": {
        "industries": ["luxury", "beauty", "creativity"],
        "psychology": "Conveys luxury, creativity, and wisdom.",
        "brands": ["Cadbury", "Hallmark", "Yahoo"]
    },
    "magenta": {
        "industries": ["fashion", "beauty", "technology"],
        "psychology": "Suggests innovation, creativity, and boldness.",
        "brands": ["T-Mobile", "Lyft", "Tinder"]
    }
}

# Historical and cultural color associations
COLOR_CULTURAL = {
    "red": {
        "western": "Passion, danger, excitement",
        "eastern": "Good fortune, joy, celebration (China)",
        "historical": "Power, nobility (Ancient Rome)"
    },
    "orange": {
        "western": "Energy, warmth, enthusiasm",
        "eastern": "Spirituality, sacred (Buddhism)",
        "historical": "Harvest, abundance (Medieval Europe)"
    },
    "yellow": {
        "western": "Happiness, optimism, caution",
        "eastern": "Imperial power (China), sacred (India)",
        "historical": "Divine light, gold (Ancient Egypt)"
    },
    "green": {
        "western": "Nature, growth, money",
        "eastern": "Eternity, family (Japan), paradise (Islam)",
        "historical": "Fertility, rebirth (Celtic)"
    },
    "cyan": {
        "western": "Tranquility, technology, cleanliness",
        "eastern": "Healing, immortality (China)",
        "historical": "Protection from evil (Ancient Egypt)"
    },
    "blue": {
        "western": "Trust, calm, stability",
        "eastern": "Immortality (China), spirituality (Judaism)",
        "historical": "Divine, expensive pigment (Renaissance)"
    },
    "purple": {
        "western": "Luxury, creativity, royalty",
        "eastern": "Wealth, privilege (Japan)",
        "historical": "Imperial power, exclusive (Ancient Rome)"
    },
    "magenta": {
        "western": "Innovation, creativity, non-conformity",
        "eastern": "Harmony of yin-yang (China)",
        "historical": "Rare, expensive dye (19th century)"
    }
}

# Color trends by year
COLOR_TRENDS = {
    2024: {
        "trending_colors": ["Digital Lavender", "Sundial", "Tranquil Blue", "Viva Magenta", "Sage Green"],
        "trend_description": "2024 sees a blend of digital-inspired hues and nature-based tones, reflecting our hybrid digital-physical lives."
    },
    2023: {
        "trending_colors": ["Viva Magenta", "Digital Lavender", "Lemon Chiffon", "Verdigris", "Cantaloupe"],
        "trend_description": "2023 embraced vibrant optimism with bold magenta alongside calming lavender and refreshing greens."
    },
    2022: {
        "trending_colors": ["Very Peri", "Coral Rose", "Glacier Lake", "Coffee Quartz", "Cascade"],
        "trend_description": "2022 featured periwinkle blue-violet as a symbol of transition, alongside earthy neutrals and refreshing blues."
    }
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

# Simple, natural intros
INTROS = [
    "This {name} color has {attr1} and {attr2} qualities.",
    "This {name} tends to feel {attr1} with a bit of {attr2}.",
    "This {name} works well for designs that need a {attr1} feel.",
    "This {name} is commonly associated with {attr1} and {attr2}.",
    "This {name} can bring a {attr1} element to your design."
]

# Simple harmony intros
HARMONY_INTROS = [
    "Here are color harmony options:",
    "These color combinations work well:",
    "For a balanced color scheme, consider:",
    "Effective color combinations include:",
    "You might pair it with:"
]

# Simple accessibility intros
ACCESSIBILITY_INTROS = [
    "For readability:",
    "Accessibility notes:",
    "For text contrast:",
    "For better visibility:",
    "Regarding text legibility:"
]

# Simple usage intros
USAGE_INTROS = [
    "Common uses include:",
    "This color works well for:",
    "Typical applications:",
    "Consider using it for:",
    "Good applications include:"
]

# Simple advice closings
CLOSINGS = [
    "Consider using lighter or darker shades for more variety.",
    "It pairs especially well with neutrals like white, black, or gray.",
    "For a more subtle effect, try reducing the saturation slightly.",
    "This color stands out more when used sparingly as an accent.",
    "It works well as either a background or foreground element, depending on your needs."
]

# Color blindness simulation descriptions
COLOR_BLINDNESS = {
    "protanopia": "Red-blind (difficulty distinguishing reds and greens, reds appear darker)",
    "deuteranopia": "Green-blind (difficulty distinguishing reds and greens, greens appear darker)",
    "tritanopia": "Blue-blind (difficulty distinguishing blues and yellows)",
    "achromatopsia": "Complete color blindness (sees only in grayscale)"
}

# Simple in-memory cache
color_advice_cache = {}

# ----------------------
# Color Utility Functions
# ----------------------

def hex_to_rgb(hex_color):
    """Convert hex color to RGB."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    """Convert RGB to hex color."""
    r, g, b = rgb
    return f"#{r:02x}{g:02x}{b:02x}"

def rgb_to_hsl(rgb):
    """Convert RGB to HSL."""
    r, g, b = [x/255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return (h*360, s*100, l*100)

def hsl_to_rgb(h, s, l):
    """Convert HSL to RGB."""
    h, s, l = h/360, s/100, l/100
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    r, g, b = int(r*255), int(g*255), int(b*255)
    return (r, g, b)

def hsl_to_hex(h, s, l):
    """Convert HSL to hex color."""
    r, g, b = hsl_to_rgb(h, s, l)
    return f"#{r:02x}{g:02x}{b:02x}"

def rgb_to_cmyk(rgb):
    """Convert RGB to CMYK."""
    r, g, b = [x/255.0 for x in rgb]
    
    # Handle black
    if r == 0 and g == 0 and b == 0:
        return (0, 0, 0, 100)
    
    c = 1 - r
    m = 1 - g
    y = 1 - b
    k = min(c, m, y)
    
    if k == 1:
        return (0, 0, 0, 100)
    
    c = (c - k) / (1 - k) * 100
    m = (m - k) / (1 - k) * 100
    y = (y - k) / (1 - k) * 100
    k = k * 100
    
    return (c, m, y, k)

def rgb_to_hsv(rgb):
    """Convert RGB to HSV."""
    r, g, b = [x/255.0 for x in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    return (h*360, s*100, v*100)

def rgb_to_lab(rgb):
    """Convert RGB to LAB color space."""
    r, g, b = [x/255.0 for x in rgb]
    
    # Convert RGB to XYZ
    r = r**2.2 if r > 0.04045 else r/12.92
    g = g**2.2 if g > 0.04045 else g/12.92
    b = b**2.2 if b > 0.04045 else b/12.92
    
    x = r * 0.4124 + g * 0.3576 + b * 0.1805
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = r * 0.0193 + g * 0.1192 + b * 0.9505
    
    # Convert XYZ to Lab
    x /= 0.95047
    y /= 1.00000
    z /= 1.08883
    
    x = x**(1/3) if x > 0.008856 else 7.787*x + 16/116
    y = y**(1/3) if y > 0.008856 else 7.787*y + 16/116
    z = z**(1/3) if z > 0.008856 else 7.787*z + 16/116
    
    L = (116 * y) - 16
    a = 500 * (x - y)
    b = 200 * (y - z)
    
    return (L, a, b)

def get_color_temperature(rgb):
    """Estimate color temperature in Kelvin."""
    # This is a simplified approximation
    r, g, b = rgb
    
    # Calculate temperature using a simplified formula
    temperature = 0
    
    if b > r:  # Cool color (blue dominant)
        ratio = b / max(r, 1)  # Avoid division by zero
        temperature = 6500 + (ratio - 1) * 2000
    else:  # Warm color (red dominant)
        ratio = r / max(b, 1)  # Avoid division by zero
        temperature = 6500 - (ratio - 1) * 2000
    
    # Clamp to reasonable range
    temperature = max(1000, min(temperature, 12000))
    
    # Classify the temperature
    if temperature < 3000:
        category = "warm"
    elif temperature < 5000:
        category = "neutral"
    else:
        category = "cool"
    
    return {
        "temperature": int(temperature),
        "category": category,
        "description": f"This is a {category} color with an estimated temperature of {int(temperature)}K."
    }

def simulate_color_blindness(hex_color):
    """Simulate how a color would appear to someone with color blindness."""
    rgb = hex_to_rgb(hex_color)
    r, g, b = rgb
    
    # Simplified simulation matrices
    # Protanopia (red-blind)
    p_r = int(0.56667 * r + 0.43333 * g + 0.00000 * b)
    p_g = int(0.55833 * r + 0.44167 * g + 0.00000 * b)
    p_b = int(0.00000 * r + 0.24167 * g + 0.75833 * b)
    protanopia = f"#{p_r:02x}{p_g:02x}{p_b:02x}"
    
    # Deuteranopia (green-blind)
    d_r = int(0.62500 * r + 0.37500 * g + 0.00000 * b)
    d_g = int(0.70000 * r + 0.30000 * g + 0.00000 * b)
    d_b = int(0.00000 * r + 0.30000 * g + 0.70000 * b)
    deuteranopia = f"#{d_r:02x}{d_g:02x}{d_b:02x}"
    
    # Tritanopia (blue-blind)
    t_r = int(0.95000 * r + 0.05000 * g + 0.00000 * b)
    t_g = int(0.00000 * r + 0.43333 * g + 0.56667 * b)
    t_b = int(0.00000 * r + 0.47500 * g + 0.52500 * b)
    tritanopia = f"#{t_r:02x}{t_g:02x}{t_b:02x}"
    
    # Achromatopsia (complete color blindness)
    # Use standard luminance formula
    luminance = int(0.2126 * r + 0.7152 * g + 0.0722 * b)
    achromatopsia = f"#{luminance:02x}{luminance:02x}{luminance:02x}"
    
    return {
        "protanopia": protanopia,
        "deuteranopia": deuteranopia,
        "tritanopia": tritanopia,
        "achromatopsia": achromatopsia
    }

def get_color_name(h, s, l):
    """Get the color name based on HSL values."""
    # Find the base color name from hue
    base_name = None
    example_hex = None
    for (hue_min, hue_max), data in COLOR_NAMES.items():
        if hue_min <= h <= hue_max or (hue_min > hue_max and (h >= hue_min or h <= hue_max)):
            base_name = data["en"]
            attributes = data["attributes"]
            example_hex = data["example"]
            break
    
    if not base_name:
        base_name = "neutral"
        attributes = ["balanced", "versatile", "calm", "sophisticated", "timeless"]
        example_hex = "#808080"
    
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
            return "near black", ["elegant", "sophisticated", "formal", "mysterious", "dramatic"], "#111111"
        elif l > 80:
            return "near white", ["clean", "pure", "minimalist", "airy", "spacious"], "#F5F5F5"
        else:
            return f"{lightness_mod} gray", ["neutral", "balanced", "conservative", "timeless", "versatile"], "#808080"
    
    full_name = f"{lightness_mod} {saturation_mod} {base_name}"
    return full_name.strip(), attributes, example_hex

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

def get_split_complementary(h, s, l):
    """Get split complementary colors."""
    h_comp = (h + 180) % 360
    h1 = (h_comp + 30) % 360
    h2 = (h_comp - 30) % 360
    return [(h1, s, l), (h2, s, l)]

def get_tetradic(h, s, l):
    """Get tetradic (rectangle) colors."""
    h1 = (h + 60) % 360
    h2 = (h + 180) % 360
    h3 = (h + 240) % 360
    return [(h1, s, l), (h2, s, l), (h3, s, l)]

def get_square(h, s, l):
    """Get square color harmony."""
    h1 = (h + 90) % 360
    h2 = (h + 180) % 360
    h3 = (h + 270) % 360
    return [(h1, s, l), (h2, s, l), (h3, s, l)]

def get_compound(h, s, l):
    """Get compound color harmony (combination of complementary and analogous)."""
    h_comp = (h + 180) % 360
    h1 = (h + 30) % 360
    h2 = (h - 30) % 360
    h3 = (h_comp + 30) % 360
    h4 = (h_comp - 30) % 360
    return [(h1, s, l), (h2, s, l), (h3, s, l), (h4, s, l)]

def get_monochromatic(h, s, l):
    """Get monochromatic colors."""
    # Lighter version
    l1 = min(l + 20, 95)
    # Darker version
    l2 = max(l - 20, 15)
    # More saturated
    s1 = min(s + 15, 95)
    # Less saturated
    s2 = max(s - 15, 15)
    
    return [(h, s, l1), (h, s, l2), (h, s1, l), (h, s2, l)]

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
    white_rgb = (255, 255, 255)
    black_rgb = (0, 0, 0)
    
    white_contrast = calculate_contrast(rgb, white_rgb)
    black_contrast = calculate_contrast(rgb, black_rgb)
    
    better_text = "white" if white_contrast > black_contrast else "black"
    better_text_hex = "#FFFFFF" if better_text == "white" else "#000000"
    contrast_value = max(white_contrast, black_contrast)
    
    if contrast_value >= 7:
        level = "excellent"
    elif contrast_value >= 4.5:
        level = "good"
    elif contrast_value >= 3:
        level = "moderate"
    else:
        level = "poor"
    
    return better_text, better_text_hex, contrast_value, level

def get_use_cases(name, attributes, contrast_level):
    """Generate use case suggestions based on color properties."""
    use_cases = []
    
    # Based on color attributes
    if any(attr in attributes for attr in ["energetic", "attention-grabbing", "bold"]):
        use_cases.append("call-to-action buttons")
        use_cases.append("promotional materials")
        use_cases.append("sale banners")
    
    if any(attr in attributes for attr in ["calm", "trustworthy", "reliable"]):
        use_cases.append("financial applications")
        use_cases.append("healthcare interfaces")
        use_cases.append("professional services")
    
    if any(attr in attributes for attr in ["professional", "formal", "sophisticated"]):
        use_cases.append("business websites")
        use_cases.append("corporate branding")
        use_cases.append("formal documentation")
    
    if any(attr in attributes for attr in ["fresh", "natural", "balanced"]):
        use_cases.append("eco-friendly products")
        use_cases.append("wellness applications")
        use_cases.append("organic food branding")
    
    if any(attr in attributes for attr in ["creative", "innovative", "imaginative"]):
        use_cases.append("art portfolios")
        use_cases.append("creative agency branding")
        use_cases.append("design tool interfaces")
    
    if any(attr in attributes for attr in ["playful", "cheerful", "sunny"]):
        use_cases.append("children's products")
        use_cases.append("entertainment apps")
        use_cases.append("casual game interfaces")
    
    # Based on contrast level
    if contrast_level in ["good", "excellent"]:
        use_cases.append("text elements")
        use_cases.append("navigation components")
        use_cases.append("important UI elements")
    else:
        use_cases.append("decorative elements")
        use_cases.append("background accents")
        use_cases.append("subtle patterns")
    
    # Generic uses for variety
    generic_uses = [
        "secondary branding elements",
        "accent colors",
        "background gradients",
        "infographic elements",
        "social media graphics",
        "digital illustrations",
        "product packaging",
        "email marketing",
        "mobile app interfaces",
        "data visualization"
    ]
    
    # Shuffle all use cases and pick a random selection
    all_uses = list(set(use_cases))  # Remove duplicates
    random.shuffle(all_uses)
    
    # If we don't have enough, add some generic ones
    while len(all_uses) < 3:
        random_use = random.choice(generic_uses)
        if random_use not in all_uses:
            all_uses.append(random_use)
    
    return all_uses[:3]  # Return 3 random use cases

def get_color_psychology(base_color):
    """Get color psychology information."""
    for color_name, info in COLOR_PSYCHOLOGY.items():
        if color_name in base_color:
            return info
    return {
        "industries": ["various"],
        "psychology": "Has versatile psychological effects depending on context.",
        "brands": ["Various"]
    }

def get_cultural_associations(base_color):
    """Get cultural associations for a color."""
    for color_name, info in COLOR_CULTURAL.items():
        if color_name in base_color:
            return info
    return {
        "western": "Varies by context",
        "eastern": "Varies by culture",
        "historical": "Has different meanings throughout history"
    }

def get_color_trends(base_color):
    """Check if color is trending."""
    current_year = datetime.datetime.now().year
    
    # Get trends for current year or most recent year
    year_key = current_year
    while year_key not in COLOR_TRENDS and year_key > current_year - 3:
        year_key -= 1
    
    if year_key not in COLOR_TRENDS:
        return {
            "is_trending": False,
            "trend_info": "No recent trend data available."
        }
    
    trends = COLOR_TRENDS[year_key]
    
    # Check if color is similar to any trending colors
    for trending_color in trends["trending_colors"]:
        if base_color.lower() in trending_color.lower() or trending_color.lower() in base_color.lower():
            return {
                "is_trending": True,
                "trend_year": year_key,
                "trend_name": trending_color,
                "trend_info": f"Similar to {trending_color}, which is trending in {year_key}. {trends['trend_description']}"
            }
    
    return {
        "is_trending": False,
        "trend_year": year_key,

        "trend_info": f"Not specifically trending in {year_key}, but you can still use it effectively in your designs. {trends['trend_description']}"
    }

def generate_css_variables(hex_color, h, s, l):
    """Generate CSS variables for a color scheme."""
    # Generate shades and tints
    shades = []
    tints = []
    
    for i in range(1, 6):
        # Darker shades (decrease lightness)
        shade_l = max(l - (i * 10), 5)
        shade_hex = hsl_to_hex(h, s, shade_l)
        shades.append(shade_hex)
        
        # Lighter tints (increase lightness)
        tint_l = min(l + (i * 10), 95)
        tint_hex = hsl_to_hex(h, s, tint_l)
        tints.append(tint_hex)
    
    # Generate CSS
    css = ":root {\n"
    css += f"  --color-primary: {hex_color};\n"
    
    for i, shade in enumerate(shades):
        css += f"  --color-primary-shade-{i+1}: {shade};\n"
    
    for i, tint in enumerate(tints):
        css += f"  --color-primary-tint-{i+1}: {tint};\n"
    
    css += "}"
    
    return css

def generate_tailwind_config(hex_color, h, s, l):
    """Generate Tailwind CSS configuration for a color."""
    # Generate shades and tints
    color_obj = {}
    
    # Standard Tailwind color scale: 50, 100, 200, ..., 900
    lightness_values = [95, 90, 80, 70, 60, 50, 40, 30, 20, 10]
    scale_names = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]
    
    for name, l_val in zip(scale_names, lightness_values):
        color_obj[name] = hsl_to_hex(h, s, l_val)
    
    # Generate Tailwind config
    config = "module.exports = {\n"
    config += "  theme: {\n"
    config += "    extend: {\n"
    config += "      colors: {\n"
    config += "        'primary': {\n"
    
    for name, hex_val in color_obj.items():
        config += f"          '{name}': '{hex_val}',\n"
    
    config += "        }\n"
    config += "      }\n"
    config += "    }\n"
    config += "  }\n"
    config += "}"
    
    return config

def generate_color_advice(hex_color):
    """Generate advice for a given hex color."""
    # Validate hex color
    if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
        return "That doesn't look like a valid hex color. Please provide a color in the format #RRGGBB, like #0066FF."
    
    # Convert to RGB and HSL
    rgb = hex_to_rgb(hex_color)
    h, s, l = rgb_to_hsl(rgb)
    
    # Get color name and attributes
    color_name, attributes, _ = get_color_name(h, s, l)
    base_color = color_name.split()[-1] if len(color_name.split()) > 0 else color_name
    
    # Get color harmonies
    comp_h, comp_s, comp_l = get_complementary(h, s, l)
    comp_hex = hsl_to_hex(comp_h, comp_s, comp_l)
    
    analogous = get_analogous(h, s, l)
    analogous_hex = [hsl_to_hex(h, s, l) for h, s, l in analogous]
    
    triadic = get_triadic(h, s, l)
    triadic_hex = [hsl_to_hex(h, s, l) for h, s, l in triadic]
    
    split_comp = get_split_complementary(h, s, l)
    split_comp_hex = [hsl_to_hex(h, s, l) for h, s, l in split_comp]
    
    tetradic = get_tetradic(h, s, l)
    tetradic_hex = [hsl_to_hex(h, s, l) for h, s, l in tetradic]
    
    square = get_square(h, s, l)
    square_hex = [hsl_to_hex(h, s, l) for h, s, l in square]
    
    compound = get_compound(h, s, l)
    compound_hex = [hsl_to_hex(h, s, l) for h, s, l in compound][:3]  # Limit to 3 for display
    
    monochromatic = get_monochromatic(h, s, l)
    monochromatic_hex = [hsl_to_hex(h, s, l) for h, s, l in monochromatic]
    
    # Get accessibility information
    better_text, better_text_hex, contrast_value, contrast_level = get_accessibility_info(rgb)
    
    # Get use cases
    use_cases = get_use_cases(color_name, attributes, contrast_level)
    
    # Get color psychology
    psychology = get_color_psychology(base_color)
    
    # Get cultural associations
    cultural = get_cultural_associations(base_color)
    
    # Get color trends
    trends = get_color_trends(base_color)
    
    # Get color blindness simulation
    color_blindness_sim = simulate_color_blindness(hex_color)
    
    # Get color temperature
    temperature = get_color_temperature(rgb)
    
    # Get additional color spaces
    cmyk = rgb_to_cmyk(rgb)
    hsv = rgb_to_hsv(rgb)
    lab = rgb_to_lab(rgb)
    
    # Generate design tools
    css_variables = generate_css_variables(hex_color, h, s, l)
    tailwind_config = generate_tailwind_config(hex_color, h, s, l)
    
    # Select random conversational elements
    intro = random.choice(INTROS).format(
        name=color_name, 
        attr1=random.choice(attributes), 
        attr2=random.choice([a for a in attributes if a != attributes[0]])
    )
    
    harmony_intro = random.choice(HARMONY_INTROS)
    accessibility_intro = random.choice(ACCESSIBILITY_INTROS)
    usage_intro = random.choice(USAGE_INTROS)
    closing = random.choice(CLOSINGS)
    
    # Generate a more straightforward response with tables and color codes
    response = f"""{hex_color} is a {color_name}. {intro}

{harmony_intro}

| Harmony Type | Colors | Description | Good For |
|-------------|--------|-------------|----------|
| Complementary | `{comp_hex}` | {HARMONY_DESCRIPTIONS["complementary"]} | {random.choice(HARMONY_USES["complementary"])} |
| Analogous | `{analogous_hex[0]}` `{analogous_hex[1]}` | {HARMONY_DESCRIPTIONS["analogous"]} | {random.choice(HARMONY_USES["analogous"])} |
| Triadic | `{triadic_hex[0]}` `{triadic_hex[1]}` | {HARMONY_DESCRIPTIONS["triadic"]} | {random.choice(HARMONY_USES["triadic"])} |
| Split Complementary | `{split_comp_hex[0]}` `{split_comp_hex[1]}` | {HARMONY_DESCRIPTIONS["split_complementary"]} | {random.choice(HARMONY_USES["split_complementary"])} |
| Tetradic | `{tetradic_hex[0]}` `{tetradic_hex[1]}` `{tetradic_hex[2]}` | {HARMONY_DESCRIPTIONS["tetradic"]} | {random.choice(HARMONY_USES["tetradic"])} |
| Square | `{square_hex[0]}` `{square_hex[1]}` `{square_hex[2]}` | {HARMONY_DESCRIPTIONS["square"]} | {random.choice(HARMONY_USES["square"])} |

**Monochromatic Variations:**
`{monochromatic_hex[0]}` `{monochromatic_hex[1]}` `{monochromatic_hex[2]}` `{monochromatic_hex[3]}`
{HARMONY_DESCRIPTIONS["monochromatic"]} Good for {random.choice(HARMONY_USES["monochromatic"])}.

{accessibility_intro}

| Accessibility | Details |
|--------------|---------|
| Best text color | {better_text} (`{better_text_hex}`) |
| Contrast ratio | {contrast_value:.1f}:1 ({contrast_level}) |
| WCAG compliance | {
"AA & AAA (all text)" if contrast_value >= 7 else 
"AA (all text)" if contrast_value >= 4.5 else
"AA (large text only)" if contrast_value >= 3 else
"Not compliant"} |

**Color Blindness Appearance:**
- Protanopia (red-blind): `{color_blindness_sim["protanopia"]}` - {COLOR_BLINDNESS["protanopia"]}
- Deuteranopia (green-blind): `{color_blindness_sim["deuteranopia"]}` - {COLOR_BLINDNESS["deuteranopia"]}
- Tritanopia (blue-blind): `{color_blindness_sim["tritanopia"]}` - {COLOR_BLINDNESS["tritanopia"]}

**Color Psychology:**
- Industry fit: {", ".join(psychology["industries"])}
- Psychology: {psychology["psychology"]}
- Notable brands: {", ".join(psychology["brands"])}

**Cultural Associations:**
- Western: {cultural["western"]}
- Eastern: {cultural["eastern"]}
- Historical: {cultural["historical"]}

**Technical Color Data:**
- RGB: {rgb[0]}, {rgb[1]}, {rgb[2]}
- HSL: {h:.0f}°, {s:.0f}%, {l:.0f}%
- CMYK: {cmyk[0]:.0f}%, {cmyk[1]:.0f}%, {cmyk[2]:.0f}%, {cmyk[3]:.0f}%
- Temperature: {temperature["temperature"]}K ({temperature["category"]})

{usage_intro}
- {use_cases[0]}
- {use_cases[1]}
- {use_cases[2]}

{closing}

{"**Trending:** " + trends["trend_info"] if trends.get("is_trending", False) else ""}"""

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
    
    # Check cache first
    if hex_color in color_advice_cache:
        return {"advice": color_advice_cache[hex_color]}
    
    try:
        advice = generate_color_advice(hex_color)
        # Store in cache
        color_advice_cache[hex_color] = advice
        return {"advice": advice}
    except Exception as e:
        logger.error(f"Error generating color advice: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating color advice: {str(e)}")

# Health check endpoint
@app.get("/api/py/health")
async def health_check():
    return {"status": "healthy", "service": "Color Analysis API"}

# Test the function with a sample color
if __name__ == "__main__":
    test_color = "#0066FF"
    print(generate_color_advice(test_color))