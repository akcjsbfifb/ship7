"use client";

import { GraduationCap, KeyRound, Plus } from "lucide-react";
import { useState } from "react";

import { CourseCard } from "@/components/course-card";
import { CreateCourseDialog } from "@/components/create-course-dialog";
import { JoinClassDialog } from "@/components/join-class-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MeResponse } from "@/lib/types";

export function DashboardHome({
	me,
	onRefresh,
	onBecomeTeacher,
}: {
	me: MeResponse;
	onRefresh: () => void;
	onBecomeTeacher: () => Promise<void>;
}) {
	const [joinOpen, setJoinOpen] = useState(false);
	const [createOpen, setCreateOpen] = useState(false);
	const firstName =
		me.user.name?.split(/\s+/)[0] || me.user.email.split("@")[0] || "vos";
	const isTeacher = me.user.role === "TEACHER";

	return (
		<main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
			<section className="mb-8 flex flex-col gap-1">
				<h2 className="text-balance text-xl font-semibold tracking-tight md:text-2xl">
					Hola, {firstName}
				</h2>
				<p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
					Unite a una clase con el código que te compartió tu docente, o creá tu
					propio curso y sumá material para que trabaje el agente de IA.
				</p>
			</section>

			<section
				aria-label="Acciones rápidas"
				className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-2"
			>
				<div className="flex flex-col gap-4 rounded-xl border border-brand/40 bg-brand/5 p-5">
					<div className="flex items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-brand/40 bg-brand/10 text-brand">
							<KeyRound className="size-5" />
						</div>
						<div className="min-w-0">
							<h3 className="text-base font-medium leading-snug">
								Unirme a una clase
							</h3>
							<p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
								Ingresá el código de invitación de tu curso.
							</p>
						</div>
					</div>
					<Button className="w-full sm:w-auto" onClick={() => setJoinOpen(true)}>
						<KeyRound className="size-4" />
						Ingresar código
					</Button>
				</div>

				<div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
					<div className="flex items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-secondary text-foreground">
							<GraduationCap className="size-5" />
						</div>
						<div className="min-w-0">
							<h3 className="text-base font-medium leading-snug">
								Crear un curso
							</h3>
							<p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
								Sos docente: armá el curso y compartí el código con tu clase.
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						className="w-full sm:w-auto"
						onClick={() => setCreateOpen(true)}
					>
						<Plus className="size-4" />
						Crear curso
					</Button>
				</div>
			</section>

			<Tabs defaultValue="student" className="space-y-6">
				<TabsList>
					<TabsTrigger value="student">
						Mis clases
						<span className="ml-1.5 text-muted-foreground">
							{me.enrolled.length}
						</span>
					</TabsTrigger>
					<TabsTrigger value="teacher">
						Cursos que dicto
						<span className="ml-1.5 text-muted-foreground">
							{me.owned.length}
						</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="student">
					{me.enrolled.length > 0 ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{me.enrolled.map((course) => (
								<CourseCard key={course.id} course={course} role="student" />
							))}
						</div>
					) : (
						<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-14 text-center">
							<div className="flex size-12 items-center justify-center rounded-full border border-brand/40 bg-brand/10 text-brand">
								<KeyRound className="size-5" />
							</div>
							<div>
								<p className="font-medium">Todavía no estás en ninguna clase</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Pedile el código a tu docente para unirte a tu primer curso.
								</p>
							</div>
							<Button onClick={() => setJoinOpen(true)}>
								<KeyRound className="size-4" />
								Ingresar código
							</Button>
						</div>
					)}
				</TabsContent>

				<TabsContent value="teacher">
					{me.owned.length > 0 ? (
						<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
							{me.owned.map((course) => (
								<CourseCard key={course.id} course={course} role="teacher" />
							))}
						</div>
					) : (
						<div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-14 text-center">
							<div className="flex size-12 items-center justify-center rounded-full border border-border bg-secondary">
								<GraduationCap className="size-5" />
							</div>
							<div>
								<p className="font-medium">Aún no creaste cursos</p>
								<p className="mt-1 text-sm text-muted-foreground">
									Creá tu primer curso para subir material y configurar su
									agente de IA.
								</p>
							</div>
							<Button variant="outline" onClick={() => setCreateOpen(true)}>
								<Plus className="size-4" />
								Crear curso
							</Button>
						</div>
					)}
				</TabsContent>
			</Tabs>

			<JoinClassDialog
				open={joinOpen}
				onOpenChange={setJoinOpen}
				onJoined={onRefresh}
			/>
			<CreateCourseDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				canCreate={isTeacher}
				onBecomeTeacher={onBecomeTeacher}
				onCreated={onRefresh}
			/>
		</main>
	);
}
