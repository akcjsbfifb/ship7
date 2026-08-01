"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { ClassroomPanel } from "@/components/course/classroom-panel";
import { ChatbotPanel } from "@/components/course/chatbot-panel";
import { StudentsPanel } from "@/components/course/students-panel";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { authFetch } from "@/lib/auth/client-api";
import { Copy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
	user: { id: string; role: "TEACHER" | "STUDENT" };
	owned: Course[];
	enrolled: Course[];
};

export default function CoursePage() {
	const params = useParams<{ id: string }>();
	const courseId = params.id;
	const { firebaseUser, loading } = useAuth();
	const router = useRouter();
	const [course, setCourse] = useState<Course | null>(null);
	const [isTeacher, setIsTeacher] = useState(false);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [rotating, setRotating] = useState(false);

	const load = useCallback(async () => {
		try {
			setLoadError(null);
			const res = await authFetch("/api/me");
			const data: MeResponse = await res.json();
			if (!res.ok) throw new Error((data as { error?: string }).error || "Failed");

			const owned = data.owned.find((c) => c.id === courseId);
			const enrolled = data.enrolled.find((c) => c.id === courseId);
			const found = owned ?? enrolled;
			if (!found) {
				toast.error("Curso no encontrado o sin acceso");
				router.replace("/dashboard");
				return;
			}
			setCourse(found);
			setIsTeacher(Boolean(owned));
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to load course";
			setLoadError(msg);
			toast.error(msg);
		}
	}, [courseId, router]);

	useEffect(() => {
		if (loading) return;
		if (!firebaseUser) {
			router.replace("/login");
			return;
		}
		void load();
	}, [firebaseUser, loading, load, router]);

	const copyInvite = async () => {
		if (!course) return;
		await navigator.clipboard.writeText(course.inviteCode);
		toast.success("Código copiado");
	};

	const rotateInvite = async () => {
		if (!course) return;
		setRotating(true);
		try {
			const res = await authFetch(`/api/courses/${course.id}/rotate-invite`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to rotate");
			setCourse(data.course);
			toast.success("Código rotado");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Rotate failed");
		} finally {
			setRotating(false);
		}
	};

	if (loading || (!course && !loadError)) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-1 flex items-center justify-center text-muted-foreground">
					Cargando…
				</main>
			</div>
		);
	}

	if (loadError && !course) {
		return (
			<div className="min-h-screen flex flex-col">
				<Navbar />
				<main className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
					<p className="text-muted-foreground text-center">{loadError}</p>
					<div className="flex gap-2">
						<Button variant="outline" asChild>
							<Link href="/dashboard">Volver</Link>
						</Button>
						<Button onClick={() => void load()}>Reintentar</Button>
					</div>
				</main>
			</div>
		);
	}

	if (!course) return null;

	const defaultTab = isTeacher ? "material" : "chat";

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
				<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
					<div>
						<Link
							href="/dashboard"
							className="text-sm text-muted-foreground hover:text-foreground"
						>
							← Cursos
						</Link>
						<h1 className="text-3xl font-bold tracking-tight mt-2">{course.title}</h1>
						{course.description && (
							<p className="text-muted-foreground mt-1">{course.description}</p>
						)}
					</div>
					{isTeacher && (
						<Card className="p-4 space-y-2 min-w-[240px]">
							<div className="text-xs text-muted-foreground uppercase tracking-wide">
								Código para alumnos
							</div>
							<code className="text-lg font-mono block">{course.inviteCode}</code>
							<div className="flex gap-2">
								<Button size="sm" variant="outline" onClick={copyInvite}>
									<Copy className="h-3.5 w-3.5" />
									Copiar
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={rotateInvite}
									disabled={rotating}
								>
									<RefreshCw className="h-3.5 w-3.5" />
									Rotar
								</Button>
							</div>
						</Card>
					)}
				</div>

				<Tabs defaultValue={defaultTab} className="space-y-4">
					<TabsList
						className={`grid w-full p-1 ${isTeacher ? "grid-cols-3" : "grid-cols-2"}`}
					>
						{isTeacher && (
							<TabsTrigger value="students">Alumnos</TabsTrigger>
						)}
						<TabsTrigger value="material">Material</TabsTrigger>
						<TabsTrigger value="chat">Chatbot</TabsTrigger>
					</TabsList>

					{isTeacher && (
						<TabsContent value="students" className="mt-0">
							<StudentsPanel courseId={course.id} />
						</TabsContent>
					)}
					<TabsContent value="material" className="mt-0">
						<ClassroomPanel courseId={course.id} isTeacher={isTeacher} />
					</TabsContent>
					<TabsContent value="chat" className="mt-0">
						<ChatbotPanel courseId={course.id} isTeacher={isTeacher} />
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
