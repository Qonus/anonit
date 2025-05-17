import { getApiUrl } from "@/lib/utils";
import axios from "axios";

export async function POST(request: Request) {
    const body = await request.json();
    try {
        const response = await axios.post(`${getApiUrl()}/analyze`, {text: body.text, language: body.language});
        return new Response(JSON.stringify(response.data), {
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