# Asteroid Impact Simulator

This is a web-based tool for simulating asteroid impacts and exploring mitigation strategies. Users can select asteroids from NASA's database or input custom parameters to visualize the potential consequences of an impact on Earth.

## Features

- **Interactive Map:** Visualize the impact location and the radius of damage using Leaflet.js.
- **Asteroid Data:** Pulls near-earth object data from NASA's NEO API.
- **Custom Simulation:** Allows users to define their own asteroid parameters (size, speed, density, etc.).
- **Impact Calculation:** Simulates impact effects, including crater size, energy release, and shockwave radius.
- **Data Visualization:** Presents simulation results in an easy-to-understand format.

## Tech Stack

- **Backend:** Python with FastAPI
- **Frontend:** React.js
- **Mapping:** Leaflet.js
- **Data:** NASA NEO API

## Setup and Installation

### Backend

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Create a virtual environment:**

    ```bash
    python -m venv venv
    ```

3.  **Activate the virtual environment:**

    - On Windows:
      ```bash
      .\venv\Scripts\activate
      ```
    - On macOS/Linux:
      ```bash
      source venv/bin/activate
      ```

4.  **Install the required packages:**

    ```bash
    pip install -r requirements.txt
    ```

5.  **Set up your Gemini API Key:**
    - Create a file named `.env` in the `backend` directory.
    - Add your Gemini API key to the file like this:
      ```
      GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
      ```
    - You can get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Frontend

1.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2.  **Install the dependencies:**
    ```bash
    npm install
    ```

## Running the Application

### Backend

1.  **Start the FastAPI server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will be running at `http://127.0.0.1:8000`.

### Frontend

1.  **Start the React application:**
    ```bash
    npm start
    ```
    The frontend will open in your browser at `http://localhost:3000`.

## How to Use

1.  **Select an Asteroid:** Choose an asteroid from the dropdown menu to use its data for the simulation.
2.  **Custom Parameters:** Alternatively, you can manually input the asteroid's parameters.
3.  **Choose Impact Location:** Click on the map to select the impact location.
4.  **Simulate:** Click the "Simulate Impact" button to run the simulation.
5.  **View Results:** The map will update to show the crater and shockwave radius. The charts and result panels will display detailed information about the impact.

## Future Improvements

- Integrate USGS data for population density to estimate casualties.
- Implement mitigation strategy simulations (deflection, fragmentation).
- More detailed atmospheric entry and breakup modeling.
- Add more advanced visualization options and data layers.
