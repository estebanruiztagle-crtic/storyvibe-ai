# Schema Zona 2 — Tópicos y arquitectura narrativa

## Estructura secuencial

```
Zona 2A (mapa de tópicos) → contrato validado → Zona 2B (arquitectura narrativa) → curva emocional
```

---

## Zona 2A — Mapa de tópicos

```json
{
  "zone_2a": {
    "id": "z2a_uuid",
    "status": "completed",
    "version": 2,
    "last_modified": "2024-11-15T10:15:00Z",

    "author_pattern": {
      "learned_from_presentations": 7,
      "typical_topic_count": { "min": 4, "max": 7, "preferred": 5 },
      "selection_bias": [
        "prefiere datos propios sobre datos de terceros",
        "siempre incluye un caso de cliente real",
        "evita tópicos de competencia directa"
      ],
      "confidence": 0.78,
      "note": "patrón en desarrollo — requiere más presentaciones para alta confianza"
    },

    "research_pool": {
      "total_candidates": 14,
      "sources": [
        {
          "source_id": "src_003",
          "topics_extracted": [
            "brecha de inclusión financiera LATAM",
            "tamaño de mercado $150B",
            "crecimiento 23% YoY"
          ]
        },
        {
          "source_id": "doc_001",
          "topics_extracted": [
            "ARR $2.1M",
            "caso cliente Banco X",
            "churn 1.4%",
            "NPS 72"
          ]
        }
      ]
    },

    "topics": [
      {
        "id": "topic_01",
        "label": "brecha de inclusión financiera LATAM",
        "type": "problema_contexto",
        "source_ids": ["src_003"],
        "origin": "investigación_web",
        "weight": {
          "relevance_to_audience": 9,
          "emotional_potential": 7,
          "data_availability": 9,
          "author_pattern_match": 0.82,
          "composite_score": 8.4
        },
        "selected": true,
        "selected_by": "autor",
        "mandatory": false
      },
      {
        "id": "topic_02",
        "label": "tamaño de mercado $150B",
        "type": "dato_duro",
        "source_ids": ["src_003"],
        "origin": "investigación_web",
        "weight": {
          "relevance_to_audience": 9,
          "emotional_potential": 5,
          "data_availability": 10,
          "author_pattern_match": 0.71,
          "composite_score": 8.1
        },
        "selected": true,
        "selected_by": "sistema_sugerido",
        "mandatory": false
      },
      {
        "id": "topic_03",
        "label": "solución propuesta",
        "type": "propuesta_valor",
        "source_ids": ["doc_001"],
        "origin": "documento_interno",
        "weight": {
          "relevance_to_audience": 10,
          "emotional_potential": 8,
          "data_availability": 9,
          "author_pattern_match": 0.91,
          "composite_score": 9.2
        },
        "selected": true,
        "selected_by": "autor",
        "mandatory": false
      },
      {
        "id": "topic_04",
        "label": "caso cliente Banco X",
        "type": "prueba_social",
        "source_ids": ["doc_001"],
        "origin": "documento_interno",
        "weight": {
          "relevance_to_audience": 8,
          "emotional_potential": 9,
          "data_availability": 8,
          "author_pattern_match": 0.95,
          "composite_score": 8.7
        },
        "selected": true,
        "selected_by": "autor",
        "mandatory": false,
        "note": "patrón recurrente del autor — siempre incluye caso real"
      },
      {
        "id": "topic_05",
        "label": "tracción ARR $2.1M",
        "type": "dato_duro",
        "source_ids": ["doc_001"],
        "origin": "documento_interno",
        "weight": {
          "relevance_to_audience": 10,
          "emotional_potential": 6,
          "data_availability": 10,
          "author_pattern_match": 0.88,
          "composite_score": 9.0
        },
        "selected": true,
        "selected_by": "autor",
        "mandatory": true,
        "mandatory_source": "zone_1.constraints.mandatory_inclusions"
      },
      {
        "id": "topic_06",
        "label": "roadmap 18 meses",
        "type": "visión",
        "source_ids": ["doc_001"],
        "origin": "documento_interno",
        "weight": {
          "relevance_to_audience": 8,
          "emotional_potential": 8,
          "data_availability": 7,
          "author_pattern_match": 0.74,
          "composite_score": 7.9
        },
        "selected": true,
        "selected_by": "autor",
        "mandatory": true,
        "mandatory_source": "zone_1.constraints.mandatory_inclusions"
      },
      {
        "id": "topic_07",
        "label": "análisis competitivo",
        "type": "contexto_mercado",
        "source_ids": ["src_003"],
        "origin": "investigación_web",
        "weight": {
          "relevance_to_audience": 6,
          "emotional_potential": 4,
          "data_availability": 7,
          "author_pattern_match": 0.31,
          "composite_score": 5.4
        },
        "selected": false,
        "rejected_reason": "contradice zone_1.constraints.topics_to_avoid + bajo pattern_match del autor"
      }
    ],

    "selected_topics_summary": {
      "count": 6,
      "mandatory": 2,
      "author_initiated": 3,
      "system_suggested_accepted": 1,
      "estimated_coverage_minutes": 17
    },

    "contract_output": {
      "status": "validated",
      "ready_for_2b": true,
      "locked_at": "2024-11-15T10:20:00Z"
    }
  }
}
```

