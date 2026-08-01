"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
	const { login, firebaseUser, loading } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (!loading && firebaseUser) {
			router.replace("/dashboard");
		}
	}, [loading, firebaseUser, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		try {
			await login(email, password);
			toast.success("Welcome back");
			router.push("/dashboard");
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : "Login failed");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<main className="flex-1 flex items-center justify-center px-4 py-12">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="font-mono text-2xl">Log in</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<Input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
							<Input
								type="password"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
							<Button type="submit" className="w-full" disabled={submitting}>
								{submitting ? "Signing in…" : "Sign in"}
							</Button>
						</form>
						<p className="mt-4 text-sm text-muted-foreground text-center">
							No account?{" "}
							<Link href="/register" className="text-primary underline-offset-4 hover:underline">
								Register
							</Link>
						</p>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
