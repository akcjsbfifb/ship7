"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { useAuth } from "@/components/auth/auth-provider";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardHome } from "@/components/dashboard-home";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth/client-api";
import type { MeResponse } from "@/lib/types";

export default function DashboardPage() {
	const { firebaseUser, loading, syncProfile } = useAuth();
	const router = useRouter();
	const [me, setMe] = useState<MeResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		try {
			setError(null);
			const res = await authFetch("/api/me");
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Failed to load");
			setMe(data);
		} catch (err) {
			console.error(err);
			const msg = err instanceof Error ? err.message : "Failed to load profile";
			setError(msg);
			toast.error(msg);
		}
	}, []);

	useEffect(() => {
		if (loading) return;
		if (!firebaseUser) {
			router.replace("/login");
			return;
		}
		void load();
	}, [firebaseUser, loading, load, router]);

	const becomeTeacher = async () => {
		await syncProfile({ role: "TEACHER" });
		toast.success("Ahora sos profesor");
		await load();
	};

	if (loading || (!me && !error)) {
		return (
			<div className="min-h-dvh bg-background text-foreground">
				<DashboardHeader />
				<main className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
					Cargando…
				</main>
			</div>
		);
	}

	if (error && !me) {
		return (
			<div className="min-h-dvh bg-background text-foreground">
				<DashboardHeader />
				<main className="flex flex-col items-center justify-center gap-4 px-4 py-24">
					<p className="text-center text-muted-foreground">{error}</p>
					<Button onClick={() => void load()}>Reintentar</Button>
				</main>
			</div>
		);
	}

	if (!me) return null;

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<DashboardHeader user={me.user} />
			<DashboardHome
				me={me}
				onRefresh={() => void load()}
				onBecomeTeacher={becomeTeacher}
			/>
		</div>
	);
}
