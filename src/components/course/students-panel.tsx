"use client";

import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-api";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Student = {
	id: string;
	name: string | null;
	email: string;
	joinedAt: string;
};

export function StudentsPanel({ courseId }: { courseId: string }) {
	const [students, setStudents] = useState<Student[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await authFetch(`/api/courses/${courseId}/students`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			setStudents(data.students ?? []);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudieron cargar alumnos");
		} finally {
			setLoading(false);
		}
	}, [courseId]);

	useEffect(() => {
		void load();
	}, [load]);

	return (
		<section>
			<div className="mb-4 flex items-end justify-between border-b-2 border-brand pb-2">
				<h2 className="text-xl font-semibold tracking-tight">
					Estudiantes
				</h2>
				<span className="text-sm text-muted-foreground">
					{students.length}
				</span>
			</div>

			{loading ? (
				<p className="text-sm text-muted-foreground">Cargando…</p>
			) : students.length === 0 ? (
				<p className="cut border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
					Todavía no hay alumnos. Compartí el código de invitación.
				</p>
			) : (
				<ul className="divide-y divide-border">
					{students.map((s) => (
						<li key={s.id} className="flex items-center gap-3 py-3">
							<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
								{(s.name || s.email).slice(0, 2).toUpperCase()}
							</div>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">
									{s.name || "—"}
								</p>
								<p className="truncate text-xs text-muted-foreground">
									{s.email}
								</p>
							</div>
							<span className="shrink-0 text-xs text-muted-foreground">
								{new Date(s.joinedAt).toLocaleDateString()}
							</span>
						</li>
					))}
				</ul>
			)}
			<div className="mt-4">
				<Button variant="outline" size="sm" onClick={() => void load()}>
					Actualizar
				</Button>
			</div>
		</section>
	);
}
