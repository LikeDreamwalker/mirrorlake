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
    (355, 10): {"en": "red", "attributes": ["energetic", "passionate", "attention-grabbing", "bold", "exciting"]},
    # Oranges
    (10, 45): {"en": "orange", "attributes": ["warm", "energetic", "friendly", "playful", "inviting"]},
    # Yellows
    (45, 70): {"en": "yellow", "attributes": ["cheerful", "optimistic", "stimulating", "bright", "sunny"]},
    # Greens
    (70, 170): {"en": "green", "attributes": ["natural", "fresh", "growth-oriented", "calming", "balanced"]},
    # Cyans
    (170, 200): {"en": "cyan", "attributes": ["calm", "refreshing", "technological", "clean", "modern"]},
    # Blues
    (200, 260): {"en": "blue", "attributes": ["trustworthy", "calm", "professional", "reliable", "peaceful"]},
    # Purples
    (260, 290): {"en": "purple", "attributes": ["creative", "luxurious", "mysterious", "royal", "imaginative"]},
    # Magentas
    (290, 355): {"en": "magenta", "attributes": ["innovative", "energetic", "emotional", "romantic", "bold"]},
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

# Conversational intros
INTROS = [
    "Oh, I really like `{color}`! It's a {name} that feels {attr1} and {attr2}.",
    "Nice choice with `{color}`! This {name} gives off a {attr1}, {attr2} vibe.",
    "That's a beautiful `{color}`! As a {name}, it has a {attr1} quality with hints of {attr2}.",
    "I see you've picked `{color}`. This {name} is quite {attr1} and {attr2}.",
    "Interesting selection with `{color}`! This {name} tends to feel {attr1} with a touch of {attr2}.",
    "Ah, `{color}`! I love this {name} - it's so {attr1} and {attr2}.",
    "Great eye for color! `{color}` is a {name} that brings {attr1} and {attr2} feelings.",
    "`{color}` is a wonderful choice. This {name} creates a {attr1} and {attr2} atmosphere.",
    "I'm drawn to your choice of `{color}`. This {name} has a {attr1}, {attr2} character.",
    "You've selected `{color}`, a {name} that's known for being {attr1} and {attr2}."
]

# Harmony intros
HARMONY_INTROS = [
    "Here are some colors that would pair nicely with it:",
    "If you're building a palette, consider these combinations:",
    "For a balanced design, you might want to try these pairings:",
    "These colors would complement your selection beautifully:",
    "When designing with this color, these harmonies work well:",
    "To create a cohesive look, try these color combinations:",
    "For your design palette, consider these harmonious options:",
    "These color pairings would enhance your selected shade:",
    "To expand your color scheme, these combinations are worth exploring:",
    "If you're looking for matching colors, these would work wonderfully:"
]

# Accessibility intros
ACCESSIBILITY_INTROS = [
    "From an accessibility standpoint:",
    "When thinking about readability and accessibility:",
    "For ensuring your design is accessible to everyone:",
    "Regarding contrast and readability:",
    "Looking at the accessibility aspects:",
    "For inclusive design considerations:",
    "Thinking about how everyone will experience this color:",
    "From a universal design perspective:",
    "For optimal visibility and accessibility:",
    "When considering users with different visual abilities:"
]

# Usage suggestion intros
USAGE_INTROS = [
    "This color would work beautifully for:",
    "I'd recommend using this color for:",
    "This shade would be perfect for:",
    "Some great applications for this color include:",
    "You might consider using this color for:",
    "This color would shine when used for:",
    "Based on its properties, this color is ideal for:",
    "This color would be most effective when used for:",
    "Consider applying this color to:",
    "This color would excel when used in:"
]

