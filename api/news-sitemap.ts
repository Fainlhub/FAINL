import type { IncomingMessage, ServerResponse } from "node:http";
import { buildNewsSitemap } from "../server/newsDiscovery.js";
import { fetchPublishedNews } from "./_newsData.js";

export default async function handler(_request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const posts = await fetchPublishedNews({ limit: 50_000 });
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/xml; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=900, stale-while-revalidate=1800");
    response.end(buildNewsSitemap(posts));
  } catch {
    response.statusCode = 503;
    response.setHeader("Content-Type", "application/xml; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end(buildNewsSitemap([]));
  }
}
