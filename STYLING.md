# Especificación de Diseño UI/UX y Sistema de Estilos — Bookworm

Este archivo actúa como un *contexto estructurado de alta precisión* diseñado para ser inyectado directamente en una IA de desarrollo frontend (como Claude, GPT-4o, o v0.dev). Transforma los requerimientos iniciales en tokens de diseño claros, una arquitectura de componentes detallada y directrices estrictas de comportamiento visual.

---

## 1. Design Tokens & Sistema de Estilos (Tailwind CSS)

Aplica estrictamente las siguientes paletas cromáticas y reglas estéticas según el tema dinámico activo:

### ☀️ MODO CLARO (Light Mode)
* *Fondo Principal:* #FFFFFF / bg-white
* *Superficies / Cards:* #F9FAFB / bg-gray-50
* *Texto Primario:* #111827 / text-gray-900
* *Texto Secundario:* #4B5563 / text-gray-600
* *Acento Sutil (Lima):* #84CC16 / text-lime-500 / border-lime-500 (Exclusivo para bordes interactivos o indicadores activos mínimos)
* *Bordes Estándar:* #E5E7EB / border-gray-200

### 🌙 MODO OSCURO (Dark Mode)
* *Fondo Principal:* #0B0B0C / bg-zinc-950
* *Superficies / Cards:* #18181B / bg-zinc-900
* *Texto Primario:* #F4F4F5 / text-zinc-100
* *Texto Secundario:* #A1A1AA / text-zinc-400
* *Acento Sutil (Musgo):* #3F6212 / text-lime-800 / border-lime-800 o #4D7C0F / border-lime-700 (Tonos verdes apagados/mutados)
* *Bordes Estándar:* #27272A / border-zinc-800

### 📐 Geometría y Filosofía Visual
* *Redondeado Global:* Aplica rounded-xl (12px) a contenedores principales, paneles y cards. Usa rounded-lg (8px) para botones, inputs y elementos interactivos menores.
* *Filosofía Minimalista:* Los acentos verdes nunca deben usarse como fondos sólidos extensos. Solo se permiten en propiedades de border, pequeños círculos de estado (w-2 h-2), o estados focales muy sutiles. La UI debe ser limpia y esencialmente monocromática.

---

## 2. Estructura de la Interfaz & Layout

El sistema se compone de tres layouts principales conectados fluidamente:

### Vista 0: Pantalla de Autenticación (Login / Signup)
* *Diseño de Pantalla Completa:* Un contenedor centrado (flex items-center justify-center min-h-screen) sobre el fondo principal.
* *Card de Autenticación:* Un contenedor minimalista (max-w-md w-full p-8 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl).
* *Sección de Branding:* Logotipo e isotipo de Bookworm en alta fidelidad tipográfica, acompañados de una breve descripción en texto secundario.
* *Formulario Tradicional (Email & Password):* 
  * Inputs limpios y minimalistas para el correo electrónico y la contraseña con placeholders sutiles.
  * Los campos deben usar bordes estándar que reaccionan con el color de acento (focus:border-lime-500 o focus:border-lime-700) únicamente al entrar en estado de foco.
  * Botón principal sólido de acción ("Iniciar Sesión" / "Registrarse") de estilo sobrio y monocromático en grises/negros, o con un sutil delineado verde según el tema.
  * Enlace discreto en la parte inferior para alternar de manera fluida entre las vistas de Login y Signup.

### Vista 1: Dashboard de Cursos (Estilo Google Classroom)
* Una cuadrícula limpia y espaciosa (grid grid-cols-1 md:grid-cols-3 gap-6).
* Las cards de los cursos deben ser minimalistas, sin ruido visual secundario, priorizando una tipografía robusta e indicadores discretos sobre la cantidad de temas o tareas pendientes.
* Incluye un menú superior o lateral de navegación para gestionar el perfil del alumno y la opción de cerrar sesión.

### Vista 2: Espacio de Trabajo del Tema (Split Pane - Estilo NotebookLM)
Al seleccionar un tema específico, la interfaz se divide verticalmente en dos áreas de interacción independientes:
1. *Panel Izquierdo (Fuentes y Materiales):*
   * Contenedor con scroll independiente (overflow-y-auto) que lista la bibliografía, archivos PDF, notas y enlaces web asociados.
   * *Sección de Contexto IA:* Al final de esta lista de fuentes, añadir un bloque colapsable/diferenciado claramente. Contiene el material extra que el estudiante no necesita leer directamente, pero que es procesado como contexto de trasfondo por la IA.
