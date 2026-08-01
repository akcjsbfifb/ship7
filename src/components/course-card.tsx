import Link from "next/link";
import { Bot, FolderOpen, GraduationCap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { CourseSummary } from "@/lib/types";

export function CourseCard({
	course,
	role,
}: {
	course: CourseSummary;
	role: "teacher" | "student";
}) {
	return (
		<Link
			href={`/courses/${course.id}`}
			className="group block cut outline-none focus-visible:ring-2 focus-visible:ring-ring"
			aria-label={`Abrir ${course.title}`}
		>
			<Card className="h-full overflow-hidden shadow-none transition-colors group-hover:border-brand/50">
				<div className="flex items-center justify-between border-b border-border bg-cream/60 px-5 py-4 dark:bg-secondary/60">
					<span className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted-foreground">
						{role === "teacher" ? (
							<span className="truncate cut-sm border border-border bg-background px-1.5 py-0.5 text-[11px]">
								{course.inviteCode}
							</span>
						) : (
							<span>Inscripto</span>
						)}
					</span>
					<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
						<span className="size-2 bg-warm" aria-hidden />
						Tutor IA
					</span>
				</div>

				<CardHeader className="gap-1 px-5 pt-4">
					<CardTitle className="text-balance text-lg leading-snug">
						{course.title}
					</CardTitle>
					{course.description && (
						<p className="line-clamp-2 text-sm text-muted-foreground">
							{course.description}
						</p>
					)}
				</CardHeader>

				<CardContent className="px-5 pt-3">
					<Badge
						variant="outline"
						className="gap-1.5 border-brand/40 font-normal text-muted-foreground"
					>
						<Bot className="size-3.5 text-brand" />
						Agente del curso
					</Badge>
				</CardContent>

				<CardFooter className="mt-4 justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1.5">
						<FolderOpen className="size-4" />
						Material + RAG
					</span>
					<span className="flex min-w-0 items-center gap-1.5">
						<GraduationCap className="size-4 shrink-0" />
						<span className="truncate">
							{role === "teacher" ? "Docente" : "Alumno"}
						</span>
					</span>
				</CardFooter>
			</Card>
		</Link>
	);
}
