from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import colorsys
import random
import re
import logging
from typing import List, Dict, Optional
import datetime
import numpy as np
from sklearn.neighbors import KNeighborsClassifier

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

# ----------------------
# Basic Color Utility Functions
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

def calculate_color_distance(color1, color2):
    """Calculate perceptual distance between two colors in Lab space."""
    # Simple Euclidean distance in RGB space as a fallback
    rgb1 = hex_to_rgb(color1)
    rgb2 = hex_to_rgb(color2)
    return sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)) ** 0.5

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

# -----------------------
# Simplified ML-based Color Features
# -----------------------

class ColorPaletteGenerator:
    """Simplified palette generation."""
    def __init__(self):
        # This would normally load a trained model
        # For simplicity, we'll use rule-based generation with some randomness
        self.hue_shifts = [15, 30, 45, 60, 90, 120, 180]
        self.saturation_shifts = [-20, -10, 0, 10, 20]
        self.lightness_shifts = [-30, -15, 0, 15, 30]
    
    def generate_palette(self, seed_color, count=5, style="balanced"):
        """Generate a color palette based on a seed color."""
        # Convert hex to HSL
        rgb = hex_to_rgb(seed_color)
        h, s, l = rgb_to_hsl(rgb)
        
        palette = [seed_color]
        
        if style == "monochromatic":
            # Vary lightness and saturation
            for i in range(count - 1):
                new_s = max(0, min(100, s + random.choice(self.saturation_shifts)))
                new_l = max(10, min(90, l + random.choice(self.lightness_shifts)))
                new_hex = hsl_to_hex(h, new_s, new_l)
                palette.append(new_hex)
        
        elif style == "analogous":
            # Use neighboring hues
            for i in range(count - 1):
                shift = random.choice([15, 30, 45])
                direction = 1 if i % 2 == 0 else -1
                new_h = (h + shift * direction) % 360
                new_s = max(0, min(100, s + random.choice(self.saturation_shifts)))
                new_l = max(10, min(90, l + random.choice(self.lightness_shifts)))
                new_hex = hsl_to_hex(new_h, new_s, new_l)
                palette.append(new_hex)
        
        elif style == "complementary":
            # Include complementary color and variations
            comp_h = (h + 180) % 360
            palette.append(hsl_to_hex(comp_h, s, l))
            
            for i in range(count - 2):
                if i % 2 == 0:
                    base_h = h
                else:
                    base_h = comp_h
                
                new_h = (base_h + random.choice([-15, 15])) % 360
                new_s = max(0, min(100, s + random.choice(self.saturation_shifts)))
                new_l = max(10, min(90, l + random.choice(self.lightness_shifts)))
                new_hex = hsl_to_hex(new_h, new_s, new_l)
                palette.append(new_hex)
        
        else:  # balanced
            # Mix of hue, saturation and lightness variations
            for i in range(count - 1):
                shift = random.choice(self.hue_shifts)
                new_h = (h + shift) % 360
                new_s = max(0, min(100, s + random.choice(self.saturation_shifts)))
                new_l = max(10, min(90, l + random.choice(self.lightness_shifts)))
                new_hex = hsl_to_hex(new_h, new_s, new_l)
                palette.append(new_hex)
        
        # Ensure all colors are unique
        palette = list(dict.fromkeys(palette))
        
        # If we don't have enough colors, add more
        while len(palette) < count:
            new_h = (h + random.choice(self.hue_shifts)) % 360
            new_s = max(0, min(100, s + random.choice(self.saturation_shifts)))
            new_l = max(10, min(90, l + random.choice(self.lightness_shifts)))
            new_hex = hsl_to_hex(new_h, new_s, new_l)
            if new_hex not in palette:
                palette.append(new_hex)
        
        return palette[:count]

# Initialize the palette generator
palette_generator = ColorPaletteGenerator()

# -----------------------
# API Models and Endpoints
# -----------------------

# Pydantic models for requests and responses
class ColorRequest(BaseModel):
    color: str

class PaletteRequest(BaseModel):
    seed_color: str
    count: int = 5
    style: str = "balanced"  # balanced, monochromatic, analogous, complementary

class PaletteResponse(BaseModel):
    palette: List[str]
    seed_color: str
    style: str
    error: bool = False
    message: str = ""

class EmotionRequest(BaseModel):
    color: str
    culture: Optional[str] = None

