let map;
let marker;
document.getElementById('weather-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('city-input').value;
  const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;

  try {
    document.getElementById('weather-info').innerHTML = '';
    const chartCanvas = document.getElementById('historical-chart');
    const ctx = chartCanvas.getContext('2d');

    if (window.historicalChart) {

      window.historicalChart.destroy();
    }

    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (!geocodeData.results || geocodeData.results.length === 0) {
      document.getElementById('weather-info').innerHTML = `<p>City not found. Please try again.</p>`;
      return;
    }

    const { latitude, longitude } = geocodeData.results[0];

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&daily=sunrise,sunset&timezone=auto`;
    const weatherResponse = await fetch(weatherUrl);
    const weatherData = await weatherResponse.json();

    const weatherDescriptions = {
      0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
      45: "Fog", 48: "Depositing rime fog",
      51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
      61: "Light Rain", 63: "Moderate Rain", 65: "Heavy Rain",
      71: "Light Snow", 73: "Moderate Snow", 75: "Heavy Snow",
      80: "Light Rain Shower", 81: "Moderate Rain Shower", 82: "Violent Rain Shower",
      95: "Slight or Moderate Thunderstorm", 96: "Thunderstorm With Slight Hail", 99: "Thunderstorm With Heavy Hail",
    };

    const condition = weatherDescriptions[weatherData.current_weather.weathercode] || "Unknown condition";
    const temperature = weatherData.current_weather.temperature;

    const sunriseTime = new Date(weatherData.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const sunsetTime = new Date(weatherData.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    let weatherInfo = `  
      <h2>Weather in ${city}</h2>
      <p>Temperature: ${temperature}°C</p>
      <p>Condition: ${condition}</p>
      <p>Sunrise: ${sunriseTime}</p>
      <p>Sunset: ${sunsetTime}</p>
    `;

    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today.setDate(today.getDate() - 6)).toISOString().split('T')[0];

    const historicalUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
    const historicalResponse = await fetch(historicalUrl);
    const historicalData = await historicalResponse.json();

    const labels = historicalData.daily.time;
    const minTemps = historicalData.daily.temperature_2m_min;
    const maxTemps = historicalData.daily.temperature_2m_max;

    window.historicalChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Min Temperature (°C)',
            data: minTemps,
            borderColor: 'blue',
            fill: false,
          },
          {
            label: 'Max Temperature (°C)',
            data: maxTemps,
            borderColor: 'red',
            fill: false,
          }
        ]
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Temperature (°C)'
            }
          }
        }
      }
    });

    document.getElementById('weather-info').innerHTML = weatherInfo;

    function addMap(lat, lon, city) {
      if (!map) {
        map = L.map('map').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`Weather location: ${city}`)
            .openPopup();
      } else {
        map.setView([lat, lon], 10);
        marker.setLatLng([lat, lon])
            .setPopupContent(`Weather location: ${city}`)
            .openPopup();
      }
    }


  } catch (error) {
    document.getElementById('weather-info').innerHTML = `<p>Could not fetch weather data. Try again later.</p>`;
    console.error('Error fetching weather data:', error);
  }
});
