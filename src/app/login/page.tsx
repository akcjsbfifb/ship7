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
	const { login, loginWithGoogle, firebaseUser, loading } = useAuth();
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
			toast.success("Bienvenido");
			router.push("/dashboard");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "No se pudo iniciar sesión",
			);
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogle = async () => {
		setSubmitting(true);
		try {
			await loginWithGoogle();
			toast.success("Bienvenido");
			router.push("/dashboard");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "No se pudo entrar con Google",
			);
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<main className="flex-1 flex items-center justify-center px-4 py-12">
				<Card className="w-full max-w-md border-brand/70 shadow-none dark:border-brand/35">
					<CardHeader>
						<CardTitle className="text-2xl">Iniciar sesión</CardTitle>
						<p className="text-sm text-muted-foreground">
							Entrá a Bookworm para ver tus clases y el tutor IA.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
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
								placeholder="Contraseña"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
							<Button
								type="submit"
								className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
								disabled={submitting}
							>
								{submitting ? "Ingresando…" : "Ingresar"}
							</Button>
						</form>
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-card px-2 text-muted-foreground">o</span>
							</div>
						</div>
						<Button
							type="button"
							variant="outline"
							className="w-full"
							disabled={submitting}
							onClick={handleGoogle}
						>
							Continuar con Google
						</Button>
						<p className="text-sm text-muted-foreground text-center">
							¿No tenés cuenta?{" "}
							<Link
								href="/register"
								className="text-primary underline-offset-4 hover:underline"
							>
								Registrate
							</Link>
						</p>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
