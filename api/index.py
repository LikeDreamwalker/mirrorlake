from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
import colorsys
import random
import re
import logging
from typing import List, Dict, Optional, Tuple, Union, Callable, Any, cast
import functools
from sklearn.neighbors import KNeighborsClassifier

# Set up logging with more structured format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Color Palette Generator API",
    description="API for generating color palettes and analyzing color emotions",
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
# Color Emotion Research Data
# -----------------------

# This dataset is based on established color psychology research
# It maps colors to emotions across different cultures
COLOR_EMOTION_DATA = [
    # Reds
    {"color": "#FF0000", "primary_emotion": "excitement", "emotions": ["excitement", "passion", "anger", "love", "strength"], "culture": "western"},
    {"color": "#FF0000", "primary_emotion": "luck", "emotions": ["luck", "joy", "celebration", "prosperity", "happiness"], "culture": "eastern"},
    {"color": "#8B0000", "primary_emotion": "anger", "emotions": ["anger", "power", "intensity", "danger", "determination"], "culture": "western"},
    {"color": "#FF6B6B", "primary_emotion": "love", "emotions": ["love", "compassion", "warmth", "sensitivity", "romance"], "culture": "western"},
    
    # Oranges
    {"color": "#FFA500", "primary_emotion": "warmth", "emotions": ["warmth", "enthusiasm", "creativity", "energy", "stimulation"], "culture": "western"},
    {"color": "#FF8C00", "primary_emotion": "energy", "emotions": ["energy", "vitality", "adventure", "playfulness", "health"], "culture": "western"},
    {"color": "#FF4500", "primary_emotion": "creativity", "emotions": ["creativity", "enthusiasm", "determination", "success", "encouragement"], "culture": "western"},
    
    # Yellows
    {"color": "#FFFF00", "primary_emotion": "happiness", "emotions": ["happiness", "optimism", "clarity", "warmth", "attention"], "culture": "western"},
    {"color": "#FFD700", "primary_emotion": "optimism", "emotions": ["optimism", "confidence", "self-esteem", "friendliness", "creativity"], "culture": "western"},
    {"color": "#FFFF00", "primary_emotion": "wisdom", "emotions": ["wisdom", "royalty", "dignity", "honor", "respect"], "culture": "eastern"},
    
    # Greens
    {"color": "#008000", "primary_emotion": "growth", "emotions": ["growth", "harmony", "freshness", "fertility", "safety"], "culture": "western"},
    {"color": "#00FF00", "primary_emotion": "nature", "emotions": ["nature", "health", "renewal", "youth", "vigor"], "culture": "western"},
    {"color": "#006400", "primary_emotion": "stability", "emotions": ["stability", "endurance", "reliability", "tradition", "wealth"], "culture": "western"},
    {"color": "#90EE90", "primary_emotion": "peace", "emotions": ["peace", "tranquility", "healing", "softness", "nurturing"], "culture": "western"},
    
    # Blues
    {"color": "#0000FF", "primary_emotion": "trust", "emotions": ["trust", "reliability", "calmness", "serenity", "loyalty"], "culture": "western"},
    {"color": "#1E90FF", "primary_emotion": "serenity", "emotions": ["serenity", "tranquility", "peace", "relaxation", "harmony"], "culture": "western"},
    {"color": "#00008B", "primary_emotion": "authority", "emotions": ["authority", "power", "intelligence", "dignity", "security"], "culture": "western"},
    {"color": "#0000FF", "primary_emotion": "spirituality", "emotions": ["spirituality", "immortality", "healing", "protection", "wisdom"], "culture": "eastern"},
    
    # Purples
    {"color": "#800080", "primary_emotion": "luxury", "emotions": ["luxury", "royalty", "nobility", "sophistication", "mystery"], "culture": "western"},
    {"color": "#9932CC", "primary_emotion": "creativity", "emotions": ["creativity", "imagination", "inspiration", "spirituality", "magic"], "culture": "western"},
    {"color": "#4B0082", "primary_emotion": "mystery", "emotions": ["mystery", "dignity", "independence", "magic", "contemplation"], "culture": "western"},
    
    # Pinks
    {"color": "#FFC0CB", "primary_emotion": "romance", "emotions": ["romance", "love", "gentleness", "calm", "nurturing"], "culture": "western"},
    {"color": "#FF69B4", "primary_emotion": "playfulness", "emotions": ["playfulness", "energy", "youth", "fun", "excitement"], "culture": "western"},
    
    # Browns
    {"color": "#A52A2A", "primary_emotion": "reliability", "emotions": ["reliability", "stability", "warmth", "comfort", "earthiness"], "culture": "western"},
    {"color": "#8B4513", "primary_emotion": "security", "emotions": ["security", "protection", "support", "grounding", "simplicity"], "culture": "western"},
    
    # Blacks
    {"color": "#000000", "primary_emotion": "elegance", "emotions": ["elegance", "sophistication", "power", "authority", "strength"], "culture": "western"},
    {"color": "#000000", "primary_emotion": "mourning", "emotions": ["mourning", "seriousness", "formality", "mystery", "depth"], "culture": "western"},
    {"color": "#000000", "primary_emotion": "protection", "emotions": ["protection", "mystery", "elegance", "sophistication", "prestige"], "culture": "eastern"},
    
    # Whites
    {"color": "#FFFFFF", "primary_emotion": "purity", "emotions": ["purity", "cleanliness", "innocence", "simplicity", "perfection"], "culture": "western"},
    {"color": "#FFFFFF", "primary_emotion": "mourning", "emotions": ["mourning", "respect", "purity", "humility", "simplicity"], "culture": "eastern"},
    
    # Grays
    {"color": "#808080", "primary_emotion": "neutrality", "emotions": ["neutrality", "balance", "sophistication", "practicality", "solidity"], "culture": "western"},
    {"color": "#A9A9A9", "primary_emotion": "reliability", "emotions": ["reliability", "intelligence", "wisdom", "security", "maturity"], "culture": "western"},
]

