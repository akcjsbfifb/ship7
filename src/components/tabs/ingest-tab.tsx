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

	const handleEmbed = async () => {
		if (!text) {
			toast.error("Please enter some text to embed");
			return;
		}

		setLoading(true);
		const toastId = toast.loading("Embedding with OpenAI...");

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

			toast.success(`Stored ${data.chunks ?? "?"} chunks`, { id: toastId });
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
				<CardTitle>Add Knowledge</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-muted-foreground font-mono">
					course · {courseId}
				</p>
				<Textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Paste course notes / PDF text here..."
					className="min-h-[200px]"
				/>
				<Button onClick={handleEmbed} disabled={loading} className="w-full">
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Processing...
						</>
					) : (
						"Add to Course Knowledge Base"
					)}
				</Button>
			</CardContent>
		</Card>
	);
}
