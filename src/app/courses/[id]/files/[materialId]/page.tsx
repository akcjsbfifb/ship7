"use client";

import { ArrowLeft, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-api";

export default function MaterialViewerPage() {
	const params = useParams<{ id: string; materialId: string }>();
	const courseId = params.id;
	const materialId = params.materialId;
	const router = useRouter();
	const { firebaseUser, loading: authLoading } = useAuth();

	const [objectUrl, setObjectUrl] = useState<string | null>(null);
	const [mimeType, setMimeType] = useState<string>("application/octet-stream");
	const [filename, setFilename] = useState("archivo");
	const [title, setTitle] = useState("Material");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (authLoading) return;
		if (!firebaseUser) {
			router.replace(`/login?next=/courses/${courseId}/files/${materialId}`);
			return;
		}

		let revoked = false;
		let createdUrl: string | null = null;

		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const metaRes = await authFetch(
					`/api/courses/${courseId}/materials/${materialId}`,
				);
				const meta = await metaRes.json();
				if (!metaRes.ok) {
					throw new Error(meta.error || "No se pudo cargar el material");
				}

				const material = meta.material as {
					title?: string;
					filename?: string;
					mimeType?: string;
					status?: string;
				};

				if (material.status && material.status !== "READY") {
					throw new Error("El archivo todavía no está listo");
				}

				setTitle(material.title || material.filename || "Material");
				setFilename(material.filename || "archivo");
				setMimeType(material.mimeType || "application/octet-stream");

				const fileRes = await authFetch(
					`/api/courses/${courseId}/materials/${materialId}/file`,
				);
				if (!fileRes.ok) {
					const data = await fileRes.json().catch(() => ({}));
					throw new Error(data.error || "No se pudo abrir el archivo");
				}

				const blob = await fileRes.blob();
				if (revoked) return;
				createdUrl = URL.createObjectURL(blob);
				setObjectUrl(createdUrl);
			} catch (err) {
				if (!revoked) {
					setError(err instanceof Error ? err.message : "Error al abrir");
					toast.error(err instanceof Error ? err.message : "Error al abrir");
				}
			} finally {
				if (!revoked) setLoading(false);
			}
		};

		void run();

		return () => {
			revoked = true;
			if (createdUrl) URL.revokeObjectURL(createdUrl);
		};
	}, [authLoading, firebaseUser, courseId, materialId, router]);

	const isPdf =
		mimeType.toLowerCase().includes("pdf") ||
		filename.toLowerCase().endsWith(".pdf");
	const isImage = mimeType.toLowerCase().startsWith("image/");
	const isText = mimeType.toLowerCase().startsWith("text/");

	return (
		<div className="flex min-h-dvh flex-col bg-background">
			<header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
				<Button variant="ghost" size="icon" className="shrink-0" asChild>
					<Link href={`/courses/${courseId}`} aria-label="Volver al curso">
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium">{title}</p>
					<p className="truncate text-xs text-muted-foreground">{filename}</p>
				</div>
				{objectUrl ? (
					<Button variant="outline" size="sm" asChild>
						<a href={objectUrl} download={filename}>
							<Download className="size-3.5" />
							Descargar
						</a>
					</Button>
				) : null}
			</header>

			<main className="flex min-h-0 flex-1 flex-col">
				{loading ? (
					<div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
						<Loader2 className="size-4 animate-spin" />
						Abriendo archivo…
					</div>
				) : error ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
						<p className="text-sm text-destructive">{error}</p>
						<Button asChild variant="outline">
							<Link href={`/courses/${courseId}`}>Volver al curso</Link>
						</Button>
					</div>
				) : objectUrl && isPdf ? (
					<iframe
						title={title}
						src={objectUrl}
						className="h-[calc(100dvh-57px)] w-full border-0 bg-muted"
					/>
				) : objectUrl && isImage ? (
					<div className="flex flex-1 items-center justify-center overflow-auto p-6">
						<img
							src={objectUrl}
							alt={title}
							className="max-h-full max-w-full object-contain"
						/>
					</div>
				) : objectUrl && isText ? (
					<iframe
						title={title}
						src={objectUrl}
						className="h-[calc(100dvh-57px)] w-full border-0 bg-background"
					/>
				) : objectUrl ? (
					<div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
						<p className="text-sm text-muted-foreground">
							Este tipo de archivo no se puede previsualizar en el navegador.
						</p>
						<Button asChild>
							<a href={objectUrl} download={filename}>
								<Download className="size-3.5" />
								Descargar {filename}
							</a>
						</Button>
					</div>
				) : null}
			</main>
		</div>
	);
}
