# Schema Zona 1 — Diagnóstico de contexto y audiencia

## Objeto principal: `context`

```json
{
  "context": {
    "id": "ctx_uuid",
    "presentation_id": "pres_uuid",
    "version": 2,
    "created_at": "2024-11-15T09:00:00Z",
    "last_modified": "2024-11-15T11:30:00Z",

    "event": {
      "type": "pitch_deck",
      "name": "Demo Day Serie A — Sequoia",
      "date": "2024-12-01",
      "format": "presencial",
      "duration_minutes": 20,
      "q_and_a_minutes": 10,
      "location": "San Francisco, CA",
      "language": "es",
      "formality_level": 8
    },

    "audience": {
      "profile_label": "inversores Serie A",
      "size": 8,
      "composition": [
        {
          "segment": "decision_makers",
          "percentage": 75,
          "role": "general partner",
          "knowledge_domain": "fintech",
          "knowledge_level": "experto"
        },
        {
          "segment": "evaluators",
          "percentage": 25,
          "role": "analyst",
          "knowledge_domain": "fintech",
          "knowledge_level": "avanzado"
        }
      ],
      "emotional_baseline": "escéptico",
      "primary_motivation": "retorno financiero",
      "primary_fear": "riesgo de ejecución del equipo",
      "cultural_context": "anglosajón",
      "attention_span_minutes": 7,
      "familiarity_with_presenter": "ninguna"
    },

    "objective": {
      "primary": "conseguir segunda reunión",
      "secondary": "instalar credibilidad técnica del equipo",
      "desired_action": "agendar due diligence",
      "success_metric": "al menos 3 de 8 asistentes solicitan follow-up",
      "what_must_they_remember": "el problema es real, el equipo puede resolverlo",
      "what_must_they_feel": "confianza con urgencia leve"
    },

    "constraints": {
      "topics_to_avoid": ["competidor X por acuerdo NDA", "ronda anterior fallida"],
      "mandatory_inclusions": ["tracción ARR", "roadmap 18 meses"],
      "sensitivity_level": "alto",
      "prior_context": "el lead investor ya vio el deck v1 hace 3 semanas"
    },

    "tone": {
      "primary": "inspiracional_con_datos",
      "register": "profesional",
      "energy_level": 7,
      "humor_allowed": false,
      "emotional_arc": {
        "opening": "curiosidad",
        "middle": "tensión_resuelta",
        "closing": "confianza"
      }
    },

    "storytelling": {
      "arc_type": "problema_solución_visión",
      "narrative_anchor": "el fundador vivió el problema en carne propia",
      "hook_type": "dato_sorpresivo",
      "proof_style": "caso_real_con_métricas"
    },

    "risk_flags": [
      {
        "id": "risk_01",
        "type": "audiencia",
        "description": "audiencia escéptica puede desconectarse ante demasiados datos consecutivos",
        "mitigation": "no superar 2 slides de datos sin un elemento narrativo",
        "severity": "alta",
        "detected_by": "agente_diagnostico",
        "timestamp": "2024-11-15T09:45:00Z"
      },
      {
        "id": "risk_02",
        "type": "tiempo",
        "description": "20 minutos es ajustado para 7 slides con Q&A incluido",
        "mitigation": "preparar versión de 15 minutos como fallback",
        "severity": "media",
        "detected_by": "agente_ritmo",
        "timestamp": "2024-11-15T09:45:00Z"
      },
      {
        "id": "risk_03",
        "type": "contenido",
        "description": "lead investor ya vio v1: necesita ver evolución clara o perderá interés",
        "mitigation": "slide explícito de 'qué cambió desde la última vez'",
        "severity": "alta",
        "detected_by": "agente_diagnostico",
        "timestamp": "2024-11-15T09:45:00Z"
      }
    ],

    "diagnostic_session": {
      "mode": "voz",
      "turns": [
        {
          "turn": 1,
          "role": "agente",
          "content": "¿Cuál es el único resultado que haría que esta presentación fuera un éxito para ti?",
          "timestamp": "2024-11-15T09:10:00Z"
        },
        {
          "turn": 2,
          "role": "usuario",
          "content": "Que al menos tres de los ocho inversores me pidan una segunda reunión.",
          "timestamp": "2024-11-15T09:10:45Z",
          "input_mode": "voz",
          "transcribed_by": "whisper"
        },
        {
          "turn": 3,
          "role": "agente",
          "content": "¿Qué es lo que más temen estos inversores de apostar por un equipo como el tuyo?",
          "timestamp": "2024-11-15T09:11:00Z"
        },
        {
          "turn": 4,
          "role": "usuario",
          "content": "Que no podamos ejecutar. Tenemos tecnología sólida pero somos un equipo joven.",
          "timestamp": "2024-11-15T09:11:40Z",
          "input_mode": "voz",
          "transcribed_by": "whisper"
        }
      ],
      "total_turns": 4,
      "completion_score": 0.85
    },

    "downstream_contracts": {
      "feeds_to": ["agente_narrativa", "agente_ritmo", "agente_assets", "agente_critico"],
      "locked_fields": ["event.duration_minutes", "audience.emotional_baseline", "objective.primary"],
      "propagation_rules": [
        {
          "if_field": "audience.emotional_baseline",
          "equals": "escéptico",
          "then": "agente_narrativa.max_consecutive_valleys = 2"
        },
        {
          "if_field": "event.duration_minutes",
          "less_than": 25,
          "then": "agente_ritmo.alert_threshold_slides = 8"
        },
        {
          "if_field": "tone.humor_allowed",
          "equals": false,
          "then": "agente_narrativa.exclude_resource_types = ['analogía_humorística', 'anécdota_ligera']"
        }
      ]
    },

    "ai_metadata": {
      "diagnostic_agent_version": "1.2",
      "questions_asked": 6,
      "questions_pending": 2,
      "confidence_score": 0.87,
      "low_confidence_fields": ["audience.attention_span_minutes", "constraints.prior_context"],
      "suggested_next_question": "¿Existe algún tema que sea políticamente sensible para este grupo específico de inversores?"
    }
  }
}
```

