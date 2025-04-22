from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import colorsys
import random
import re
import logging
from typing import List, Dict, Optional, Tuple, Union, Callable, Any, cast
import functools

# Set up logging with more structured format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Color Palette Generator API",
    description="API for generating color palettes",
    version="1.0.0",
    docs_url="/api/py/docs", 
    openapi_url="/api/py/openapi.json"
)

# Add CORS middleware with more specific settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict this in production
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ----------------------
# Basic Color Utility Functions with Caching
# ----------------------

@functools.lru_cache(maxsize=128)
def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """
    Convert hex color to RGB tuple.
    
    Args:
        hex_color: A hex color string (with or without #)
        
    Returns:
        RGB tuple with values from 0-255
    """
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

@functools.lru_cache(maxsize=128)
def rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
    """
    Convert RGB tuple to hex color string.
    
    Args:
        rgb: RGB tuple with values from 0-255
        
    Returns:
        Hex color string with # prefix
    """
    r, g, b = rgb
    return f"#{r:02x}{g:02x}{b:02x}"

@functools.lru_cache(maxsize=128)
def rgb_to_hsl(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
    """
    Convert RGB tuple to HSL tuple.
    
    Args:
        rgb: RGB tuple with values from 0-255
        
    Returns:
        HSL tuple with h in degrees (0-360), s in percent (0-100), l in percent (0-100)
    """
    r, g, b = [x/255.0 for x in rgb]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    return (h*360, s*100, l*100)

@functools.lru_cache(maxsize=128)
def hsl_to_rgb(h: float, s: float, l: float) -> Tuple[int, int, int]:
    """
    Convert HSL values to RGB tuple.
    
    Args:
        h: Hue in degrees (0-360)
        s: Saturation in percent (0-100)
        l: Lightness in percent (0-100)
        
    Returns:
        RGB tuple with values from 0-255
    """
    h, s, l = h/360, s/100, l/100
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return (int(r*255), int(g*255), int(b*255))

@functools.lru_cache(maxsize=128)
def hsl_to_hex(h: float, s: float, l: float) -> str:
    """
    Convert HSL values to hex color string.
    
    Args:
        h: Hue in degrees (0-360)
        s: Saturation in percent (0-100)
        l: Lightness in percent (0-100)
        
    Returns:
        Hex color string with # prefix
    """
    r, g, b = hsl_to_rgb(h, s, l)
    return f"#{r:02x}{g:02x}{b:02x}"

def calculate_color_distance(color1: str, color2: str) -> float:
    """
    Calculate perceptual distance between two colors in RGB space.
    
    Args:
        color1: First hex color string
        color2: Second hex color string
        
    Returns:
        Euclidean distance between the colors
    """
    rgb1 = hex_to_rgb(color1)
    rgb2 = hex_to_rgb(color2)
    # Weighted RGB distance to better match human perception
    # Weights based on human perception sensitivity to different colors
    r_weight, g_weight, b_weight = 0.3, 0.59, 0.11
    r_diff = (rgb1[0] - rgb2[0]) * r_weight
    g_diff = (rgb1[1] - rgb2[1]) * g_weight
    b_diff = (rgb1[2] - rgb2[2]) * b_weight
    return (r_diff**2 + g_diff**2 + b_diff**2) ** 0.5

def validate_hex_color(hex_color: str) -> str:
    """
    Validate and normalize a hex color string.
    
    Args:
        hex_color: A hex color string (with or without #)
        
    Returns:
        Normalized hex color string with # prefix
        
    Raises:
        ValueError: If the hex color is invalid
    """
    # Add # if missing
    if not hex_color.startswith('#'):
        hex_color = f'#{hex_color}'
    
    # Check if it's a valid hex color
    if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
        raise ValueError("Invalid hex color format. Please provide a color in the format #RRGGBB.")
    
    return hex_color

# -----------------------
# Palette Generator Class
# -----------------------

class ColorPaletteGenerator:
    """
    Generate color palettes based on color theory principles.
    
    This class provides methods to generate different types of color palettes
    based on a seed color, including monochromatic, analogous, complementary,
    and balanced palettes.
    """
    
    def __init__(self):
        """Initialize the palette generator with predefined shift values."""
        # Predefined shift values for different palette styles
        self.hue_shifts = {
            "small": [15, 30, 45],
            "medium": [60, 90],
            "large": [120, 180]
        }
        self.saturation_shifts = [-20, -10, 0, 10, 20]
        self.lightness_shifts = [-30, -15, 0, 15, 30]
    
    def generate_palette(self, seed_color: str, count: int = 5, style: str = "balanced") -> List[str]:
        """
        Generate a color palette based on a seed color.
        
        Args:
            seed_color: Hex color string to use as the base
            count: Number of colors to generate (2-10)
            style: Palette style ("balanced", "monochromatic", "analogous", "complementary")
            
        Returns:
            List of hex color strings
        """
        # Normalize and validate the seed color
        try:
            seed_color = validate_hex_color(seed_color)
        except ValueError as e:
            logger.error(f"Invalid seed color: {e}")
            raise
            
        # Convert hex to HSL
        rgb = hex_to_rgb(seed_color)
        h, s, l = rgb_to_hsl(rgb)
        
        # Initialize palette with seed color
        palette = [seed_color]
        
        # Generate palette based on style
        style_method = getattr(self, f"_generate_{style}_palette", None)
        if style_method and callable(style_method):
            palette = style_method(h, s, l, count)
        else:
            # Default to balanced if style not found
            palette = self._generate_balanced_palette(h, s, l, count)
        
        # Ensure all colors are unique
        palette = list(dict.fromkeys(palette))
        
        # If we don't have enough colors, add more with the balanced method
        while len(palette) < count:
            new_h = (h + random.choice(self.hue_shifts["medium"])) % 360
            new_s = max(0, min(100, s + random.choice(self.saturation_shifts)))
            new_l = max(10, min(90, l + random.choice(self.lightness_shifts)))
            new_hex = hsl_to_hex(new_h, new_s, new_l)
            if new_hex not in palette:
                palette.append(new_hex)
        
        return palette[:count]
    
    def _generate_monochromatic_palette(self, h: float, s: float, l: float, count: int) -> List[str]:
        """Generate a monochromatic palette (same hue, different saturation/lightness)."""
        palette = [hsl_to_hex(h, s, l)]  # Start with the seed color
        
        # Create variations by changing saturation and lightness
        for i in range(count - 1):
            # Alternate between changing saturation and lightness
            if i % 2 == 0:
                new_s = max(0, min(100, s + self.saturation_shifts[i % len(self.saturation_shifts)]))
                new_l = l
            else:
                new_s = s
                new_l = max(10, min(90, l + self.lightness_shifts[i % len(self.lightness_shifts)]))
            
            new_hex = hsl_to_hex(h, new_s, new_l)
            palette.append(new_hex)
        
        return palette
    
    def _generate_analogous_palette(self, h: float, s: float, l: float, count: int) -> List[str]:
        """Generate an analogous palette (adjacent hues on the color wheel)."""
        palette = [hsl_to_hex(h, s, l)]  # Start with the seed color
        
        # Create variations with neighboring hues
        for i in range(count - 1):
            # Alternate between clockwise and counterclockwise on the color wheel
            direction = 1 if i % 2 == 0 else -1
            shift = self.hue_shifts["small"][i % len(self.hue_shifts["small"])]
            
            new_h = (h + shift * direction) % 360
            # Slightly vary saturation and lightness for more interest
            new_s = max(0, min(100, s + random.choice([-5, 0, 5])))
            new_l = max(10, min(90, l + random.choice([-5, 0, 5])))
            
            new_hex = hsl_to_hex(new_h, new_s, new_l)
            palette.append(new_hex)
        
        return palette
    
    def _generate_complementary_palette(self, h: float, s: float, l: float, count: int) -> List[str]:
        """Generate a complementary palette (opposite hues on the color wheel)."""
        # Start with the seed color
        palette = [hsl_to_hex(h, s, l)]
        
        # Add the complementary color
        comp_h = (h + 180) % 360
        palette.append(hsl_to_hex(comp_h, s, l))
        
        # Add variations of both the original and complementary colors
        for i in range(count - 2):
            # Alternate between variations of the original and complementary colors
            base_h = h if i % 2 == 0 else comp_h
            
            # Small hue shift
            new_h = (base_h + random.choice([-15, 15])) % 360
            # Vary saturation and lightness
            new_s = max(0, min(100, s + random.choice(self.saturation_shifts)))
            new_l = max(10, min(90, l + random.choice(self.lightness_shifts)))
            
            new_hex = hsl_to_hex(new_h, new_s, new_l)
            palette.append(new_hex)
        
        return palette
    
    def _generate_balanced_palette(self, h: float, s: float, l: float, count: int) -> List[str]:
        """Generate a balanced palette with good distribution around the color wheel."""
        palette = [hsl_to_hex(h, s, l)]  # Start with the seed color
        
        # Create a well-distributed palette
        for i in range(count - 1):
            # Use golden ratio to distribute colors evenly
            golden_ratio = 0.618033988749895
            h = (h + 360 * golden_ratio) % 360
            
            # Vary saturation and lightness slightly
            new_s = max(0, min(100, s + random.choice([-10, 0, 10])))
            new_l = max(10, min(90, l + random.choice([-10, 0, 10])))
            
            new_hex = hsl_to_hex(h, new_s, new_l)
            palette.append(new_hex)
        
        return palette

# Initialize the palette generator
palette_generator = ColorPaletteGenerator()

# -----------------------
# API Models
# -----------------------

class ColorRequest(BaseModel):
    color: str = Field(..., description="Hex color code (with or without # prefix)")
    
    @validator('color')
    def validate_color(cls, v):
        try:
            return validate_hex_color(v)
        except ValueError as e:
            raise ValueError(str(e))

class PaletteRequest(BaseModel):
    seed_color: str = Field(..., description="Hex color code to use as the base for the palette")
    count: int = Field(5, ge=2, le=10, description="Number of colors in the palette (2-10)")
    style: str = Field("balanced", description="Palette style: balanced, monochromatic, analogous, complementary")
    
    @validator('seed_color')
    def validate_seed_color(cls, v):
        try:
            return validate_hex_color(v)
        except ValueError as e:
            raise ValueError(str(e))
    
    @validator('style')
    def validate_style(cls, v):
        valid_styles = ["balanced", "monochromatic", "analogous", "complementary"]
        if v not in valid_styles:
            raise ValueError(f"Invalid style. Please choose from: {', '.join(valid_styles)}")
        return v

class PaletteResponse(BaseModel):
    palette: List[str] = Field(..., description="List of hex color codes in the palette")
    seed_color: str = Field(..., description="Original seed color")
    style: str = Field(..., description="Palette style used")
    error: bool = Field(False, description="Whether an error occurred")
    message: str = Field("", description="Error message if applicable")

class AdvancedColorResponse(BaseModel):
    palette: List[str] = Field(..., description="Generated color palette")
    error: bool = Field(False, description="Whether an error occurred")
    message: str = Field("", description="Error message if applicable")

# -----------------------
# API Endpoints
# -----------------------

@app.post("/api/py/generate-palette", response_model=PaletteResponse)
async def generate_palette(request: PaletteRequest):
    """
    Generate a color palette based on a seed color.
    
    This endpoint creates a palette of colors based on the provided seed color
    and the specified style. Available styles include balanced, monochromatic,
    analogous, and complementary.
    """
    try:
        # Generate palette
        palette = palette_generator.generate_palette(
            request.seed_color, 
            count=request.count,
            style=request.style
        )
        
        return {
            "palette": palette,
            "seed_color": request.seed_color,
            "style": request.style
        }
    
    except ValueError as e:
        logger.warning(f"Validation error in generate_palette: {e}")
        return {
            "palette": [],
            "seed_color": request.seed_color,
            "style": request.style,
            "error": True,
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"Error generating palette: {e}", exc_info=True)
        return {
            "palette": [],
            "seed_color": request.seed_color,
            "style": request.style,
            "error": True,
            "message": f"Error generating palette: {str(e)}"
        }

@app.post("/api/py/advanced-color", response_model=AdvancedColorResponse)
async def get_advanced_color_analysis(request: ColorRequest):
    """
    Perform color palette generation.
    
    This endpoint generates a palette based on the provided color.
    """
    try:
        # Generate palette
        palette = palette_generator.generate_palette(request.color, count=5, style="balanced")
        
        # Create the response with just the palette data
        return {
            "palette": palette
        }
    
    except ValueError as e:
        logger.warning(f"Validation error in get_advanced_color_analysis: {e}")
        return {
            "palette": [],
            "error": True,
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"Error in advanced color analysis: {e}", exc_info=True)
        return {
            "palette": [],
            "error": True,
            "message": f"Error in advanced color analysis: {str(e)}"
        }