"use client";

import { auth } from "@/lib/firebase/client";

export async function getIdToken(): Promise<string | null> {
	const user = auth.currentUser;
	if (!user) return null;
	return user.getIdToken();
}

export async function authFetch(
	input: RequestInfo | URL,
	init: RequestInit = {},
): Promise<Response> {
	const token = await getIdToken();
	if (!token) {
		throw new Error("Not authenticated");
	}

	const headers = new Headers(init.headers);
	headers.set("Authorization", `Bearer ${token}`);
	if (init.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	return fetch(input, { ...init, headers });
}
