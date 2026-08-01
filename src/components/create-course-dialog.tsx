"use client";

import { Check, Copy, GraduationCap, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/client-api";

export function CreateCourseDialog({
	open,
	onOpenChange,
	canCreate,
	onBecomeTeacher,
	onCreated,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	canCreate: boolean;
	onBecomeTeacher?: () => Promise<void>;
	onCreated?: () => void;
}) {
	const router = useRouter();
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [createdCode, setCreatedCode] = useState<string | null>(null);
	const [createdId, setCreatedId] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const [pending, setPending] = useState(false);

	function reset() {
		setTitle("");
		setDescription("");
		setCreatedCode(null);
		setCreatedId(null);
		setCopied(false);
		setPending(false);
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		setPending(true);
		try {
			if (!canCreate && onBecomeTeacher) {
				await onBecomeTeacher();
			}
			const res = await authFetch("/api/courses", {
				method: "POST",
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || undefined,
				}),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "No se pudo crear el curso");
			setCreatedCode(data.course.inviteCode);
			setCreatedId(data.course.id);
			onCreated?.();
			toast.success("Curso creado");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al crear");
		} finally {
			setPending(false);
		}
	}

	async function copyCode() {
		if (!createdCode) return;
		try {
			await navigator.clipboard.writeText(createdCode);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				if (!next) reset();
				onOpenChange(next);
			}}
		>
			<DialogContent className="sm:max-w-lg">
				{createdCode ? (
					<>
						<DialogHeader>
							<div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-brand/40 bg-brand/10 text-brand">
								<Check className="size-5" />
							</div>
							<DialogTitle>Curso creado</DialogTitle>
							<DialogDescription>
								Compartí este código con tus estudiantes para que se unan a{" "}
								<span className="font-medium text-foreground">{title}</span>.
							</DialogDescription>
						</DialogHeader>

						<div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/60 px-4 py-3">
							<span className="font-mono text-lg tracking-[0.18em]">
								{createdCode}
							</span>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => void copyCode()}
							>
								{copied ? (
									<Check className="size-4" />
								) : (
									<Copy className="size-4" />
								)}
								{copied ? "Copiado" : "Copiar"}
							</Button>
						</div>

						<DialogFooter>
							<Button
								type="button"
								onClick={() => {
									onOpenChange(false);
									if (createdId) router.push(`/courses/${createdId}`);
								}}
							>
								Abrir curso
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-brand/40 bg-brand/10 text-brand">
								<GraduationCap className="size-5" />
							</div>
							<DialogTitle>Crear un curso</DialogTitle>
							<DialogDescription>
								Vas a ser el docente de este curso. Después vas a poder subir
								material y usar el tutor con RAG.
								{!canCreate &&
									" Tu cuenta se actualizará a docente al crear el curso."}
							</DialogDescription>
						</DialogHeader>

						<form onSubmit={handleSubmit} className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
								<Label htmlFor="course-name">Nombre del curso</Label>
								<Input
									id="course-name"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									placeholder="Ej.: Álgebra Lineal"
									required
								/>
							</div>

							<div className="flex flex-col gap-2">
								<Label htmlFor="course-description">
									Descripción{" "}
									<span className="text-muted-foreground">(opcional)</span>
								</Label>
								<Textarea
									id="course-description"
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									placeholder="Qué van a aprender tus estudiantes en este curso."
									rows={3}
								/>
							</div>

							<DialogFooter>
								<Button
									type="button"
									variant="ghost"
									onClick={() => onOpenChange(false)}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={pending || !title.trim()}>
									{pending ? (
										<Loader2 className="size-4 animate-spin" />
									) : (
										<Plus className="size-4" />
									)}
									Crear curso
								</Button>
							</DialogFooter>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
