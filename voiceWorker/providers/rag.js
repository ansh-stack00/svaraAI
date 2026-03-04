const { createClient } = require('@supabase/supabase-js')
const{ generateEmbedding } = require('./embedding')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function buildRAGPrompt(agent, userQuery) {
  
  const embedding = await generateEmbedding(userQuery)

  const { data: matches, error } = await supabase.rpc(
    "search_knowledge_chunks",
    {
      query_embedding: embedding,
      match_agent_id: agent.id,
      match_limit: 5,
    }
  )

  if (error) {
    console.error("RAG search error:", error)
  }

  const context =
    matches?.map(
      (m, i) => `Source ${i + 1}:\n${m.content}`
    ).join("\n\n") || ""

  
  const finalPrompt = `
SYSTEM PROMPT:
${agent?.system_prompt || ""}

You must answer strictly from the provided knowledge context.
If answer is not in the context, say:
"Sorry, I don't have enough information in my knowledge base."

Knowledge Context:
${context}
`

  return finalPrompt
}

module.exports = { buildRAGPrompt }