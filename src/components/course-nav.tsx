"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CourseTab = "stream" | "classwork" | "people" | "ia";

export function CourseNav({
	tabs,
	value,
	onChange,
}: {
	tabs: { value: CourseTab; label: string; icon: LucideIcon }[];
	value: CourseTab;
	onChange: (tab: CourseTab) => void;
}) {
	return (
		<nav
			aria-label="Secciones del curso"
			className="sticky top-[57px] z-10 border-b border-border bg-background/80 backdrop-blur-md"
		>
			<div className="flex items-center gap-1 overflow-x-auto px-2 md:px-4">
				{tabs.map((t) => {
					const active = t.value === value;
					const Icon = t.icon;
					return (
						<button
							key={t.value}
							type="button"
							onClick={() => onChange(t.value)}
							aria-current={active ? "page" : undefined}
							className={cn(
								"relative flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-3.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50",
								active
									? "text-brand"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							<Icon className="size-4" />
							{t.label}
							{active && (
								<span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
							)}
						</button>
					);
				})}
			</div>
		</nav>
	);
}
