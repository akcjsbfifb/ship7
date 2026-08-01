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
	};
	owned: Course[];
	enrolled: Course[];
};

function CourseList({
	courses,
	empty,
	kind,
}: {
	courses: Course[];
	empty: string;
	kind: "owned" | "enrolled";
}) {
	if (courses.length === 0) {
		return <p className="text-muted-foreground text-sm">{empty}</p>;
	}

	return (
		<div className="grid gap-3">
			{courses.map((course) => (
				<Link key={course.id} href={`/courses/${course.id}`}>
					<Card className="hover:border-primary/50 transition-colors">
						<CardContent className="py-4 flex items-center justify-between gap-4">
							<div>
								<div className="font-medium">{course.title}</div>
								<div className="text-sm text-muted-foreground">
									{kind === "owned"
										? "Sos el profesor · Material + Tutor"
										: "Inscripto como alumno · Tutor"}
									{course.description ? ` · ${course.description}` : ""}
								</div>
							</div>
							{kind === "owned" && (
								<code className="text-xs bg-muted px-2 py-1 rounded shrink-0">
									{course.inviteCode}
								</code>
							)}
						</CardContent>
					</Card>
				</Link>
			))}
		</div>
	);
}

export default function DashboardPage() {
	const { firebaseUser, loading } = useAuth();
	const router = useRouter();
	const [me, setMe] = useState<MeResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [inviteCode, setInviteCode] = useState("");
	const [busy, setBusy] = useState(false);

	const load = useCallback(async () => {
		try {
			setError(null);
			const res = await authFetch("/api/me");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to load");
			setMe(data);
		} catch (err) {
			console.error(err);
			const msg = err instanceof Error ? err.message : "Failed to load profile";
			setError(msg);
			toast.error(msg);
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
			toast.success("Curso creado");
			router.push(`/courses/${data.course.id}`);
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
			toast.success(`Te uniste a ${data.course?.title ?? "el curso"}`);
			router.push(`/courses/${data.course.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Join failed");
		} finally {
			setBusy(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-1 flex items-center justify-center text-muted-foreground">
					Cargando…
				</main>
			</div>
		);
	}

	if (error && !me) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
					<p className="text-muted-foreground text-center">{error}</p>
					<Button onClick={() => void load()}>Reintentar</Button>
				</main>
			</div>
		);
	}

	if (!me) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-1 flex items-center justify-center text-muted-foreground">
					Cargando…
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10 space-y-8">
				<div>
					<h1 className="text-3xl font-bold tracking-tight font-mono">Cursos</h1>
					<p className="text-muted-foreground mt-1">
						{me.user.name || me.user.email}
					</p>
				</div>

				<div className="grid gap-4 sm:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Crear curso</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-3">
								Al crearlo sos automáticamente el profesor de ese curso.
							</p>
							<form onSubmit={createCourse} className="space-y-3">
								<Input
									placeholder="Título del curso"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									required
								/>
								<Textarea
									placeholder="Descripción (opcional)"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
								/>
								<Button type="submit" disabled={busy}>
									Crear y abrir
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Unirse con código</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground mb-3">
								Pedile el código de invitación al profesor del curso.
							</p>
							<form onSubmit={joinCourse} className="flex flex-col gap-2">
								<Input
									placeholder="Código de invitación"
									value={inviteCode}
									onChange={(e) => setInviteCode(e.target.value)}
									required
								/>
								<Button type="submit" disabled={busy}>
									Unirme como alumno
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>

				<section className="space-y-3">
					<h2 className="text-xl font-semibold">Donde soy profesor</h2>
					<CourseList
						courses={me.owned}
						kind="owned"
						empty="Todavía no creaste cursos. Creá uno arriba."
					/>
				</section>

				<section className="space-y-3">
					<h2 className="text-xl font-semibold">Donde soy alumno</h2>
					<CourseList
						courses={me.enrolled}
						kind="enrolled"
						empty="Todavía no estás inscripto en ningún curso. Unite con un código."
					/>
				</section>
			</main>
		</div>
	);
}
