# Schema — Curva emocional

## Objeto central: `emotional_curve`

Este es el objeto que todos los agentes leen y escriben. Se genera automáticamente desde el framework seleccionado en 2B y se ajusta manualmente.

```json
{
  "emotional_curve": {
    "id": "curve_uuid",
    "presentation_id": "pres_uuid",
    "version": 3,
    "last_modified": "2024-11-15T14:32:00Z",
    "generated_from_framework": "st_01",
    "approved": true,
    "approved_at": "2024-11-15T15:00:00Z",

    "global_metrics": {
      "tension_score": 7.2,
      "rhythm_balance": 0.68,
      "consecutive_valleys_max": 2,
      "consecutive_peaks_max": 1,
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
          "content_summary": "¿Qué pasaría si pudieras...?",
          "speaker_notes": "Pausa de 3s después de la pregunta"
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
            "emotion_alignment_score": 9,
            "url": "storage/assets/img_001.jpg"
          },
          "secondary": null
        },

        "design": {
          "cognitive_load": "bajo",
          "text_density": "minima",
          "visual_weight": "alto",
          "layout_type": "imagen_full_con_texto_superpuesto"
        },

        "generation_rules_applied": [
          "problema_contexto → peak",
          "posición 1 en arco → intensidad alta",
          "audiencia escéptica → intensidad -1 vs baseline"
        ],

        "modified_by_user": false,
        "ai_metadata": {
          "agent_suggestions": [
            {
              "agent": "narrativa",
              "suggestion": "Considerar abrir con dato sorpresivo en lugar de pregunta retórica",
              "accepted": false,
              "timestamp": "2024-11-15T13:10:00Z"
            }
          ],
          "iteration_count": 2
        }
      },
      {
        "id": "point_uuid_02",
        "slide_number": 2,
        "label": "Problema",

        "emotional": {
          "type": "valley",
          "target_emotion": "incomodidad",
          "intensity": 4,
          "valence": "negative",
          "arousal": "medium",
          "transition_to_next": "descenso_suave"
        },

        "narrative": {
          "role": "tensión",
          "resource_type": "dato_duro",
          "content_summary": "El mercado pierde X cada año por...",
          "speaker_notes": "No acelerar aquí, dejar que el dato pese"
        },

        "timing": {
          "duration_seconds": 90,
          "cumulative_seconds": 150,
          "pacing": "medio"
        },

        "assets": {
          "primary": {
            "id": "asset_uuid_02",
            "type": "data_visualization",
            "emotion_alignment_score": 8,
            "url": "storage/assets/chart_001.svg"
          },
          "secondary": null
        },

        "design": {
          "cognitive_load": "medio",
          "text_density": "media",
          "visual_weight": "medio",
          "layout_type": "dato_central_con_contexto"
        },

        "generation_rules_applied": [
          "dato_duro → valley",
          "audiencia escéptica → intensidad +1 vs baseline"
        ],

        "modified_by_user": false,
        "ai_metadata": {
          "agent_suggestions": [],
          "iteration_count": 1
        }
      }
    ],

    "history": [
      {
        "version": 1,
        "timestamp": "2024-11-14T09:00:00Z",
        "changed_by": "system",
        "change_summary": "Generación automática desde framework problema-solución-visión"
      },
      {
        "version": 2,
        "timestamp": "2024-11-14T16:20:00Z",
        "changed_by": "agent_narrativa",
        "change_summary": "Reordenó slides 3 y 4 para evitar valle doble"
      },
      {
        "version": 3,
        "timestamp": "2024-11-15T14:32:00Z",
        "changed_by": "user",
        "change_summary": "Ajustó intensidad slide 6 de 3 a 5"
      }
    ]
  }
}
```

## Reglas de generación automática (framework → curva)

| Tipo de tópico | Tipo de punto | Intensidad base |
|---|---|---|
| `problema_contexto` | peak | 7 |
| `dato_duro` | valley | 4 |
| `propuesta_valor` | transition | 6 |
| `prueba_social` | peak | 8 |
| `visión` | peak | 9 |
| `contexto_mercado` | valley | 3 |

**Calibración por audiencia:**
- Audiencia escéptica → valleys +1, peaks -1 vs baseline
- Audiencia entusiasta → peaks +1, valleys sin cambio

## Campos clave explicados

**`valence` + `arousal` separados de `target_emotion`**
Permiten calcular si la transición entre dos slides es abrupta o fluida. `valence` (positive/negative) y `arousal` (high/medium/low) dan precisión matemática a la curva.

**`emotion_alignment_score` en assets**
Puntuación 1–10 calculada por Agente 3. Si baja de 7, el sistema alerta. Evita imágenes visualmente bonitas pero emocionalmente neutras.

**`consecutive_valleys_max`**
El sistema detecta automáticamente cuando hay demasiados valles seguidos y alerta antes del ensayo.

## Flujo de generación y ajuste

```
Framework seleccionado en 2B
        │
        ▼
Sistema mapea cada tópico → punto de curva
usando 3 reglas:
  ├── tipo de tópico → tipo emocional
  ├── posición en el arco → intensidad
  └── emotional_baseline audiencia → calibración
        │
        ▼
Curva generada automáticamente (versión 1)
        │
        ▼
Autor ajusta manualmente punto por punto:
  ├── tipo (peak / valley / transition)
  ├── emoción objetivo
  └── intensidad (slider 1–10)
        │
        ▼
Aprobación → curva bloqueada → agentes downstream pueden operar
```
