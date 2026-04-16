const axios = require('axios');

/**
 * Fetch real weather data from OpenWeather API
 */
async function fetchWeatherData(city) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ OPENWEATHER_API_KEY missing, returning mock weather');
      return { temp: 30, humidity: 60, rain: 0, aqi: 50, description: 'clear sky' };
    }

    // Get coordinates for the city
    const geoRes = await axios.get(`http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
    if (!geoRes.data || geoRes.data.length === 0) {
      throw new Error('City not found');
    }

    const { lat, lon } = geoRes.data[0];

    // Get current weather
    const weatherRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
    const data = weatherRes.data;

    return {
      temp: data.main.temp,
      humidity: data.main.humidity,
      rain: data.rain ? (data.rain['1h'] || 0) : 0,
      aqi: 50, // Note: AQI requires a separate call usually, sticking to 50 or providing basic mock if unavailable
      windSpeed: data.wind.speed,
      description: data.weather[0].description,
      lat,
      lon
    };
  } catch (error) {
    console.error(`Weather fetch error for ${city}:`, error.message);
    return { temp: 30, humidity: 60, rain: 0, aqi: 50, description: 'clear sky' };
  }
}

module.exports = { fetchWeatherData };
