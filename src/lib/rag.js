import OpenAI from "openai";
import { createClient } from "./supabase/server";
import { generateEmbedding } from "./embedding";

const client =  new OpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY,
});


export async function queryRAG(agentId , query) {
    const supabase = await createClient()

    const embedding = await generateEmbedding(query)

    const { data: matches } = await supabase.rpc(
    "search_knowledge_chunks",
    {
      query_embedding: embedding,
      match_agent_id: agentId,
      match_limit: 5,
    }
  )

    const context = matches?.map((m , i) => `Source ${i + 1}:\n${m.content}`).join("\n\n") || "";

//   get system prompt 
    const {data : agent } = await supabase
        .from("agents")
        .select("system_prompt")
        .eq("id", agentId)
        .single()
    
    const finalPrompt = `
    SYSTEM PROMPT:
    ${agent?.system_prompt}

    You must answer strcitly from the provided knowledge context .
    If answer is not in the context, say:
    "Sorry, I don't have enough information in my knowledge base."

    Knowledge Context:
    ${context}

    User Query:
    ${query}

    `

    const response = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            {
                role: "system",
                content: finalPrompt
            },
            {
                role: "user",
                content: query
            }
        ]
    })

    console.log("OpenAI Response:", response)

    return response?.choices?.[0]?.message?.content 

    

}
