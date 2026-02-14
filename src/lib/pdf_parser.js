import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer) {

    const data = await pdf(buffer)
    const pages = data.text.split('\f');

    pages.map((page , index) => ({
        pageNumber: index + 1,
        text: page.trim()
    }))
}