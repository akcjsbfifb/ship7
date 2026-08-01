"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_COURSE_ID = "demo-course";

export function IngestTab() {
	const [text, setText] = useState("");
	const [courseId, setCourseId] = useState(DEFAULT_COURSE_ID);
	const [loading, setLoading] = useState(false);

	const handleEmbed = async () => {
		if (!text) {
			toast.error("Please enter some text to embed");
			return;
		}
		if (!courseId.trim()) {
			toast.error("courseId is required for isolation");
			return;
		}

		setLoading(true);
		const toastId = toast.loading("Embedding with OpenAI...");

		try {
			const response = await fetch("/api/ingest", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text,
					courseId: courseId.trim(),
					chunkingMethod: "paragraph",
				}),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to ingest");
			}

			toast.success(
				`Stored ${data.chunks ?? "?"} chunks for course ${courseId.trim()}`,
				{ id: toastId },
			);
			setText("");
		} catch (error) {
			console.error("Failed to process:", error);
			toast.error("Failed to process text. Please try again.", { id: toastId });
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
				<Input
					value={courseId}
					onChange={(e) => setCourseId(e.target.value)}
					placeholder="courseId (isolation key)"
				/>
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
