import { createClient } from "@supabase/supabase-js";

export default async function Home() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, anon);

  const { data, error } = await supabase
    .from("raw_items")
    .select("title,url,published_at,excerpt, sources(name,region,language)")
    .order("published_at", { ascending: false })
    .limit(30);

  return (
    <main style= padding: 24, maxWidth: 900, margin: "0 auto" >
      <h1>Trend Radar</h1>
      <p>
        This page shows the latest ingested items. To ingest RSS, call:
        <code> /api/ingest/rss </code>
      </p>

      {error && (
        <pre style= background: "#111", color: "#fff", padding: 12, overflowX: "auto" >
          {JSON.stringify(error, null, 2)}
        </pre>
      )}

      <ul style= paddingLeft: 18 >
        {data?.map((x: any, idx: number) => (
          <li key={idx} style= marginBottom: 10 >
            <a href={x.url} target="_blank" rel="noreferrer">{x.title}</a>
            <div style= fontSize: 12, opacity: 0.7 >
              {x.sources?.name} · {x.sources?.region} · {x.sources?.language} ·{" "}
              {x.published_at ? new Date(x.published_at).toLocaleString() : "no date"}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
