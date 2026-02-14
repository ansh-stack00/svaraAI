export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/chunking";
import { crawlWebsite } from "@/lib/urlScraper";
import { extractTextFromPDF } from "@/lib/pdf_parser";
import { generateEmbedding } from "@/lib/embedding";

export async function POST(request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();

  const agent_id = formData.get("agent_id");
  const name = formData.get("name");
  const type = formData.get("type");

  let fullText = "";
  let metadata = {};

  if (type === "url") {
    const url = formData.get("url");
    const pages = await crawlWebsite(url);
    fullText = pages.map((page) => page.content).join("\n");
    metadata.url = url;
  }

  if (type === "pdf") {
    const file = formData.get("file");

    if (!file) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const pages = await extractTextFromPDF(buffer);
    fullText = pages.map((page) => page.text).join("\n");
    metadata.total_pages = pages.length;
}

  if (type === "text") {
    fullText = formData.get("content");
  }

  const { data: source, error } = await supabase
    .from("knowledge_sources")
    .insert({
      agent_id,
      user_id: user.id,
      type,
      name,
      metadata,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const docs = await chunkText(fullText, { source_id: source.id });

  for (const doc of docs) {
    const embedding = await generateEmbedding(doc.pageContent);

    await supabase.from("knowledge_chunks").insert({
      source_id: source.id,
      agent_id,
      content: doc.pageContent,
      metadata: doc.metadata,
      token_count: Math.ceil(doc.pageContent.length / 4),
      embedding,
    });
  }

  return NextResponse.json({ success: true });
}

export async function GET(request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const agent_id = searchParams.get("agent_id");

  if (!agent_id) {
    return NextResponse.json({ error: "agent_id required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("knowledge_sources")
    .select("*")
    .eq("agent_id", agent_id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sources: data });
}


