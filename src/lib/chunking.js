import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { NextResponse } from "next/server";
export async function chunkText(text , metadata={}) {
    if(!text || text.trim().length === 0) {
        console.log("text is empty inside pdf ")
        return []
    }

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 700,
        chunkOverlap: 200,
    })

    const docs = await splitter.createDocuments([text], [metadata]);
    console.log("chunked docs", docs.length)
        if (!docs.length) {
        console.log("No chunks created");
        return NextResponse.json({
            success: true,
            warning: "No chunks generated from document",
        });
    }

    return docs

}