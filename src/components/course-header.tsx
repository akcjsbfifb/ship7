"use client";

import { ArrowLeft, Copy, GraduationCap, RefreshCw, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { authFetch } from "@/lib/auth/client-api";
import { type CourseSummary, type MeUser, initialsOf } from "@/lib/types";

export function CourseHeader({
	course,
	isTeacher,
	studentCount,
	user,
	onCourseUpdate,
}: {
	course: CourseSummary;
	isTeacher: boolean;
	studentCount?: number;
	user?: MeUser | null;
	onCourseUpdate?: (course: CourseSummary) => void;
}) {
	const { firebaseUser, logout } = useAuth();
	const displayName =
		user?.name || firebaseUser?.displayName || user?.email || "Usuario";
	const photoURL = firebaseUser?.photoURL || user?.photoUrl || undefined;

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
		<header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
			<div className="flex items-center gap-3 px-4 py-3 md:px-6">
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0 text-muted-foreground"
					asChild
				>
					<Link href="/dashboard" aria-label="Volver a mis cursos">
						<ArrowLeft />
					</Link>
				</Button>

				<div className="cut-sm flex size-9 shrink-0 items-center justify-center border border-brand/40 bg-brand/10 text-brand">
					<GraduationCap className="size-5" />
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<h1 className="truncate text-base font-semibold leading-tight md:text-lg">
							{course.title}
						</h1>
						{isTeacher && (
							<Badge
								variant="outline"
								className="hidden shrink-0 border-brand/40 font-mono text-[11px] text-muted-foreground sm:inline-flex"
							>
								{course.inviteCode}
							</Badge>
						)}
					</div>
					<p className="truncate text-xs text-muted-foreground">
						{course.description || "Curso de Bookworm"}
					</p>
				</div>

				{typeof studentCount === "number" && (
					<div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
						<Users className="size-4" />
						<span>{studentCount} estudiantes</span>
					</div>
				)}

				{isTeacher && (
					<div className="hidden items-center gap-1 md:flex">
						<Button
							size="sm"
							variant="outline"
							onClick={() => void copyInvite()}
						>
							<Copy className="size-3.5" />
							Copiar
						</Button>
						<Button
							size="sm"
							variant="ghost"
							onClick={() => void rotateInvite()}
						>
							<RefreshCw className="size-3.5" />
						</Button>
					</div>
				)}

				<Separator
					orientation="vertical"
					className="mx-1 hidden h-6 sm:block"
				/>

				<ThemeToggle />

				<button
					type="button"
					onClick={() => void logout()}
					title="Cerrar sesión"
				>
					<Avatar className="size-9">
						{photoURL ? (
							<AvatarImage
								src={photoURL}
								alt={displayName}
								referrerPolicy="no-referrer"
							/>
						) : null}
						<AvatarFallback className="bg-secondary text-xs font-medium">
							{initialsOf(displayName, user?.email)}
						</AvatarFallback>
					</Avatar>
				</button>
			</div>
		</header>
	);
}
