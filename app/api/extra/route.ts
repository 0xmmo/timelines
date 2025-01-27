import { NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const periodName = searchParams.get("periodName");
  const eventName = searchParams.get("eventName");

  if (!slug || !periodName || !eventName) {
    return NextResponse.json(
      { error: "Slug, periodName, and eventName are required" },
      { status: 400 }
    );
  }

  try {
    // Fetch Wikipedia article content
    const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${slug}&explaintext=1&exsectionformat=plain`;
    const response = await fetch(wikipediaApiUrl);

    if (!response.ok) {
      throw new Error(`Wikipedia API responded with status ${response.status}`);
    }

    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const content = pages[pageId].extract;

    if (!content) {
      return NextResponse.json({
        expandedInfo: "No additional information available",
      });
    }

    const prompt = `
    Given the following Wikipedia article content, provide detailed information about the event "${eventName}" from the period "${periodName}".
    Focus on providing a summary of key details and important information.
    Keep the response to less than 1 paragraph.
    Do not say the name of the event or period.

    Wikipedia article content:
    ${content}
    `;

    const result = await generateText({
      model: google("gemini-2.0-flash-exp"),
      prompt: prompt,
    });

    return NextResponse.json({ expandedInfo: result.text });
  } catch (error) {
    console.error("Error fetching expanded information:", error);
    return NextResponse.json(
      { error: "Failed to fetch expanded information" },
      { status: 500 }
    );
  }
}
