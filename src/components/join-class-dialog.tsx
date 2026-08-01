"use client";

import { AlertCircle, ArrowRight, KeyRound, Loader2 } from "lucide-react";
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
import { authFetch } from "@/lib/auth/client-api";

export function JoinClassDialog({
	open,
	onOpenChange,
	onJoined,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onJoined?: () => void;
}) {
	const router = useRouter();
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	function reset() {
		setCode("");
		setError(null);
		setPending(false);
	}

	async function handleSubmit(event: React.FormEvent) {
		event.preventDefault();
		const inviteCode = code.trim();
		if (inviteCode.length < 4) {
			setError("El código debe tener al menos 4 caracteres.");
			return;
		}

		setError(null);
		setPending(true);
		try {
			const res = await authFetch("/api/courses/join", {
				method: "POST",
				body: JSON.stringify({ inviteCode }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "No se pudo unir al curso");
			toast.success(`Te uniste a ${data.course?.title ?? "el curso"}`);
			onOpenChange(false);
			reset();
			onJoined?.();
			router.push(`/courses/${data.course.id}`);
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Error al unirse";
			setError(msg);
			setPending(false);
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
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-brand/40 bg-brand/10 text-brand">
						<KeyRound className="size-5" />
					</div>
					<DialogTitle>Unirse a una clase</DialogTitle>
					<DialogDescription>
						Pedile a tu docente el código de la clase y escribilo acá para
						acceder al material y al agente de IA del curso.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="join-code">Código de la clase</Label>
						<Input
							id="join-code"
							value={code}
							onChange={(event) => {
								setCode(event.target.value);
								setError(null);
							}}
							placeholder="Ej.: ABC123XY"
							autoComplete="off"
							autoCapitalize="characters"
							spellCheck={false}
							aria-invalid={Boolean(error)}
							className="h-11 font-mono text-base tracking-[0.18em] uppercase"
						/>
						{error ? (
							<p className="flex items-start gap-1.5 text-sm text-destructive">
								<AlertCircle className="mt-0.5 size-4 shrink-0" />
								{error}
							</p>
						) : (
							<p className="text-xs text-muted-foreground">
								Código de invitación del curso, sin espacios.
							</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={pending}>
							{pending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<ArrowRight className="size-4" />
							)}
							Unirme
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
