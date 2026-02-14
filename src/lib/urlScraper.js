import axios from "axios";
import * as cheerio from "cheerio";
import { URL } from "url";

export async function crawlWebsite(startUrl, options = {}) {
  const {
    maxDepth = 2,
    maxPages = 20,
  } = options;

  const visited = new Set();
  const results = [];

  const baseDomain = new URL(startUrl).origin;

  async function crawl(url, depth) {
    if (
      depth > maxDepth ||
      visited.has(url) ||
      visited.size >= maxPages
    ) {
      return;
    }

    try {
      visited.add(url);

      const { data } = await axios.get(url, {
        timeout: 10000,
      });

      const $ = cheerio.load(data);

      // Remove unnecessary elements
      $("script, style, nav, footer, header").remove();

      const text = $("main").text() || $("article").text() || $("body").text();

      results.push({
        url,
        title: $("title").text(),
        content: text.replace(/\s+/g, " ").trim(),
      });

      // Extracting internal links
      $("a[href]").each((_, element) => {
        const href = $(element).attr("href");

        if (!href) return;

        try {
          const absoluteUrl = new URL(href, url).href;

          if (
            absoluteUrl.startsWith(baseDomain) &&
            !absoluteUrl.includes("#")
          ) {
            crawl(absoluteUrl, depth + 1);
          }
        } catch {
          // Ignore invalid URLs
        }
      });

    } catch (err) {
      console.log("Skipping:", url);
    }
  }

  await crawl(startUrl, 0);

  return results;
}
