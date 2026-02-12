import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


// api to fetch agents created by the logged in user
export async function GET() {
    try {
        const supabase = createClient()

        // fetching logged in user details from supabase 
        const { data: {user} , error: authError} = await supabase.auth.getUser()

        if(authError || !user){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // fetchin agents created by the logged in user

        const { data: agents, error } = await supabase
            .from("agents")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

            if(error){
                return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
            }

            return NextResponse.json({ agents });


        
    } catch (error) {
        console.error("Error fetching agents:", error);
        return NextResponse.json({ error: "An error occurred while fetching agents" }, { status: 500 });
    }
}


// api to create a new agent

export async function POST(request) {

    try {
        const supabase = createClient()

        const { data: {user} , error: authError} = await supabase.auth.getUser()
        if(authError || !user){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json()

        const { name, system_prompt, voice_id } = body
        if(!name || !system_prompt || !voice_id){
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const { data: agent, error } = await supabase
            .from("agents")
            .insert(
                {
                    user_id: user.id,
                    name,
                    system_prompt,
                    voice_id
                }
            )
            .select()
            .single()

            if(error){
                return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
            }

    } catch (error) {
        console.error("Error creating agent:", error);
        return NextResponse.json({ error: "An error occurred while creating agent" }, { status: 500 });
    }
}