class EmotionResponse(BaseModel):
    color: str
    primary_emotion: str
    emotions: List[str]
    confidence: float
    cultural_variations: Optional[Dict[str, str]] = None
    error: bool = False
    message: str = ""

class ColorEmotionMapRequest(BaseModel):
    color: str
    culture: Optional[str] = None

class ColorEmotionMapResponse(BaseModel):
    color: str
    primary_emotion: str
    emotions: List[str]
    confidence: float
    cultural_variations: Dict[str, str]
    similar_colors: List[str]
    contrasting_emotions: List[str]
    error: bool = False
    message: str = ""

class AdvancedColorResponse(BaseModel):
    palette: List[str]
    emotions: List[str]
    primary_emotion: str
    emotion_confidence: float
    cultural_variations: Optional[Dict[str, str]] = None
    similar_colors: List[str] = []
    contrasting_emotions: List[str] = []
    error: bool = False
    message: str = ""

# New endpoint for ML-based palette generation
@app.post("/api/py/generate-palette", response_model=PaletteResponse)
async def generate_palette(request: PaletteRequest):
    try:
        # Validate hex color
        hex_color = request.seed_color
        if not hex_color.startswith('#'):
            hex_color = f'#{hex_color}'
        
        if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
            return {
                "palette": [],
                "seed_color": hex_color,
                "style": request.style,
                "error": True,
                "message": "Invalid hex color format. Please provide a color in the format #RRGGBB."
            }
        
        # Validate style
        valid_styles = ["balanced", "monochromatic", "analogous", "complementary"]
        if request.style not in valid_styles:
            return {
                "palette": [],
                "seed_color": hex_color,
                "style": request.style,
                "error": True,
                "message": f"Invalid style. Please choose from: {', '.join(valid_styles)}"
            }
        
        # Generate palette
        palette = palette_generator.generate_palette(
            hex_color, 
            count=min(max(request.count, 2), 10),  # Limit between 2 and 10 colors
            style=request.style
        )
        
        return {
            "palette": palette,
            "seed_color": hex_color,
            "style": request.style
        }
    
    except Exception as e:
        logger.error(f"Error generating palette: {e}")
        return {
            "palette": [],
            "seed_color": request.seed_color,
            "style": request.style,
            "error": True,
            "message": f"Error generating palette: {str(e)}"
        }

# New endpoint for color emotion prediction using research data
@app.post("/api/py/color-emotion", response_model=EmotionResponse)
async def predict_color_emotion(request: EmotionRequest):
    try:
        # Validate hex color
        hex_color = request.color
        if not hex_color.startswith('#'):
            hex_color = f'#{hex_color}'
        
        if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
            return {
                "color": hex_color,
                "primary_emotion": "",
                "emotions": [],
                "confidence": 0.0,
                "cultural_variations": {},
                "error": True,
                "message": "Invalid hex color format. Please provide a color in the format #RRGGBB."
            }
        
        # Convert to RGB for the classifier
        rgb = hex_to_rgb(hex_color)
        
        # Predict primary emotion using the KNN classifier
        primary_emotion = emotion_classifier.predict([rgb])[0]
        
        # Get probabilities to calculate confidence
        probabilities = emotion_classifier.predict_proba([rgb])[0]
        confidence = max(probabilities)
        
        # Find the closest color in our dataset to get associated emotions
        closest_color = None
        min_distance = float('inf')
        
        for item in COLOR_EMOTION_DATA:
            distance = calculate_color_distance(hex_color, item["color"])
            if distance < min_distance:
                min_distance = distance
                closest_color = item
        
        # Get associated emotions
        emotions = closest_color["emotions"] if closest_color else [primary_emotion]
        
        # Get cultural variations if available
        cultural_variations = {}
        for culture, classifier in culture_classifiers.items():
            cultural_variations[culture] = classifier.predict([rgb])[0]
        
        return {
            "color": hex_color,
            "primary_emotion": primary_emotion,
            "emotions": emotions,
            "confidence": float(confidence),
            "cultural_variations": cultural_variations
        }
    
    except Exception as e:
        logger.error(f"Error predicting color emotion: {e}")
        return {
            "color": request.color,
            "primary_emotion": "",
            "emotions": [],
            "confidence": 0.0,
            "cultural_variations": {},
            "error": True,
            "message": f"Error predicting color emotion: {str(e)}"
        }

