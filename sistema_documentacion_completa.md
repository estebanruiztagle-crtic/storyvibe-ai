# Sistema de diseño de presentaciones — documentación completa

## Concepto central
Tablero infinito tipo canvas donde el autor diseña presentaciones de principio a fin sin saltar entre herramientas. El sistema tiene 5 zonas secuenciales conectadas por contratos de datos, con agentes de IA especializados en cada una.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend / Canvas | Next.js + tldraw |
| UI components | shadcn/ui + Tailwind |
| Backend / Orquestador | Node.js + Express |
| IA principal | Claude API (claude-sonnet-4) |
| Base de datos | Supabase (Postgres + Auth + Storage + Realtime) |
| Almacenamiento assets | Supabase Storage o Cloudflare R2 |
| Deploy frontend | Vercel |
| Deploy backend | Railway o Render |
| Búsqueda semántica | pgvector en Supabase |
| Embeddings | Voyage AI o OpenAI |
| Voz STT | Deepgram (MVP) → Whisper.cpp WASM (producción) |
| TTS | OpenAI TTS o ElevenLabs |
| Generación imagen | Flux Pro 1.1, Nanobanana Pro, Recraft V3 (vía Replicate + Gemini API) |
| Generación video | Runway ML API + Kling API |
| Integración diseño | Canva API |
| Fuentes externas | Brave Search API / Perplexity API |
| Drive | Google Drive API |

---

## Arquitectura general

```
CANALES DE ENTRADA
├── 1. Voz / texto (diagnóstico conversacional)
├── 2. Fuentes externas (URLs, búsqueda web, redes sociales)
├── 3. Documentos internos (PDF, PPTX, DOCX desde Drive)
└── 4. Brand book / guidelines (filtro global transversal)

ZONAS (secuenciales con contratos)
Zona 1 → Zona 2A → Zona 2B → Curva Emocional → Zona 3 → Zona 4 → Zona 5

CAPA DE IA (agentes especializados)
├── Agente 1: diagnóstico de contexto
├── Agente 2A: curador de tópicos
├── Agente 2B: arquitecto narrativo
├── Agente 3: curador/generador de assets
├── Agente 4: crítico de diseño (Canva API)
└── Agente 5: calculador de ritmo y tiempo

BRAND LAYER (transversal — scope global)
Actúa como filtro de restricciones sobre todas las zonas.
Modo strict: bloquea violaciones. Modo advisory: las señala.
```

---

## Módulo de voz (capa opcional)

```
Voz → MediaRecorder API (WebM/Opus)
    → Deepgram streaming (MVP) / Whisper.cpp WASM (prod)
    → Clasificador de intención (Claude API, JSON schema)
        ├── "navegar" → mueve canvas
        ├── "dictar" → agrega contenido
        ├── "instruir" → activa agente
        └── "iterar" → modifica existente
    → Router de agentes
    → Respuesta en texto + TTS opcional
```

Latencia esperada: ~300ms clasificador, ~500ms pipeline completo.

---

## Brand Layer — schema

```json
{
  "brand_layer": {
    "id": "brand_uuid",
    "scope": "global",
    "priority": "override",
    "status": "active",
    "source": {
      "type": "pdf",
      "filename": "brandbook_v2.3.pdf",
      "parse_confidence": 0.93
    },
    "constraints": {
      "visual": {
        "colors": {
          "primary": ["#1A1A2E", "#16213E"],
          "secondary": ["#0F3460", "#E94560"],
          "neutral": ["#F5F5F5", "#888888"],
          "forbidden": ["rojo saturado", "verde saturado"]
        },
        "typography": {
          "display": "Neue Haas Grotesk",
          "body": "Georgia",
          "mono": "IBM Plex Mono"
        },
        "imagery": {
          "allowed_styles": ["alto contraste", "personas reales", "fotografía documental"],
          "forbidden_styles": ["stock genérico", "ilustración", "renders 3D"]
        },
        "data_visualization": {
          "style": "minimalista",
          "max_variables_per_chart": 1,
          "allowed_chart_types": ["barra", "línea", "scatter"],
          "forbidden_chart_types": ["pie", "donut", "área apilada"]
        }
      },
      "verbal": {
        "tone_adjectives": ["preciso", "directo", "ambicioso"],
        "forbidden_patterns": ["jerga informal", "superlativos vacíos", "anglicismos innecesarios"],
        "sentence_style": "corto y activo"
      }
    },
    "enforcement": {
      "mode": "strict",
      "on_violation": "block_and_explain",
      "agents_affected": ["agente_assets", "agente_critico", "agente_narrativa", "zona_5_storyboard"],
      "violation_log": []
    },
    "ui": {
      "display_in_bar": true,
      "inspection_panel": "expandible",
      "violation_badge": true
    }
  }
}
```