# -----------------------
# Color Emotion Map Implementation
# -----------------------

# Initialize emotion classifiers once at startup
def initialize_emotion_classifiers():
    """Initialize and return the emotion classifiers."""
    # Prepare the emotion data for the KNN classifier
    emotion_colors = [item["color"] for item in COLOR_EMOTION_DATA]
    emotion_rgb_values = [hex_to_rgb(color) for color in emotion_colors]
    emotion_primary_emotions = [item["primary_emotion"] for item in COLOR_EMOTION_DATA]

    # Create a KNN classifier for emotions
    emotion_classifier = KNeighborsClassifier(n_neighbors=3, weights='distance')
    emotion_classifier.fit(emotion_rgb_values, emotion_primary_emotions)

    # Create culture-specific classifiers
    western_data = [item for item in COLOR_EMOTION_DATA if item["culture"] == "western"]
    eastern_data = [item for item in COLOR_EMOTION_DATA if item["culture"] == "eastern"]

    western_colors = [item["color"] for item in western_data]
    western_rgb_values = [hex_to_rgb(color) for color in western_colors]
    western_primary_emotions = [item["primary_emotion"] for item in western_data]

    eastern_colors = [item["color"] for item in eastern_data]
    eastern_rgb_values = [hex_to_rgb(color) for color in eastern_colors]
    eastern_primary_emotions = [item["primary_emotion"] for item in eastern_data]

    # Create culture-specific classifiers if we have enough data
    culture_classifiers = {}
    if len(western_rgb_values) >= 3:
        western_classifier = KNeighborsClassifier(n_neighbors=min(3, len(western_rgb_values)), weights='distance')
        western_classifier.fit(western_rgb_values, western_primary_emotions)
        culture_classifiers["western"] = western_classifier

    if len(eastern_rgb_values) >= 3:
        eastern_classifier = KNeighborsClassifier(n_neighbors=min(3, len(eastern_rgb_values)), weights='distance')
        eastern_classifier.fit(eastern_rgb_values, eastern_primary_emotions)
        culture_classifiers["eastern"] = eastern_classifier
        
    return emotion_classifier, culture_classifiers

# Initialize classifiers
emotion_classifier, culture_classifiers = initialize_emotion_classifiers()

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

class EmotionRequest(BaseModel):
    color: str = Field(..., description="Hex color code to analyze")
    culture: Optional[str] = Field(None, description="Specific culture to analyze (western, eastern)")
    
    @validator('color')
    def validate_color(cls, v):
        try:
            return validate_hex_color(v)
        except ValueError as e:
            raise ValueError(str(e))
    
    @validator('culture')
    def validate_culture(cls, v):
        if v is not None and v not in ["western", "eastern"]:
            raise ValueError("Culture must be either 'western' or 'eastern'")
        return v

class EmotionResponse(BaseModel):
    color: str = Field(..., description="Hex color code analyzed")
    primary_emotion: str = Field(..., description="Primary emotion associated with the color")
    emotions: List[str] = Field(..., description="List of emotions associated with the color")
    confidence: float = Field(..., description="Confidence score of the emotion prediction")
    cultural_variations: Optional[Dict[str, str]] = Field(None, description="Emotion variations across cultures")
    error: bool = Field(False, description="Whether an error occurred")
    message: str = Field("", description="Error message if applicable")

