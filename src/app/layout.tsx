import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
	title: "EducAI: un tutor IA anclado a la bibliografía de tu cátedra",
	description:
		"Creá cursos, subí el material y tus alumnos estudian con una IA que responde solo con las fuentes del curso, citando cada respuesta.",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="es" suppressHydrationWarning>
			<body
				className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased min-h-screen bg-background`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>
						<Toaster richColors position="top-center" />
						{children}
					</AuthProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
