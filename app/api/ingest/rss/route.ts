import Parser from "rss-parser";
import { supabaseServer } from "@/lib/supabaseServer";

export const runtime = "nodejs";

function hashExternalId(item: any) {
  return item.guid || item.id || item.link || `${item.title}-${item.pubDate || item.isoDate || ""}`;
}

export async function GET() {
  const supabase = supabaseServer();
  const parser = new Parser();

  const { data: feeds, error: feedsErr } = await supabase
    .from("sources")
    .select("id,rss_url,region,language,name")
    .eq("enabled", true);

  if (feedsErr) {
    return Response.json({ ok: false, error: feedsErr }, { status: 500 });
  }

  let inserted = 0;
  let scanned = 0;

  for (const feed of feeds || []) {
    try {
      const parsed = await parser.parseURL(feed.rss_url);
      for (const item of parsed.items || []) {
        scanned += 1;
        const external_id = String(hashExternalId(item));
        const title = String(item.title || "").trim();
        const url = String(item.link || "").trim();
        if (!title || !url) continue;

        const published_at = item.isoDate || item.pubDate || null;
        const excerpt = (item.contentSnippet || item.summary || "").toString().slice(0, 500);

        const { error: upErr } = await supabase.from("raw_items").upsert(
          {
            source_id: feed.id,
            external_id,
            title,
            url,
            published_at,
            excerpt
          },
          { onConflict: "source_id,external_id" }
        );

        if (!upErr) inserted += 1;
      }
    } catch (e: any) {
      // continue; keep ingesting other feeds
    }
  }

  return Response.json({ ok: true, feeds: feeds?.length || 0, scanned, inserted });
}
