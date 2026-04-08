# Schema Zona 3 — Assets

## Objeto principal: `zone_3`

```json
{
  "zone_3": {
    "id": "z3_uuid",
    "presentation_id": "pres_uuid",
    "contract_from_curve": {
      "curve_id": "curve_uuid",
      "approved": true,
      "points_requiring_assets": 6,
      "locked_at": "2024-11-15T15:00:00Z"
    },

    "brand_layer_active": "brand_uuid",

    "drive_library": {
      "status": "indexed",
      "indexed_at": "2024-11-15T08:00:00Z",
      "total_assets": 143,
      "folders_scanned": [
        "drive://Fotos de marca/",
        "drive://Videos corporativos/",
        "drive://Presentaciones anteriores/"
      ],
      "assets": [
        {
          "id": "drv_001",
          "type": "image",
          "filename": "equipo_oficina_2024.jpg",
          "url": "drive://...",
          "tags": ["equipo", "personas reales", "oficina"],
          "brand_compliance": true,
          "embedding_vector": "[...]",
          "used_in_presentations": 3
        }
      ]
    },

    "asset_slots": [
      {
        "id": "slot_01",
        "slide_number": 1,
        "curve_point": {
          "type": "peak",
          "emotion": "curiosidad",
          "intensity": 7,
          "topic": "brecha de inclusión financiera LATAM"
        },

        "search": {
          "semantic_query": "exclusión financiera personas sin acceso banco latinoamérica",
          "mood_keywords": ["contraste", "urgencia", "humano", "escala"],
          "asset_type_needed": "image",
          "layout_hint": "imagen_full_fondo"
        },

        "pinterest_reference": {
          "status": "provided",
          "pin_url": "https://pinterest.com/pin/xxx",
          "extracted_mood": {
            "palette": ["#1a1a2e", "#e8e0d0", "#c4a882"],
            "style": "alto contraste, fotografía documental",
            "composition": "sujeto centrado, fondo desenfocado",
            "emotion_alignment_score": 9.1
          }
        },

        "generation": {
          "status": "completed",
          "engine_used": "flux_pro",
          "engine_version": "flux-pro-1.1",
          "cost_usd": 0.04,
          "prompt": {
            "base": "Documentary photograph, Latin American person without bank access, high contrast, warm tones #c4a882, centered subject, shallow depth of field",
            "style_from_pinterest": "fotografía documental, alto contraste, tonos cálidos",
            "brand_constraints_applied": [
              "paleta primaria respetada",
              "no ilustración",
              "personas reales"
            ],
            "negative_prompt": "stock photo, generic, illustration, 3D render, purple tones"
          },
          "iterations": 2,
          "selected_variant": "variant_03"
        },

        "drive_candidates": {
          "searched": true,
          "results": [],
          "reason_not_used": "ningún asset del drive con relevancia suficiente (score < 0.70)"
        },

        "final_asset": {
          "id": "asset_001",
          "type": "image",
          "url": "storage/assets/slot01_final.jpg",
          "dimensions": {"w": 1920, "h": 1080},
          "brand_compliance_score": 9.2,
          "emotion_alignment_score": 8.8,
          "approved": true,
          "approved_by": "usuario",
          "approved_at": "2024-11-15T15:45:00Z"
        }
      },
      {
        "id": "slot_04",
        "slide_number": 4,
        "curve_point": {
          "type": "peak",
          "emotion": "confianza emergente",
          "intensity": 8,
          "topic": "caso cliente Banco X"
        },

        "search": {
          "semantic_query": "transformación digital banco cliente satisfecho resultado",
          "asset_type_needed": "video",
          "duration_seconds": 8,
          "layout_hint": "video_background_con_texto"
        },

        "pinterest_reference": {
          "status": "not_provided",
          "fallback": "mood_from_curve_emotion"
        },

        "drive_candidates": {
          "searched": true,
          "results": [
            {
              "asset_id": "drv_034",
              "filename": "cliente_banco_x_entrevista.mp4",
              "relevance_score": 0.88,
              "brand_compliance": true,
              "recommended": true,
              "reason": "video real del cliente — mayor autenticidad que generado"
            }
          ],
          "drive_asset_selected": true,
          "reason": "asset propio priorizado — mayor autenticidad + brand compliance perfecto"
        },

        "final_asset": {
          "id": "asset_004",
          "type": "video",
          "url": "drive://Videos corporativos/cliente_banco_x_entrevista.mp4",
          "duration_seconds": 12,
          "brand_compliance_score": 10,
          "emotion_alignment_score": 9.4,
          "source": "drive_propio",
          "approved": true,
          "approved_by": "usuario",
          "approved_at": "2024-11-15T15:50:00Z"
        }
      }
    ],

    "session_summary": {
      "total_slots": 6,
      "completed": 4,
      "pending": 2,
      "approved": 3,
      "source_breakdown": {
        "drive_propio": 2,
        "generado_flux_pro": 2,
        "generado_nanobanana_pro": 1,
        "generado_recraft_v3": 0
      },
      "total_cost_usd": 0.61,
      "brand_violations": 0,
      "avg_emotion_alignment": 9.0
    },

    "engine_router": {
      "default_mode": "arena",
      "arena_mode": {
        "enabled": true,
        "description": "envía el mismo prompt a 3 motores en paralelo, oculta la fuente, el autor vota, el sistema aprende",
        "engines": [
          {
            "id": "flux_pro",
            "name": "Flux Pro 1.1",
            "provider": "Black Forest Labs",
            "api": "Replicate API",
            "api_endpoint": "black-forest-labs/flux-pro",
            "cost_per_image_usd": 0.04,
            "specialty": "fotografía realista, control fino de composición"
          },
          {
            "id": "nanobanana_pro",
            "name": "Nanobanana Pro",
            "provider": "Google DeepMind",
            "api": "Gemini API / Vertex AI",
            "api_endpoint": "gemini-image-pro",
            "cost_per_image_usd": 0.039,
            "specialty": "fidelidad máxima, grounding con búsqueda Google, edición por instrucción natural"
          },
          {
            "id": "recraft_v3",
            "name": "Recraft V3",
            "provider": "Recraft",
            "api": "Replicate API",
            "api_endpoint": "recraft-ai/recraft-v3",
            "cost_per_image_usd": 0.04,
            "specialty": "diseño gráfico, tipografía en imagen, coherencia de estilo"
          }
        ],
        "cost_per_arena_session_usd": 0.119,
        "flow": {
          "step_1": "prompt optimizado enviado en paralelo a los 3 motores",
          "step_2": "3 variantes mostradas sin revelar qué motor generó cada una",
          "step_3": "autor selecciona la mejor visualmente",
          "step_4": "sistema revela el motor ganador",
          "step_5": "resultado registrado en arena_history"
        }
      },

      "arena_history": {
        "total_sessions": 0,
        "wins": {
          "flux_pro": 0,
          "nanobanana_pro": 0,
          "recraft_v3": 0
        },
        "win_by_emotion_type": {
          "peak": {"flux_pro": 0, "nanobanana_pro": 0, "recraft_v3": 0},
          "valley": {"flux_pro": 0, "nanobanana_pro": 0, "recraft_v3": 0},
          "transition": {"flux_pro": 0, "nanobanana_pro": 0, "recraft_v3": 0}
        },
        "win_by_asset_type": {
          "image": {"flux_pro": 0, "nanobanana_pro": 0, "recraft_v3": 0}
        },
        "learned_preference": null,
        "confidence": 0.0,
        "sessions_for_high_confidence": 20,
        "note": "con 20 sesiones el router asigna motor automáticamente según tipo y emoción"
      },

      "routing_rules": [
        {
          "condition": "drive_candidate.relevance_score >= 0.80",
          "action": "usar asset propio — no genera",
          "mode": "drive",
          "priority": 1
        },
        {
          "condition": "arena_history.confidence < 0.80",
          "action": "activar arena_mode para acumular preferencias del autor",
          "mode": "arena",
          "priority": 2
        },
        {
          "condition": "arena_history.confidence >= 0.80",
          "action": "usar motor con mayor win_rate para ese tipo de emoción",
          "mode": "automatic",
          "priority": 3
        }
      ],

      "video_engines": [
        {
          "id": "runway_gen3",
          "name": "Runway Gen-3 Alpha Turbo",
          "specialty": "clips cortos < 10s, alta calidad",
          "cost_per_second_usd": 0.05
        },
        {
          "id": "kling",
          "name": "Kling API",
          "specialty": "clips largos > 10s",
          "cost_per_second_usd": 0.04
        }
      ]
    }
  }
}
```

