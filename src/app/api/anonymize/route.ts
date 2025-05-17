import { anonymizeText } from "../actions";

export async function POST(request: Request) {
    const body = await request.json();
    try {
        const response = await anonymizeText(body.text);
        return new Response(JSON.stringify(response), {
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