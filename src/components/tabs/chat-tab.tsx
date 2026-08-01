"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getIdToken } from "@/lib/auth/client-api";
import { useChat } from "ai/react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";

type ChatTabProps = {
	courseId: string;
};

export function ChatTab({ courseId }: ChatTabProps) {
	const { messages, input, handleInputChange, handleSubmit, data, isLoading } =
		useChat({
			api: "/api/chat",
			body: { courseId },
			fetch: async (input, init) => {
				const token = await getIdToken();
				if (!token) {
					throw new Error("Not authenticated");
				}
				const headers = new Headers(init?.headers);
				headers.set("Authorization", `Bearer ${token}`);
				return fetch(input, { ...init, headers });
			},
		});

	const handleChatSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) {
			toast.error("Please enter a question");
			return;
		}
		const token = await getIdToken();
		if (!token) {
			toast.error("Not authenticated");
			return;
		}
		handleSubmit(e);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tutor</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[480px] pr-4 mb-4">
					<div className="space-y-4">
						{messages.map((m) => (
							<div
								key={m.id}
								className={`flex flex-col ${
									m.role === "user" ? "items-end" : "items-start"
								}`}
							>
								<div
									className={`max-w-[80%] rounded-lg px-4 py-2 ${
										m.role === "user"
											? "bg-primary text-primary-foreground"
											: "bg-muted"
									}`}
								>
									{m.role === "user" ? (
										m.content
									) : (
										<>
											{Array.isArray(data) &&
												data.length > 0 &&
												// biome-ignore lint/suspicious/noExplicitAny: StreamData payload
												(data[data.length - 1] as any)?.contextDetails
													?.length > 0 && (
													<div className="mb-4 p-2 border border-dashed rounded-md border-gray-500 text-sm opacity-75">
														<div className="font-semibold mb-1">
															Context Used:
														</div>
														{/* biome-ignore lint/suspicious/noExplicitAny: StreamData payload */}
														{(data[data.length - 1] as any).contextDetails.map(
															(
																context: {
																	content?: string;
																	chunk?: string;
																	metadata: Record<string, unknown>;
																},
																i: number,
															) => (
																<div key={i} className="mb-2">
																	<div className="font-medium">
																		{context.content ?? context.chunk}
																	</div>
																	<div className="text-xs text-gray-400">
																		Distance: {String(context.metadata.distance)}{" "}
																		| Created:{" "}
																		{String(context.metadata.createdAt)}
																	</div>
																</div>
															),
														)}
													</div>
												)}
											<ReactMarkdown
												components={{
													code({ className, children, ...props }) {
														const match = /language-(\w+)/.exec(
															className || "",
														);
														return match ? (
															<SyntaxHighlighter
																style={vscDarkPlus}
																language={match[1]}
																PreTag="div"
																{...(props as SyntaxHighlighterProps)}
															>
																{String(children).replace(/\n$/, "")}
															</SyntaxHighlighter>
														) : (
															<code className={className} {...props}>
																{children}
															</code>
														);
													},
												}}
												className="prose prose-invert max-w-none"
											>
												{m.content}
											</ReactMarkdown>
										</>
									)}
								</div>
							</div>
						))}
					</div>
				</ScrollArea>

				<form onSubmit={handleChatSubmit} className="flex gap-2">
					<input
						value={input}
						onChange={handleInputChange}
						placeholder="Ask about this course…"
						className="flex-1 p-2 border rounded-md bg-background"
						disabled={isLoading}
					/>
					<Button type="submit" disabled={isLoading}>
						Send
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