# Closing questions
CLOSINGS = [
    "Would you like me to suggest a complete palette based on this color?",
    "Need any specific advice on how to use this in your design?",
    "Anything specific you'd like to know about working with this color?",
    "Would you like to explore more colors that would work with this one?",
    "Is there a particular design challenge you're trying to solve with this color?",
    "Would you like to see how this color might look in different lighting conditions?",
    "Are you considering this for a specific project?",
    "Would you like to see some design examples using this color?",
    "Is there a specific mood you're trying to create with this color?",
    "Would you like to explore similar colors in this family?"
]

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
        attributes = ["balanced", "versatile", "calm", "sophisticated", "timeless"]
    
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
            return "near black", ["elegant", "sophisticated", "formal", "mysterious", "dramatic"]
        elif l > 80:
            return "near white", ["clean", "pure", "minimalist", "airy", "spacious"]
        else:
            return f"{lightness_mod} gray", ["neutral", "balanced", "conservative", "timeless", "versatile"]
    
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
    if "energetic" in attributes or "attention-grabbing" in attributes or "bold" in attributes:
        use_cases.append("call-to-action buttons")
        use_cases.append("promotional materials")
        use_cases.append("sale banners")
    
    if "calm" in attributes or "trustworthy" in attributes or "reliable" in attributes:
        use_cases.append("financial applications")
        use_cases.append("healthcare interfaces")
        use_cases.append("professional services")
    
    if "professional" in attributes or "formal" in attributes or "sophisticated" in attributes:
        use_cases.append("business websites")
        use_cases.append("corporate branding")
        use_cases.append("formal documentation")
    
    if "fresh" in attributes or "natural" in attributes or "balanced" in attributes:
        use_cases.append("eco-friendly products")
        use_cases.append("wellness applications")
        use_cases.append("organic food branding")
    
    if "creative" in attributes or "innovative" in attributes or "imaginative" in attributes:
        use_cases.append("art portfolios")
        use_cases.append("creative agency branding")
        use_cases.append("design tool interfaces")
    
    if "playful" in attributes or "cheerful" in attributes or "sunny" in attributes:
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
    
    # If we don't have enough specific use cases, add some generic ones
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

def generate_color_advice(hex_color):
    print(hex_color, '12')
    """Generate advice for a given hex color."""
    # Validate hex color
    if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
        return "I'm sorry, but that doesn't look like a valid hex color. Please provide a color in the format #RRGGBB, like #0066FF."
    
    # Convert to RGB and HSL
    rgb = hex_to_rgb(hex_color)
    h, s, l = rgb_to_hsl(rgb)
    print(rgb, h, s, l, '121')
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
    
    # Select random conversational elements
    intro = random.choice(INTROS).format(
        color=hex_color, 
        name=color_name, 
        attr1=random.choice(attributes), 
        attr2=random.choice([a for a in attributes if a != attributes[0]])
    )
    
    harmony_intro = random.choice(HARMONY_INTROS)
    accessibility_intro = random.choice(ACCESSIBILITY_INTROS)
    usage_intro = random.choice(USAGE_INTROS)
    closing = random.choice(CLOSINGS)
    
    # Generate a more conversational response with tables
    response = f"""{intro}

{harmony_intro}

| Harmony Type | Colors |
|-------------|--------|
| Complementary | `{comp_hex}` |
| Analogous | `{analogous_hex[0]}` `{analogous_hex[1]}` |
| Triadic | `{triadic_hex[0]}` `{triadic_hex[1]}` |

{accessibility_intro}

| Accessibility | Details |
|--------------|---------|
| Best text color | {better_text} |
| Contrast ratio | {contrast_value:.1f}:1 ({contrast_level}) |
| WCAG compliance | {
"AA & AAA (all text)" if contrast_value >= 7 else 
"AA (all text)" if contrast_value >= 4.5 else
"AA (large text only)" if contrast_value >= 3 else
"Not compliant"} |

{usage_intro}
- {use_cases[0]}
- {use_cases[1]}
- {use_cases[2]}

{closing}"""

    return response

# Pydantic model for request
class ColorRequest(BaseModel):
    color: str

# Pydantic model for response
class ColorResponse(BaseModel):
    advice: str

@app.post("/api/py/color-advice", response_model=ColorResponse)
async def color_advice(request: ColorRequest):
    print(ColorRequest, 13)
    hex_color = request.color
    
    # Ensure the hex color is properly formatted
    if not hex_color.startswith('#'):
        hex_color = f'#{hex_color}'
    
    try:
        advice = generate_color_advice(hex_color)
        return {"advice": advice}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating color advice: {str(e)}")

# Test the function with a sample color
if __name__ == "__main__":
    test_color = "#0066FF"
    print(generate_color_advice(test_color))