import axios from "axios";

export async function POST(request: Request) {
    const body = await request.json();
    // console.log(body)
    try {
        const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            contents: body.contents,
        });
        // console.log(response.data.candidates[0].content);
        return new Response(JSON.stringify(response.data.candidates[0].content.parts[0].text), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    } catch (e) {
        console.log(e);
        return new Response(JSON.stringify({
            error: "Internal server error",
            details: e instanceof Error ? e.message : String(e)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}