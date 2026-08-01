import { NextResponse } from "next/server";

import { AuthError } from "@/lib/auth/errors";
import { handleError } from "@/lib/auth/http";
import { requireCourseAccess } from "@/lib/auth/require-course-access";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/db/client";

type RouteContext = { params: Promise<{ id: string }> };

/** List my conversations in this course. */
export async function GET(req: Request, context: RouteContext) {
	try {
		const { user } = await requireUser(req);
		const { id: courseId } = await context.params;
		await requireCourseAccess(user, courseId);

		const threads = await prisma.chatThread.findMany({
			where: { courseId, userId: user.id },
			orderBy: { updatedAt: "desc" },
			include: {
				messages: {
					orderBy: { createdAt: "asc" },
					take: 1,
					where: { role: "user" },
				},
				_count: { select: { messages: true } },
			},
		});

		return NextResponse.json({
			threads: threads.map((t) => ({
				id: t.id,
				title:
					t.title ||
					t.messages[0]?.content?.slice(0, 60) ||
					"Nueva conversación",
				createdAt: t.createdAt,
				updatedAt: t.updatedAt,
				messageCount: t._count.messages,
				preview: t.messages[0]?.content?.slice(0, 80) ?? null,
			})),
		});
	} catch (error) {
		return handleError(error);
	}
}

/** Create a fresh conversation. */
export async function POST(req: Request, context: RouteContext) {
	try {
		const { user } = await requireUser(req);
		const { id: courseId } = await context.params;
		await requireCourseAccess(user, courseId);

		const body = await req.json().catch(() => ({}));
		const title =
			typeof body.title === "string" && body.title.trim()
				? body.title.trim().slice(0, 120)
				: null;

		// Reuse an existing empty conversation instead of accumulating duplicates
		// (e.g. double mount in dev or repeated clicks on "Nueva").
		if (!title) {
			const existing = await prisma.chatThread.findFirst({
				where: {
					courseId,
					userId: user.id,
					title: null,
					messages: { none: {} },
				},
				orderBy: { createdAt: "desc" },
			});
			if (existing) {
				return NextResponse.json({
					thread: {
						id: existing.id,
						title: "Nueva conversación",
						createdAt: existing.createdAt,
						updatedAt: existing.updatedAt,
						messageCount: 0,
						preview: null,
					},
				});
			}
		}

		const thread = await prisma.chatThread.create({
			data: { courseId, userId: user.id, title },
		});

		return NextResponse.json({
			thread: {
				id: thread.id,
				title: thread.title || "Nueva conversación",
				createdAt: thread.createdAt,
				updatedAt: thread.updatedAt,
				messageCount: 0,
				preview: null,
			},
		});
	} catch (error) {
		return handleError(error);
	}
}

/** Delete one of my conversations. */
export async function DELETE(req: Request, context: RouteContext) {
	try {
		const { user } = await requireUser(req);
		const { id: courseId } = await context.params;
		await requireCourseAccess(user, courseId);

		const url = new URL(req.url);
		const threadId = url.searchParams.get("threadId");
		if (!threadId) throw new AuthError("threadId is required", 400);

		const thread = await prisma.chatThread.findFirst({
			where: { id: threadId, courseId, userId: user.id },
		});
		if (!thread) throw new AuthError("Thread not found", 404);

		await prisma.chatThread.delete({ where: { id: thread.id } });
		return NextResponse.json({ ok: true });
	} catch (error) {
		return handleError(error);
	}
}
