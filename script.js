const ddlUnits = document.querySelector("#ddlUnits");
const ddlDay = document.querySelector("#ddlDay");
const txtSearch = document.querySelector("#txtSearch");
const btnSearch = document.querySelector("#btnSearch");
const dvCityCountry = document.querySelector("#dvCityCountry");
const dvCurrDate = document.querySelector("#dvCurrDate");
const dvCurrTemp = document.querySelector("#dvCurrTemp");
const pFeelsLike = document.querySelector("#pFeelsLike");
const pHumidity = document.querySelector("#pHumidity");
const pWind = document.querySelector("#pWind");
const pPrecipitation = document.querySelector("#pPrecipitation");

let cityName, countryName, weatherData;

dvCurrDate.textContent = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
  year: "numeric",
}).format(new Date());

document.addEventListener("DOMContentLoaded", () => {
  populateDayOfWeek();
  getGeoData("Jaipur");
});

async function getGeoData(place) {
  const search = place || txtSearch.value.trim();
  if (!search) return;

  const url = `https://nominatim.openstreetmap.org/search?q=${search}&format=jsonv2&addressdetails=1`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.length) return;

    const { lat, lon } = data[0];
    loadLocationData(data[0]);
    await getWeatherData(lat, lon);
  } catch {}
}

function loadLocationData(data) {
  const a = data.address;
  cityName = a.city || a.town || a.village || a.county || "Unknown";
  countryName = a.country_code.toUpperCase();
  dvCityCountry.textContent = `${cityName}, ${countryName}`;
}

async function getWeatherData(lat, lon) {
  let temp = "celsius", wind = "kmh", precip = "mm";
  if (ddlUnits.value === "F") {
    temp = "fahrenheit";
    wind = "mph";
    precip = "inch";
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&hourly=temperature_2m,weather_code&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,precipitation,wind_speed_10m&temperature_unit=${temp}&wind_speed_unit=${wind}&precipitation_unit=${precip}`;

  try {
    const res = await fetch(url);
    weatherData = await res.json();
    loadCurrentWeather();
    loadDailyForecast();
    loadHourlyForecast();
  } catch {}
}

function loadCurrentWeather() {
  const c = weatherData.current;
  const u = weatherData.current_units;
  dvCurrTemp.textContent = Math.round(c.temperature_2m);
  pFeelsLike.textContent = Math.round(c.apparent_temperature);
  pHumidity.textContent = c.relative_humidity_2m;
  pWind.textContent = `${c.wind_speed_10m} ${u.wind_speed_10m}`;
  pPrecipitation.textContent = `${c.precipitation} ${u.precipitation}`;
}

function loadDailyForecast() {
  const d = weatherData.daily;
  for (let i = 0; i < 7; i++) {
    const el = document.querySelector(`#dvForecastDay${i + 1}`);
    if (!el) continue;

    const day = new Intl.DateTimeFormat("en-US", { weekday: "short" })
      .format(new Date(d.time[i]));

    const icon = getWeatherCodeName(d.weather_code[i]);

    el.innerHTML = `
      <p class="daily__day-title">${day}</p>
      <img class="daily__day-icon" src="/assets/images/icon-${icon}.webp" alt="${icon}">
      <div class="daily__day-temps">
        <p class="daily__day-high">${Math.round(d.temperature_2m_max[i])}°</p>
        <p class="daily__day-low">${Math.round(d.temperature_2m_min[i])}°</p>
      </div>
    `;
  }
}

function loadHourlyForecast() {
  if (!weatherData) return;

  const day = parseInt(ddlDay.value, 10);
  const start = day * 24;
  const end = start + 23;
  let id = 1;

  for (let h = start; h <= end; h++) {
    const el = document.querySelector(`#dvForecastHour${id}`);
    if (!el) break;

    const icon = getWeatherCodeName(weatherData.hourly.weather_code[h]);
    const temp = Math.round(weatherData.hourly.temperature_2m[h]);
    const hour = new Date(weatherData.hourly.time[h])
      .toLocaleString("en-US", { hour: "numeric", hour12: true });

    el.innerHTML = `
      <img class="hourly__hour-icon" src="/assets/images/icon-${icon}.webp" alt="${icon}">
      <p class="hourly__hour-time">${hour}</p>
      <p class="hourly__hour-temp">${temp}°</p>
    `;
    id++;
  }
}

function getWeatherCodeName(code) {
  return {
    0: "sunny",
    1: "partly-cloudy",
    2: "partly-cloudy",
    3: "overcast",
    45: "fog",
    48: "fog",
    51: "drizzle",
    53: "drizzle",
    55: "drizzle",
    61: "rain",
    63: "rain",
    65: "rain",
    71: "snow",
    73: "snow",
    75: "snow",
    80: "rain",
    95: "storm",
  }[code] || "unknown";
}

function populateDayOfWeek() {
  ddlDay.innerHTML = "";
  const d = new Date();
  for (let i = 0; i < 7; i++) {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);
    ddlDay.appendChild(o);
    d.setDate(d.getDate() + 1);
  }
}

btnSearch.addEventListener("click", () => getGeoData());
ddlUnits.addEventListener("change", () => getGeoData());
ddlDay.addEventListener("change", loadHourlyForecast);
