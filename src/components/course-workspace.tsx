"use client";

import {
	Bot,
	ClipboardList,
	Newspaper,
	Users,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ChatbotPanel } from "@/components/course/chatbot-panel";
import { ClassroomPanel } from "@/components/course/classroom-panel";
import { StudentsPanel } from "@/components/course/students-panel";
import { CourseHeader } from "@/components/course-header";
import { CourseNav, type CourseTab } from "@/components/course-nav";
import { StreamPage } from "@/components/pages/stream-page";
import type { CourseSummary, MeUser } from "@/lib/types";

export function CourseWorkspace({
	course: initialCourse,
	isTeacher,
	user,
	studentCount,
}: {
	course: CourseSummary;
	isTeacher: boolean;
	user: MeUser;
	studentCount?: number;
}) {
	const [course, setCourse] = useState(initialCourse);
	const [tab, setTab] = useState<CourseTab>(isTeacher ? "classwork" : "ia");

	const tabs = useMemo(() => {
		const base: { value: CourseTab; label: string; icon: typeof Bot }[] = [
			{ value: "stream", label: "Novedades", icon: Newspaper },
			{ value: "classwork", label: "Trabajo en clase", icon: ClipboardList },
		];
		if (isTeacher) {
			base.push({ value: "people", label: "Personas", icon: Users });
		}
		base.push({ value: "ia", label: "Asistente IA", icon: Bot });
		return base;
	}, [isTeacher]);

	return (
		<div className="flex h-dvh flex-col bg-background text-foreground">
			<CourseHeader
				course={course}
				isTeacher={isTeacher}
				studentCount={studentCount}
				user={user}
				onCourseUpdate={setCourse}
			/>
			<CourseNav tabs={tabs} value={tab} onChange={setTab} />

			{tab === "ia" ? (
				<main className="min-h-0 flex-1 overflow-hidden p-4 md:p-6">
					<div className="mx-auto h-full max-w-6xl">
						<ChatbotPanel courseId={course.id} isTeacher={isTeacher} />
					</div>
				</main>
			) : (
				<main className="min-h-0 flex-1 overflow-y-auto">
					{tab === "stream" && (
						<StreamPage
							course={course}
							isTeacher={isTeacher}
							studentCount={studentCount}
							onCourseUpdate={setCourse}
						/>
					)}
					{tab === "classwork" && (
						<div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
							<div className="mb-5">
								<h1 className="text-lg font-semibold">Trabajo en clase</h1>
								<p className="text-sm text-muted-foreground">
									Temas y material del curso. Lo que subís se indexa para el
									tutor IA.
								</p>
							</div>
							<ClassroomPanel courseId={course.id} isTeacher={isTeacher} />
						</div>
					)}
					{tab === "people" && isTeacher && (
						<div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6">
							<div className="mb-5">
								<h1 className="text-lg font-semibold">Personas</h1>
								<p className="text-sm text-muted-foreground">
									Alumnos inscriptos en este curso.
								</p>
							</div>
							<StudentsPanel courseId={course.id} />
						</div>
					)}
				</main>
			)}
		</div>
	);
}
