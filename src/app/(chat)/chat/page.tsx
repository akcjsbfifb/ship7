"use client";

import { Navbar } from "@/components/navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import Link from "next/link";

export default function PlaygroundPage() {
	return (
		<div className="max-w-6xl mx-auto space-y-8 py-8 px-4">
			<div className="space-y-4">
				<h1 className="text-4xl font-bold tracking-tight">Playground moved</h1>
				<p className="text-muted-foreground text-lg">
					Ingest, search, and tutor chat now live inside each course after you
					sign in.
				</p>
			</div>

			<Alert variant="default" className="bg-muted">
				<Lightbulb className="h-4 w-4" />
				<AlertTitle>Course-scoped RAG</AlertTitle>
				<AlertDescription>
					Create or join a course from the dashboard. Each course has its own
					isolated knowledge base.
				</AlertDescription>
			</Alert>

			<Button asChild>
				<Link href="/dashboard">Go to dashboard →</Link>
			</Button>
		</div>
	);
}
