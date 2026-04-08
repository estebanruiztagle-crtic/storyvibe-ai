# Schema Brand Layer — Restricción global transversal

## Posición en el sistema

El brand layer no pertenece a ninguna zona. Es una capa por encima de todas, con una barra persistente visible en todo momento. Se carga antes que cualquier otro proceso al iniciar una sesión.

```
┌──────────────────────────────────────────────────────┐
│  BRAND LAYER — activo · brand book v2.3              │  ← barra persistente
└──────────────────────────────────────────────────────┘
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  zona 1  │  zona 2  │  zona 3  │  zona 4  │  zona 5  │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

## Objeto principal: `brand_layer`

```json
{
  "brand_layer": {
    "id": "brand_uuid",
    "workspace_id": "workspace_uuid",
    "scope": "global",
    "priority": "override",
    "status": "active",
    "loaded_at": "2024-11-15T08:45:00Z",

    "source": {
      "type": "pdf",
      "filename": "brandbook_v2.3.pdf",
      "version": "2.3",
      "owner": "Empresa X",
      "parsed_at": "2024-11-15T08:46:00Z",
      "parse_confidence": 0.93,
      "low_confidence_fields": ["logo_usage.clear_space"]
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
          "mono": "IBM Plex Mono",
          "forbidden": ["Comic Sans", "Papyrus", "cualquier script decorativo"]
        },
        "imagery": {
          "allowed_styles": ["alto contraste", "personas reales", "fotografía documental"],
          "forbidden_styles": ["stock genérico", "ilustración", "renders 3D"],
          "color_treatment": "monocromático o duotono en paleta primaria"
        },
        "data_visualization": {
          "style": "minimalista",
          "max_variables_per_chart": 1,
          "allowed_chart_types": ["barra", "línea", "scatter"],
          "forbidden_chart_types": ["pie", "donut", "área apilada"]
        },
        "logo": {
          "clear_space": "2x height",
          "forbidden_backgrounds": ["rojo", "verde saturado"],
          "formats": ["SVG", "PNG transparente"]
        }
      },

      "verbal": {
        "tone_adjectives": ["preciso", "directo", "ambicioso"],
        "forbidden_patterns": [
          "jerga informal",
          "superlativos vacíos",
          "anglicismos innecesarios"
        ],
        "sentence_style": "corto y activo",
        "person": "segunda persona singular"
      },

      "layout": {
        "grid": "12 columnas",
        "margins": "generosos",
        "density": "baja",
        "hierarchy_levels": 3
      }
    },

    "enforcement": {
      "mode": "strict",
      "on_violation": "block_and_explain",
      "agents_affected": [
        "agente_assets",
        "agente_critico",
        "agente_narrativa",
        "zona_5_storyboard"
      ],
      "violation_log": [
        {
          "id": "viol_001",
          "timestamp": "2024-11-15T14:20:00Z",
          "agent": "agente_assets",
          "asset_id": "asset_candidate_07",
          "violation_type": "imagery.forbidden_styles",
          "detail": "imagen rechazada — estilo stock genérico",
          "rule_cited": "constraints.visual.imagery.forbidden_styles",
          "action_taken": "asset_descartado"
        }
      ]
    },

    "ui": {
      "display_in_bar": true,
      "color_preview": ["#1A1A2E", "#16213E", "#0F3460", "#E94560", "#F5F5F5"],
      "font_preview": "Neue Haas Grotesk / Georgia",
      "inspection_panel": "expandible",
      "violation_badge": true
    }
  }
}
```

## Modos de enforcement

| Modo | Comportamiento |
|---|---|
| `strict` | bloquea cualquier violación automáticamente |
| `advisory` | permite la violación pero la marca con advertencia visible |

## Notas de implementación

- Se parsea antes que cualquier otro proceso al iniciar sesión
- Si no hay brand book cargado, el sistema advierte explícitamente antes de continuar
- El `violation_log` es compartido con Zona 4 — trazabilidad unificada entre assets y diseño
- Cuando el sistema bloquea algo por brand, debe citar la regla exacta que lo causó