# New endpoint for color emotion map
@app.post("/api/py/color-emotion-map", response_model=ColorEmotionMapResponse)
async def get_color_emotion_map(request: ColorEmotionMapRequest):
    try:
        # Validate hex color
        hex_color = request.color
        if not hex_color.startswith('#'):
            hex_color = f'#{hex_color}'
        
        if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
            return {
                "color": hex_color,
                "primary_emotion": "",
                "emotions": [],
                "confidence": 0.0,
                "cultural_variations": {},
                "similar_colors": [],
                "contrasting_emotions": [],
                "error": True,
                "message": "Invalid hex color format. Please provide a color in the format #RRGGBB."
            }
        
        # Convert to RGB for the classifier
        rgb = hex_to_rgb(hex_color)
        
        # Predict primary emotion using the KNN classifier
        primary_emotion = emotion_classifier.predict([rgb])[0]
        
        # Get probabilities to calculate confidence
        probabilities = emotion_classifier.predict_proba([rgb])[0]
        confidence = max(probabilities)
        
        # Find the closest color in our dataset to get associated emotions
        closest_color = None
        min_distance = float('inf')
        
        for item in COLOR_EMOTION_DATA:
            distance = calculate_color_distance(hex_color, item["color"])
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
            if item["primary_emotion"] == primary_emotion and item["color"] != hex_color:
                similar_colors.append(item["color"])
        
        # Limit to 5 similar colors
        similar_colors = similar_colors[:5]
        
        # Find contrasting emotions
        all_emotions = set(item["primary_emotion"] for item in COLOR_EMOTION_DATA)
        contrasting_emotions = list(all_emotions - {primary_emotion})
        # Limit to 3 contrasting emotions
        contrasting_emotions = contrasting_emotions[:3]
        
        return {
            "color": hex_color,
            "primary_emotion": primary_emotion,
            "emotions": emotions,
            "confidence": float(confidence),
            "cultural_variations": cultural_variations,
            "similar_colors": similar_colors,
            "contrasting_emotions": contrasting_emotions
        }
    
    except Exception as e:
        logger.error(f"Error generating color emotion map: {e}")
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

# New endpoint that combines all advanced color features
@app.post("/api/py/advanced-color", response_model=AdvancedColorResponse)
async def get_advanced_color_analysis(request: ColorRequest):
    try:
        # Validate hex color
        hex_color = request.color
        if not hex_color.startswith('#'):
            hex_color = f'#{hex_color}'
        
        if not re.match(r'^#[0-9A-Fa-f]{6}$', hex_color):
            return {
                "palette": [],
                "emotions": [],
                "primary_emotion": "",
                "emotion_confidence": 0.0,
                "cultural_variations": {},
                "similar_colors": [],
                "contrasting_emotions": [],
                "error": True,
                "message": "Invalid hex color format. Please provide a color in the format #RRGGBB."
            }
        
        # Generate palette
        palette = palette_generator.generate_palette(hex_color, count=5, style="balanced")
        
        # Get emotion data
        emotion_request = EmotionRequest(color=hex_color)
        emotion_response = await predict_color_emotion(emotion_request)
        
        # Get emotion map data for cultural variations
        emotion_map_request = ColorEmotionMapRequest(color=hex_color)
        emotion_map_response = await get_color_emotion_map(emotion_map_request)
        
        # Create the response with data from all sources
        return {
            "palette": palette,
            "emotions": emotion_response["emotions"] if "emotions" in emotion_response else [],
            "primary_emotion": emotion_response["primary_emotion"] if "primary_emotion" in emotion_response else "",
            "emotion_confidence": emotion_response["confidence"] if "confidence" in emotion_response else 0.0,
            "cultural_variations": emotion_map_response["cultural_variations"] if "cultural_variations" in emotion_map_response else {},
            "similar_colors": emotion_map_response["similar_colors"] if "similar_colors" in emotion_map_response else [],
            "contrasting_emotions": emotion_map_response["contrasting_emotions"] if "contrasting_emotions" in emotion_map_response else [],
        }
    
    except Exception as e:
        logger.error(f"Error in advanced color analysis: {e}")
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

# Health check endpoint
@app.get("/api/py/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "Color Analysis API",
        "features": [
            "ML Palette Generation",
            "Color Emotion Prediction",
            "Color Emotion Map"
        ]
    }