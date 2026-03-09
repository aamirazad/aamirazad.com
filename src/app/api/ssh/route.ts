import { NextResponse } from "next/server";

export async function GET() {
	const responseText = `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJdKj2BKOoQ6cTHpC0wVxF24HgbXqLAScRUnweuiEnDf aamirmazad@gmail.com`;

	// Return the response as plain text
	return new NextResponse(responseText, {
		headers: { "Content-Type": "text/plain" },
	});
}
