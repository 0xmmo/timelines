"use client";

import { useState, useEffect, Suspense } from "react";
import { Timeline } from "@/components/Timeline";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Home } from "lucide-react";

interface TimelineData {
  title: string;
  periods: Array<{
    years: string;
    name: string;
    events: Array<{
      date: string;
      name: string;
      description: string;
    }>;
  }>;
}

const loadingMessages = [
  "One sec ...",
  "We haven't seen that one before ...",
  "Fetching article from Wikipedia ...",
  "Parsing chronological information ...",
  "Preparing your timeline ...",
  "Adding final touches ...",
  "Adding final touches ...",
];

async function getTimelineData(slug: string): Promise<TimelineData> {
  const res = await fetch(`/api/timeline?slug=${slug}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to fetch timeline data");
  }
  return res.json();
}

function LoadingMessage() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      {loadingMessages[messageIndex]}
    </div>
  );
}

function TimelineContent() {
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  useEffect(() => {
    if (slug) {
      setIsLoading(true);
      getTimelineData(slug)
        .then((data) => {
          setTimelineData(data);
          setIsLoading(false);
        })
        .catch((err) => {
          setError("Failed to load timeline data");
          setIsLoading(false);
        });
    }
  }, [slug]);

  if (isLoading) {
    return <LoadingMessage />;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!timelineData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        No timeline data available
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mt-8 mb-3 text-center font-corben">
        {timelineData.title}
      </h1>
      <Link
        href={`https://en.wikipedia.org/wiki/${slug}`}
        className="text-blue-500 hover:underline mb-6 block text-center"
        target="_blank"
        rel="noopener noreferrer"
      >
        Wikipedia
      </Link>
      <Timeline data={timelineData.periods} />
    </div>
  );
}

export default function TimelinePage() {
  return (
    <>
      <Suspense fallback={<LoadingMessage />}>
        <TimelineContent />
      </Suspense>
      <Link
        href="/"
        className="fixed top-4 left-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors duration-200 z-90"
      >
        <Home className="w-6 h-6 text-gray-400" />
      </Link>
    </>
  );
}
