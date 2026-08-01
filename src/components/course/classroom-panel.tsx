"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authFetch, getIdToken } from "@/lib/auth/client-api";
import { ChevronDown, ChevronRight, FileText, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Material = {
	id: string;
	title: string;
	filename: string;
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
			toast.error(err instanceof Error ? err.message : "No se pudo cargar material");
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
			toast.error(err instanceof Error ? err.message : "Error", { id: toastId });
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

	const deleteTopic = async (topicId: string) => {
		if (!confirm("¿Borrar el tema y todos sus archivos?")) return;
		setBusy(true);
		try {
			const res = await authFetch(`/api/courses/${courseId}/topics/${topicId}`, {
				method: "DELETE",
			});
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
				<div className="flex items-start gap-2.5 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-muted-foreground">
					Todo el material que subas se indexa automáticamente para el tutor IA
					del curso.
				</div>
			)}

			{isTeacher && (
				<form
					onSubmit={createTopic}
					className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 sm:flex-row"
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
				<p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
					{isTeacher
						? "Creá un tema y subí archivos (PDF, DOCX, TXT) o pegá texto."
						: "Todavía no hay material publicado."}
				</p>
			) : (
				topics.map((topic) => {
					const open = openIds[topic.id] ?? true;
					return (
						<Card key={topic.id} className="overflow-hidden shadow-none">
							<button
								type="button"
								className="flex w-full items-center gap-2 p-4 text-left hover:bg-muted/40"
								onClick={() =>
									setOpenIds((s) => ({ ...s, [topic.id]: !open }))
								}
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
								<CardContent className="space-y-3 pt-0 border-t">
									{topic.materials.length === 0 ? (
										<p className="text-sm text-muted-foreground py-2">
											Sin archivos en este tema.
										</p>
									) : (
										<ul className="space-y-2">
											{topic.materials.map((m) => (
												<li
													key={m.id}
													className="flex items-center gap-2 text-sm py-2 border-b last:border-0"
												>
													<FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
													<div className="flex-1 min-w-0">
														<div className="font-medium truncate">{m.title}</div>
														<div className="text-xs text-muted-foreground">
															{m.filename} · {m.status}
															{m.status === "FAILED" && m.errorMessage
																? ` — ${m.errorMessage}`
																: ""}
														</div>
													</div>
													{m.downloadUrl && (
														<a
															href={m.downloadUrl}
															target="_blank"
															rel="noreferrer"
															className="text-xs text-primary underline"
														>
															Descargar
														</a>
													)}
													{isTeacher && (
														<Button
															size="icon"
															variant="ghost"
															disabled={busy}
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
										<div className="flex flex-wrap gap-2 pt-2 items-center">
											<label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 py-1.5 cursor-pointer hover:bg-muted">
												<Upload className="h-3.5 w-3.5" />
												Subir archivo
												<input
													type="file"
													className="hidden"
													disabled={busy}
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
												disabled={busy}
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
												disabled={busy || !pasteText.trim()}
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
