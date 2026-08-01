import { GraduationCap, KeyRound, Sparkles } from "lucide-react";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

export default function Home() {
	return (
		<div className="relative min-h-dvh overflow-hidden bg-background">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(var(--brand)/0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_hsl(var(--brand)/0.08),_transparent_40%)]"
			/>
			<Navbar />
			<main className="relative mx-auto flex max-w-5xl flex-col gap-12 px-4 py-16 md:py-24">
				<section className="max-w-2xl space-y-6">
					<div className="inline-flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-1.5 text-sm text-brand-foreground">
						<GraduationCap className="size-4 text-brand" />
						EducAI
					</div>
					<h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
						Clases con un tutor IA entrenado en tu material
					</h1>
					<p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
						Creá cursos, subí apuntes y bibliografía, y dejá que el asistente
						responda con contexto del curso. Los alumnos se unen con un código.
					</p>
					<div className="flex flex-wrap gap-3">
						<Button
							asChild
							className="bg-brand text-brand-foreground hover:bg-brand/90"
						>
							<Link href="/register">Crear cuenta</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/login">Iniciar sesión</Link>
						</Button>
					</div>
				</section>

				<section className="grid gap-4 md:grid-cols-3">
					<div className="rounded-xl border border-brand/40 bg-brand/5 p-5">
						<KeyRound className="mb-3 size-5 text-brand" />
						<h2 className="font-medium">Unite con código</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Los estudiantes ingresan al curso con el código del docente.
						</p>
					</div>
					<div className="rounded-xl border border-border bg-card p-5">
						<GraduationCap className="mb-3 size-5" />
						<h2 className="font-medium">Material indexado</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							PDF, DOCX y texto se procesan para el RAG del curso.
						</p>
					</div>
					<div className="rounded-xl border border-border bg-card p-5">
						<Sparkles className="mb-3 size-5 text-brand" />
						<h2 className="font-medium">Asistente por curso</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Cada clase tiene su propio tutor con historial guardado.
						</p>
					</div>
				</section>
			</main>
		</div>
	);
}