---

## Zona 1 — Diagnóstico de contexto

**Función:** fuente de verdad que alimenta todos los agentes. Se construye desde 4 canales de entrada en paralelo antes del diagnóstico conversacional.

**Flujo técnico:**
```
Ingesta paralela de fuentes
├── URLs → Web scraper + Claude visión
├── Archivos → PyMuPDF + python-docx
└── Brand book → Claude visión + extracción estructurada
        ↓
Enriquecedor de contexto (Claude API)
        ↓
Diagnóstico conversacional (agente ya informado)
        ↓
Validador de coherencia (reglas deterministas)
        ↓
Propagador → emite eventos a agentes downstream
```

**Schema clave (extracto):**
```json
{
  "context": {
    "event": {
      "type": "pitch_deck",
      "duration_minutes": 20,
      "formality_level": 8
    },
    "audience": {
      "emotional_baseline": "escéptico",
      "primary_motivation": "retorno financiero",
      "primary_fear": "riesgo de ejecución",
      "attention_span_minutes": 7
    },
    "objective": {
      "primary": "conseguir segunda reunión",
      "what_must_they_feel": "confianza con urgencia leve"
    },
    "tone": {
      "primary": "inspiracional_con_datos",
      "emotional_arc": {
        "opening": "curiosidad",
        "middle": "tensión_resuelta",
        "closing": "confianza"
      }
    },
    "downstream_contracts": {
      "propagation_rules": [
        {
          "if_field": "audience.emotional_baseline",
          "equals": "escéptico",
          "then": "agente_narrativa.max_consecutive_valleys = 2"
        },
        {
          "if_field": "tone.humor_allowed",
          "equals": false,
          "then": "agente_narrativa.exclude_resource_types = ['analogía_humorística']"
        }
      ]
    },
    "input_sources": {
      "external_research": {
        "sources": [
          {
            "type": "url",
            "subtype": "empresa_audiencia",
            "destination_zone": "zona_1",
            "extracted_fields": ["audience.profile_label", "audience.primary_motivation"]
          },
          {
            "type": "web_search",
            "subtype": "contenido_narrativa",
            "destination_zone": "zona_2"
          }
        ]
      },
      "internal_documents": {
        "documents": [
          {
            "type": "pdf",
            "destination_zone": "zona_2",
            "extracted_content": {"key_metrics": [], "narrative_assets": []}
          }
        ]
      }
    },
    "risk_flags": [
      {
        "type": "audiencia",
        "severity": "alta",
        "detected_by": "agente_diagnostico",
        "mitigation": "no superar 2 slides de datos sin elemento narrativo"
      }
    ],
    "ai_metadata": {
      "confidence_score": 0.87,
      "suggested_next_question": "¿Existe algún tema políticamente sensible para este grupo?"
    }
  }
}
```

---

## Zona 2A — Mapa de tópicos

**Función:** selección y jerarquía de contenido. El sistema aprende el patrón de selección del autor con el tiempo.

**Schema clave:**
```json
{
  "zone_2a": {
    "author_pattern": {
      "learned_from_presentations": 7,
      "typical_topic_count": {"min": 4, "max": 7, "preferred": 5},
      "selection_bias": [
        "prefiere datos propios sobre datos de terceros",
        "siempre incluye un caso de cliente real",
        "evita tópicos de competencia directa"
      ],
      "confidence": 0.78
    },
    "topics": [
      {
        "id": "topic_01",
        "label": "brecha de inclusión financiera LATAM",
        "type": "problema_contexto",
        "origin": "investigación_web",
        "weight": {
          "relevance_to_audience": 9,
          "emotional_potential": 7,
          "data_availability": 9,
          "author_pattern_match": 0.82,
          "composite_score": 8.4
        },
        "selected": true,
        "mandatory": false
      }
    ],
    "contract_output": {
      "status": "validated",
      "ready_for_2b": true
    }
  }
}
```

**Tipos de tópico:** `problema_contexto`, `dato_duro`, `propuesta_valor`, `prueba_social`, `visión`, `contexto_mercado`

---

## Zona 2B — Arquitectura narrativa

**Función:** el sistema investiga frameworks de storytelling y presenta opciones con fit_score calibrado contra zona 1. El autor selecciona.

