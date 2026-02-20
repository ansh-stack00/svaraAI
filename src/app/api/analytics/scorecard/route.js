import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { OpenAI } from "openai";

const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",

})

const systemPrompt = `
You are an expert call quality analyst. Analyze the following conversation and provide a detailed scorecard. 
Respond ONLY with valid JSON in this exact format:

{
  "quality_score": 8,
  "sentiment": "positive",
  "accuracy_score": 0.9,
  "goal_completed": true,
  "key_topics": ["topic1", "topic2", "topic3"],
  "response_time_avg": 2000
}

Guidelines:
- quality_score: 1-10 based on professionalism, helpfulness, and clarity
- sentiment: "positive", "neutral", or "negative"
- accuracy_score: 0.0-1.0 based on how well agent answered questions
- goal_completed: true if conversation achieved its purpose
- key_topics: 2-5 main topics discussed
- response_time_avg: estimated average response time in milliseconds (1000-3000)

`

export async function POST(request) {

   try {
     const supabase = await createClient();
     const { data: { user } , error: authError } = await supabase.auth.getUser()
     
     if(authError || !user) {
         console.log("Unauthorized access" , authError)
         return NextResponse.json({ error: "Unauthorized" } ,  { status: 401 })
     }
 
     const { call_id } = await request.json()
     if(!call_id){
         console.log("Missing! call id is required" , call_id)
         return NextResponse.json({ error: "Missing! call id is required" } , { status: 400 })
     }
 
     // verify call belong to user 
 
     const { data: calls , erros: callError } = await supabase
         .from('calls')
         .select('id')
         .eq('id' , call_id)
         .eq('user_id' , user.id)
         .single()
     
     if(callError || !calls){
         console.log("Call not found" , callError)
         return NextResponse.json({ error: "Call not found" } , { status: 404 })
     }

    //  fetch transcripts

    const {data: transcripts , error: transcriptError } = await supabase
        .from('transcripts')
        .select('*')
        .eq('call_id' , call_id)
        .eq('user_id' , user.id)
        .order('sequence_number' , { ascending: true })

    if(transcriptError || !transcripts || transcripts.length === 0){
        console.log("Transcript not found  for this call" , transcriptError)
        return NextResponse.json({ error: "Transcript not found" } , { status: 404 })
    }
    
    const conversation = transcripts
      .map(t => `${t.speaker === 'user' ? 'User' : 'Agent'}: ${t.text}`)
      .join('\n')
    
    const response = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: conversation
            }
        ],
        temperature: 0.3,
        max_completion_tokens:500
    })

    const responseText = response.choices[0].message.content

    let scoreCard ;
    try {
        scoreCard = JSON.parse(responseText)
    }
    catch {
        const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
        if(jsonMatch) {
            scoreCard = JSON.parse(jsonMatch[1])

        }
        else {
            const objectMatch = responseText.match(/\{[\s\S]*\}/)
            if(objectMatch) {
                scoreCard = JSON.parse(objectMatch[0])
            }
            else {
                throw new Error('Could not parse scorecard from AI response')
            }
        }
    }

    if (!scoreCard.quality_score || !scoreCard.sentiment) {
        console.log("Invalid scorecard format")
      throw new Error('Invalid scorecard format');
    }

    const { data: analytics, error: analyticsError } = await supabase
      .from('call_analytics')
      .insert({
        call_id,
        quality_score: scoreCard.quality_score,
        sentiment: scoreCard.sentiment,
        accuracy_score: scoreCard.accuracy_score || null,
        goal_completed: scoreCard.goal_completed || null,
        key_topics: scoreCard.key_topics || [],
        response_time_avg: scoreCard.response_time_avg || null,
      })
      .select()
      .single()

    if(analyticsError) {
        console.log("Error inserting analytics" , analyticsError)
        return NextResponse.json({ error: "Error inserting analytics" } , { status: 500 })
    }

    return NextResponse.json({scoreCard : analytics})


   } catch (error) {
        console.log("Error inserting analytics" , error)
        return NextResponse.json({ error: "Error inserting analytics" } , { status: 500 })
   }
}



export async function GET(request) {
    try {

        const supabase = await createClient();
        const { data: { user } , error: authError } = await supabase.auth.getUser()
        
        if(authError || !user) {
            console.log("Unauthorized access" , authError)
            return NextResponse.json({ error: "Unauthorized" } ,  { status: 401 })
        }
    
        const { searchParams } = new URL(request.url)
        const call_id = searchParams.get('call_id')
        if(!call_id){
            console.log("Missing! call id is required" , call_id)
            return NextResponse.json({ error: "Missing! call id is required" } , { status: 400 })
        }

        const { data: scorecard, error } = await supabase
            .from('call_analytics')
            .select(`
                *,
                calls!inner (
                user_id,
                agent_id,
                agents (name)
                )
            `)
            .eq('call_id', call_id)
            .single()
        if(error) {
            console.log("Error fetching scorecard" , error)
            return NextResponse.json({ error: "Error fetching scorecard" } , { status: 500 })
        }

        if (scorecard.calls.user_id !== user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({ scorecard })
        
    } catch (error) {

        console.log("Error fetching scorecard" , error)
        return NextResponse.json({ error: "Error fetching scorecard" } , { status: 500 })
        
    }
}