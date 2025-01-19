"use client";

import { useMemo } from "react";
import resolveConfig from "tailwindcss/resolveConfig";
import tailwindConfig from "@/tailwind.config";
import { parse, format, isValid } from "date-fns";

interface Event {
  date: string;
  name: string;
  description: string;
  image?: {
    url: string;
    title: string;
  };
}

interface Period {
  years: string;
  name: string;
  events: Event[];
}

const colorPalette = [
  "indigo-600",
  "rose-600",
  "amber-600",
  "emerald-600",
  "sky-600",
  "violet-600",
  "orange-600",
  "teal-600",
  "pink-600",
  "cyan-600",
  "lime-600",
  "fuchsia-600",
];

export function Timeline({ data }: { data?: Period[] }) {
  const periodColors = useMemo(() => {
    return (
      data?.map((_, index) => colorPalette[index % colorPalette.length]) || []
    );
  }, [data]);

  if (!data || data.length === 0) {
    return <div>No timeline data available</div>;
  }

  const formatDate = (dateString: string): string => {
    let date: Date | undefined;

    if (dateString.length === 10) {
      // YYYY-MM-DD
      date = parse(dateString, "yyyy-MM-dd", new Date());
    } else if (dateString.length === 7) {
      // YYYY-MM
      date = parse(dateString, "yyyy-MM", new Date());
    } else if (dateString.length === 4) {
      // YYYY
      date = parse(dateString, "yyyy", new Date());
    }

    if (date && isValid(date)) {
      if (dateString.length === 10) {
        return format(date, "EEE, MMM d, yyyy");
      } else if (dateString.length === 7) {
        return format(date, "MMM, yyyy");
      } else {
        return format(date, "yyyy");
      }
    }

    return dateString; // Return original string if parsing fails
  };

  const fullConfig = resolveConfig(tailwindConfig);
  const colors = fullConfig.theme.colors;

  const colorClasses = colorPalette.reduce((acc, color) => {
    const [hue, shade] = color.split("-");
    acc[`bg-${color}`] = { backgroundColor: colors[hue][shade] };
    acc[`border-${color}`] = { borderColor: colors[hue][shade] };
    acc[`text-${color}`] = { color: colors[hue][shade] };
    return acc;
  }, {} as Record<string, React.CSSProperties>);

  return (
    <div className="container mx-auto pt-10 -mb-4">
      <style jsx>{`
        ${Object.entries(colorClasses)
          .map(
            ([className, styles]) => `
          .${className} {
            ${Object.entries(styles)
              .map(([property, value]) => `${property}: ${value};`)
              .join("")}
          }
        `
          )
          .join("")}
      `}</style>
      {data.map((period, periodIndex) => (
        <div key={periodIndex} className="relative pb-12">
          <div
            className={`absolute left-1/4 -ml-0.5 top-0 bottom-0 w-1 bg-${
              periodColors[periodIndex % colorPalette.length]
            } z-1`}
            aria-hidden="true"
          ></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="col-span-1 text-right pr-8">
              <p className="text-gray-600 font-semibold opacity-0">
                {period.years}
              </p>
            </div>
            <div className="col-span-3 relative">
              <div
                className={`absolute -left-6 w-10 h-10 rounded-full bg-${
                  periodColors[periodIndex % colorPalette.length]
                } flex items-center justify-center border-4 border-white z-10`}
              >
                <div className="w-3 h-3 bg-white rounded-full"></div>
              </div>
              <p
                className={`text-2xl font-bold text-${
                  periodColors[periodIndex % colorPalette.length]
                } ml-8 mb-4 mt-1 `}
              >
                {period.name}
              </p>
            </div>
          </div>
          <div>
            {period.events.map((event, eventIndex) => (
              <div
                key={eventIndex}
                className="grid grid-cols-4 gap-4 hover:bg-gray-100 py-4 rounded-lg transition-colors duration-300"
              >
                <div className="col-span-1 text-right pr-4 pl-2">
                  <p className="text-gray-600 font-semibold md:text-md text-sm">
                    {formatDate(event.date)}
                  </p>
                </div>
                <div className="col-span-3 relative">
                  <div
                    className={`absolute -ml-4 w-6 h-6 rounded-full bg-${
                      periodColors[periodIndex % colorPalette.length]
                    } border-4 border-white z-10`}
                  ></div>
                  <div className="ml-8">
                    <p className="text-lg font-semibold">{event.name}</p>
                    <p className="text-gray-600 pr-8">{event.description}</p>
                    {event.image && (
                      <div className="mt-4 max-w-sm pr-2">
                        <img
                          src={event.image.url}
                          alt={event.image.title}
                          className="rounded-lg shadow-md w-full h-auto"
                        />
                        <p className="text-sm text-gray-400 mt-2">
                          {event.image.title}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
