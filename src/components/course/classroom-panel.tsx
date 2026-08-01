"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch, getIdToken } from "@/lib/auth/client-api";
import {
	ArrowDown,
	ArrowUp,
	ChevronDown,
	ChevronRight,
	ExternalLink,
	FileText,
	Trash2,
	Upload,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Material = {
	id: string;
	title: string;
	filename: string;
	mimeType?: string;
	status: "PROCESSING" | "READY" | "FAILED";
	errorMessage: string | null;
	downloadUrl?: string | null;
};

type Topic = {
	id: string;
	title: string;
	description: string | null;
	materials: Material[];
};

export function ClassroomPanel({
	courseId,
	isTeacher,
}: {
	courseId: string;
	isTeacher: boolean;
}) {
	const [topics, setTopics] = useState<Topic[]>([]);
	const [openIds, setOpenIds] = useState<Record<string, boolean>>({});
	const [newTitle, setNewTitle] = useState("");
	const [busy, setBusy] = useState(false);
	const [reorderingTopicId, setReorderingTopicId] = useState<string | null>(
		null,
	);
	const [pasteTopicId, setPasteTopicId] = useState<string | null>(null);
	const [pasteText, setPasteText] = useState("");

	const load = useCallback(async () => {
		try {
			const res = await authFetch(`/api/courses/${courseId}/topics`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			setTopics(data.topics ?? []);
			setOpenIds((prev) => {
				const next = { ...prev };
				for (const t of data.topics ?? []) {
					if (next[t.id] === undefined) next[t.id] = true;
				}
				return next;
			});
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "No se pudo cargar material",
			);
		}
	}, [courseId]);

	useEffect(() => {
		void load();
	}, [load]);

	const createTopic = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newTitle.trim()) return;
		setBusy(true);
		try {
			const res = await authFetch(`/api/courses/${courseId}/topics`, {
				method: "POST",
				body: JSON.stringify({ title: newTitle.trim() }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			setNewTitle("");
			toast.success("Tema creado");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setBusy(false);
		}
	};

	const uploadFile = async (topicId: string, file: File) => {
		setBusy(true);
		const toastId = toast.loading("Subiendo e indexando…");
		try {
			const token = await getIdToken();
			if (!token) throw new Error("No autenticado");
			const form = new FormData();
			form.append("file", file);
			form.append("title", file.name);
			const res = await fetch(
				`/api/courses/${courseId}/topics/${topicId}/materials`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: form,
				},
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Upload failed");
			if (data.material?.status === "FAILED") {
				toast.error(data.material.errorMessage || "Falló la indexación", {
					id: toastId,
				});
			} else {
				toast.success("Material listo", { id: toastId });
			}
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al subir", {
				id: toastId,
			});
		} finally {
			setBusy(false);
		}
	};

	const pasteAsMaterial = async (topicId: string) => {
		if (!pasteText.trim()) return;
		setBusy(true);
		const toastId = toast.loading("Indexando texto…");
		try {
			const token = await getIdToken();
			if (!token) throw new Error("No autenticado");
			const form = new FormData();
			form.append("text", pasteText);
			form.append("title", "Nota de texto");
			const res = await fetch(
				`/api/courses/${courseId}/topics/${topicId}/materials`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: form,
				},
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			toast.success("Texto indexado", { id: toastId });
			setPasteText("");
			setPasteTopicId(null);
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error", {
				id: toastId,
			});
		} finally {
			setBusy(false);
		}
	};

	const deleteMaterial = async (materialId: string) => {
		if (!confirm("¿Borrar este material del curso y del RAG?")) return;
		setBusy(true);
		try {
			const res = await authFetch(
				`/api/courses/${courseId}/materials/${materialId}`,
				{ method: "DELETE" },
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			toast.success("Material eliminado");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setBusy(false);
		}
	};

	const openMaterial = (material: Material) => {
		if (material.status !== "READY") {
			toast.error("El archivo todavía no está listo");
			return;
		}
		// Same-origin viewer avoids chrome-error from failed cross-origin Storage URLs.
		window.open(
			`/courses/${courseId}/files/${material.id}`,
			"_blank",
			"noopener,noreferrer",
		);
	};

	const moveMaterial = async (
		topicId: string,
		materialId: string,
		direction: "up" | "down",
	) => {
		const topic = topics.find((t) => t.id === topicId);
		if (!topic) return;

		const index = topic.materials.findIndex((m) => m.id === materialId);
		if (index < 0) return;
		const target = direction === "up" ? index - 1 : index + 1;
		if (target < 0 || target >= topic.materials.length) return;

		const nextMaterials = [...topic.materials];
		const [item] = nextMaterials.splice(index, 1);
		nextMaterials.splice(target, 0, item);
		const orderedIds = nextMaterials.map((m) => m.id);

		setTopics((prev) =>
			prev.map((t) =>
				t.id === topicId ? { ...t, materials: nextMaterials } : t,
			),
		);
		setReorderingTopicId(topicId);

		try {
			const res = await authFetch(
				`/api/courses/${courseId}/topics/${topicId}/materials`,
				{
					method: "PATCH",
					body: JSON.stringify({ orderedIds }),
				},
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			if (Array.isArray(data.materials)) {
				setTopics((prev) =>
					prev.map((t) =>
						t.id === topicId ? { ...t, materials: data.materials } : t,
					),
				);
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo reordenar");
			await load();
		} finally {
			setReorderingTopicId(null);
		}
	};

	const deleteTopic = async (topicId: string) => {
		if (!confirm("¿Borrar el tema y todos sus archivos?")) return;
		setBusy(true);
		try {
			const res = await authFetch(
				`/api/courses/${courseId}/topics/${topicId}`,
				{
					method: "DELETE",
				},
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			toast.success("Tema eliminado");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="space-y-4">
			{isTeacher && (
				<div className="cut flex items-start gap-2.5 border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-muted-foreground">
					Todo el material que subas se indexa automáticamente para el tutor IA
					del curso. Podés reordenar los archivos de cada tema con las flechas.
				</div>
			)}

			{isTeacher && (
				<form
					onSubmit={createTopic}
					className="cut flex flex-col gap-2 border border-border bg-card p-4 sm:flex-row"
				>
					<Input
						placeholder="Ej: Unidad 1 — Introducción"
						value={newTitle}
						onChange={(e) => setNewTitle(e.target.value)}
						required
					/>
					<Button
						type="submit"
						disabled={busy}
						className="bg-brand text-brand-foreground hover:bg-brand/90"
					>
						Crear tema
					</Button>
				</form>
			)}

			{topics.length === 0 ? (
				<p className="cut border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
					{isTeacher
						? "Creá un tema y subí archivos (PDF, DOCX, TXT) o pegá texto."
						: "Todavía no hay material publicado."}
				</p>
			) : (
				topics.map((topic) => {
					const open = openIds[topic.id] ?? true;
					const topicBusy = busy || reorderingTopicId === topic.id;
					return (
						<Card key={topic.id} className="overflow-hidden shadow-none">
							<button
								type="button"
								className="flex w-full items-center gap-2 p-4 text-left hover:bg-muted/40"
								onClick={() => setOpenIds((s) => ({ ...s, [topic.id]: !open }))}
							>
								{open ? (
									<ChevronDown className="h-4 w-4 shrink-0" />
								) : (
									<ChevronRight className="h-4 w-4 shrink-0" />
								)}
								<span className="flex-1 font-semibold">{topic.title}</span>
								<span className="rounded-md bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
									{topic.materials.length}
								</span>
							</button>
							{open && (
								<CardContent className="space-y-3 border-t pt-0">
									{topic.materials.length === 0 ? (
										<p className="py-2 text-sm text-muted-foreground">
											Sin archivos en este tema.
										</p>
									) : (
										<ul className="space-y-2">
											{topic.materials.map((m, index) => (
												<li
													key={m.id}
													className="flex items-center gap-2 border-b py-2 text-sm last:border-0"
												>
													{isTeacher && (
														<div className="flex shrink-0 flex-col">
															<Button
																type="button"
																size="icon"
																variant="ghost"
																className="size-5 [&_svg]:size-3"
																disabled={topicBusy || index === 0}
																aria-label="Subir archivo"
																onClick={() =>
																	void moveMaterial(topic.id, m.id, "up")
																}
															>
																<ArrowUp />
															</Button>
															<Button
																type="button"
																size="icon"
																variant="ghost"
																className="size-5 [&_svg]:size-3"
																disabled={
																	topicBusy ||
																	index === topic.materials.length - 1
																}
																aria-label="Bajar archivo"
																onClick={() =>
																	void moveMaterial(topic.id, m.id, "down")
																}
															>
																<ArrowDown />
															</Button>
														</div>
													)}
													<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
													<div className="min-w-0 flex-1">
														{m.status === "READY" ? (
															<button
																type="button"
																className="block w-full truncate text-left font-medium text-primary hover:underline"
																onClick={() => void openMaterial(m)}
															>
																{m.title}
															</button>
														) : (
															<div className="truncate font-medium">
																{m.title}
															</div>
														)}
														<div className="text-xs text-muted-foreground">
															{m.filename} · {m.status}
															{m.status === "FAILED" && m.errorMessage
																? ` — ${m.errorMessage}`
																: ""}
														</div>
													</div>
													{m.status === "READY" && (
														<Button
															type="button"
															size="sm"
															variant="outline"
															className="shrink-0 gap-1.5"
															onClick={() => void openMaterial(m)}
														>
															<ExternalLink className="h-3.5 w-3.5" />
															Abrir
														</Button>
													)}
													{isTeacher && (
														<Button
															size="icon"
															variant="ghost"
															disabled={topicBusy}
															onClick={() => void deleteMaterial(m.id)}
														>
															<Trash2 className="h-4 w-4" />
														</Button>
													)}
												</li>
											))}
										</ul>
									)}

									{isTeacher && (
										<div className="flex flex-wrap items-center gap-2 pt-2">
											<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
												<Upload className="h-3.5 w-3.5" />
												Subir archivo
												<input
													type="file"
													className="hidden"
													disabled={topicBusy}
													onChange={(e) => {
														const f = e.target.files?.[0];
														if (f) void uploadFile(topic.id, f);
														e.target.value = "";
													}}
												/>
											</label>
											<Button
												type="button"
												size="sm"
												variant="outline"
												onClick={() =>
													setPasteTopicId(
														pasteTopicId === topic.id ? null : topic.id,
													)
												}
											>
												Pegar texto
											</Button>
											<Button
												type="button"
												size="sm"
												variant="ghost"
												disabled={topicBusy}
												onClick={() => void deleteTopic(topic.id)}
											>
												Borrar tema
											</Button>
										</div>
									)}

									{isTeacher && pasteTopicId === topic.id && (
										<div className="space-y-2 pt-2">
											<Textarea
												value={pasteText}
												onChange={(e) => setPasteText(e.target.value)}
												placeholder="Pegá apuntes…"
												className="min-h-[120px]"
											/>
											<Button
												size="sm"
												disabled={topicBusy || !pasteText.trim()}
												onClick={() => void pasteAsMaterial(topic.id)}
											>
												Indexar texto
											</Button>
										</div>
									)}
								</CardContent>
							)}
						</Card>
					);
				})
			)}
		</div>
	);
}
