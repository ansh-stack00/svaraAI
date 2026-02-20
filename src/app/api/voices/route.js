import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
    try {

        const apiKey = process.env.ELEVENLABS_API_KEY;
        if(apiKey ) console.log("found key")

        if(!apiKey){
            return NextResponse.json({ error: "API key not found" }, { status: 500 });
        }

        const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
            headers: {
                "xi-api-key": apiKey
            }
        })

        if(response.status !== 200){
            return NextResponse.json({ error: "Failed to fetch voices" }, { status: response.status });
        }

        const data = response.data.voices
        // console.log(data)

        const voices = data.map(voice => ({
            id: voice.voice_id,
            name: voice.name,
            preview_url: voice.preview_url,
            category: voice.category
        }))
        return NextResponse.json({voices});
        


        
    } catch (error) {
        console.error("Error fetching voices:", error);
        return NextResponse.json({ error: "An error occurred while fetching voices" }, { status: 500 });
    }
}