import Image from "next/image";
import Link from "next/link";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

const problems = [
	{
		title: "El material queda disperso",
		body: "PDFs, links y apuntes sueltos que los alumnos no usan o no entienden, llenos de términos que nadie les explica.",
	},
	{
		title: "Los docentes repiten las mismas respuestas",
		body: "Las mismas dudas sobre el mismo material, una y otra vez, dedicando tiempo y recursos a cada alumno por separado.",
	},
	{
		title: "La IA genérica alucina",
		body: "Responde con información de la web que no tiene nada que ver con lo que dio el profesor, y resuelve el ejercicio en lugar de explicarlo.",
	},
];

export default function Home() {
	return (
		<div className="min-h-dvh bg-background">
			<Navbar />

			<main>
				{/* Hero */}
				<section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-20 pt-14 md:grid-cols-[1.2fr_1fr] md:pb-28 md:pt-20">
					<div className="space-y-6">
						<h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
							Un tutor IA que responde solo con la bibliografía de tu cátedra
						</h1>
						<p className="max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
							Subí el material del curso, compartí un código y tus alumnos
							estudian con respuestas citadas. Sin alucinaciones.
						</p>
						<div className="flex flex-wrap gap-3">
							<Button
								asChild
								size="lg"
								className="bg-brand text-brand-foreground hover:bg-brand/90"
							>
								<Link href="/register">Crear cuenta</Link>
							</Button>
							<Button variant="outline" size="lg" asChild>
								<Link href="/login">Iniciar sesión</Link>
							</Button>
						</div>
					</div>
					<div className="hidden justify-center rounded-2xl border border-brand/25 bg-brand/5 p-10 md:flex">
						<Image
							src="/logos/mortarboard.svg"
							alt="Birrete de graduación"
							width={260}
							height={260}
							priority
						/>
					</div>
				</section>

				{/* Problemas */}
				<section className="border-y border-border bg-card">
					<div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1fr_1.4fr] md:py-24">
						<div className="space-y-4">
							<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
								Tres problemas que vemos todos los días en las facultades
							</h2>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Sobre todo en la educación pública rosarina, en cátedras con
								mucho material de lectura.
							</p>
							<Image
								src="/logos/question.svg"
								alt="Signo de pregunta"
								width={96}
								height={96}
								className="pt-2"
							/>
						</div>
						<ol className="space-y-8">
							{problems.map((problem, i) => (
								<li key={problem.title} className="flex gap-5">
									<span className="font-mono text-sm text-brand" aria-hidden>
										{String(i + 1).padStart(2, "0")}
									</span>
									<div>
										<h3 className="font-medium">{problem.title}</h3>
										<p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
											{problem.body}
										</p>
									</div>
								</li>
							))}
						</ol>
					</div>
				</section>

				{/* Cómo funciona */}
				<section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
					<h2 className="max-w-xl text-2xl font-semibold tracking-tight md:text-3xl">
						Como Google Classroom, con un NotebookLM adentro de cada curso
					</h2>
					<div className="mt-10 grid gap-4 md:grid-cols-3">
						<div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
							<div className="flex flex-col gap-6 sm:flex-row sm:items-center">
								<Image
									src="/logos/book.svg"
									alt="Libro con material de estudio"
									width={110}
									height={110}
									className="shrink-0"
								/>
								<div>
									<h3 className="font-medium">Subí el material del curso</h3>
									<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
										PDFs, notas y links se indexan y quedan como única fuente de
										la IA. También podés cargar contexto extra de trasfondo, sin
										que el alumno tenga que leerlo.
									</p>
								</div>
							</div>
						</div>
						<div className="rounded-2xl border border-brand/25 bg-brand/5 p-6">
							<Image
								src="/logos/key.svg"
								alt="Llave de acceso"
								width={72}
								height={72}
							/>
							<h3 className="mt-4 font-medium">Compartí el código</h3>
							<p className="mt-1 text-sm leading-relaxed text-muted-foreground">
								Los alumnos se unen al curso con un código de invitación, sin
								trámites.
							</p>
						</div>
						<div className="rounded-2xl bg-brand p-6 text-brand-foreground">
							<Image
								src="/logos/chat.svg"
								alt="Conversación de preguntas y respuestas"
								width={72}
								height={72}
							/>
							<h3 className="mt-4 font-medium">Cada curso tiene su chat</h3>
							<p className="mt-1 text-sm leading-relaxed opacity-90">
								El alumno pregunta lo que no entiende, cuando lo necesita, sin
								esperar la próxima clase.
							</p>
						</div>
						<div className="rounded-2xl border border-border bg-card p-6 md:col-span-2">
							<h3 className="font-medium">Respuestas ancladas a las fuentes</h3>
							<p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
								La IA responde solo en base a los documentos del curso y cita de
								cuál sacó cada respuesta. Explica el material para que el alumno
								aprenda, en lugar de resolverle el ejercicio.
							</p>
							<p className="mt-4 font-mono text-xs text-muted-foreground">
								RAG con embeddings + pgvector, sin información de la web
							</p>
						</div>
					</div>
				</section>

				{/* Por qué ahora */}
				<section className="border-t border-border">
					<div className="mx-auto max-w-3xl space-y-6 px-4 py-16 md:py-24">
						<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
							Por qué ahora
						</h2>
						<p className="leading-relaxed text-muted-foreground">
							Las universidades ya pasaron la etapa de prohibir ChatGPT: hoy
							buscan integrar la IA de forma controlada. Eso abre la ventana
							para una herramienta que no compite con el aula sino que la
							refuerza, dándole al docente control sobre qué fuentes usa la IA.
						</p>
						<p className="leading-relaxed text-muted-foreground">
							Pensada para cátedras con mucha bibliografía: humanidades,
							derecho, medicina y ciencias sociales, donde estudiar con IA sin
							salirse del programa tiene valor real.
						</p>
					</div>
				</section>

				{/* CTA final */}
				<section className="border-t border-border bg-card">
					<div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 md:flex-row md:items-center md:justify-between md:py-20">
						<div>
							<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
								Creá tu primer curso hoy
							</h2>
							<p className="mt-2 text-muted-foreground">
								Subí el material que ya tenés y compartí el código con tus
								alumnos.
							</p>
						</div>
						<Button
							asChild
							size="lg"
							className="bg-brand text-brand-foreground hover:bg-brand/90"
						>
							<Link href="/register">Crear cuenta</Link>
						</Button>
					</div>
				</section>
			</main>

			<footer className="border-t border-border">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
					<span>EducAI</span>
					<span>Hecho en Rosario, Argentina</span>
				</div>
			</footer>
		</div>
	);
}
