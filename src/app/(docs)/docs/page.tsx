"use client";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CodeBlock } from "@/components/ui/code-block";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function DocsPage() {
	return (
		<div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
			<div className="space-y-4">
				<h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
				<p className="text-muted-foreground text-lg">
					Learn how to integrate vector search and RAG capabilities into your
					Next.js application.
				</p>
			</div>

			<Alert>
				<AlertCircle className="h-4 w-4" />
				<AlertTitle>Quick Start</AlertTitle>
				<AlertDescription>
					Follow the setup instructions below to get started with vector search
					in minutes. Make sure you have PostgreSQL with pgvector extension
					enabled.
				</AlertDescription>
			</Alert>

			<Card className="p-1">
				<Tabs defaultValue="setup" className="space-y-6">
					<TabsList className="w-full grid grid-cols-4 p-1">
						<TabsTrigger value="setup" className="font-medium">
							Setup
						</TabsTrigger>
						<TabsTrigger value="pgvector" className="font-medium">
							PGVector
						</TabsTrigger>
						<TabsTrigger value="vectordb" className="font-medium">
							VectorDB
						</TabsTrigger>
						<TabsTrigger value="examples" className="font-medium">
							Examples
						</TabsTrigger>
					</TabsList>

					<div className="p-6">
						<TabsContent value="setup" className="m-0 space-y-8">
							<div className="space-y-4">
								<h2 className="text-2xl font-bold tracking-tight">
									Getting Started
								</h2>
								<p className="text-muted-foreground">
									Complete these steps to set up vector search in your
									application.
								</p>
							</div>

							<div className="space-y-6">
								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<Badge variant="outline">Step 1</Badge>
										<h3 className="text-lg font-semibold">Database Setup</h3>
									</div>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<p>Create a Postgres database with either:</p>
										<ul className="list-disc list-inside space-y-2 text-muted-foreground">
											<li>
												Docker Compose pgvector (recommended for local hackathon)
											</li>
											<li>Neon / Marketplace Postgres with pgvector</li>
										</ul>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<Badge variant="outline">Step 2</Badge>
										<h3 className="text-lg font-semibold">
											Environment Variables
										</h3>
									</div>
									<div className="pl-6 border-l-2 border-muted">
										<CodeBlock language="bash">{`
# Database
POSTGRES_URL="postgres://..."

# Vercel AI Gateway
AI_GATEWAY_API_KEY="..."

# Inngest (optional, for background jobs)
INNGEST_EVENT_KEY="..."
INNGEST_SIGNING_KEY="..."
                    `}</CodeBlock>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<Badge variant="outline">Step 3</Badge>
										<h3 className="text-lg font-semibold">Enable pgvector</h3>
									</div>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<p>Connect to your database and run:</p>
										<CodeBlock language="sql">{`CREATE EXTENSION vector;`}</CodeBlock>
									</div>
								</div>

								<div className="space-y-4">
									<div className="flex items-center gap-2">
										<Badge variant="outline">Step 4</Badge>
										<h3 className="text-lg font-semibold">Create Tables</h3>
									</div>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<p>Using Prisma schema:</p>
										<CodeBlock language="prisma">{`
model documents {
  id        BigInt                 @id @default(autoincrement())
  courseId  String
  content   String?
  embedding Unsupported("vector")?
  metadata  Json?                  @default("{}")
  createdAt DateTime               @default(now())
  updatedAt DateTime               @updatedAt

  @@index([courseId])
}
                    `}</CodeBlock>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="pgvector" className="m-0 space-y-8">
							<div className="space-y-4">
								<h2 className="text-2xl font-bold tracking-tight">
									PGVector Setup
								</h2>
								<p className="text-muted-foreground">
									Configure and optimize your vector database for similarity
									search.
								</p>
							</div>

							<div className="space-y-6">
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Indexing</h3>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<p>Create an index for faster similarity search:</p>
										<CodeBlock language="sql">{`
-- For cosine similarity (recommended for OpenAI embeddings)
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- For L2 distance
CREATE INDEX ON documents USING hnsw (embedding vector_l2_ops);

-- For inner product
CREATE INDEX ON documents USING hnsw (embedding vector_ip_ops);
                    `}</CodeBlock>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Index Options</h3>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<p>Customize HNSW parameters:</p>
										<CodeBlock language="sql">{`
CREATE INDEX ON documents
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
                    `}</CodeBlock>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="vectordb" className="m-0 space-y-8">
							<div className="space-y-4">
								<h2 className="text-2xl font-bold tracking-tight">
									VectorDB Usage
								</h2>
								<p className="text-muted-foreground">
									Configure and use the VectorDB library for efficient vector
									storage and retrieval.
								</p>
							</div>

							<div className="space-y-6">
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Configuration</h3>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<CodeBlock language="typescript">{`
import { documentsVectorDB } from '@/lib/db/vector';

// All reads/writes require courseId for isolation
await documentsVectorDB.addText(notes, {
  courseId: 'math-101',
  chunkingMethod: 'paragraph',
});

const hits = await documentsVectorDB.searchSimilar(question, {
  courseId: 'math-101',
  limit: 5,
});
                    `}</CodeBlock>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Basic Operations</h3>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<CodeBlock language="typescript">{`
await documentsVectorDB.addText(text, {
  courseId: 'math-101',
  chunkingMethod: 'paragraph',
  metadata: { source: 'docs' }
});

const results = await documentsVectorDB.searchSimilar(query, {
  courseId: 'math-101',
  limit: 5,
  distance: 'cosine',
  filter: { source: 'docs' }
});
                    `}</CodeBlock>
									</div>
								</div>
							</div>
						</TabsContent>

						<TabsContent value="examples" className="m-0 space-y-8">
							<div className="space-y-4">
								<h2 className="text-2xl font-bold tracking-tight">
									Example Usage
								</h2>
								<p className="text-muted-foreground">
									Explore examples of integrating vector search and RAG
									capabilities into your Next.js application.
								</p>
							</div>

							<div className="space-y-6">
								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Chat with Documents</h3>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<p>
											See the chat implementation in <code>src/app/(chat)</code>{" "}
											for a complete example of:
										</p>
										<ul className="list-disc list-inside space-y-2 text-muted-foreground">
											<li>Document ingestion with chunking</li>
											<li>Semantic search with metadata filtering</li>
											<li>Streaming chat responses with context</li>
										</ul>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Chunking Methods</h3>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<CodeBlock language="typescript">{`
// Sentence-based chunking
const chunks = vectorDB.chunkText(text, 'sentence');

// Paragraph-based chunking
const chunks = vectorDB.chunkText(text, 'paragraph');

// Fixed-size chunking
const chunks = vectorDB.chunkText(text, 'fixed');
                    `}</CodeBlock>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-semibold">Similarity Metrics</h3>
									<div className="pl-6 border-l-2 border-muted space-y-3">
										<CodeBlock language="typescript">{`
// Cosine similarity (normalized vectors)
const results = await vectorDB.searchSimilar(query, {
  distance: 'cosine'
});

// Euclidean distance
const results = await vectorDB.searchSimilar(query, {
  distance: 'euclidean'
});

// Inner product
const results = await vectorDB.searchSimilar(query, {
  distance: 'inner_product'
});
                    `}</CodeBlock>
									</div>
								</div>
							</div>
						</TabsContent>
					</div>
				</Tabs>
			</Card>

			<div className="text-sm text-muted-foreground">
				<p>
					EduAI / ship7 — boilerplate based on NextRag. See the project README for
					Docker and hackathon roadmap.
				</p>
			</div>
		</div>
	);
}
