"use client";

import {
    AlertTriangle,
    Cloud,
    CloudDrizzle,
    CloudFog,
    CloudLightning,
    CloudRain,
    CloudSun,
    Droplets,
    Loader2,
    Moon,
    Snowflake,
    Sun,
    Wind,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { extractCity, getWeather } from "@/services/weather";

function wmoIcon(code: number, isDay: boolean): LucideIcon {
    if (code === 0 || code === 1) return isDay ? Sun : Moon;
    if (code === 2) return CloudSun;
    if (code === 3) return Cloud;
    if (code === 45 || code === 48) return CloudFog;
    if (code >= 51 && code <= 57) return CloudDrizzle;
    if (code >= 61 && code <= 67) return CloudRain;
    if (code >= 71 && code <= 77) return Snowflake;
    if (code >= 80 && code <= 82) return CloudRain;
    if (code === 85 || code === 86) return Snowflake;
    if (code >= 95) return CloudLightning;
    return CloudSun;
}

function wmoTone(code: number): string {
    if (code === 0 || code === 1) return "text-amber-500";
    if (code >= 51 && code <= 57) return "text-sky-400";
    if (code >= 61 && code <= 67) return "text-sky-500";
    if (code >= 71 && code <= 77) return "text-sky-300";
    if (code >= 80) return "text-sky-600";
    if (code >= 95) return "text-violet-500";
    return "text-slate-500";
}

function brDateToDate(date: string): Date | null {
    const m = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function dayOfWeek(date: string): string {
    const value = brDateToDate(date);
    if (!value) return "";
    return value
        .toLocaleDateString("pt-BR", { weekday: "short" })
        .replace(".", "");
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h2 className="text-sm font-medium text-slate-900">{children}</h2>;
}

type WeatherCardProps = {
    place?: string | null;
    eventDate?: string;
};

export function WeatherCard({ place, eventDate }: WeatherCardProps) {
    const enabled = Boolean(place && extractCity(place));
    const { data, isLoading, isError } = useQuery({
        queryKey: ["weather", place ?? ""],
        queryFn: () => getWeather(place ?? ""),
        enabled,
        staleTime: 5 * 60 * 1000,
        retry: 0,
    });

    const CurrentIcon = data ? wmoIcon(data.weatherCode, data.isDay) : CloudSun;

    return (
        <Card className="border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <SectionTitle>Clima</SectionTitle>
                <CurrentIcon className={`h-5 w-5 ${data ? wmoTone(data.weatherCode) : "text-amber-500"}`} />
            </div>

            {isLoading ? (
                <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando condições…
                </div>
            ) : isError || !data ? (
                <div className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    Clima indisponível para {extractCity(place) ?? "este evento"}.
                </div>
            ) : (
                <>
                    <p className="mt-1 text-xs text-slate-500">{data.city}</p>
                    <div className="mt-3 flex items-end gap-8">
                        <div className="flex flex-col">
                            <p className="text-5xl font-semibold">{data.temperature}°</p>
                            <span className="mt-1 text-xs text-slate-400">
                                Sensação {data.feelsLike}°
                            </span>
                        </div>
                        <div className="text-sm">
                            <p className="text-slate-500">Umidade</p>
                            <span className="font-medium">{data.humidity}%</span>
                            <p className="mt-2 text-slate-500">{data.description}</p>
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Droplets className="h-3.5 w-3.5" /> {data.humidity}% umid.
                        </span>
                        <span className="flex items-center gap-1">
                            <Wind className="h-3.5 w-3.5" /> {data.windSpeed} km/h
                        </span>
                        {data.precipitation > 0 && (
                            <span className="flex items-center gap-1">
                                <CloudRain className="h-3.5 w-3.5" /> {data.precipitation} mm
                            </span>
                        )}
                    </div>

                    {data.daily.length > 0 && (
                        <div className="mt-4 grid grid-cols-4 gap-1 border-t border-slate-100 pt-3">
                            {data.daily.slice(0, 4).map((day) => {
                                const Icon = wmoIcon(day.weatherCode, true);
                                const isEventDay = eventDate === day.date;
                                return (
                                    <div key={day.date} className="text-center">
                                        <p className={`text-[10px] uppercase ${isEventDay ? "font-semibold text-blue-600" : "text-slate-400"}`}>
                                            {isEventDay ? "Evento" : dayOfWeek(day.date)}
                                        </p>
                                        <Icon className={`mx-auto h-4 w-4 ${wmoTone(day.weatherCode)}`} />
                                        <p className="mt-0.5 text-xs font-medium text-slate-700">
                                            {day.min}°/ {day.max}°
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </Card>
    );
}