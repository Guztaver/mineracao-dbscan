---
name: Pulso
description: A cartographic monitor for reading synthetic electricity-consumption patterns.
colors:
  primary: "#ffc36b"
  primary-hover: "#ffd18a"
  primary-soft: "#ffe0ae"
  primary-ink: "#172333"
  page-bg: "#071a2b"
  surface-raised: "#0c2236"
  panel-bg: "#122d43"
  plot-bg: "#0a2033"
  text-strong: "#f0f5f6"
  text-soft: "#c5d5dd"
  text-muted: "#a6bbc6"
  text-chart: "#8fbdd0"
  border: "#29485f"
  border-bright: "#41647b"
  contour: "#78b5cd"
  contour-light: "#b9d9e5"
  anomaly: "#b3a1f7"
  success: "#76d6b0"
  error: "#ff9990"
  success-border: "#4c9c82"
  success-bg: "#123c3a"
  success-ink: "#ddf8eb"
  alert-border: "#bc8d50"
  alert-bg: "#45351f"
  alert-ink: "#fff0d4"
  error-border: "#bd6c68"
  error-bg: "#462829"
  error-ink: "#ffe4e0"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "clamp(30px, 3.3vw, 44px)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "23px"
    fontWeight: 600
    lineHeight: 1.1
  body:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.48
  label:
    fontFamily: "Barlow Semi Condensed, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "9px"
  md: "14px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "13px"
  lg: "17px"
  xl: "22px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "0 16px"
    typography: "{typography.label}"
  field:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.sm}"
    height: "49px"
    padding: "11px 12px"
  panel:
    backgroundColor: "{colors.panel-bg}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.md}"
    padding: "22px"
---

# Design System: Pulso

## Overview

**Creative North Star: “Carta de Sondagem”**

Pulso treats the consumption chart as a field to investigate. Density contours are calculated from the model's DBSCAN core points; a submitted reading is plotted in the same coordinate space, so the user can connect the classification to the data around it.

The web controls stay familiar and direct. Dark layered surfaces hold the plotting field, pale contour lines describe concentration, and amber is reserved for the submitted reading and primary action. The interface is informative and exploratory without implying that synthetic readings are real measurements.

**Key Characteristics:**
- Data-derived contours are the signature visual.
- Amber marks the primary action and the user's reading.
- The chart and input stay readable as a standard web tool.
- Synthetic data and model limits remain visible in context.

## Colors

The palette reads as a night survey field: deep blue layers support cool contour lines, while amber isolates the active input.

### Primary
- **Sounding Amber:** the primary button and the user's submitted point.
- **Ice Contour:** the main density lines and chart coordinates.
- **Pale Contour:** the strongest contour line and selected-field emphasis.
- **Reading Violet:** simulated anomalies in the data cloud.

### Secondary
- **Current Green:** confirms that the demonstration dataset is available and marks a normal result.

### Neutral
- **Night Field:** the page ground.
- **Raised Ink:** input wells and secondary surfaces.
- **Slate Panel:** the reading form and work panels.
- **Plot Basin:** the plotting canvas.
- **Map Ink:** primary text; **Sounding Notes** and **Chart Mist** carry secondary text.
- **Sounding Rule** and **Bright Rule** divide surfaces and show active fields.

### Named Rules
**The Single Marker Rule.** Amber belongs to the primary action and the user's input. Keep simulated anomaly points violet and typical points blue so the legend remains unambiguous.

## Typography

**Display Font:** Barlow Semi Condensed (self-hosted from `fonts/`, SIL Open Font License 1.1)  
**Body Font:** Barlow Semi Condensed  
**Label Font:** Barlow Semi Condensed

**Character:** One compact, open sans family keeps measurements and explanatory copy in the same visual voice. Weight and size, rather than extra typefaces or all-caps labels, distinguish titles from controls.

### Hierarchy
- **Display:** semibold, responsive large heading; introduces the task.
- **Title:** semibold section headings for the map, form, and explanation.
- **Body:** regular copy with a comfortable measure for instructions and caveats.
- **Label:** semibold field and chart labels; tabular numerals are used for measurements and metrics.

### Named Rules
**The One-Family Rule.** Use Barlow Semi Condensed throughout; do not introduce a display face for decoration.

## Layout

The wide screen pairs a dominant map with a narrower reading form; the map remains the largest region. At widths below the tablet breakpoint, the form and its result move above the map. On small phones, the introduction, controls, map, and explanatory disclosure remain in one column. The page is capped at a readable desktop measure and keeps enough interior space around chart labels and field groups.

## Elevation & Depth

Depth comes from tonal layers and full borders, not drop shadows. The plot is the darkest working surface, fields sit one level above it, and the form panel is lighter still. Focus and active states increase border contrast; they do not add glow or shadow.

### Named Rules
**The Layered Field Rule.** Use a darker plot plane inside a raised page surface; use borders to clarify panel edges.

## Shapes

Panels have medium rounded corners, while fields and buttons use smaller corners. Status labels may be pill-shaped. Borders are complete and visible, with no one-sided state rails.

## Components

### Buttons
- **Shape:** compact rounded rectangle with a clear 48px target height.
- **Primary:** amber fill, dark ink, centered action label and a small inline arrow.
- **Hover / Focus:** subtle vertical response on hover; a high-contrast amber outline for keyboard focus.

### Chips
- **Style:** dark-field text with a complete border; status dot and label communicate the demonstration-data state.
- **State:** colors repeat in the chart legend and result panel.

### Cards / Containers
- **Corner Style:** shared medium panel radius.
- **Background:** slate for the form, dark plot color for the chart, raised night for the explanation.
- **Shadow Strategy:** none; tonal separation and borders define the regions.
- **Internal Padding:** generous panel insets with tighter spacing around related labels and values.

### Inputs / Fields
- **Style:** raised dark well, bright text, unit aligned at the trailing edge.
- **Focus:** lighter full border, visible keyboard outline.
- **Error:** rose border and a separate error message that tells the user how to recover.

### Navigation
- **Style:** compact masthead with a line-drawn pulse mark and dataset status. It contains no fake destinations.

### Density Map
- **Style:** a canvas plots the data cloud and calculates a smoothed density field from saved DBSCAN core points; marching contour segments mark higher-density regions.
- **State:** simulated anomalies are violet; a submitted reading is amber with an outer ring and text label.

## Do's and Don'ts

### Do:
- **Do** keep the sampled data, density lines, and submitted marker distinct in the legend.
- **Do** use contours only for the calculated DBSCAN core-point field.
- **Do** preserve the synthetic-data note and limitations near the relevant task.
- **Do** keep chart labels, form controls, and status copy readable on small screens.

### Don't:
- **Don't** use the anomaly alert as a diagnosis or prediction.
- **Don't** use amber for simulated anomaly points.
- **Don't** add decorative grids or contour geometry outside the chart field.
- **Don't** rely on color alone for reading status.
