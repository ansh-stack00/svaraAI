import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";


// api to get agent by id 
export async function GET(request, context) {
    try {
        const supabase = await createClient();

        const { data: {user} } = await supabase.auth.getUser()
        if( !user){
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params
        if(!id){
            return NextResponse.json({ error: "Missing agent id" }, { status: 400 });
        }

        const { data: agent, error } = await supabase
            .from("agents")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single()
        
        if (error || !agent) {
            return NextResponse.json({ error: "Agent not found" }, { status: 404 });
        }

        return NextResponse.json({ agent });

        
    } catch (error) {
        console.error("Error fetching agent by id :", error);
        return NextResponse.json({ error: "An error occurred while fetching agent" }, { status: 500 });
    }
}

// api to update agent 

export async function PUT(request , context){
    try{

        const supabase = await createClient()

        const { data: {user}}= await supabase.auth.getUser()
        if(!user){
            return NextResponse.json(
                { 
                    error: "Unauthorized" 
                }, 
                { 
                    status: 401 
                }
            )
        }

        const { id } = context.params
        if(!id){
            return NextResponse.json({ error: "Missing agent id" }, { status: 400 });
        }

        const body = await request.json()
        const { name , system_prompt , voice_id } = body
        // if(!name || !system_prompt || !voice_id){
        //     return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        // }

        const { data: agent, error } = await supabase
            .from("agents")
            .update({
                name,
                system_prompt,
                voice_id
            })
            .eq("id", id)
            .eq("user_id", user.id)
            .select()
            .single()

        if(error || !agent){
            return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
        }

        return NextResponse.json({ agent });


    }
    catch (error) {
        console.error("Error updating agent:", error);
        return NextResponse.json({ error: "An error occurred while updating agent" }, { status: 500 });
    }
}

// api to delete agent 

export async function DELETE( _ , context){
    try {

        const supabase = await createClient()
        const { data: {user}}= await supabase.auth.getUser()

        if(!user){
            return NextResponse.json({ error: "Unauthorized"} , { status: 401 })
        }

        const { id } = await context.params;
        if(!id){
            return NextResponse.json({ error: "Missing agent id" }, { status: 400 });
        }

        const { data: agent, error } = await supabase
            .from("agents")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)
            

        // if(error || !agent){
        //     return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
        // }

        return NextResponse.json({ success: true });

        
    } catch (error) {
        console.error("Error deleting agent:", error);
        return NextResponse.json({ error: "An error occurred while deleting agent" }, { status: 500 });
    }
}