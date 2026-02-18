import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";



export async function GET(request) {
    try{

        const supabase = await createClient();

        const { data : { user } , error:authError } = await supabase.auth.getUser();
        if(authError || !user) {
            console.log("Unauthorized access" , authError)
            return NextResponse.json({ error: "Unauthorized" } ,  { status: 401 })
        }

        console.log("User ID:", user.id)

        const { searchParams } = new URL(request.url)
        const agentId = searchParams.get("agent_id")
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        if(!agentId){
            console.log("Missing sagent Id ", agentId)
            return NextResponse.json({ error: "Missing agent id" } , { status: 400 })
        }


        const { data: calls, error } = await  supabase
        .from('calls')
        .select(`*`)
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1)

        
        console.log("User ID:", user.id);
        console.log("Agent ID:", agentId);
        console.log("Calls:", calls);
        console.log("Error:", error);

        if(error ){
            console.log("Failed to fetch calls" , error)
            return NextResponse.json({ error: "Failed to fetch calls" } , { status: 500 })
        }


        return NextResponse.json({ 
            calls: calls || [],
            total: calls?.length || 0,
        })

        
    }
    catch(error){
        console.log("Error fetching calls" , error)
        return NextResponse.json({ error: "Failed to fetch calls" } , { status: 500 })
    }
}