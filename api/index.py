from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import colorsys
import math
import random
import re

app = FastAPI(docs_url="/api/py/docs", openapi_url="/api/py/openapi.json")

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

# More conversational intros
INTROS = [
    "I'm really digging `{color}`! It's a {name} that feels {attr1} and {attr2}.",
    "That `{color}` is a great pick! This {name} gives off a {attr1}, {attr2} vibe.",
    "Ooh, `{color}` is a nice one! As a {name}, it has a {attr1} quality with hints of {attr2}.",
    "I see you're working with `{color}`. This {name} is quite {attr1} and {attr2}.",
    "Interesting choice with `{color}`! This {name} tends to feel {attr1} with a touch of {attr2}.",
    "I'm a fan of `{color}`! This {name} is so {attr1} and {attr2}.",
    "Nice eye! `{color}` is a {name} that brings {attr1} and {attr2} feelings.",
    "`{color}` works really well. This {name} creates a {attr1} and {attr2} atmosphere.",
    "I like your choice of `{color}`. This {name} has a {attr1}, {attr2} character.",
    "Good pick with `{color}`, a {name} that's known for being {attr1} and {attr2}."
]

# More casual harmony intros
HARMONY_INTROS = [
    "Here are some colors that would go well with it:",
    "If you're building a palette, try these combinations:",
    "For a balanced design, these pairings could work nicely:",
    "These colors would complement your selection:",
    "When designing with this color, these harmonies look good:",
    "To create a cohesive look, try these combinations:",
    "For your design palette, these options work well together:",
    "These color pairings would enhance your selected shade:",
    "To expand your color scheme, check out these combinations:",
    "If you need matching colors, these would work well:"
]

# More straightforward accessibility intros
ACCESSIBILITY_INTROS = [
    "For accessibility:",
    "About readability:",
    "For making sure everyone can read your content:",
    "Regarding contrast:",
    "Looking at accessibility:",
    "For inclusive design:",
    "For users with different visual abilities:",
    "From an accessibility perspective:",
    "For optimal visibility:",
    "For better readability:"
]

# More casual usage suggestion intros
USAGE_INTROS = [
    "This color would be great for:",
    "I'd use this color for:",
    "This shade works well for:",
    "Some good uses for this color include:",
    "You could use this color for:",
    "This color would look good when used for:",
    "Based on its properties, this color works for:",
    "This color is effective when used for:",
    "Consider using this color for:",
    "This color would be perfect for:"
]

# More conversational closing questions
CLOSINGS = [
    "Want me to suggest a full palette based on this?",
    "Need any specific tips on using this in your design?",
    "Anything else you'd like to know about this color?",
    "Want to see more colors that would work with this one?",
    "Are you using this for a specific project?",
    "Want to see how this might look in different lighting?",
    "What are you planning to use this color for?",
    "Would you like some design examples using this color?",
    "Are you going for a specific mood with this color?",
    "Want to explore similar colors?"
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

def generate_color_advice(hex_color):
    """Generate advice for a given hex color."""
    # Validate hex color
    if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
        return "That doesn't look like a valid hex color. Can you provide a color in the format #RRGGBB, like #0066FF?"
    
    # Convert to RGB and HSL
    rgb = hex_to_rgb(hex_color)
    h, s, l = rgb_to_hsl(rgb)
    
    # Get color name and attributes
    color_name, attributes, _ = get_color_name(h, s, l)
    
    # Get color harmonies
    comp_h, comp_s, comp_l = get_complementary(h, s, l)
    comp_hex = hsl_to_hex(comp_h, comp_s, comp_l)
    
    analogous = get_analogous(h, s, l)
    analogous_hex = [hsl_to_hex(h, s, l) for h, s, l in analogous]
    
    triadic = get_triadic(h, s, l)
    triadic_hex = [hsl_to_hex(h, s, l) for h, s, l in triadic]
    
    # Get accessibility information
    better_text, better_text_hex, contrast_value, contrast_level = get_accessibility_info(rgb)
    
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
    
    # Generate a more conversational response with tables and color codes
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
| Best text color | {better_text} (`{better_text_hex}`) |
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

I can also suggest some shades and tints of this color if you'd like to create a monochromatic palette. Or maybe you'd like to see how this color would look with different background colors?

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