## Objeto: `input_sources`

```json
{
  "input_sources": {
    "id": "inputs_uuid",
    "presentation_id": "pres_uuid",
    "created_at": "2024-11-15T09:00:00Z",

    "conversational": {
      "status": "active",
      "mode": "voz",
      "completion_score": 0.87,
      "turns": 4
    },

    "external_research": {
      "status": "completed",
      "sources": [
        {
          "id": "src_001",
          "type": "url",
          "subtype": "empresa_audiencia",
          "url": "https://sequoiacap.com",
          "label": "Sequoia Capital — web corporativa",
          "fetched_at": "2024-11-15T09:05:00Z",
          "destination_zone": "zona_1",
          "extracted_fields": [
            "audience.profile_label",
            "audience.primary_motivation",
            "audience.knowledge_domain"
          ],
          "summary": "Fondo enfocado en Series A-B en fintech y deeptech.",
          "confidence": 0.91
        },
        {
          "id": "src_002",
          "type": "url",
          "subtype": "red_social",
          "url": "https://linkedin.com/in/partner-name",
          "label": "LinkedIn — lead investor",
          "fetched_at": "2024-11-15T09:06:00Z",
          "destination_zone": "zona_1",
          "extracted_fields": [
            "audience.familiarity_with_presenter",
            "audience.primary_fear",
            "constraints.prior_context"
          ],
          "summary": "18 años en VC. Ha publicado artículos sobre riesgo de ejecución en equipos jóvenes.",
          "confidence": 0.84
        },
        {
          "id": "src_003",
          "type": "web_search",
          "subtype": "contenido_narrativa",
          "query": "fintech latinoamérica mercado tamaño 2024 estudios",
          "results_count": 8,
          "selected_count": 3,
          "fetched_at": "2024-11-15T09:10:00Z",
          "destination_zone": "zona_2",
          "sources_used": [
            {
              "url": "https://idbinvest.org/fintech-latam-2024",
              "title": "Fintech en América Latina 2024 — BID Invest",
              "relevance_score": 0.93,
              "key_data": "Mercado de $150B, crecimiento 23% YoY"
            }
          ]
        },
        {
          "id": "src_004",
          "type": "url",
          "subtype": "evento",
          "url": "https://demo-day-sequoia.com/agenda",
          "label": "Agenda oficial Demo Day",
          "fetched_at": "2024-11-15T09:07:00Z",
          "destination_zone": "zona_1",
          "extracted_fields": [
            "event.format",
            "event.duration_minutes",
            "constraints.prior_context"
          ],
          "summary": "8 startups presentan. Slot de 20 min cada una.",
          "confidence": 0.97
        }
      ]
    },

    "internal_documents": {
      "status": "partial",
      "documents": [
        {
          "id": "doc_001",
          "type": "pdf",
          "label": "Informe de tracción Q3 2024",
          "filename": "traction_q3_2024.pdf",
          "uploaded_at": "2024-11-15T08:50:00Z",
          "pages": 12,
          "destination_zone": "zona_2",
          "extracted_content": {
            "key_metrics": ["ARR $2.1M", "MoM growth 18%", "NPS 72", "Churn 1.4%"],
            "narrative_assets": ["caso cliente Banco X", "comparativa competencia"],
            "confidence": 0.95
          }
        },
        {
          "id": "doc_002",
          "type": "pptx",
          "label": "Deck v1 — octubre 2024",
          "filename": "deck_v1_oct2024.pptx",
          "uploaded_at": "2024-11-15T08:52:00Z",
          "slides_count": 14,
          "destination_zone": "zona_1",
          "extracted_content": {
            "note": "Lead investor ya vio esta versión. Identificar qué cambió.",
            "changed_since_v1": ["nueva métrica ARR", "caso cliente añadido", "equipo expandido"],
            "confidence": 0.89
          }
        }
      ]
    },

    "brand_identity": {
      "status": "loaded",
      "scope": "global",
      "applies_to_zones": ["zona_3", "zona_4", "zona_5"],
      "acts_as": "filtro_transversal",
      "sources": [
        {
          "id": "brand_001",
          "type": "pdf",
          "label": "Brand book corporativo v2.3",
          "filename": "brandbook_v2.3.pdf",
          "uploaded_at": "2024-11-15T08:45:00Z",
          "parsed": {
            "colors": {
              "primary": ["#1A1A2E", "#16213E"],
              "secondary": ["#0F3460", "#E94560"],
              "neutral": ["#F5F5F5", "#888888"]
            },
            "typography": {
              "display": "Neue Haas Grotesk",
              "body": "Georgia",
              "mono": "IBM Plex Mono"
            },
            "tone_of_voice": {
              "adjectives": ["preciso", "directo", "ambicioso"],
              "avoid": ["jerga informal", "superlativos vacíos", "anglicismos innecesarios"]
            },
            "visual_style": {
              "photography": "alto contraste, personas reales, no stock genérico",
              "illustration": "no permitida",
              "data_viz": "minimalista, una variable por gráfico"
            }
          }
        }
      ],
      "propagation_rules": [
        {
          "applies_to": "agente_assets",
          "rule": "filtrar imágenes por paleta y estilo definidos en brand"
        },
        {
          "applies_to": "agente_critico",
          "rule": "evaluar cada slide contra brand guidelines antes de aprobar"
        },
        {
          "applies_to": "agente_narrativa",
          "rule": "excluir recursos de tono que contradigan tone_of_voice.avoid"
        },
        {
          "applies_to": "zona_5",
          "rule": "storyboard solo puede usar tipografías y colores del brand parsed"
        }
      ]
    }
  }
}
```

