"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { authFetch, getIdToken } from "@/lib/auth/client-api";
import { useChat } from "ai/react";
import { FileText, Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type MaterialRow = {
	id: string;
	title: string;
	filename: string;
	status: string;
	topicTitle: string;
};

type Topic = {
	id: string;
	title: string;
};

type ChatMessage = {
	id: string;
	role: "user" | "assistant";
	content: string;
};

export function ChatbotPanel({
	courseId,
	isTeacher,
}: {
	courseId: string;
	isTeacher: boolean;
}) {
	const [materials, setMaterials] = useState<MaterialRow[]>([]);
	const [topics, setTopics] = useState<Topic[]>([]);
	const [historyLoaded, setHistoryLoaded] = useState(false);
	const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
	const [uploadTopicId, setUploadTopicId] = useState("");
	const [pasteOpen, setPasteOpen] = useState(false);
	const [pasteText, setPasteText] = useState("");
	const [busy, setBusy] = useState(false);

	const loadMaterials = useCallback(async () => {
		try {
			const res = await authFetch(`/api/courses/${courseId}/materials`);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			setMaterials(data.materials ?? []);
			const nextTopics = (data.topics ?? []).map((t: Topic) => ({
				id: t.id,
				title: t.title,
			}));
			setTopics(nextTopics);
			setUploadTopicId((current) => current || nextTopics[0]?.id || "");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error materiales");
		}
	}, [courseId]);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			try {
				const res = await authFetch(`/api/courses/${courseId}/chat`);
				const data = await res.json();
				if (!res.ok) throw new Error(data.error || "Error");
				if (cancelled) return;
				setInitialMessages(
					(data.messages ?? [])
						.filter(
							(m: { role: string }) =>
								m.role === "user" || m.role === "assistant",
						)
						.map((m: ChatMessage) => ({
							id: m.id,
							role: m.role,
							content: m.content,
						})),
				);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Error chat");
			} finally {
				if (!cancelled) setHistoryLoaded(true);
			}
			if (!cancelled) await loadMaterials();
		})();
		return () => {
			cancelled = true;
		};
	}, [courseId, loadMaterials]);

	if (!historyLoaded) {
		return (
			<div className="flex h-[min(70vh,640px)] items-center justify-center rounded-xl border text-sm text-muted-foreground">
				Cargando chat…
			</div>
		);
	}

	return (
		<ChatbotInner
			key={courseId}
			courseId={courseId}
			isTeacher={isTeacher}
			initialMessages={initialMessages}
			materials={materials}
			topics={topics}
			uploadTopicId={uploadTopicId}
			setUploadTopicId={setUploadTopicId}
			pasteOpen={pasteOpen}
			setPasteOpen={setPasteOpen}
			pasteText={pasteText}
			setPasteText={setPasteText}
			busy={busy}
			setBusy={setBusy}
			reloadMaterials={loadMaterials}
		/>
	);
}

