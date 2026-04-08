# Prompt de arranque — Claude Code

## Contexto del proyecto

Estoy construyendo un tablero de diseño de presentaciones con canvas infinito. El sistema tiene 5 zonas secuenciales donde diseño presentaciones de principio a fin sin saltar entre herramientas externas.

Ya tengo diseñados:
- Arquitectura técnica completa (ver sistema_documentacion_completa.md)
- Schemas de datos de todas las zonas
- 5 prototipos HTML funcionales (zona1 a zona5)

## Stack definido

- **Frontend / Canvas:** Next.js 14 + tldraw (canvas infinito)
- **UI:** shadcn/ui + Tailwind CSS
- **Backend:** Node.js + Express (orquestador de agentes)
- **IA:** Claude API (claude-sonnet-4)
- **Base de datos:** Supabase (Postgres + pgvector + Storage + Realtime)
- **Deploy:** Vercel (frontend) + Railway (backend)

## Las 5 zonas del sistema

1. **Zona 1** — Diagnóstico de contexto y audiencia (con 4 canales de entrada: voz, URLs externas, documentos internos, brand book)
2. **Zona 2A** — Mapa de tópicos (con aprendizaje del patrón del autor)
3. **Zona 2B** — Arquitectura narrativa (frameworks de storytelling con fit_score)
4. **Curva emocional** — Objeto central que todos los agentes leen y escriben (peaks/valleys/transitions)
5. **Zona 3** — Assets (Drive propio + Pinterest mood → generación IA con Arena mode: Flux Pro 1.1 vs Nanobanana Pro vs Recraft V3)
6. **Zona 4** — Crítico de diseño (Canva API webhook + sugerencias ejecutables con aprobación manual)
7. **Zona 5** — Storyboard filmstrip + control de tiempo

## Brand Layer

Restricción global transversal que aplica sobre todas las zonas. Se carga desde un PDF (brand book) y genera propagation_rules hacia todos los agentes.

## Tarea inicial

Construye el scaffold completo del proyecto con esta estructura:

```
/apps
  /web          → Next.js + tldraw
  /api          → Node.js + Express
/packages
  /shared       → tipos TypeScript compartidos
  /supabase     → schema de base de datos
```

Incluye:
1. Configuración inicial de Next.js 14 con App Router
2. tldraw instalado y canvas infinito funcionando con un shape de prueba
3. Supabase client configurado con variables de entorno
4. shadcn/ui inicializado
5. Estructura de carpetas para las 5 zonas como shapes personalizados de tldraw
6. Express API básica con health check

Una vez que el scaffold esté corriendo, empezamos por implementar la Zona 1 usando el prototipo HTML como referencia visual exacta.
