"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { authFetch } from "@/lib/auth/client-api";
import { useState } from "react";
import { toast } from "sonner";

type SearchResult = {
	content: string;
	distance: number;
	courseId?: string;
};

type SearchTabProps = {
	courseId: string;
};

export function SearchTab({ courseId }: SearchTabProps) {
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

	const handleSearch = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!query.trim()) {
			toast.error("Please enter a search query");
			return;
		}

		setLoading(true);
		try {
			const response = await authFetch("/api/search", {
				method: "POST",
				body: JSON.stringify({ query, courseId }),
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Failed to search");
			}
			setSearchResults(data.results ?? []);
		} catch (error) {
			console.error("Failed to search:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to perform search",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Search Knowledge Base</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<form onSubmit={handleSearch} className="flex flex-col gap-2 sm:flex-row">
					<Input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Enter your search query..."
						className="flex-1"
					/>
					<Button type="submit" disabled={loading}>
						Search
					</Button>
				</form>

				<ScrollArea className="h-[500px] pr-4">
					{searchResults.length > 0 ? (
						<div className="space-y-4">
							{searchResults.map((result, i) => (
								<Card key={i}>
									<CardContent className="pt-4">
										<div className="text-sm space-y-2">
											<div className="font-mono text-xs text-muted-foreground">
												Similarity: {(1 - result.distance).toFixed(3)}
												{result.courseId ? ` · course: ${result.courseId}` : ""}
											</div>
											<div className="bg-muted p-3 rounded-md">
												{result.content}
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className="text-center text-muted-foreground py-8">
							Search results will appear here
						</div>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