## Flujo técnico del Agente 1

```
INICIO DE SESIÓN
      │
      ▼
INGESTA PARALELA DE FUENTES
├── URLs + búsqueda web → Web scraper + Claude visión
├── Archivos internos PDF/PPTX → PyMuPDF + python-docx
└── Brand book → Claude visión + extracción estructurada
      │
      ▼
ENRIQUECEDOR DE CONTEXTO (Claude API)
Cruza todos los inputs y actualiza campos del schema
      │
      ▼
DIAGNÓSTICO CONVERSACIONAL
El agente llega ya informado. Solo pregunta lo que no pudo inferir.
      │
      ▼
VALIDADOR DE COHERENCIA (reglas deterministas)
      │
      ▼
PROPAGADOR → emite eventos a agentes downstream
Brand layer actúa como filtro transversal sobre todas las zonas
```

## Stack específico

| Componente | Tecnología |
|---|---|
| Entrada de voz | Deepgram streaming / Whisper local |
| Extracción de entidades | Claude API con JSON schema forzado |
| Validador de coherencia | Función determinista en Node.js |
| Propagador de reglas | json-rules-engine en Node |
| Persistencia | Supabase — tabla `contexts` con JSONB |
| Eventos a agentes | Supabase Realtime o Redis pub/sub |
