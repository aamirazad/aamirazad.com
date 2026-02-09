import { NextResponse } from "next/server";

export async function GET() {
	// Your plain text response
	const responseText = `{
    "m.server": "chat.aamirazad.com:443"
}`;

	// Return the response as plain text
	return new NextResponse(responseText, {
		headers: { "Content-Type": "application/json" },
	});
}
