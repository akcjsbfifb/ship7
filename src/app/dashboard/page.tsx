"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/client-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Course = {
	id: string;
	title: string;
	description: string | null;
	inviteCode: string;
	teacherId: string;
};

type MeResponse = {
	user: {
		id: string;
		email: string;
		name: string | null;
		role: "TEACHER" | "STUDENT";
	};
	owned: Course[];
	enrolled: Course[];
};

export default function DashboardPage() {
	const { firebaseUser, loading } = useAuth();
	const router = useRouter();
	const [me, setMe] = useState<MeResponse | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [inviteCode, setInviteCode] = useState("");
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await authFetch("/api/me");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to load");
			setMe(data);
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : "Failed to load profile");
		}
	}, []);

	useEffect(() => {
		if (loading) return;
		if (!firebaseUser) {
			router.replace("/login");
			return;
		}
		void load();
	}, [firebaseUser, loading, load, router]);

	const createCourse = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		try {
			const res = await authFetch("/api/courses", {
				method: "POST",
				body: JSON.stringify({ title, description: description || undefined }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to create course");
			toast.success("Course created");
			setTitle("");
			setDescription("");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Create failed");
		} finally {
			setBusy(false);
		}
	};

	const joinCourse = async (e: React.FormEvent) => {
		e.preventDefault();
		setBusy(true);
		try {
			const res = await authFetch("/api/courses/join", {
				method: "POST",
				body: JSON.stringify({ inviteCode: inviteCode.trim() }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to join");
			toast.success(`Joined ${data.course?.title ?? "course"}`);
			setInviteCode("");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Join failed");
		} finally {
			setBusy(false);
		}
	};

	if (loading || !me) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-1 flex items-center justify-center text-muted-foreground">
					Loading…
				</main>
			</div>
		);
	}

	const isTeacher = me.user.role === "TEACHER";
	const courses = isTeacher ? me.owned : me.enrolled;

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight font-mono">Dashboard</h1>
					<p className="text-muted-foreground mt-1">
						{me.user.name || me.user.email} · {me.user.role.toLowerCase()}
					</p>
				</div>

				{isTeacher ? (
					<Card>
						<CardHeader>
							<CardTitle>Create course</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={createCourse} className="space-y-3">
								<Input
									placeholder="Course title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									required
								/>
								<Textarea
									placeholder="Description (optional)"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
								<Button type="submit" disabled={busy}>
									Create
								</Button>
							</form>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardHeader>
							<CardTitle>Join with invite code</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={joinCourse} className="flex flex-col sm:flex-row gap-2">
								<Input
									placeholder="Invite code"
									value={inviteCode}
									onChange={(e) => setInviteCode(e.target.value)}
									required
								/>
								<Button type="submit" disabled={busy}>
									Join
								</Button>
							</form>
						</CardContent>
					</Card>
				)}

				<section className="space-y-3">
					<h2 className="text-xl font-semibold">Your courses</h2>
					{courses.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							{isTeacher
								? "No courses yet — create one above."
								: "No enrollments yet — join with a code."}
						</p>
					) : (
						<div className="grid gap-3">
							{courses.map((course) => (
								<Link key={course.id} href={`/courses/${course.id}`}>
									<Card className="hover:border-primary/50 transition-colors">
										<CardContent className="py-4 flex items-center justify-between gap-4">
											<div>
												<div className="font-medium">{course.title}</div>
												{course.description && (
													<div className="text-sm text-muted-foreground line-clamp-1">
														{course.description}
													</div>
												)}
											</div>
											{isTeacher && (
												<code className="text-xs bg-muted px-2 py-1 rounded shrink-0">
													{course.inviteCode}
												</code>
											)}
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					)}
				</section>
			</main>
		</div>
	);
}
