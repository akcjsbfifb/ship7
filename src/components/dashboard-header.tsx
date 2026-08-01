"use client";

import { GraduationCap, LogOut } from "lucide-react";
import Link from "next/link";

import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsOf, type MeUser } from "@/lib/types";

export function DashboardHeader({ user }: { user?: MeUser | null }) {
	const { firebaseUser, logout } = useAuth();
	const displayName =
		user?.name || firebaseUser?.displayName || user?.email || "Usuario";
	const email = user?.email || firebaseUser?.email || "";
	const photoURL = firebaseUser?.photoURL ?? undefined;

	return (
		<header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md">
			<div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-6">
				<Link href="/dashboard" className="flex items-center gap-3 min-w-0">
					<div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-brand/40 bg-brand/10 text-brand">
						<GraduationCap className="size-5" />
					</div>
					<div className="min-w-0">
						<h1 className="text-base font-semibold leading-tight tracking-tight md:text-lg">
							EducAI
						</h1>
						<p className="truncate text-xs text-muted-foreground">
							Mis clases y cursos
						</p>
					</div>
				</Link>

				<div className="flex-1" />

				<ThemeToggle />

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
							aria-label="Abrir menú de perfil"
						>
							<Avatar className="size-9">
								{photoURL ? (
									<AvatarImage src={photoURL} alt={displayName} referrerPolicy="no-referrer" />
								) : null}
								<AvatarFallback className="bg-secondary text-xs font-medium">
									{initialsOf(displayName, email)}
								</AvatarFallback>
							</Avatar>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-56">
						<DropdownMenuLabel>
							<div className="flex flex-col">
								<span className="text-sm font-medium">{displayName}</span>
								<span className="text-xs font-normal text-muted-foreground">
									{email}
								</span>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => void logout()}
							className="text-destructive focus:text-destructive"
						>
							<LogOut className="size-4" />
							Cerrar sesión
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
