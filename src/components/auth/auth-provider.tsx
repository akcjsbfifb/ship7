"use client";

import {
	type User as FirebaseUser,
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	updateProfile,
} from "firebase/auth";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { toAuthError } from "@/lib/auth/firebase-errors";
import { auth, googleProvider } from "@/lib/firebase/client";

type AuthContextValue = {
	firebaseUser: FirebaseUser | null;
	loading: boolean;
	getIdToken: () => Promise<string | null>;
	login: (email: string, password: string) => Promise<void>;
	register: (opts: {
		email: string;
		password: string;
		name?: string;
	}) => Promise<void>;
	loginWithGoogle: () => Promise<void>;
	logout: () => Promise<void>;
	syncProfile: (opts?: {
		name?: string;
		role?: "TEACHER" | "STUDENT";
	}) => Promise<unknown>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		return onAuthStateChanged(auth, (user) => {
			setFirebaseUser(user);
			setLoading(false);
		});
	}, []);

	const getIdToken = useCallback(async () => {
		if (!auth.currentUser) return null;
		return auth.currentUser.getIdToken();
	}, []);

	const syncProfile = useCallback(
		async (opts?: { name?: string; role?: "TEACHER" | "STUDENT" }) => {
			try {
				const token = await getIdToken();
				if (!token) throw new Error("Not authenticated");

				const res = await fetch("/api/auth/sync", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(opts ?? {}),
				});

				const data = await res.json();
				if (!res.ok) {
					throw new Error(data.error || "No se pudo sincronizar el perfil");
				}
				return data.user;
			} catch (err) {
				throw toAuthError(err);
			}
		},
		[getIdToken],
	);

	const login = useCallback(
		async (email: string, password: string) => {
			try {
				await signInWithEmailAndPassword(auth, email, password);
				await syncProfile();
			} catch (err) {
				throw toAuthError(err);
			}
		},
		[syncProfile],
	);

	const register = useCallback(
		async ({
			email,
			password,
			name,
		}: {
			email: string;
			password: string;
			name?: string;
		}) => {
			try {
				const cred = await createUserWithEmailAndPassword(
					auth,
					email,
					password,
				);
				if (name?.trim()) {
					await updateProfile(cred.user, { displayName: name.trim() });
				}
				await syncProfile({ name: name?.trim() });
			} catch (err) {
				throw toAuthError(err);
			}
		},
		[syncProfile],
	);

	const loginWithGoogle = useCallback(async () => {
		try {
			const result = await signInWithPopup(auth, googleProvider);
			const name = result.user.displayName?.trim() || undefined;
			await syncProfile(name ? { name } : undefined);
		} catch (err) {
			throw toAuthError(err);
		}
	}, [syncProfile]);

	const logout = useCallback(async () => {
		await signOut(auth);
	}, []);

	const value = useMemo(
		() => ({
			firebaseUser,
			loading,
			getIdToken,
			login,
			register,
			loginWithGoogle,
			logout,
			syncProfile,
		}),
		[
			firebaseUser,
			loading,
			getIdToken,
			login,
			register,
			loginWithGoogle,
			logout,
			syncProfile,
		],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return ctx;
}
