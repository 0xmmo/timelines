'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TimelineCard } from "@/components/TimelineCard"
import wikipediaArticles from './data/wikipediaArticles.json'
import { useDebounce } from 'use-debounce'

const defaultArticles = [
  "Library of Alexandria", "Lady Gaga", "Chainsaw", "Great Depression", "Pug",
]

function isValidWikipediaUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === 'en.wikipedia.org' && parsedUrl.pathname.startsWith('/wiki/');
  } catch {
    return false;
  }
}

function extractSlugFromUrl(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const pathParts = parsedUrl.pathname.split('/');
    return pathParts[pathParts.length - 1] || null;
  } catch {
    return null;
  }
}

function searchArticles(articles: typeof wikipediaArticles, searchTerm: string, count: number) {
  if (searchTerm.length < 2) {
    return defaultArticles.map(title => articles.find(a => a.title === title)).filter(Boolean);
  }

  const lowerSearchTerm = searchTerm.toLowerCase();
  return articles
    .filter(article => 
      article.title.toLowerCase().includes(lowerSearchTerm) || 
      article.url.toLowerCase().includes(lowerSearchTerm)
    )
    .slice(0, count);
}

export default function Home() {
  const [inputUrl, setInputUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [debouncedInputUrl] = useDebounce(inputUrl, 100);
  const router = useRouter();

  const suggestedArticles = useMemo(() => {
    return searchArticles(wikipediaArticles, debouncedInputUrl, 5);
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

  return (
    <div className="container mx-auto px-2 py-8">
      <h1 className="text-4xl font-bold mb-4 text-center font-corben">Wikipedia to Timeline</h1>
      <h2 className="text-xl mb-6 text-center font-corben">Generate a timeline for any topic.</h2>
      <div className="max-w-2xl mx-auto">
        <form className="flex  mb-0" onSubmit={handleSubmit}>
          <Input 
            type="text" 
            value={inputUrl}
            onChange={handleInputChange}
            placeholder="Search topics or paste a Wikipedia URL ..." 
            className="flex-grow rounded-none"
          />
          <Button type="submit" className="border-solid rounded-none bg-zinc-950 text-white" disabled={!isValidUrl}>Go</Button>
        </form>

        {!isValidUrl && suggestedArticles.length > 0 && (
          <div className="mb-12">
            <ul className="space-y-0">
              {suggestedArticles.map((article, index) => (
                <li 
                  key={index} 
                  className="border border-gray-200 p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer border-t-0"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(article);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
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
        {!isValidUrl && suggestedArticles.length === 0 && (<p className="text-center mt-4">Must be a valid Wikipedia URL</p>)}
      </div>
    </div>
  )
}

