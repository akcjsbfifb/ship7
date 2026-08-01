/** Friendly auth messages — never surface Firebase/Next raw errors to the UI. */

const MESSAGES: Record<string, string> = {
	"auth/email-already-in-use": "Ese email ya está registrado. Probá iniciar sesión.",
	"auth/invalid-email": "Email inválido.",
	"auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
	"auth/user-not-found": "No encontramos una cuenta con ese email.",
	"auth/wrong-password": "Email o contraseña incorrectos.",
	"auth/invalid-credential": "Email o contraseña incorrectos.",
	"auth/too-many-requests": "Demasiados intentos. Esperá un momento e intentá de nuevo.",
	"auth/popup-closed-by-user": "Cerraste la ventana de Google.",
	"auth/cancelled-popup-request": "Se canceló el inicio con Google.",
	"auth/popup-blocked": "El navegador bloqueó la ventana de Google. Permití popups e intentá de nuevo.",
	"auth/network-request-failed": "Error de red. Revisá tu conexión.",
	"auth/account-exists-with-different-credential":
		"Ese email ya existe con otro método de acceso. Probá email/contraseña o Google.",
};

function getErrorCode(err: unknown): string | null {
	if (!err || typeof err !== "object") return null;
	if ("code" in err && typeof (err as { code: unknown }).code === "string") {
		return (err as { code: string }).code;
	}
	return null;
}

export function getAuthErrorMessage(err: unknown): string {
	const code = getErrorCode(err);
	if (code && MESSAGES[code]) return MESSAGES[code];

	if (err instanceof Error && err.message && !err.message.startsWith("Firebase:")) {
		// Our own thrown messages (e.g. sync failures)
		if (err.message === "Not authenticated") return "No estás autenticado.";
		if (!err.message.includes("auth/")) return err.message;
	}

	return "No se pudo completar. Intentá de nuevo.";
}

export function toAuthError(err: unknown): Error {
	return new Error(getAuthErrorMessage(err));
}
