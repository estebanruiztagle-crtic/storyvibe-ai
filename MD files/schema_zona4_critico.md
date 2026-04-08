# Schema Zona 4 — Crítico de diseño

## Objeto principal: `zone_4`

```json
{
  "zone_4": {
    "id": "z4_uuid",
    "presentation_id": "pres_uuid",
    "canva_design_id": "canva_design_xyz",

    "contracts": {
      "brand_layer_id": "brand_uuid",
      "curve_id": "curve_uuid",
      "assets_approved": "z3_uuid"
    },

    "evaluation_mode": "realtime_per_slide",
    "canva_api": {
      "connection": "active",
      "design_id": "canva_design_xyz",
      "last_sync": "2024-11-15T16:00:00Z",
      "webhook": "on_slide_change"
    },

    "evaluations": [
      {
        "id": "eval_01",
        "slide_number": 1,
        "evaluated_at": "2024-11-15T16:05:00Z",
        "trigger": "slide_content_changed",

        "canva_snapshot": {
          "elements_count": 4,
          "text_blocks": 2,
          "images": 1,
          "fonts_detected": ["Neue Haas Grotesk", "Georgia"],
          "colors_detected": ["#1A1A2E", "#c4a882", "#F5F5F5"],
          "text_total_words": 18,
          "layout_type": "imagen_full_texto_superpuesto"
        },

        "axes": {

          "brand_compliance": {
            "score": 9.2,
            "weight": 0.40,
            "status": "pass",
            "checks": [
              {
                "rule": "typography.display",
                "expected": "Neue Haas Grotesk",
                "detected": "Neue Haas Grotesk",
                "pass": true
              },
              {
                "rule": "colors.primary",
                "expected": ["#1A1A2E", "#16213E"],
                "detected": ["#1A1A2E", "#c4a882"],
                "pass": true
              },
              {
                "rule": "imagery.forbidden_styles",
                "detected": "fotografía documental",
                "pass": true
              },
              {
                "rule": "verbal.tone",
                "forbidden_patterns_found": [],
                "pass": true
              }
            ]
          },

          "cognitive_load": {
            "score": 7.8,
            "weight": 0.35,
            "status": "warning",
            "checks": [
              {
                "rule": "text_density",
                "words_detected": 18,
                "recommended_max": 15,
                "pass": false,
                "delta": 3
              },
              {
                "rule": "hierarchy_levels",
                "detected": 2,
                "max_allowed": 3,
                "pass": true
              },
              {
                "rule": "elements_count",
                "detected": 4,
                "recommended_max": 5,
                "pass": true
              }
            ]
          },

          "emotional_alignment": {
            "score": 8.8,
            "weight": 0.25,
            "status": "pass",
            "curve_point": {
              "type": "peak",
              "emotion": "curiosidad",
              "intensity": 7
            },
            "checks": [
              {
                "rule": "visual_weight_vs_intensity",
                "expected": "alto",
                "detected": "alto",
                "pass": true
              },
              {
                "rule": "text_density_vs_type",
                "point_type": "peak",
                "expected_density": "minima",
                "detected_density": "baja",
                "pass": true
              },
              {
                "rule": "color_valence",
                "emotion_valence": "positive",
                "palette_warmth": "cálido",
                "pass": true
              }
            ]
          }
        },

        "global_score": 8.6,
        "global_status": "warning",

        "suggestions": [
          {
            "id": "sug_01",
            "axis": "cognitive_load",
            "severity": "medium",
            "problem": "18 palabras detectadas — 3 sobre el máximo recomendado para un slide de pico",
            "suggestion": "reducir a 15 palabras eliminando artículos y reformulando la segunda línea",
            "canva_action": {
              "type": "edit_text",
              "element_id": "text_block_02",
              "current_text": "40% de los adultos en América Latina no tienen acceso a servicios financieros formales",
              "suggested_text": "40% de adultos en LATAM sin acceso financiero formal",
              "words_before": 15,
              "words_after": 9
            },
            "status": "pending",
            "approved_by": null,
            "approved_at": null,
            "applied": false
          }
        ]
      },
      {
        "id": "eval_04",
        "slide_number": 4,
        "evaluated_at": "2024-11-15T16:22:00Z",
        "trigger": "slide_content_changed",

        "canva_snapshot": {
          "elements_count": 6,
          "text_blocks": 3,
          "images": 1,
          "fonts_detected": ["Neue Haas Grotesk"],
          "colors_detected": ["#1A1A2E", "#E94560", "#F5F5F5"],
          "text_total_words": 31,
          "layout_type": "texto_columna_imagen_derecha"
        },

        "axes": {
          "brand_compliance": {
            "score": 6.1,
            "weight": 0.40,
            "status": "fail",
            "checks": [
              {
                "rule": "colors.forbidden_as_background",
                "detected": "#E94560",
                "context": "color secundario usado como fondo de bloque — brand lo restringe a acentos pequeños",
                "pass": false
              },
              {
                "rule": "data_viz.max_variables",
                "detected": 2,
                "max_allowed": 1,
                "pass": false
              }
            ]
          },
          "cognitive_load": {
            "score": 5.2,
            "weight": 0.35,
            "status": "fail",
            "checks": [
              {
                "rule": "text_density",
                "words_detected": 31,
                "recommended_max": 20,
                "pass": false,
                "delta": 11
              },
              {
                "rule": "elements_count",
                "detected": 6,
                "recommended_max": 5,
                "pass": false,
                "delta": 1
              }
            ]
          },
          "emotional_alignment": {
            "score": 8.1,
            "weight": 0.25,
            "status": "pass",
            "curve_point": {
              "type": "peak",
              "emotion": "confianza emergente",
              "intensity": 8
            },
            "checks": [
              {
                "rule": "visual_weight_vs_intensity",
                "expected": "alto",
                "detected": "medio",
                "pass": false
              }
            ]
          }
        },

        "global_score": 6.5,
        "global_status": "fail",

        "suggestions": [
          {
            "id": "sug_04a",
            "axis": "brand_compliance",
            "severity": "high",
            "problem": "#E94560 usado como fondo de bloque — brand lo permite solo como acento puntual",
            "suggestion": "reemplazar fondo del bloque con #1A1A2E y usar #E94560 solo en el elemento de énfasis",
            "canva_action": {
              "type": "change_fill",
              "element_id": "block_bg_01",
              "current_fill": "#E94560",
              "suggested_fill": "#1A1A2E"
            },
            "status": "approved",
            "approved_by": "usuario",
            "approved_at": "2024-11-15T16:25:00Z",
            "applied": true
          },
          {
            "id": "sug_04b",
            "axis": "cognitive_load",
            "severity": "high",
            "problem": "31 palabras en un slide de pico — excede en 11 el máximo recomendado",
            "suggestion": "dividir en dos bloques: dato central (NPS 72) en tipografía grande, contexto en texto pequeño debajo",
            "canva_action": {
              "type": "restructure_layout",
              "element_id": "text_block_01",
              "current_layout": "texto_párrafo",
              "suggested_layout": "dato_grande_contexto_pequeño",
              "canva_template_hint": "stat_callout"
            },
            "status": "pending",
            "approved_by": null,
            "approved_at": null,
            "applied": false
          }
        ]
      }
    ],

    "session_summary": {
      "slides_evaluated": 4,
      "slides_pending": 2,
      "pass": 2,
      "warning": 1,
      "fail": 1,
      "suggestions_total": 3,
      "suggestions_approved": 1,
      "suggestions_pending": 2,
      "suggestions_rejected": 0,
      "avg_brand_score": 7.7,
      "avg_cognitive_score": 6.5,
      "avg_emotional_score": 8.5,
      "canva_edits_applied": 1
    },

    "violation_log": [
      {
        "id": "viol_z4_01",
        "slide": 4,
        "suggestion_id": "sug_04a",
        "type": "brand_compliance",
        "rule_violated": "colors.forbidden_as_background",
        "resolved": true,
        "resolved_at": "2024-11-15T16:25:00Z"
      }
    ]
  }
}
```

## Tipos de `canva_action`

| Tipo | Descripción |
|---|---|
| `edit_text` | modifica el contenido de un bloque de texto |
| `change_fill` | cambia el color de fondo de un elemento |
| `restructure_layout` | reorganiza la estructura del slide |

## Pesos por eje

| Eje | Peso | Fuente de verdad |
|---|---|---|
| brand_compliance | 0.40 | brand_layer |
| cognitive_load | 0.35 | reglas de diseño cognitivo |
| emotional_alignment | 0.25 | curva emocional aprobada |

## Regla de exportación

El sistema bloquea la exportación final mientras haya slides en estado `fail` con sugerencias de severidad `high` pendientes de aprobación.

## Flujo técnico

```
Canva API webhook on_slide_change
        │
        ▼ (latencia 1.5–3s)
Agente 4 evalúa contra 3 ejes
        │
        ├── brand_compliance → brand_layer
        ├── cognitive_load → reglas deterministas
        └── emotional_alignment → curva aprobada
        │
        ▼
Si detecta problema:
├── genera canva_action estructurada
├── presenta al usuario con diff visual
└── espera aprobación manual
        │
        ├── aprueba → Canva API ejecuta el cambio
        └── rechaza → registra en violation_log, continúa
```