class ColorEmotionMapRequest(BaseModel):
    color: str = Field(..., description="Hex color code to analyze")
    culture: Optional[str] = Field(None, description="Specific culture to analyze (western, eastern)")
    
    @validator('color')
    def validate_color(cls, v):
        try:
            return validate_hex_color(v)
        except ValueError as e:
            raise ValueError(str(e))

class ColorEmotionMapResponse(BaseModel):
    color: str = Field(..., description="Hex color code analyzed")
    primary_emotion: str = Field(..., description="Primary emotion associated with the color")
    emotions: List[str] = Field(..., description="List of emotions associated with the color")
    confidence: float = Field(..., description="Confidence score of the emotion prediction")
    cultural_variations: Dict[str, str] = Field(..., description="Emotion variations across cultures")
    similar_colors: List[str] = Field(..., description="Colors with similar emotional impact")
    contrasting_emotions: List[str] = Field(..., description="Emotions that contrast with the primary emotion")
    error: bool = Field(False, description="Whether an error occurred")
    message: str = Field("", description="Error message if applicable")

class AdvancedColorResponse(BaseModel):
    palette: List[str] = Field(..., description="Generated color palette")
    emotions: List[str] = Field(..., description="Emotions associated with the color")
    primary_emotion: str = Field(..., description="Primary emotion associated with the color")
    emotion_confidence: float = Field(..., description="Confidence score of the emotion prediction")
    cultural_variations: Optional[Dict[str, str]] = Field(None, description="Emotion variations across cultures")
    similar_colors: List[str] = Field([], description="Colors with similar emotional impact")
    contrasting_emotions: List[str] = Field([], description="Emotions that contrast with the primary emotion")
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

@app.post("/api/py/color-emotion", response_model=EmotionResponse)
async def predict_color_emotion(request: EmotionRequest):
    """
    Predict emotions associated with a color.
    
    This endpoint analyzes a color and returns the primary emotion associated
    with it, along with a list of related emotions and confidence score.
    """
    try:
        # Convert to RGB for the classifier
        rgb = hex_to_rgb(request.color)
        
        # Predict primary emotion using the KNN classifier
        primary_emotion = emotion_classifier.predict([rgb])[0]
        
        # Get probabilities to calculate confidence
        probabilities = emotion_classifier.predict_proba([rgb])[0]
        confidence = float(max(probabilities))
        
        # Find the closest color in our dataset to get associated emotions
        closest_color = None
        min_distance = float('inf')
        
        for item in COLOR_EMOTION_DATA:
            distance = calculate_color_distance(request.color, item["color"])
            if distance < min_distance:
                min_distance = distance
                closest_color = item
        
        # Get associated emotions
        emotions = closest_color["emotions"] if closest_color else [primary_emotion]
        
        # Get cultural variations if available
        cultural_variations = {}
        
        # If a specific culture is requested, only return that one
        if request.culture:
            if request.culture in culture_classifiers:
                cultural_variations[request.culture] = culture_classifiers[request.culture].predict([rgb])[0]
        else:
            # Otherwise return all available cultures
            for culture, classifier in culture_classifiers.items():
                cultural_variations[culture] = classifier.predict([rgb])[0]
        
        return {
            "color": request.color,
            "primary_emotion": primary_emotion,
            "emotions": emotions,
            "confidence": confidence,
            "cultural_variations": cultural_variations
        }
    
    except ValueError as e:
        logger.warning(f"Validation error in predict_color_emotion: {e}")
        return {
            "color": request.color,
            "primary_emotion": "",
            "emotions": [],
            "confidence": 0.0,
            "cultural_variations": {},
            "error": True,
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"Error predicting color emotion: {e}", exc_info=True)
        return {
            "color": request.color,
            "primary_emotion": "",
            "emotions": [],
            "confidence": 0.0,
            "cultural_variations": {},
            "error": True,
            "message": f"Error predicting color emotion: {str(e)}"
        }