function ChatbotInner({
	courseId,
	isTeacher,
	initialMessages,
	materials,
	topics,
	uploadTopicId,
	setUploadTopicId,
	pasteOpen,
	setPasteOpen,
	pasteText,
	setPasteText,
	busy,
	setBusy,
	reloadMaterials,
}: {
	courseId: string;
	isTeacher: boolean;
	initialMessages: ChatMessage[];
	materials: MaterialRow[];
	topics: Topic[];
	uploadTopicId: string;
	setUploadTopicId: (id: string) => void;
	pasteOpen: boolean;
	setPasteOpen: (v: boolean) => void;
	pasteText: string;
	setPasteText: (v: string) => void;
	busy: boolean;
	setBusy: (v: boolean) => void;
	reloadMaterials: () => Promise<void>;
}) {
	const bottomRef = useRef<HTMLDivElement>(null);
	const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
		useChat({
			api: "/api/chat",
			body: { courseId },
			initialMessages,
			fetch: async (input, init) => {
				const token = await getIdToken();
				if (!token) throw new Error("Not authenticated");
				const headers = new Headers(init?.headers);
				headers.set("Authorization", `Bearer ${token}`);
				return fetch(input, { ...init, headers });
			},
			onError: (err) => toast.error(err.message || "Error en el chat"),
		});

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages, isLoading]);

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;
		handleSubmit(e);
	};

	const uploadFile = async (file: File) => {
		if (!uploadTopicId) {
			toast.error("Creá un tema en Material primero");
			return;
		}
		setBusy(true);
		const toastId = toast.loading("Subiendo e indexando…");
		try {
			const token = await getIdToken();
			if (!token) throw new Error("No autenticado");
			const form = new FormData();
			form.append("file", file);
			form.append("title", file.name);
			const res = await fetch(
				`/api/courses/${courseId}/topics/${uploadTopicId}/materials`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: form,
				},
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			if (data.material?.status === "FAILED") {
				toast.error(data.material.errorMessage || "Falló", { id: toastId });
			} else {
				toast.success("Agregado al RAG", { id: toastId });
			}
			await reloadMaterials();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error", { id: toastId });
		} finally {
			setBusy(false);
		}
	};

	const pasteUpload = async () => {
		if (!uploadTopicId || !pasteText.trim()) return;
		setBusy(true);
		const toastId = toast.loading("Indexando…");
		try {
			const token = await getIdToken();
			if (!token) throw new Error("No autenticado");
			const form = new FormData();
			form.append("text", pasteText);
			form.append("title", "Nota rápida");
			const res = await fetch(
				`/api/courses/${courseId}/topics/${uploadTopicId}/materials`,
				{
					method: "POST",
					headers: { Authorization: `Bearer ${token}` },
					body: form,
				},
			);
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Error");
			toast.success("Listo", { id: toastId });
			setPasteText("");
			setPasteOpen(false);
			await reloadMaterials();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error", { id: toastId });
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="grid h-[min(72vh,680px)] grid-cols-1 overflow-hidden rounded-xl border bg-card lg:grid-cols-[260px_1fr]">
			{/* Sidebar fija */}
			<aside className="flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r">
				<div className="shrink-0 border-b px-3 py-2.5">
					<h3 className="text-sm font-semibold">Material</h3>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
					{materials.length === 0 ? (
						<p className="text-xs text-muted-foreground">
							Sin material indexado todavía.
						</p>
					) : (
						<ul className="space-y-2">
							{materials.map((m) => (
								<li key={m.id} className="flex gap-2 text-sm">
									<FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
									<div className="min-w-0">
										<div className="truncate font-medium">{m.title}</div>
										<div className="truncate text-xs text-muted-foreground">
											{m.topicTitle} · {m.status}
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>

				{isTeacher && (
					<div className="shrink-0 space-y-2 border-t p-3">
						<p className="text-xs text-muted-foreground">Agregar al RAG</p>
						{topics.length > 0 ? (
							<select
								className="w-full rounded-md border bg-background p-2 text-sm"
								value={uploadTopicId}
								onChange={(e) => setUploadTopicId(e.target.value)}
							>
								{topics.map((t) => (
									<option key={t.id} value={t.id}>
										{t.title}
									</option>
								))}
							</select>
						) : (
							<p className="text-xs text-amber-600">
								Creá un tema en Material.
							</p>
						)}
						<label className="block">
							<input
								type="file"
								className="hidden"
								disabled={busy || !uploadTopicId}
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) void uploadFile(f);
									e.target.value = "";
								}}
							/>
							<Button
								type="button"
								size="sm"
								variant="outline"
								className="w-full"
								disabled={busy || !uploadTopicId}
								onClick={(e) => {
									const input = e.currentTarget.parentElement?.querySelector(
										'input[type="file"]',
									) as HTMLInputElement | null;
									input?.click();
								}}
							>
								{busy ? (
									<Loader2 className="h-3.5 w-3.5 animate-spin" />
								) : (
									<Upload className="h-3.5 w-3.5" />
								)}
								Subir archivo
							</Button>
						</label>
						<Button
							type="button"
							size="sm"
							variant="ghost"
							className="w-full"
							onClick={() => setPasteOpen(!pasteOpen)}
						>
							Pegar texto
						</Button>
						{pasteOpen && (
							<div className="space-y-2">
								<Textarea
									value={pasteText}
									onChange={(e) => setPasteText(e.target.value)}
									className="min-h-[72px] text-sm"
									placeholder="Texto para el RAG…"
								/>
								<Button
									size="sm"
									className="w-full"
									disabled={busy || !pasteText.trim()}
									onClick={() => void pasteUpload()}
								>
									Indexar
								</Button>
							</div>
						)}
					</div>
				)}
			</aside>

			{/* Chat: ventana fija + scroll interno */}
			<section className="flex min-h-0 min-w-0 flex-col">
				<div className="shrink-0 border-b px-4 py-2.5">
					<h3 className="text-sm font-semibold">Tutor</h3>
				</div>

				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
					<div className="space-y-3">
						{messages.length === 0 && (
							<p className="py-10 text-center text-sm text-muted-foreground">
								Preguntá sobre el material del curso. El historial se guarda.
							</p>
						)}
						{messages.map((m) => (
							<div
								key={m.id}
								className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
							>
								<div
									className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
										m.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-muted"
									}`}
								>
									{m.role === "user" ? (
										m.content
									) : (
										<ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">
											{m.content}
										</ReactMarkdown>
									)}
								</div>
							</div>
						))}
						{error && (
							<p className="text-center text-sm text-destructive">
								{error.message}
							</p>
						)}
						<div ref={bottomRef} />
					</div>
				</div>

				<form
					onSubmit={onSubmit}
					className="flex shrink-0 gap-2 border-t bg-card p-3"
				>
					<input
						value={input}
						onChange={handleInputChange}
						placeholder="Preguntá…"
						className="flex-1 rounded-md border bg-background p-2 text-sm"
						disabled={isLoading}
					/>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "…" : "Enviar"}
					</Button>
				</form>
			</section>
		</div>
	);
}
