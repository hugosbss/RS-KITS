"use client";

export type WeatherDaily = {
  date: string;
  min: number;
  max: number;
  weatherCode: number;
};

export type WeatherData = {
  city: string;
  place: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  description: string;
  isDay: boolean;
  daily: WeatherDaily[];
};

const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

export const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Céu limpo",
  1: "Predominantemente limpo",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Nevoeiro",
  48: "Nevoeiro com geada",
  51: "Garoa leve",
  53: "Garoa",
  55: "Garoa intensa",
  56: "Garoa congelante leve",
  57: "Garoa congelante",
  61: "Chuva fraca",
  63: "Chuva moderada",
  65: "Chuva intensa",
  66: "Chuva congelante leve",
  67: "Chuva congelante",
  71: "Neve fraca",
  73: "Neve moderada",
  75: "Neve intensa",
  77: "Grãos de neve",
  80: "Pancadas de chuva fracas",
  81: "Pancadas de chuva",
  82: "Pancadas de chuva violentas",
  85: "Pancadas de neve",
  86: "Pancadas de neve intensas",
  95: "Trovoada",
  96: "Trovoada com granizo",
  99: "Trovoada com granizo forte",
};

export function describeWmo(code: number): string {
  return WMO_DESCRIPTIONS[code] ?? "Sem informações";
}

// Extrai a cidade do campo "place" do evento nos formatos:
// "São Paulo, SP", "São Paulo/SP", "São Paulo". Ignora "UF" sozinho.
export function extractCity(place?: string | null): string | null {
  if (!place) return null;
  const value = place.trim();
  if (!value) return null;

  const withUf = value.match(/^(.+?)(?:,|\/)\s*([A-Za-z]{2})$/);
  const city = (withUf ? withUf[1] : value.split(/[,/]/)[0]).trim();

  if (!city) return null;
  if (city.length <= 2 && city.toUpperCase() === city) return null;
  return city;
}

function toBrDay(date: string): string | null {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

export async function getWeather(
  place: string,
): Promise<WeatherData | null> {
  const city = extractCity(place);
  if (!city) return null;

  const geoResponse = await fetch(
    `${GEO_URL}?name=${encodeURIComponent(city)}&count=1&language=pt&format=json`,
  );
  if (!geoResponse.ok) return null;
  const geo = (await geoResponse.json()) as { results?: { latitude: number; longitude: number; name: string }[] };
  const location = geo?.results?.[0];
  if (!location) return null;

  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current:
      "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation,is_day",
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    timezone: "auto",
    forecast_days: "7",
  });

  const forecastResponse = await fetch(`${FORECAST_URL}?${params.toString()}`, {
    cache: "no-store",
  });
  if (!forecastResponse.ok) return null;
  const forecast = (await forecastResponse.json()) as {
    current?: {
      temperature_2m?: number;
      apparent_temperature?: number;
      relative_humidity_2m?: number;
      weather_code?: number;
      wind_speed_10m?: number;
      precipitation?: number;
      is_day?: number;
    };
    daily?: {
      time?: string[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
      weather_code?: number[];
    };
  };

  const current = forecast?.current;
  if (!current || current.temperature_2m == null) return null;

  const daily: WeatherDaily[] = Array.isArray(forecast?.daily?.time)
    ? forecast.daily.time.map((date, index) => ({
        date: toBrDay(date) ?? date,
        min: Math.round(forecast.daily?.temperature_2m_min?.[index] ?? 0),
        max: Math.round(forecast.daily?.temperature_2m_max?.[index] ?? 0),
        weatherCode: forecast.daily?.weather_code?.[index] ?? 0,
      }))
    : [];

  return {
    city: location.name,
    place,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    precipitation: current.precipitation ?? 0,
    weatherCode: current.weather_code ?? 0,
    description: describeWmo(current.weather_code ?? 0),
    isDay: current.is_day === 1,
    daily,
  };
}