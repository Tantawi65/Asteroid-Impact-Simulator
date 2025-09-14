from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import numpy as np
from pydantic import BaseModel
from typing import Optional, Dict
import os
from dotenv import load_dotenv
import google.generativeai as genai
from geopy.geocoders import Nominatim

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# CORS middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API and Service Configurations ---

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY":
    print("WARNING: GEMINI_API_KEY is not set or is a placeholder. The report will be a placeholder.")
    model = None
else:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('models/gemini-2.5-flash')

# Configure Geopy for reverse geocoding
geolocator = Nominatim(user_agent="asteroid-simulator")

# NASA API configuration
NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")
NEO_API_URL = "https://api.nasa.gov/neo/rest/v1/neo/browse"


# --- Helper Functions ---  

def get_impact_country(lat: float, lon: float) -> str:
    """Converts latitude and longitude to a country name."""
    try:
        location = geolocator.reverse((lat, lon), exactly_one=True, language='en')
        if location and 'country' in location.raw.get('address', {}):
            return location.raw['address']['country']
    except Exception as e:
        print(f"Geocoding error: {e}")
    return "an unknown location (likely an ocean)"

def get_llm_suggestions(impact_energy: float, crater_diameter: float, shockwave_radius: float, country: str) -> str:
    """Calls the Gemini API to get recommendations for disaster management."""
    if not model:
        return """
        ### Placeholder Report

        **Your Gemini API key is not configured.**

        Please add your Gemini API key to the `backend/.env` file to generate a real, location-specific report.

        This is a placeholder demonstrating where the AI-generated analysis would appear. The real report will provide a detailed, country-specific response protocol based on the impact data and location.
        """

    energy_in_megatons = impact_energy / 4.184e15
    prompt = f"""
    Analyze the following asteroid impact scenario and provide a detailed, country-specific government response protocol.

    Scenario Details:
    - Impact Location: {country}
    - Impact Energy: {energy_in_megatons:.2f} Megatons of TNT equivalent
    - Estimated Crater Diameter: {crater_diameter / 1000:.2f} km
    - Estimated Shockwave Radius (for severe damage): {shockwave_radius / 1000:.2f} km

    Based on these details and the specific political, geographical, and economic context of {country}, provide a response protocol that only and only covers the following:
        **Immediate Threat Assessment:** Briefly explain what the impact energy and damage radii mean in understandable terms.
      **Immediate Pre-Impact Actions:** (Evacuation strategies, public warnings, mobilization of resources). Be specific to {country}'s capabilities and infrastructure.
        Keep the response concise and fast. priotrize being fast over the details
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"An error occurred while generating the report from Gemini: {e}"


# --- Pydantic Models ---

class AsteroidParams(BaseModel):
    name: Optional[str] = None
    radius: float
    density: float
    speed: float
    angle: float

class SimulationResult(BaseModel):
    mass_kg: float
    kinetic_energy_joules: float
    impact_energy_joules: float
    crater_diameter_meters: float
    shockwave_radius_meters: float
    energy_equivalent_kt_tnt: float

class ReportRequest(BaseModel):
    simulation_result: SimulationResult
    impact_coords: Dict[str, float]


# --- API Endpoints ---

@app.get("/api/asteroids")
async def get_asteroids():
    """Fetches a list of near-earth objects from NASA's NEO API."""
    params = {"api_key": NASA_API_KEY}
    response = requests.get(NEO_API_URL, params=params)
    response.raise_for_status()
    return response.json()

@app.post("/api/simulate", response_model=SimulationResult)
async def simulate_impact(asteroid: AsteroidParams):
    """Simulates an asteroid impact based on the provided parameters."""
    mass = (4/3) * np.pi * (asteroid.radius**3) * asteroid.density
    kinetic_energy = 0.5 * mass * (asteroid.speed**2)
    energy_lost_to_atmosphere = 0.5
    impact_energy = kinetic_energy * (1 - energy_lost_to_atmosphere)
    crater_diameter = 0.00016 * (impact_energy / (9.8 * asteroid.density))**(1/3.4) * 1000
    shockwave_radius = (impact_energy / 1e12)**(1/3) * 1000
    return {
        "mass_kg": mass,
        "kinetic_energy_joules": kinetic_energy,
        "impact_energy_joules": impact_energy,
        "crater_diameter_meters": crater_diameter,
        "shockwave_radius_meters": shockwave_radius,
        "energy_equivalent_kt_tnt": impact_energy / 4.184e12,
    }

@app.post("/api/generate-report")
async def generate_report(request: ReportRequest):
    """Generates a detailed, AI-powered report based on simulation results and location."""
    country = get_impact_country(request.impact_coords['lat'], request.impact_coords['lng'])
    llm_suggestions = get_llm_suggestions(
        impact_energy=request.simulation_result.impact_energy_joules,
        crater_diameter=request.simulation_result.crater_diameter_meters,
        shockwave_radius=request.simulation_result.shockwave_radius_meters,
        country=country
    )
    return {"report": llm_suggestions}
