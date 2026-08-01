"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/client-api";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type PresetMeta = {
	key: string;
	label: string;
	description: string;
};

export function TutorConfigPanel({ courseId }: { courseId: string }) {
	const [presets, setPresets] = useState<PresetMeta[]>([]);
	const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
	const [instructions, setInstructions] = useState("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await authFetch(`/api/courses/${courseId}/tutor-config`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			setPresets(data.presets ?? []);
			setSelectedKeys(data.tutorPresetKeys ?? []);
			setInstructions(data.tutorInstructions ?? "");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "No se pudo cargar la config del tutor",
			);
		} finally {
			setLoading(false);
		}
	}, [courseId]);

	useEffect(() => {
		void load();
	}, [load]);

	const togglePreset = (key: string) => {
		setSelectedKeys((prev) =>
			prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
		);
	};

	const save = async () => {
		setSaving(true);
		try {
			const res = await authFetch(`/api/courses/${courseId}/tutor-config`, {
				method: "PUT",
				body: JSON.stringify({
					tutorInstructions: instructions,
					tutorPresetKeys: selectedKeys,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error al guardar");
			setSelectedKeys(data.tutorPresetKeys ?? selectedKeys);
			setInstructions(data.tutorInstructions ?? instructions);
			toast.success("Configuración del tutor guardada");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo guardar");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<Card>
				<CardContent className="py-8 text-sm text-muted-foreground">
					Cargando…
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Agente / Límites del tutor</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<p className="text-sm text-muted-foreground">
					Esto afecta al chatbot de todos los alumnos de este curso.
				</p>

				<div className="space-y-3">
					<p className="text-sm font-medium">Presets</p>
					<ul className="space-y-3">
						{presets.map((p) => {
							const checked = selectedKeys.includes(p.key);
							return (
								<li key={p.key}>
									<label className="flex gap-3 items-start cursor-pointer">
										<input
											type="checkbox"
											className="mt-1 size-4 accent-primary"
											checked={checked}
											onChange={() => togglePreset(p.key)}
										/>
										<span>
											<span className="block text-sm font-medium">{p.label}</span>
											<span className="block text-xs text-muted-foreground">
												{p.description}
											</span>
										</span>
									</label>
								</li>
							);
						})}
					</ul>
				</div>

				<div className="space-y-2">
					<label htmlFor="tutor-instructions" className="text-sm font-medium">
						Instrucciones adicionales
					</label>
					<Textarea
						id="tutor-instructions"
						placeholder='Ej.: "No resuelvas la guía 3; solo orientá sobre teoría de la Unidad 2".'
						value={instructions}
						onChange={(e) => setInstructions(e.target.value)}
						rows={6}
					/>
				</div>

				<Button onClick={() => void save()} disabled={saving}>
					{saving ? "Guardando…" : "Guardar"}
				</Button>
			</CardContent>
		</Card>
	);
}
