# Design system and UI foundation rationale

## Context

The first public page already has a reliable API, contact flow, loading state, error state, and SEO behavior. The visual system is the remaining foundation decision. The engineer selected a generated Stitch screen titled `Mark Angel: Midnight Workshop` with a `Cyber Noir Terminal` screen and wants the real portfolio content mapped into it. The reference is Stitch project `8269407297924120097`, screen `290435ad99cd47b7bd6733fc59112983`, captured on `2026-07-19`.

## Options considered

### Midnight Workshop and Cyber Noir Terminal

Use the selected Cyber Noir Terminal source as a faithful workshop terminal metaphor with its near black canvas, signal colors, archive labels, CRT details, and animated effects.

**Pros**:

- Memorable and technically credible for a full stack developer.
- Gives projects, skills, and history a natural archive structure.
- Supports a cohesive public page and future owner dashboard.

**Cons**:

- Can become visually noisy or resemble a novelty terminal if the source effects obscure content.
- Requires deliberate accessibility work for contrast, performance, and reduced motion.

### Chromatic Field Notes

Use a bright editorial field notebook with colorful annotations, diagrams, and irregular content blocks.

**Pros**:

- Friendly and expressive.
- Makes varied content types easy to distinguish.

**Cons**:

- Less aligned with the selected Stitch screen and technical positioning.
- A large color vocabulary can weaken consistency and contrast.

### Analog Future Archive

Use a warm archival interface with paper, scan marks, labels, and physical media references.

**Pros**:

- Distinctive and tactile.
- Strong storytelling potential for experience and project history.

**Cons**:

- More dependent on imagery and texture assets.
- Less direct connection to the existing generated screen and developer identity.

## Rationale

Midnight Workshop was selected because it is distinctive without requiring fictional portfolio content. The engineer requires the selected screen's palette, layout, interaction language, and animation rather than an interpretation of it. The implementation keeps API data honest, hides empty sections, and provides a static CSS representation when WebGL cannot run or a visitor turns off effects. This lets source fidelity remain reviewable and usable.