@app.post("/api/py/color-emotion-map", response_model=ColorEmotionMapResponse)
async def get_color_emotion_map(request: ColorEmotionMapRequest):
    """
    Generate a detailed emotion map for a color.
    
    This endpoint provides a comprehensive analysis of a color's emotional
    associations, including similar colors and contrasting emotions.
    """
    try:
        # Convert to RGB for the classifier
        rgb = hex_to_rgb(request.color)
        
        # Predict primary emotion using the KNN classifier
        primary_emotion = emotion_classifier.predict([rgb])[0]
        
        # Get probabilities to calculate confidence
        probabilities = emotion_classifier.predict_proba([rgb])[0]
        confidence = float(max(probabilities))
        
        # Find the closest color in our dataset to get associated emotions
        closest_color = None
        min_distance = float('inf')
        
        for item in COLOR_EMOTION_DATA:
            distance = calculate_color_distance(request.color, item["color"])
            if distance < min_distance:
                min_distance = distance
                closest_color = item
        
        # Get associated emotions
        emotions = closest_color["emotions"] if closest_color else [primary_emotion]
        
        # Get cultural variations if available
        cultural_variations = {}
        for culture, classifier in culture_classifiers.items():
            cultural_variations[culture] = classifier.predict([rgb])[0]
        
        # Find similar colors with the same emotion
        similar_colors = []
        for item in COLOR_EMOTION_DATA:
            if item["primary_emotion"] == primary_emotion and item["color"] != request.color:
                similar_colors.append(item["color"])
        
        # Limit to 5 similar colors
        similar_colors = similar_colors[:5]
        
        # Find contrasting emotions
        all_emotions = set(item["primary_emotion"] for item in COLOR_EMOTION_DATA)
        contrasting_emotions = list(all_emotions - {primary_emotion})
        # Limit to 3 contrasting emotions
        contrasting_emotions = contrasting_emotions[:3]
        
        return {
            "color": request.color,
            "primary_emotion": primary_emotion,
            "emotions": emotions,
            "confidence": confidence,
            "cultural_variations": cultural_variations,
            "similar_colors": similar_colors,
            "contrasting_emotions": contrasting_emotions
        }
    
    except ValueError as e:
        logger.warning(f"Validation error in get_color_emotion_map: {e}")
        return {
            "color": request.color,
            "primary_emotion": "",
            "emotions": [],
            "confidence": 0.0,
            "cultural_variations": {},
            "similar_colors": [],
            "contrasting_emotions": [],
            "error": True,
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"Error generating color emotion map: {e}", exc_info=True)
        return {
            "color": request.color,
            "primary_emotion": "",
            "emotions": [],
            "confidence": 0.0,
            "cultural_variations": {},
            "similar_colors": [],
            "contrasting_emotions": [],
            "error": True,
            "message": f"Error generating color emotion map: {str(e)}"
        }

@app.post("/api/py/advanced-color", response_model=AdvancedColorResponse)
async def get_advanced_color_analysis(request: ColorRequest):
    """
    Perform comprehensive color analysis.
    
    This endpoint combines palette generation and emotion analysis to provide
    a complete color profile, including palette suggestions, emotional associations,
    and cultural variations.
    """
    try:
        # Generate palette
        palette = palette_generator.generate_palette(request.color, count=5, style="balanced")
        
        # Get emotion data
        emotion_request = EmotionRequest(color=request.color)
        emotion_response = await predict_color_emotion(emotion_request)
        
        # Get emotion map data for cultural variations
        emotion_map_request = ColorEmotionMapRequest(color=request.color)
        emotion_map_response = await get_color_emotion_map(emotion_map_request)
        
        # Create the response with data from all sources
        return {
            "palette": palette,
            "emotions": emotion_response.get("emotions", []),
            "primary_emotion": emotion_response.get("primary_emotion", ""),
            "emotion_confidence": emotion_response.get("confidence", 0.0),
            "cultural_variations": emotion_map_response.get("cultural_variations", {}),
            "similar_colors": emotion_map_response.get("similar_colors", []),
            "contrasting_emotions": emotion_map_response.get("contrasting_emotions", []),
        }
    
    except ValueError as e:
        logger.warning(f"Validation error in get_advanced_color_analysis: {e}")
        return {
            "palette": [],
            "emotions": [],
            "primary_emotion": "",
            "emotion_confidence": 0.0,
            "cultural_variations": {},
            "similar_colors": [],
            "contrasting_emotions": [],
            "error": True,
            "message": str(e)
        }
    except Exception as e:
        logger.error(f"Error in advanced color analysis: {e}", exc_info=True)
        return {
            "palette": [],
            "emotions": [],
            "primary_emotion": "",
            "emotion_confidence": 0.0,
            "cultural_variations": {},
            "similar_colors": [],
            "contrasting_emotions": [],
            "error": True,
            "message": f"Error in advanced color analysis: {str(e)}"
        }