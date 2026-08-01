"use client";

import { Bot, Copy, GraduationCap, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authFetch } from "@/lib/auth/client-api";
import type { CourseSummary } from "@/lib/types";

export function StreamPage({
	course,
	isTeacher,
	studentCount,
	onCourseUpdate,
}: {
	course: CourseSummary;
	isTeacher: boolean;
	studentCount?: number;
	onCourseUpdate?: (course: CourseSummary) => void;
}) {
	const copyInvite = async () => {
		await navigator.clipboard.writeText(course.inviteCode);
		toast.success("Código copiado");
	};

	const rotateInvite = async () => {
		try {
			const res = await authFetch(`/api/courses/${course.id}/rotate-invite`, {
				method: "POST",
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "No se pudo rotar");
			onCourseUpdate?.(data.course);
			toast.success("Código rotado");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		}
	};

	return (
		<div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 md:px-6">
			<div className="overflow-hidden rounded-2xl border border-border bg-card">
				<div className="flex items-end justify-between gap-4 border-b border-brand/30 bg-brand/10 px-6 py-8">
					<div>
						<h1 className="text-pretty text-2xl font-semibold text-foreground md:text-3xl">
							{course.title}
						</h1>
						{course.description && (
							<p className="mt-1 text-sm text-muted-foreground">
								{course.description}
							</p>
						)}
					</div>
					<span className="hidden size-14 shrink-0 items-center justify-center rounded-xl border border-brand/40 bg-background text-brand sm:flex">
						<GraduationCap className="size-7" />
					</span>
				</div>
				<div className="flex flex-wrap items-center gap-4 px-6 py-3 text-sm text-muted-foreground">
					{typeof studentCount === "number" && (
						<>
							<span className="inline-flex items-center gap-1.5">
								<Users className="size-4" />
								{studentCount} estudiantes
							</span>
							<Separator orientation="vertical" className="h-4" />
						</>
					)}
					<span className="inline-flex items-center gap-1.5">
						<Bot className="size-4 text-brand" />
						Tutor con RAG del curso
					</span>
				</div>
			</div>

			{isTeacher ? (
				<div className="rounded-xl border border-border bg-card p-5">
					<p className="text-xs uppercase tracking-wide text-muted-foreground">
						Código para alumnos
					</p>
					<code className="mt-2 block font-mono text-2xl tracking-[0.18em]">
						{course.inviteCode}
					</code>
					<p className="mt-2 text-sm text-muted-foreground">
						Compartilo para que tus estudiantes se unan y usen el asistente IA
						con el material indexado.
					</p>
					<div className="mt-4 flex gap-2">
						<Button variant="outline" onClick={() => void copyInvite()}>
							<Copy className="size-4" />
							Copiar código
						</Button>
						<Button variant="ghost" onClick={() => void rotateInvite()}>
							<RefreshCw className="size-4" />
							Rotar
						</Button>
					</div>
				</div>
			) : (
				<div className="rounded-xl border border-brand/30 bg-brand/5 p-5">
					<p className="text-sm leading-relaxed text-muted-foreground">
						Explorá el material en{" "}
						<span className="font-medium text-foreground">Trabajo en clase</span>{" "}
						o preguntale al{" "}
						<span className="font-medium text-foreground">Asistente IA</span>{" "}
						sobre el contenido indexado del curso.
					</p>
				</div>
			)}
		</div>
	);
}
