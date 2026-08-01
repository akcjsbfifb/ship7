"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
	{ href: "/", label: "Home" },
	{ href: "/dashboard", label: "Cursos" },
];

export function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const { firebaseUser, loading, logout } = useAuth();

	const handleLogout = async () => {
		await logout();
		router.push("/login");
	};

	return (
		<header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
			<div className="max-w-[1200px] mx-auto flex h-16 items-center justify-between px-4">
				<Link href="/" className="flex items-center gap-2">
					<span className="flex size-8 items-center justify-center rounded-lg border border-brand/40 bg-brand/10 text-brand">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="size-4"
							aria-hidden
						>
							<path d="M22 10v6M2 10l10-5 10 5-10 5z" />
							<path d="M6 12v5c3 3 9 3 12 0v-5" />
						</svg>
					</span>
					<span className="font-semibold text-lg">EducAI</span>
				</Link>
				<div className="flex items-center gap-6">
					<nav className="flex items-center gap-4">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`text-sm transition-colors hover:text-foreground/80 ${
									pathname === item.href ||
									(item.href !== "/" && pathname.startsWith(item.href))
										? "text-foreground font-medium"
										: "text-muted-foreground"
								}`}
							>
								{item.label}
							</Link>
						))}
					</nav>
					{!loading &&
						(firebaseUser ? (
							<div className="flex items-center gap-2">
								<span className="hidden sm:inline text-xs text-muted-foreground max-w-[140px] truncate">
									{firebaseUser.email}
								</span>
								<Button variant="outline" size="sm" onClick={handleLogout}>
									Log out
								</Button>
							</div>
						) : (
							<Button variant="default" size="sm" asChild>
								<Link href="/login">Log in</Link>
							</Button>
						))}
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