**Schema clave:**
```json
{
  "zone_2b": {
    "storytelling_options": [
      {
        "id": "st_01",
        "name": "problema — solución — visión",
        "origin": "McKee / Duarte",
        "fit_score": 9.2,
        "fit_reasons": [
          "audiencia escéptica responde bien a estructura lógica clara",
          "permite integrar datos duros sin perder momentum"
        ],
        "emotional_arc_proposed": ["curiosidad", "tensión", "alivio", "excitación", "confianza"],
        "risk": "puede sentirse formulaico sin gancho fuerte en apertura",
        "recommended": true
      }
    ],
    "selected_framework": null,
    "agent_next_action": "presentar opciones al autor para selección"
  }
}
```

---

## Curva emocional — schema central

**Este es el objeto que todos los agentes leen y escriben.**

```json
{
  "emotional_curve": {
    "id": "curve_uuid",
    "version": 3,
    "global_metrics": {
      "tension_score": 7.2,
      "rhythm_balance": 0.68,
      "consecutive_valleys_max": 2,
      "alerts": [
        {
          "type": "consecutive_valleys",
          "slides": [4, 5, 6],
          "severity": "warning",
          "suggestion": "insertar micro-pico entre slide 5 y 6"
        }
      ]
    },
    "points": [
      {
        "id": "point_uuid_01",
        "slide_number": 1,
        "label": "Apertura",
        "emotional": {
          "type": "peak",
          "target_emotion": "curiosidad",
          "intensity": 7,
          "valence": "positive",
          "arousal": "high",
          "transition_to_next": "descenso_gradual"
        },
        "narrative": {
          "role": "gancho",
          "resource_type": "pregunta_retórica",
          "content_summary": "¿Qué pasaría si pudieras...?"
        },
        "timing": {
          "duration_seconds": 60,
          "cumulative_seconds": 60,
          "pacing": "lento"
        },
        "assets": {
          "primary": {
            "id": "asset_uuid_01",
            "type": "image",
            "emotion_alignment_score": 9
          }
        },
        "design": {
          "cognitive_load": "bajo",
          "text_density": "minima",
          "visual_weight": "alto"
        },
        "ai_metadata": {
          "agent_suggestions": [],
          "iteration_count": 2
        }
      }
    ],
    "history": [
      {
        "version": 1,
        "changed_by": "user",
        "change_summary": "Estructura inicial 10 slides"
      }
    ]
  }
}
```

**Reglas de generación automática (framework → curva):**
- `problema_contexto` → peak (gancho)
- `dato_duro` → valley
- `propuesta_valor` → transition
- `prueba_social` → peak
- `visión` → peak máximo
- Intensidad calibrada por posición en arco del framework seleccionado
- Audiencia escéptica → intensidad valleys +1, peaks -1 vs baseline

---

## Zona 3 — Assets

**Fuentes en orden de prioridad:**
1. Google Drive propio (indexado con embeddings vectoriales)
2. Pinterest como referencia de mood → prompt para generación IA
3. Generación IA (motor seleccionado por router)

**Arena Mode — comparación de motores:**
```json
{
  "arena_mode": {
    "enabled": true,
    "engines": [
      {
        "id": "flux_pro",
        "name": "Flux Pro 1.1",
        "api": "Replicate API",
        "cost_per_image_usd": 0.04,
        "specialty": "fotografía realista, control fino de composición"
      },
      {
        "id": "nanobanana_pro",
        "name": "Nanobanana Pro",
        "api": "Gemini API / Vertex AI",
        "cost_per_image_usd": 0.039,
        "specialty": "fidelidad máxima, grounding con búsqueda Google"
      },
      {
        "id": "recraft_v3",
        "name": "Recraft V3",
        "api": "Replicate API",
        "cost_per_image_usd": 0.04,
        "specialty": "diseño gráfico, tipografía en imagen"
      }
    ],
    "cost_per_arena_session_usd": 0.119,
    "flow": {
      "step_1": "prompt enviado en paralelo a los 3 motores",
      "step_2": "3 variantes mostradas sin revelar motor",
      "step_3": "autor vota la mejor",
      "step_4": "sistema revela motor ganador",
      "step_5": "resultado registrado en arena_history"
    }
  },
  "arena_history": {
    "wins": {"flux_pro": 0, "nanobanana_pro": 0, "recraft_v3": 0},
    "win_by_emotion_type": {
      "peak": {"flux_pro": 0, "nanobanana_pro": 0, "recraft_v3": 0},
      "valley": {"flux_pro": 0, "nanobanana_pro": 0, "recraft_v3": 0}
    },
    "confidence": 0.0,
    "sessions_for_high_confidence": 20
  }
}
```

