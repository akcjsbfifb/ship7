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
	const { messages, input, handleInputChange, handleSubmit, data, isLoading, error } =
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
			onError: (err) => {
				toast.error(err.message || "Error en el chat");
			},
		});

	const handleChatSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) {
			toast.error("Escribí una pregunta");
			return;
		}
		const token = await getIdToken();
		if (!token) {
			toast.error("No autenticado");
			return;
		}
		handleSubmit(e);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tutor del curso</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="text-sm text-muted-foreground mb-4">
					Preguntá sobre el material cargado. Solo usa el RAG de este curso.
				</p>
				<ScrollArea className="h-[420px] pr-4 mb-4">
					<div className="space-y-4">
						{messages.length === 0 && (
							<div className="text-center text-muted-foreground text-sm py-16">
								Todavía no hay mensajes. Probá: “¿De qué trata el material?”
							</div>
						)}
						{messages.map((m) => (
							<div
								key={m.id}
								className={`flex flex-col ${
									m.role === "user" ? "items-end" : "items-start"
								}`}
							>
								<div
									className={`max-w-[85%] rounded-lg px-4 py-2 ${
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
													<div className="mb-3 p-2 border border-dashed rounded-md text-xs opacity-80">
														<div className="font-semibold mb-1">
															Contexto usado
														</div>
														{/* biome-ignore lint/suspicious/noExplicitAny: StreamData payload */}
														{(data[data.length - 1] as any).contextDetails
															.slice(0, 2)
															.map(
																(
																	context: {
																		content?: string;
																		chunk?: string;
																	},
																	i: number,
																) => (
																	<div key={i} className="mb-1 line-clamp-3">
																		{context.content ?? context.chunk}
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
												className="prose dark:prose-invert max-w-none prose-sm"
											>
												{m.content}
											</ReactMarkdown>
										</>
									)}
								</div>
							</div>
						))}
						{error && (
							<p className="text-sm text-destructive text-center">
								{error.message}
							</p>
						)}
					</div>
				</ScrollArea>

				<form onSubmit={handleChatSubmit} className="flex gap-2">
					<input
						value={input}
						onChange={handleInputChange}
						placeholder="Preguntá sobre el curso…"
						className="flex-1 p-2 border rounded-md bg-background"
						disabled={isLoading}
					/>
					<Button type="submit" disabled={isLoading}>
						{isLoading ? "…" : "Enviar"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
