import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function chunkText(text , metadata={}) {

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 700,
        chunkOverlap: 200,
    })

    const docs = await splitter.createDocuments([text], [metadata]);
    return docs

}