"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { authFetch } from "@/lib/auth/client-api";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type IngestTabProps = {
	courseId: string;
};

export function IngestTab({ courseId }: IngestTabProps) {
	const [text, setText] = useState("");
	const [loading, setLoading] = useState(false);
	const [lastChunks, setLastChunks] = useState<number | null>(null);

	const handleEmbed = async () => {
		if (!text.trim()) {
			toast.error("Pegá algún texto del curso");
			return;
		}

		setLoading(true);
		const toastId = toast.loading("Indexando en el RAG…");

		try {
			const response = await authFetch("/api/ingest", {
				method: "POST",
				body: JSON.stringify({
					text,
					courseId,
					chunkingMethod: "paragraph",
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to ingest");
			}

			const chunks = Number(data.chunks ?? 0);
			setLastChunks(chunks);
			toast.success(`Guardados ${chunks} chunks en este curso`, { id: toastId });
			setText("");
		} catch (error) {
			console.error("Failed to process:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to process text",
				{ id: toastId },
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Cargar material</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground">
					Pegá apuntes o texto de un PDF. Queda aislado a este curso y el tutor
					lo usa para responder.
				</p>
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Ej: La fotosíntesis es el proceso por el cual…"
					className="min-h-[240px]"
				/>
				<Button onClick={handleEmbed} disabled={loading} className="w-full">
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Procesando…
						</>
					) : (
						"Agregar al conocimiento del curso"
					)}
				</Button>
				{lastChunks !== null && (
					<p className="text-xs text-muted-foreground text-center">
						Última carga: {lastChunks} chunks. Probá el tab Tutor.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
