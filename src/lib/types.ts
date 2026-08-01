export type CourseSummary = {
	id: string;
	title: string;
	description: string | null;
	inviteCode: string;
	teacherId: string;
	createdAt?: string;
};

export type MeUser = {
	id: string;
	email: string;
	name: string | null;
	photoUrl?: string | null;
	role: "TEACHER" | "STUDENT";
};

export type MeResponse = {
	user: MeUser;
	owned: CourseSummary[];
	enrolled: CourseSummary[];
};

export function initialsOf(name: string | null | undefined, email?: string) {
	const source = (name || email || "?").replace(/^Prof\.\s*/i, "").trim();
	return source
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}