## Flujo de prioridad de fuentes

```
1. Google Drive propio
   └── búsqueda semántica con embeddings (relevance_score >= 0.80 → usar directo)

2. Pinterest mood → generación IA
   └── extracción de paleta, estilo, composición
   └── prompt optimizado enviado a Arena mode (3 motores en paralelo)
   └── autor vota sin saber qué motor generó qué
   └── sistema aprende preferencias del autor

3. Generación automática (sin Pinterest)
   └── mood inferido desde curve_point.emotion + intensity
```

## Stack específico

| Componente | Tecnología |
|---|---|
| Indexación Drive | Google Drive API + embeddings (Voyage AI) |
| Búsqueda semántica | pgvector en Supabase |
| Extracción mood Pinterest | Claude API con visión |
| Router de motores | Lógica determinista en Node.js |
| Generación imagen | Flux Pro / Nanobanana Pro / Recraft V3 |
| Generación video | Runway ML API + Kling API |
| Evaluación brand compliance | Claude API con visión + brand_layer |
| Almacenamiento assets | Supabase Storage o Cloudflare R2 |

## Costo estimado por presentación (arena mode activo)

| Escenario | Costo aproximado |
|---|---|
| 6 slots imagen — todo arena | ~$0.71 USD |
| 4 imagen + 2 video (8s c/u) | ~$1.08 USD |
| Con Drive (2 propios + 4 generados) | ~$0.48 USD |
| 20 sesiones arena para calibrar router | ~$2.38 USD total |
