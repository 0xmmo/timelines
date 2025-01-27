"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "use-debounce";

const defaultArticles = [
  {
    title: "Library of Alexandria",
    url: "https://en.wikipedia.org/wiki/Library_of_Alexandria",
  },
  { title: "Lady Gaga", url: "https://en.wikipedia.org/wiki/Lady_Gaga" },
  { title: "Chainsaw", url: "https://en.wikipedia.org/wiki/Chainsaw" },
  {
    title: "Great Depression",
    url: "https://en.wikipedia.org/wiki/Great_Depression",
  },
  { title: "Pug", url: "https://en.wikipedia.org/wiki/Pug" },
];

function isValidWikipediaUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "en.wikipedia.org" &&
      parsedUrl.pathname.startsWith("/wiki/")
    );
  } catch {
    return false;
  }
}

function extractSlugFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split("/");
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}

async function searchArticles(searchTerm: string, count: number) {
  if (searchTerm.length < 2) {
    return defaultArticles;
  }

  try {
    const response = await fetch(
      `/api/search?q=${encodeURIComponent(searchTerm)}`
    );
    if (!response.ok) throw new Error("Search failed");
    const results = await response.json();
    return results.slice(0, count).map((result: any) => ({
      title: result.title,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(
        result.title.replace(/ /g, "_")
      )}`,
    }));
  } catch (error) {
    console.error("Search error:", error);
    return defaultArticles;
  }
}

export default function Home() {
  const [inputUrl, setInputUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [debouncedInputUrl] = useDebounce(inputUrl, 300, {
    leading: false,
    trailing: true,
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();

  const [suggestions, setSuggestions] = useState(defaultArticles);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const results = await searchArticles(debouncedInputUrl, 5);
      setSuggestions(results);
    };

    fetchSuggestions();
  }, [debouncedInputUrl]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    setInputUrl(url);
    setIsValidUrl(isValidWikipediaUrl(url));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const slug = extractSlugFromUrl(inputUrl);
    if (slug) {
      router.push(`/timeline?slug=${slug}`);
    }
  };

  const handleSuggestionClick = (article: { title: string; url: string }) => {
    const slug = extractSlugFromUrl(article.url);
    if (slug) {
      router.push(`/timeline?slug=${slug}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
    }
  };

  return (
    <div className="container mx-auto px-2 py-8 min-h-screen flex flex-col">
      <div className="flex-grow">
        <h1 className="text-4xl font-bold mb-4 text-center font-corben">
          Timeline Anything
        </h1>
        <h2 className="text-xl mb-6 text-center font-corben">
          Turn any topic into an interactive chronological timeline.
        </h2>
        <div className="max-w-2xl mx-auto">
          <form className="flex  mb-0" onSubmit={handleSubmit}>
            <Input
              type="text"
              value={inputUrl}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search topics or paste a Wikipedia URL ..."
              className="flex-grow rounded-none"
            />
            <Button
              type="submit"
              className="border-solid rounded-none bg-zinc-950 text-white"
              disabled={!isValidUrl}
            >
              Go
            </Button>
          </form>

          {!isValidUrl && suggestions.length > 0 && (
            <div className="mb-12">
              <ul className="space-y-0">
                {suggestions.map((article, index) => (
                  <li
                    key={index}
                    className={`border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-t-0 ${
                      index === selectedIndex ? "bg-gray-100" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(article);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSuggestionClick(article);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <h3 className="text-lg font-semibold">{article.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{article.url}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!isValidUrl && suggestions.length === 0 && (
            <p className="text-center mt-4">Must be a valid Wikipedia URL</p>
          )}
        </div>
      </div>
      <footer className="text-center text-sm text-gray-500 py-4 opacity-30 hover:opacity-100 transition-opacity duration-200">
        built with ❤️ by{" "}
        <a
          href="https://0xmmo.co"
          className="hover:text-gray-700 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          0xmmo.co
        </a>
        <span className="mx-2">•</span>
        <a
          href="https://github.com/0xmmo/timelines"
          className="hover:text-gray-700 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          github
        </a>
      </footer>
    </div>
  );
}
