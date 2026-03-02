import OpenAI from "openai";
import { createClient } from "./supabase/server";
import { generateEmbedding } from "./embedding";

const client = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function queryRAG(agentId, conversationId, query) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    agent_id: agentId,
    user_id: user.id,
    role: "user",
    content: query,
  });


  const embedding = await generateEmbedding(query);

 
  const { data: matches } = await supabase.rpc(
    "search_knowledge_chunks",
    {
      query_embedding: embedding,
      match_agent_id: agentId,
      match_limit: 5,
    }
  );

  const context =
    matches?.map((m, i) => `Source ${i + 1}:\n${m.content}`).join("\n\n") ||
    "";

  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("system_prompt")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (agentError || !agent) {
    throw new Error("Agent not found or unauthorized");
  }


  const { data: history } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(10);

  const systemPrompt = `
${agent.system_prompt}

You must answer strictly from the provided knowledge context.
If the answer is not in the context, say:
"Sorry, I don't have enough information in my knowledge base."

Knowledge Context:
${context}
`;

  // Remove the last user message from history (since we just inserted it)
  const previousMessages =
    history?.slice(0, -1).map((m) => ({
      role: m.role,
      content: m.content,
    })) || [];

  const response = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      ...previousMessages,
      { role: "user", content: query },
    ],
  });

  const assistantReply = response?.choices?.[0]?.message?.content;

  // ✅ 8. Save assistant response
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    agent_id: agentId,
    user_id: user.id,
    role: "assistant",
    content: assistantReply,
  });

  return assistantReply;
}