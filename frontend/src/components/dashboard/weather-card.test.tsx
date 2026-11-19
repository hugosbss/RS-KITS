import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { WeatherCard } from './weather-card';
vi.mock('@tanstack/react-query', () => ({ useQuery: vi.fn() }));
const weather = {
  city: 'Bauru',
  place: 'Bauru/SP',
  temperature: 25,
  feelsLike: 26,
  humidity: 60,
  windSpeed: 10,
  precipitation: 2,
  weatherCode: 0,
  description: 'Céu limpo',
  isDay: true,
  daily: [
    { date: '08/10/2026', min: 20, max: 30, weatherCode: 0 },
    { date: '09/10/2026', min: 19, max: 28, weatherCode: 3 },
  ],
};
function query(data: unknown, isLoading = false, isError = false) {
  vi.mocked(useQuery).mockReturnValue({
    data,
    isLoading,
    isError,
  } as ReturnType<typeof useQuery>);
}
describe('weather card', () => {
  it('shows loading and unavailable weather independently of event operations', () => {
    query(undefined, true);
    const { rerender } = render(<WeatherCard place="Bauru/SP" />);
    expect(screen.getByText(/Buscando condições/)).toBeInTheDocument();
    query(undefined, false, true);
    rerender(<WeatherCard />);
    expect(screen.getByText(/Clima indisponível/)).toBeInTheDocument();
  });
  it.each([0, 1, 2, 3, 45, 51, 61, 71, 80, 85, 95, 100])(
    'shows forecast, precipitation and event day for WMO %s',
    (code) => {
      query({ ...weather, weatherCode: code, isDay: code !== 1 });
      render(<WeatherCard place="Bauru/SP" eventDate="08/10/2026" />);
      expect(screen.getByText('25°')).toBeInTheDocument();
      expect(screen.getByText('Evento')).toBeInTheDocument();
      expect(screen.getByText('2 mm')).toBeInTheDocument();
    },
  );
});
