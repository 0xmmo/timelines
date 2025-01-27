import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db("wikipedia_cache");
    const articles = db.collection("articles");

    // First try to search in our local collection
    const localResults = await articles
      .find({
        $or: [
          { title: { $regex: query, $options: "i" } },
          { snippet: { $regex: query, $options: "i" } },
        ],
      })
      .limit(10)
      .toArray();

    if (localResults.length > 0) {
      return NextResponse.json(localResults);
    }

    try {
      // If no local results, fetch from Wikipedia API
      const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(
        query
      )}&utf8=1&origin=*`;

      const response = await fetch(wikipediaApiUrl);

      if (!response.ok) {
        throw new Error(
          `Wikipedia API responded with status ${response.status}`
        );
      }

      const data = await response.json();
      const results = data.query.search.map((result: any) => ({
        title: result.title,
        snippet: result.snippet.replace(/<\/?[^>]+(>|$)/g, ""),
        pageId: result.pageid,
      }));

      // Store the articles, don't await this
      void articles.insertMany(
        results.map((result: any) => ({
          ...result,
          timestamp: new Date(),
        })),
        { ordered: false } // Continue even if some documents already exist
      );

      return NextResponse.json(results);
    } catch (wikiError) {
      console.error("Wikipedia API error:", wikiError);
      // If Wikipedia API fails, return any partial matches from MongoDB
      const fallbackResults = await articles
        .find({
          $or: [
            { title: { $regex: query.split(" ").join("|"), $options: "i" } },
            { snippet: { $regex: query.split(" ").join("|"), $options: "i" } },
          ],
        })
        .limit(5)
        .toArray();

      if (fallbackResults.length > 0) {
        return NextResponse.json(fallbackResults);
      }

      return NextResponse.json([], { status: 200 }); // Return empty instead
    }
  } catch (error) {
    console.error("Error searching Wikipedia:", error);
    return NextResponse.json(
      { error: "Failed to search Wikipedia" },
      { status: 500 }
    );
  }
}
