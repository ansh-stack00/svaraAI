import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_, context) {
  try {
    const supabase = await createClient();
  
    const {
      data: { user },
    } = await supabase.auth.getUser();
  
    if (!user) {
      console.log("Unauthorized access");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const { id } = await context.params;
  
    if (!id) {
      console.log("Missing call id", id);
      return NextResponse.json({ error: "Missing call id" }, { status: 400 });
    }
  
    const {data:transcripts , error:transcriptError } = await supabase
            .from("transcripts")
            .select('*')
            .eq("call_id" , id)
            .eq("user_id" , user.id)
            .order("sequence_number" , { ascending: true })

        console.log(transcripts[0])
  
      if (transcriptError || !transcripts) {
          console.log("No transcripts found");
          return NextResponse.json({ error: "No transcripts found" }, { status: 404 });
        }
      
  
    const fontPath = path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf");
    const fontBuffer = fs.readFileSync(fontPath); 

    const doc = new PDFDocument({ font: fontBuffer });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
  
    doc.fontSize(18).text("Call Transcript", { align: "center" });
    doc.moveDown();
  
    transcripts.forEach((t) => {
      const speaker = t.speaker === "user" ? "You" : "Agent";
      doc.fontSize(12).text(`${speaker}: ${t.text}`);
      doc.moveDown();
    });
  
    doc.end();
  
    return new Promise((resolve) => {
      doc.on("end", () => {
        resolve(
          new Response(Buffer.concat(chunks), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="transcript-${id}.pdf"`,
            },
          })
        );
      });
    });
  } catch (error) {
     console.error("PDF generation error:", error);
     return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )

  }
}