## Tipos de tópico

| Tipo | Rol emocional |
|---|---|
| `problema_contexto` | peak — gancho de apertura |
| `dato_duro` | valley — información fría |
| `propuesta_valor` | transition — puente |
| `prueba_social` | peak — validación |
| `visión` | peak máximo — cierre |
| `contexto_mercado` | valley — contexto analítico |

---

## Zona 2B — Arquitectura narrativa

```json
{
  "zone_2b": {
    "id": "z2b_uuid",
    "status": "awaiting_selection",
    "version": 1,

    "storytelling_research": {
      "query": "storytelling frameworks pitch deck inversores escépticos fintech",
      "sources_consulted": 6,
      "frameworks_evaluated": 4
    },

    "storytelling_options": [
      {
        "id": "st_01",
        "name": "problema — solución — visión",
        "origin": "McKee / Duarte",
        "description": "Establece el dolor del mercado, presenta la solución como inevitable y proyecta el futuro que el inversor puede co-crear.",
        "fit_score": 9.2,
        "fit_reasons": [
          "audiencia escéptica responde bien a estructura lógica clara",
          "permite integrar datos duros en el valle sin perder momentum",
          "cierre aspiracional activa confianza — emoción objetivo de zona 1"
        ],
        "emotional_arc_proposed": ["curiosidad", "tensión", "alivio", "excitación", "confianza"],
        "risk": "puede sentirse formulaico si no hay gancho fuerte en la apertura",
        "recommended": true
      },
      {
        "id": "st_02",
        "name": "el mundo cambia — nosotros lo vimos primero",
        "origin": "Sequoia pitch framework",
        "description": "Abre con una tendencia macro inevitable, posiciona al equipo como los que detectaron la oportunidad antes que nadie.",
        "fit_score": 8.4,
        "fit_reasons": [
          "muy efectivo con inversores de VC acostumbrados al framework de Sequoia",
          "el dato de mercado $150B encaja naturalmente como evidencia de la tendencia"
        ],
        "emotional_arc_proposed": ["sorpresa", "curiosidad", "urgencia", "confianza"],
        "risk": "requiere que el equipo tenga credenciales de visión temprana",
        "recommended": false
      },
      {
        "id": "st_03",
        "name": "el héroe con un problema",
        "origin": "StoryBrand — Donald Miller",
        "description": "El cliente es el héroe, el producto es la guía. La narrativa orbita alrededor de la transformación del cliente.",
        "fit_score": 7.8,
        "fit_reasons": [
          "caso cliente Banco X encaja perfectamente como historia central",
          "humaniza la propuesta de valor ante audiencia técnicamente escéptica"
        ],
        "emotional_arc_proposed": ["empatía", "tensión", "esperanza", "satisfacción", "confianza"],
        "risk": "puede diluir los datos duros si no se integran con cuidado",
        "recommended": false
      },
      {
        "id": "st_04",
        "name": "antes — después — puente",
        "origin": "framework de copywriting aplicado a pitch",
        "description": "Contrasta el estado actual del mercado con el estado futuro posible, y posiciona el producto como el puente.",
        "fit_score": 7.1,
        "fit_reasons": [
          "estructura simple que funciona bien en slots de tiempo corto",
          "20 minutos es ajustado — esta estructura minimiza el riesgo de sobrepasar el tiempo"
        ],
        "emotional_arc_proposed": ["incomodidad", "esperanza", "confianza"],
        "risk": "arco emocional demasiado corto — pocos picos, riesgo de presentación plana",
        "recommended": false
      }
    ],

    "selected_framework": null,
    "selected_by": null,
    "selected_at": null,
    "narrative_map": null,
    "agent_next_action": "presentar opciones al autor para selección"
  }
}
```

## Contrato 2A → 2B

```
2A produce:
  ├── lista de tópicos seleccionados (validada por autor)
  ├── tipo de cada tópico (dato_duro, prueba_social, visión, etc.)
  ├── peso emocional potencial de cada uno
  └── restricciones heredadas de zona 1 (mandatory, forbidden)

2B consume eso y:
  ├── investiga frameworks de storytelling aplicables
  ├── score cada framework contra el conjunto de tópicos disponibles
  ├── presenta opciones al autor con justificación
  └── una vez seleccionado, mapea cada tópico al arco narrativo
      y propone la curva emocional inicial
```

## Mecanismo de aprendizaje del autor (2A)

El objeto `author_pattern` se actualiza con cada presentación completada:

- `typical_topic_count` → promedio histórico de tópicos seleccionados
- `selection_bias` → patrones estadísticos detectados (ej: si en 7/7 presentaciones incluiste un caso real, se registra como sesgo estable)
- `confidence` → sube con cada presentación hasta ~15 donde el sistema puede preseleccionar con alta precisión
