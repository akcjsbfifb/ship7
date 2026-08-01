import { NextResponse } from "next/server";

import { handleError } from "@/lib/auth/http";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/client";

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => ({}));

		const { user: initialUser } = await requireUser(req);

		const data: { name?: string; role?: "TEACHER" | "STUDENT" } = {};

		if (typeof body.name === "string" && body.name.trim()) {
			data.name = body.name.trim();
		}

		if (body.role === "TEACHER" || body.role === "STUDENT") {
			data.role = body.role;
		}

		const user =
			Object.keys(data).length > 0
				? await prisma.user.update({
						where: { id: initialUser.id },
						data,
					})
				: initialUser;

		return NextResponse.json({ user });
	} catch (error) {
		return handleError(error);
	}
}
