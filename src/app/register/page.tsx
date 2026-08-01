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

export default function RegisterPage() {
	const { register, loginWithGoogle, firebaseUser, loading } = useAuth();
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
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
			await register({ email, password, name });
			toast.success("Cuenta creada");
			router.push("/dashboard");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo registrar");
		} finally {
			setSubmitting(false);
		}
	};

	const handleGoogle = async () => {
		setSubmitting(true);
		try {
			await loginWithGoogle();
			toast.success("Listo");
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
				<Card className="w-full max-w-md border-brand shadow-none">
					<CardHeader>
						<CardTitle className="text-2xl">Crear cuenta</CardTitle>
						<p className="text-sm text-muted-foreground">
							Registrate en Bookworm para crear cursos o unirte a los que ya
							existen.
						</p>
					</CardHeader>
					<CardContent className="space-y-4">
						<form onSubmit={handleSubmit} className="space-y-4">
							<Input
								placeholder="Nombre (opcional)"
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
								placeholder="Contraseña (mín. 6)"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								minLength={6}
								required
							/>
							<Button
								type="submit"
								className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
								disabled={submitting}
							>
								{submitting ? "Creando…" : "Registrarme"}
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
							¿Ya tenés cuenta?{" "}
							<Link
								href="/login"
								className="text-primary underline-offset-4 hover:underline"
							>
								Iniciar sesión
							</Link>
						</p>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}
