import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMapEvents } from 'react-leaflet';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const API_URL = 'http://127.0.0.1:8000';

function LocationMarker({ setImpactCoords }) {
  const map = useMapEvents({
    click(e) {
      setImpactCoords([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return null;
}

function ReportModal({ content, onClose }) {
  const formattedContent = content.split('**').map((part, index) => {
    return index % 2 === 1 ? <strong key={index}>{part}</strong> : part;
  });

  return (
    <div className="report-modal">
      <div className="report-content">
        <button className="close-button" onClick={onClose}>X</button>
        <pre>{formattedContent}</pre>
      </div>
    </div>
  );
}

function App() {
  const [asteroids, setAsteroids] = useState([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState('');
  const [params, setParams] = useState({
    radius: 10,
    density: 2000,
    speed: 20000,
    angle: 45,
  });
  const [simulationResult, setSimulationResult] = useState(null);
  const [impactCoords, setImpactCoords] = useState([51.505, -0.09]);
  const [showReport, setShowReport] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/api/asteroids`)
      .then(response => {
        setAsteroids(response.data.near_earth_objects);
      })
      .catch(error => {
        console.error("Error fetching asteroids:", error);
      });
  }, []);

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({ ...prev, [name]: parseFloat(value) }));
  };

  const handleAsteroidSelect = (e) => {
    const asteroidName = e.target.value;
    setSelectedAsteroid(asteroidName);
    if (asteroidName) {
      const asteroid = asteroids.find(a => a.name === asteroidName);
      if (asteroid) {
        const speed = (asteroid.close_approach_data && asteroid.close_approach_data.length > 0)
          ? asteroid.close_approach_data[0].relative_velocity.kilometers_per_second * 1000
          : 20000; // Default speed if data is missing

        setParams({
          radius: (asteroid.estimated_diameter.meters.estimated_diameter_max / 2),
          density: 2000, // Default density
          speed: speed,
          angle: 45, // Default angle
        });
      }
    }
  };

  const handleSimulate = () => {
    // When a new simulation is run, clear the old report
    setReportContent('');
    setShowReport(false);

    axios.post(`${API_URL}/api/simulate`, params)
      .then(response => {
        setSimulationResult(response.data);
      })
      .catch(error => {
        console.error("Error running simulation:", error);
      });
  };

  const handleGenerateReport = () => {
    // If a report already exists, just show it
    if (reportContent) {
      setShowReport(true);
      return;
    }

    setIsGeneratingReport(true);
    const reportRequest = {
      simulation_result: simulationResult,
      impact_coords: {
        lat: impactCoords[0],
        lng: impactCoords[1]
      }
    };

    axios.post(`${API_URL}/api/generate-report`, reportRequest)
      .then(response => {
        setReportContent(response.data.report);
        setShowReport(true);
      })
      .catch(error => {
        console.error("Error generating report:", error);
      })
      .finally(() => {
        setIsGeneratingReport(false);
      });
  };

  const chartData = [
    { name: 'Kinetic Energy', value: simulationResult?.kinetic_energy_joules || 0 },
    { name: 'Impact Energy', value: simulationResult?.impact_energy_joules || 0 },
  ];

  return (
    <div className="App">
      <header className="header">
        <h1>Asteroid Impact Simulator</h1>
      </header>
      <div className="main-content">
        <div className="controls">
          <h2>Parameters</h2>
          <div className="form-group">
            <label>Select Asteroid (optional)</label>
            <select onChange={handleAsteroidSelect} value={selectedAsteroid}>
              <option value="">Custom Input</option>
              {asteroids.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Radius (m)</label>
            <input type="number" name="radius" value={params.radius} onChange={handleParamChange} />
          </div>
          <div className="form-group">
            <label>Density (kg/m³)</label>
            <input type="number" name="density" value={params.density} onChange={handleParamChange} />
          </div>
          <div className="form-group">
            <label>Speed (m/s)</label>
            <input type="number" name="speed" value={params.speed} onChange={handleParamChange} />
          </div>
          <div className="form-group">
            <label>Entry Angle (°)</label>
            <input type="number" name="angle" value={params.angle} onChange={handleParamChange} />
          </div>
          <button className="simulate-button" onClick={handleSimulate}>Simulate Impact</button>
          {simulationResult && (
            <button className="report-button" onClick={handleGenerateReport} disabled={isGeneratingReport}>
              {isGeneratingReport ? 'Generating...' : 'Generate Detailed Report'}
            </button>
          )}
        </div>
        <div className="visualization">
          <div className="map-container">
            <MapContainer center={impactCoords} zoom={4} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <LocationMarker setImpactCoords={setImpactCoords} />
              {simulationResult && (
                <>
                  <Marker position={impactCoords}>
                    <Popup>Impact Location</Popup>
                  </Marker>
                  <Circle center={impactCoords} radius={simulationResult.crater_diameter_meters} pathOptions={{ color: 'red' }} />
                  <Circle center={impactCoords} radius={simulationResult.shockwave_radius_meters} pathOptions={{ color: 'orange' }} />
                </>
              )}
            </MapContainer>
          </div>
          {simulationResult && !showReport && (
            <div className="results">
              <div className="result-item">
                <h3>Crater Diameter</h3>
                <p>{(simulationResult.crater_diameter_meters / 1000).toFixed(2)} km</p>
              </div>
              <div className="result-item">
                <h3>Energy Released</h3>
                <p>{(simulationResult.energy_equivalent_kt_tnt / 1000).toFixed(2)} Megatons TNT</p>
              </div>
              <div className="result-item">
                <h3>Shockwave Radius</h3>
                <p>{(simulationResult.shockwave_radius_meters / 1000).toFixed(2)} km</p>
              </div>
              <ResponsiveContainer width="30%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          {showReport && (
            <ReportModal content={reportContent} onClose={() => setShowReport(false)} />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

