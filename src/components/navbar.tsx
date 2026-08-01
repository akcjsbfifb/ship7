"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
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
		<header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
			<div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
				<Link href="/" className="flex items-center">
					<Image
						src="/logos/bookworm-wordmark.png"
						alt="Bookworm"
						width={100}
						height={28}
						className="h-7 w-auto dark:hidden"
						priority
					/>
					<Image
						src="/logos/bookworm-wordmark-dark.png"
						alt="Bookworm"
						width={100}
						height={28}
						className="hidden h-7 w-auto dark:block"
						priority
					/>
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
