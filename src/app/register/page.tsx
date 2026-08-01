"use client";

import { useAuth, type AppRole } from "@/components/auth/auth-provider";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function RegisterPage() {
	const { register, firebaseUser, loading } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [role, setRole] = useState<AppRole>("STUDENT");
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
			await register({ email, password, name, role });
			toast.success("Account created");
			router.push("/dashboard");
		} catch (err) {
			console.error(err);
			toast.error(err instanceof Error ? err.message : "Registration failed");
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
						<CardTitle className="font-mono text-2xl">Create account</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<Input
								placeholder="Name (optional)"
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
							<Input
								type="email"
								placeholder="Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
							<Input
								type="password"
								placeholder="Password (min 6)"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								minLength={6}
								required
							/>
							<div className="space-y-2">
								<p className="text-sm text-muted-foreground">I am a…</p>
								<div className="grid grid-cols-2 gap-2">
									<Button
										type="button"
										variant={role === "STUDENT" ? "default" : "outline"}
										onClick={() => setRole("STUDENT")}
									>
										Student
									</Button>
									<Button
										type="button"
										variant={role === "TEACHER" ? "default" : "outline"}
										onClick={() => setRole("TEACHER")}
									>
										Teacher
									</Button>
								</div>
							</div>
							<Button type="submit" className="w-full" disabled={submitting}>
								{submitting ? "Creating…" : "Register"}
							</Button>
						</form>
						<p className="mt-4 text-sm text-muted-foreground text-center">
							Already have an account?{" "}
							<Link href="/login" className="text-primary underline-offset-4 hover:underline">
								Log in
							</Link>
						</p>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
