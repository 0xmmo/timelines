import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { z } from "zod";
import clientPromise from "@/lib/mongodb";

export const maxDuration = 60;

const timelineSchema = z.object({
  title: z.string(),
  periods: z.array(
    z.object({
      years: z.string(),
      name: z.string(),
      events: z.array(
        z.object({
          date: z.string(),
          name: z.string(),
          description: z.string(),
          image: z
            .object({
              url: z.string(),
              title: z.string(),
            })
            .optional(),
        })
      ),
    })
  ),
});

async function getCachedTimeline(slug: string) {
  const client = await clientPromise;
  const db = client.db("wikipedia_timelines");
  const timeline = await db.collection("timelines").findOne({ slug });
  return timeline;
}

async function cacheTimeline(slug: string, timeline: any) {
  const client = await clientPromise;
  const db = client.db("wikipedia_timelines");
  await db
    .collection("timelines")
    .updateOne(
      { slug },
      { $set: { timeline, updatedAt: new Date() } },
      { upsert: true }
    );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug is required" }, { status: 400 });
  }

  try {
    const cachedTimeline = await getCachedTimeline(slug);
    if (cachedTimeline) {
      console.log("Returning cached timeline for", slug);
      return NextResponse.json(cachedTimeline.timeline);
    }

    const wikipediaApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|images&titles=${slug}&explaintext=1&exsectionformat=plain`;

    const response = await fetch(wikipediaApiUrl);

    if (!response.ok) {
      throw new Error(`Wikipedia API responded with status ${response.status}`);
    }

    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    const content = pages[pageId].extract;
    const images = pages[pageId].images || [];

    // Fetch image URLs
    const imageUrls = await Promise.all(
      images
        .filter(
          (img: any) =>
            !img.title.toLowerCase().includes("icon") &&
            !img.title.toLowerCase().includes("logo")
        )
        .slice(0, 10) // Limit to first 10 images
        .map(async (img: any) => {
          const imageApiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(
            img.title
          )}`;
          const imgResponse = await fetch(imageApiUrl);
          const imgData = await imgResponse.json();
          const imgPages = imgData.query.pages;
          const imgPageId = Object.keys(imgPages)[0];
          return {
            type: "image",
            title: img.title.split("File:")[0] || img.title,
            url: imgPages[imgPageId]?.imageinfo?.[0]?.url,
          };
        })
    );

    console.log("Fetched Wikipedia content and images");
    console.log(imageUrls);

    if (!content) {
      return NextResponse.json({
        title: "Article Not Found",
        periods: [],
      });
    }

    const prompt = `
    Given the following Wikipedia article content and available images, create a timeline using the createTimeline function.

    Instructions:
    1. Extract a comprehensive list of key events and dates from the article.
    2. Group events into logical periods.
    3. Ensure all dates are in the correct format (YYYY-MM-DD for specific dates, YYYY-MM for months, YYYY for years).
    4. Provide concise but informative details on each event, 1 to 3 sentences long.
    5. Each period should include between 2 and 8 events.
    6. The timeline should be chronologically ordered.
    7. Use the images available and add them to relevant events.

    Wikipedia article content:
    ${content}

    Available images:
    ${JSON.stringify(imageUrls)}

    Start by thinking of where each image can be used, then create the timeline using the provided function.
    `;

    console.log(content.slice(0, 250));
    console.log(process.env.OPENAI_API_KEY?.slice(25, 50));

    const result = await generateText({
      // model: openai("gpt-4o"),
      model: google("gemini-2.0-flash-exp"),
      prompt: prompt,
      tools: {
        createTimeline: {
          description:
            "Create a timeline from the given Wikipedia article content",
          parameters: timelineSchema,
        },
      },
      toolChoice: "required",
    });

    const timeline = result?.toolCalls?.[0]?.args;
    console.log(JSON.stringify(timeline).slice(0, 2500));

    if (!timeline) throw Error("Bad timeline call");

    // Cache the generated timeline
    await cacheTimeline(slug, timeline);

    return NextResponse.json(timeline);
  } catch (error) {
    console.error("Error generating timeline:", error);
    return NextResponse.json(
      { error: "Failed to generate timeline" },
      { status: 500 }
    );
  }
}
