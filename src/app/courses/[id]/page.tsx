"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { CourseWorkspace } from "@/components/course-workspace";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-api";
import type { CourseSummary, MeResponse } from "@/lib/types";

export default function CoursePage() {
	const params = useParams<{ id: string }>();
	const courseId = params.id;
	const { firebaseUser, loading } = useAuth();
	const router = useRouter();
	const [course, setCourse] = useState<CourseSummary | null>(null);
	const [me, setMe] = useState<MeResponse | null>(null);
	const [isTeacher, setIsTeacher] = useState(false);
	const [studentCount, setStudentCount] = useState<number | undefined>();
	const [loadError, setLoadError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setLoadError(null);
			const res = await authFetch("/api/me");
			const data: MeResponse = await res.json();
			if (!res.ok) {
				throw new Error((data as { error?: string }).error || "Failed");
			}

			const owned = data.owned.find((c) => c.id === courseId);
			const enrolled = data.enrolled.find((c) => c.id === courseId);
			const found = owned ?? enrolled;
			if (!found) {
				toast.error("Curso no encontrado o sin acceso");
				router.replace("/dashboard");
				return;
			}
			setMe(data);
			setCourse(found);
			setIsTeacher(Boolean(owned));

			if (owned) {
				try {
					const studentsRes = await authFetch(
						`/api/courses/${courseId}/students`,
					);
					const studentsData = await studentsRes.json();
					if (studentsRes.ok) {
						setStudentCount((studentsData.students ?? []).length);
					}
				} catch {
					/* optional */
				}
			}
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

	if (loading || (!course && !loadError)) {
		return (
			<div className="flex min-h-dvh items-center justify-center text-muted-foreground">
				Cargando…
			</div>
		);
	}

	if (loadError && !course) {
		return (
			<div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
				<p className="text-center text-muted-foreground">{loadError}</p>
				<div className="flex gap-2">
					<Button variant="outline" asChild>
						<Link href="/dashboard">Volver</Link>
					</Button>
					<Button onClick={() => void load()}>Reintentar</Button>
				</div>
			</div>
		);
	}

	if (!course || !me) return null;

	return (
		<CourseWorkspace
			course={course}
			isTeacher={isTeacher}
			user={me.user}
			studentCount={studentCount}
		/>
	);
}
