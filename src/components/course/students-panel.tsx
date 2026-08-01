"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
		<Card>
			<CardHeader>
				<CardTitle>Alumnos inscriptos</CardTitle>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-muted-foreground">Cargando…</p>
				) : students.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Todavía no hay alumnos. Compartí el código de invitación.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="text-left text-muted-foreground border-b">
									<th className="py-2 pr-4 font-medium">Nombre</th>
									<th className="py-2 pr-4 font-medium">Email</th>
									<th className="py-2 font-medium">Ingreso</th>
								</tr>
							</thead>
							<tbody>
								{students.map((s) => (
									<tr key={s.id} className="border-b last:border-0">
										<td className="py-2 pr-4">{s.name || "—"}</td>
										<td className="py-2 pr-4">{s.email}</td>
										<td className="py-2 text-muted-foreground">
											{new Date(s.joinedAt).toLocaleDateString()}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				<div className="mt-4">
					<Button variant="outline" size="sm" onClick={() => void load()}>
						Actualizar
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