**Router de motores:**
```json
{
  "routing_rules": [
    {"condition": "arena_history.confidence >= 0.80", "mode": "automatic"},
    {"condition": "arena_history.confidence < 0.80", "mode": "arena"},
    {"condition": "drive_candidate.relevance_score >= 0.80", "mode": "drive"}
  ],
  "video_engines": [
    {"id": "runway_gen3", "specialty": "clips cortos <10s", "cost_per_second": 0.05},
    {"id": "kling", "specialty": "clips largos", "cost_per_second": 0.04}
  ]
}
```

**Stack zona 3:**
- Indexación Drive: Google Drive API + embeddings (Voyage AI)
- Búsqueda semántica: pgvector en Supabase
- Extracción mood Pinterest: Claude API con visión
- Generación imagen: Flux/Nanobanana/Recraft vía API
- Generación video: Runway ML API + Kling API
- Evaluación brand compliance: Claude API con visión + brand_layer

---

## Zona 4 — Crítico de diseño

**Función:** evalúa cada slide contra 3 ejes vía Canva API en tiempo real. Genera sugerencias ejecutables con aprobación manual.

**Trigger:** webhook `on_slide_change` desde Canva API. Latencia: 1.5–3s.

**3 ejes de evaluación:**
- Brand compliance (fuente: brand_layer) — peso 0.40
- Carga cognitiva (reglas de diseño) — peso 0.35
- Alineación emocional (curva aprobada) — peso 0.25

**Schema de sugerencia:**
```json
{
  "suggestion": {
    "id": "sug_01",
    "axis": "cognitive_load",
    "severity": "medium",
    "problem": "18 palabras — 3 sobre el máximo para slide de pico",
    "suggestion": "reducir a 15 palabras",
    "canva_action": {
      "type": "edit_text",
      "element_id": "text_block_02",
      "current_text": "texto original...",
      "suggested_text": "texto reducido..."
    },
    "status": "pending"
  }
}
```

**Tipos de canva_action:** `edit_text`, `change_fill`, `restructure_layout`

**Regla de exportación:** el sistema bloquea la exportación final mientras haya slides en estado `fail` con sugerencias críticas pendientes.

---

## Zona 5 — Storyboard + tiempo

**Función:** vista filmstrip de miniaturas con estado compuesto por slide y control de tiempo con alerta simple.

**Control de tiempo:**
```json
{
  "time_control": {
    "total_available_seconds": 1200,
    "alert_threshold_pct": 0.95,
    "fallback_version": {
      "available": true,
      "estimated_seconds": 900,
      "label": "versión 15 min"
    }
  }
}
```

**Estado por slide (compuesto de 3 fuentes):**
- `status.assets` → zona 3
- `status.design` → zona 4
- `status.overall` → el peor de los tres

**Readiness global:**
```json
{
  "readiness": {
    "overall_status": "in_progress",
    "export_to_canva_blocked": true,
    "export_blocked_reason": "slide 4 tiene issues críticos sin resolver"
  }
}
```

---

## Contratos entre zonas

```
Zona 1 → Zona 2A: contexto validado (audiencia, objetivo, tono, restricciones)
Zona 2A → Zona 2B: árbol de tópicos validado (tipo, peso, mandatory/forbidden)
Zona 2B → Curva: framework seleccionado → mapeo automático tópico→punto
Curva → Zona 3: punto de curva por slot (tipo, emoción, intensidad)
Zona 3 → Zona 4: asset aprobado por slot + brand_layer activo
Zona 4 → Zona 5: score de diseño + sugerencias por slide
Brand Layer → todos: restricciones visuales y verbales transversales
```

---

## Análisis retroactivo de video (pospuesto)

Funcionalidad identificada pero no construida: pipeline que analiza un video de presentación en vivo y reconstruye la curva emocional real del presentador.

Stack: ffmpeg + Whisper + librosa + pyannote + Claude visión

---

## Roadmap de construcción

| Fase | Contenido | Tiempo estimado |
|---|---|---|
| 1 | Scaffold Next.js + tldraw + Supabase + auth | Semana 1 |
| 2 | Zona 1 UI + Agente diagnóstico | Semana 2-3 |
| 3 | Zona 2A + 2B + curva emocional interactiva | Semana 4-5 |
| 4 | Zona 3 + Drive API + Arena mode | Semana 6-7 |
| 5 | Zona 4 + Canva API webhook | Semana 8-9 |
| 6 | Zona 5 + storyboard + exportación | Semana 10 |
| 7 | Módulo de voz + tablero global unificado | Semana 11-12 |
