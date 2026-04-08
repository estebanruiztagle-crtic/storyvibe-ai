# Schema Zona 5 — Storyboard + tiempo

## Objeto principal: `zone_5`

```json
{
  "zone_5": {
    "id": "z5_uuid",
    "presentation_id": "pres_uuid",

    "contracts": {
      "curve_id": "curve_uuid",
      "assets_id": "z3_uuid",
      "zone4_id": "z4_uuid",
      "brand_layer_id": "brand_uuid",
      "total_time_minutes": 20
    },

    "time_control": {
      "total_available_seconds": 1200,
      "total_estimated_seconds": 1110,
      "buffer_seconds": 90,
      "status": "ok",
      "alert_threshold_pct": 0.95,
      "alert": null,
      "fallback_version": {
        "available": true,
        "cuts": ["slide_5_reducido", "slide_3_eliminado"],
        "estimated_seconds": 900,
        "label": "versión 15 min"
      }
    },

    "slides": [
      {
        "id": "sb_01",
        "slide_number": 1,
        "label": "apertura",
        "topic": "brecha de inclusión financiera LATAM",

        "curve_point": {
          "type": "peak",
          "emotion": "curiosidad",
          "intensity": 7
        },

        "timing": {
          "estimated_seconds": 60,
          "pacing": "lento",
          "speaker_notes_words": 80
        },

        "content_summary": "pregunta retórica de apertura + dato sorpresivo",

        "assets": {
          "primary": {
            "asset_id": "asset_001",
            "type": "image",
            "brand_compliance_score": 9.2,
            "thumbnail_url": "storage/thumbs/asset_001.jpg"
          }
        },

        "design": {
          "zone4_score": 8.6,
          "zone4_status": "warning",
          "pending_suggestions": 1,
          "canva_slide_id": "canva_slide_001"
        },

        "status": {
          "assets": "approved",
          "design": "warning",
          "overall": "warning"
        }
      },
      {
        "id": "sb_02",
        "slide_number": 2,
        "label": "problema",
        "topic": "tamaño de mercado $150B",

        "curve_point": {
          "type": "valley",
          "emotion": "atención fría",
          "intensity": 4
        },

        "timing": {
          "estimated_seconds": 120,
          "pacing": "medio",
          "speaker_notes_words": 160
        },

        "content_summary": "dato duro de mercado + visualización",

        "assets": {
          "primary": {
            "asset_id": "asset_002",
            "type": "image",
            "brand_compliance_score": 9.5,
            "thumbnail_url": "storage/thumbs/asset_002.jpg"
          }
        },

        "design": {
          "zone4_score": 9.1,
          "zone4_status": "pass",
          "pending_suggestions": 0,
          "canva_slide_id": "canva_slide_002"
        },

        "status": {
          "assets": "approved",
          "design": "pass",
          "overall": "pass"
        }
      },
      {
        "id": "sb_03",
        "slide_number": 3,
        "label": "agravante",
        "topic": "solución propuesta",

        "curve_point": {
          "type": "transition",
          "emotion": "esperanza",
          "intensity": 6
        },

        "timing": {
          "estimated_seconds": 150,
          "pacing": "medio",
          "speaker_notes_words": 200
        },

        "content_summary": "analogía + demo visual de la solución",

        "assets": {
          "primary": {
            "asset_id": "asset_003",
            "type": "image",
            "brand_compliance_score": 9.4,
            "thumbnail_url": "storage/thumbs/asset_003.jpg"
          }
        },

        "design": {
          "zone4_score": 8.2,
          "zone4_status": "warning",
          "pending_suggestions": 2,
          "canva_slide_id": "canva_slide_003"
        },

        "status": {
          "assets": "approved",
          "design": "warning",
          "overall": "warning"
        }
      },
      {
        "id": "sb_04",
        "slide_number": 4,
        "label": "caso cliente",
        "topic": "caso cliente Banco X",

        "curve_point": {
          "type": "peak",
          "emotion": "confianza emergente",
          "intensity": 8
        },

        "timing": {
          "estimated_seconds": 270,
          "pacing": "medio",
          "speaker_notes_words": 360
        },

        "content_summary": "historia Banco X + métricas NPS 72",

        "assets": {
          "primary": {
            "asset_id": "asset_004",
            "type": "video",
            "brand_compliance_score": 10,
            "thumbnail_url": "storage/thumbs/asset_004.jpg"
          }
        },

        "design": {
          "zone4_score": 6.5,
          "zone4_status": "fail",
          "pending_suggestions": 2,
          "canva_slide_id": "canva_slide_004"
        },

        "status": {
          "assets": "approved",
          "design": "fail",
          "overall": "fail"
        }
      },
      {
        "id": "sb_05",
        "slide_number": 5,
        "label": "tracción",
        "topic": "tracción ARR $2.1M",

        "curve_point": {
          "type": "valley",
          "emotion": "análisis",
          "intensity": 5
        },

        "timing": {
          "estimated_seconds": 240,
          "pacing": "lento",
          "speaker_notes_words": 320
        },

        "content_summary": "métricas ARR, MoM growth, churn",

        "assets": {
          "primary": {
            "asset_id": "asset_005",
            "type": "image",
            "brand_compliance_score": 9.1,
            "thumbnail_url": "storage/thumbs/asset_005.jpg"
          }
        },

        "design": {
          "zone4_score": null,
          "zone4_status": "pending",
          "pending_suggestions": 0,
          "canva_slide_id": "canva_slide_005"
        },

        "status": {
          "assets": "approved",
          "design": "pending",
          "overall": "pending"
        }
      },
      {
        "id": "sb_06",
        "slide_number": 6,
        "label": "visión",
        "topic": "roadmap 18 meses",

        "curve_point": {
          "type": "peak",
          "emotion": "excitación",
          "intensity": 9
        },

        "timing": {
          "estimated_seconds": 270,
          "pacing": "rápido",
          "speaker_notes_words": 200
        },

        "content_summary": "roadmap visual + llamada a la acción",

        "assets": {
          "primary": {
            "asset_id": "asset_006",
            "type": "video",
            "brand_compliance_score": 9.5,
            "thumbnail_url": "storage/thumbs/asset_006.jpg"
          }
        },

        "design": {
          "zone4_score": null,
          "zone4_status": "pending",
          "pending_suggestions": 0,
          "canva_slide_id": "canva_slide_006"
        },

        "status": {
          "assets": "approved",
          "design": "pending",
          "overall": "pending"
        }
      }
    ],

    "readiness": {
      "overall_status": "in_progress",
      "slides_ready": 1,
      "slides_warning": 2,
      "slides_fail": 1,
      "slides_pending": 2,
      "blocking_issues": [
        {
          "slide": 4,
          "reason": "2 sugerencias de zona 4 pendientes de aprobación con severidad high",
          "severity": "high"
        }
      ],
      "export_to_canva_blocked": true,
      "export_blocked_reason": "slide 4 tiene issues críticos sin resolver"
    }
  }
}
```

## Lógica de `status.overall`

El estado compuesto de cada slide toma el peor de tres fuentes:

| `status.assets` | `status.design` | `status.overall` |
|---|---|---|
| approved | pass | pass |
| approved | warning | warning |
| approved | fail | fail |
| approved | pending | pending |
| pending | pass | pending |

## Control de tiempo

Simple y binario — solo alerta cuando el total estimado supera el `alert_threshold_pct`:

```
total_estimated_seconds / total_available_seconds >= 0.95 → ALERTA
```

La `fallback_version` siempre está precalculada para activar la versión corta sin rediseñar.

## Regla de exportación

Bloquea la exportación mientras haya al menos un slide con:
- `status.overall = "fail"` Y
- `zone4_status = "fail"` con `pending_suggestions > 0` de severidad `high`