2. *Panel Derecho (Chatbot Integrado):*
   * Interfaz conversacional limpia donde los mensajes fluyen en un eje vertical.
   * Incluye las respuestas de la IA con soporte para burbujas de citas interactivas vinculadas a las fuentes del panel izquierdo.

---

## 3. Especificaciones de Componentes e Interacciones

* *Acciones Contextuales en Hover (Quick Queries):* Al pasar el cursor sobre cualquier fila de archivo, enlace o tema del panel izquierdo (group-hover:opacity-100 transition-opacity), debe emerger un botón flotante minimalista con un icono de chat ("Preguntar sobre esta fuente"). Al hacer clic, se enfoca automáticamente el input del chat y se preestablece un chip contextual (ej: "Analizando: [Nombre del Archivo]").
* *Input de Consulta Adaptable:* Una barra de entrada inferior anclada permanentemente en el panel derecho de chat. Soporta crecimiento dinámico automático de altura según las líneas de texto introducidas, esquinas redondeadas (rounded-xl), y un botón de envío integrado en el extremo derecho controlado visualmente por el color de acento según el tema activo (Lima en light / Musgo en dark).

---

## 4. Prompt Maestro de Frontend (Listo para Copiar)

Copia íntegramente el siguiente recuadro y provéelo a tu IA de frontend para iniciar la generación del código:

```text
Act as an expert frontend developer specialized in Tailwind CSS, React, and clean UI/UX design. Build the user interface for "Bookworm", a minimalist educational web application based on the following structural and design specifications:

1. GLOBAL STYLING & PALETTE (Strict Monochromatic + Muted Green Accents):
   - Light Mode: Background white (#FFFFFF), surfaces gray-50 (#F9FAFB), text gray-900 (#111827), borders gray-200 (#E5E7EB). Accent: Lime Green (#84CC16) ONLY for subtle interactive borders or active indicator dots.
   - Dark Mode: Background zinc-950 (#0B0B0C), surfaces zinc-900 (#18181B), text zinc-100 (#F4F4F5), borders zinc-800 (#27272A). Accent: Moss/Dark Green (#3F6212 or #4D7C0F) for muted highlights.
   - Geometry: Use smooth rounded borders (rounded-xl / 12px for main panels; rounded-lg / 8px for smaller interactive elements).

2. LAYOUT ARCHITECTURE:
   - Auth Screen (Login / Signup): A full-screen centered container (min-h-screen flex items-center justify-center). Contains a clean, elegant card housing a classic Email & Password form. Inputs must have subtle placeholders and use focus-controlled accent borders (focus:border-lime-500 in light / focus:border-lime-700 in dark). Include a primary submit button and a minimalist text link at the bottom to toggle smoothly between Login and Signup modes.
   - Dashboard View: Google Classroom style grid layout for course cards. Minimalist design, high typography contrast, low noise. Includes a clean top navbar with a user profile avatar dropdown containing log-out options.
   - Topic/Workspace View (NotebookLM Style Split-Pane):
     * Left Column (Sources & Materials): Vertical layout to list files, documents, and bibliography. At the very bottom, include an isolated, collapsible section for "AI Context Material" (background reference material for the AI, marked as non-mandatory for students).
     * Right Column (AI Chat Interface): Fixed split panel housing the conversation. Messages stack vertically with dynamic reference citations that tie back to the documents on the left.

3. INTERACTION & UTILITIES:
   - Contextual Hover Action: Passing the cursor over any topic or file row reveals a subtle "Ask AI about this" button (opacity-0 group-hover:opacity-100 transition). Clicking it automatically populates and targets the query inside the main chat workspace.
   - Chat Input: An elegant chat box anchored at the bottom with auto-grow heights, clean padding, and an integrated submit action button on the far right styled with theme-specific accent borders.

Please write clean, modular component code (React/TypeScript + Tailwind CSS) that reflects this distraction-free aesthetic. Avoid heavy shadows or saturated gradients. Focus heavily on whitespace and robust typography.
