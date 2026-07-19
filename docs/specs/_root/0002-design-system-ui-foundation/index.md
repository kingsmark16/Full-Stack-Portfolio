# 0002. Design system and UI foundation

**Date**: 2026-07-19
**Status**: In Progress

## Summary

This decision establishes Midnight Workshop as the visual language for the public portfolio and future dashboard. The public portfolio must faithfully implement the selected Cyber Noir Terminal Stitch screen, including its palette, terminal layout, interactions, and animated effects. It is a visual system, not a light and dark theme toggle.

The public page remains driven by the existing NestJS portfolio response. Real values are shown when present, empty sections are hidden, and the interface never invents portfolio content to fill the design.

## Requirements

1. **AC-1**: The public page uses one coherent Midnight Workshop visual system with the canonical canvas, signal, surface, border, text, type, spacing, border, and motion tokens rather than isolated page specific styles.
2. **AC-2**: The public page maps every visible portfolio value to the existing API response and hides empty skills, experience, education, certifications, services, and projects without placeholder records or fake copy.
3. **AC-3**: The page has a responsive semantic structure with keyboard reachable navigation, visible focus, labelled controls, logical heading order, semantic equivalents for decorative source effects, and WCAG 2.2 AA contrast for text, focus, error, pending, and disabled states.
4. **AC-4**: The public page reproduces the selected Cyber Noir Terminal effects: the animated shader canvas, CRT overlay, scanline sweep, flicker, text stream, blinking terminal cursor, and hover glitch treatment. None of these effects carries required information, blocks reading or interaction, or remains animated for `prefers-reduced-motion: reduce`.
5. **AC-5**: The responsive layout preserves the visual hierarchy across narrow viewports below `48rem`, medium viewports from `48rem` through `74.99rem`, and wide viewports at `75rem` and above. Narrow viewports use one column and the mobile terminal navigation. Medium and wide viewports retain the source terminal shell, visible utility navigation, and archive grid without horizontal scrolling.
6. **AC-6**: Avatar, resume, project, and technology URLs are rendered only when supplied by the API. Missing imagery falls back to an accessible CSS terminal visual with no broken image state.
7. **AC-7**: Shared UI primitives keep the web application independent from Prisma and direct database access. The API contract remains the only source for portfolio content.
8. **AC-8**: The design has loading, empty, error, and contact submission states that preserve the same visual language and expose status changes to assistive technology.
9. **AC-9**: The selected source is recorded as Stitch project `8269407297924120097`, screen `290435ad99cd47b7bd6733fc59112983`, captured on `2026-07-19`. A checked in visual capture or export must be retained before the feature is marked complete so source fidelity remains reviewable if Stitch changes.
10. **AC-10**: WebGL and all other source effects are decorative. The page stays usable with the static CSS background when WebGL is unavailable. A keyboard reachable control lets a visitor stop or restart nonessential looping effects. Effects do not flash more than three times per second.

## Decision

**Chosen option**: Midnight Workshop, implemented as the mandatory Cyber Noir Terminal interface.

Cyber Noir Terminal is the required visual direction for the public portfolio and future dashboard surfaces. The public page must use the selected Stitch screen as its source of truth for visual hierarchy, colors, styling, interaction labels, and animation. Do not replace it with a light theme, a generic dark theme, another visual direction, or a restrained substitute without revising and re accepting this specification.

Use `#020d04` as the canvas, `#00ff41` as the primary signal, and `#ffb000` as the secondary signal. Use the source screen surface, border, and text treatments. Use Space Mono for terminal language, labels, navigation, metadata, and terminal copy. Use a display face only where the source screen does. Preserve the terminal windows, technical labels, hairline borders, archive or workshop metaphor, grid, and spacing rhythm from the source screen.

The page composition follows the Stitch direction while replacing generated sample data with the real contract: a utility navigation, identity hero, project archive, capability or skill matrix, experience history, and terminal style contact area. Sections render only when their corresponding API arrays contain data. The profile remains the anchor when all optional sections are empty.

The animated WebGL background, CRT texture, scanlines, flicker, text stream, cursor, and hover glitch are part of the required source faithful experience. Motion remains progressive enhancement. `prefers-reduced-motion` freezes nonessential animation and removes short transition timing while retaining the same information and hierarchy.

The system is implemented in the Next.js web app through local tokens and feature components. No database, Prisma import, or owner only data crosses into the web app.

**Precedence order**: real API content and semantic accessibility behavior come first. The selected Stitch source governs visual structure, styling, labels, interactivity, and animation only where it does not conflict with those requirements. The static fallback is the accessible representation of the same source direction, not another theme.

## Standard definition

**Canonical pattern**:

```text
API portfolio response
  -> typed web view model
  -> semantic page sections
  -> Midnight Workshop tokens and primitives
  -> progressive decoration and responsive layout
```

**Visual language**:

- `#020d04` canvas, phosphor green `#00ff41` text and status, and amber `#ffb000` secondary accents from the selected source screen.
- Translucent terminal surfaces and green hairline borders from the selected source screen, not generic dark panels.
- Monospaced text for system language and metadata, display typography for identity and editorial emphasis.
- Thin borders, compact corners, intentional empty space, and archive labels that make content feel catalogued.
- No gradients, glossy cards, heavy shadows, or decorative imagery that competes with the portfolio content.

**Canonical tokens**:

```text
--background: #020d04
--on-background: #00ff41
--primary: #00ff41
--secondary: #ffb000
--surface: rgba(5, 22, 7, 0.8)
--surface-container: rgba(8, 32, 10, 0.9)
--outline: #00ff41
--error: #ff0000
--font-terminal: "Space Mono", "Courier New", monospace
```

**Content pattern**:

- `profile.name` and `profile.biography` anchor the hero.
- `profile.avatarUrl` and `profile.resumeUrl` are optional enhancements.
- Each public array maps to a section with a stable heading and deterministic order from the API.
- Empty arrays produce no section. The page does not add fake projects, skills, employers, or achievements.
- The contact form remains the existing visitor flow and uses the existing API contract.

**Interaction pattern**:

- Navigation links are real anchors with source faithful terminal labels, a visible focus ring, and a current section cue where applicable.
- Buttons and form controls have explicit labels, keyboard support, disabled or pending states, and announced success or error feedback.
- Implement the source screen shader canvas, CRT overlay, scanline sweep, flicker, text stream, blinking terminal cursor, and hover glitch treatment.
- Decorative ASCII art, text streams, WebGL canvas, scanlines, and CRT overlays are hidden from assistive technology. The heading, navigation, and controls remain their semantic equivalents.
- Hover glitch feedback has the same visible focus treatment and is never the only sign that a control is available.
- Decorative animation never carries required information and becomes static under reduced motion, when the visitor turns effects off, or when WebGL cannot initialize.
- Error and loading states reuse the same terminal vocabulary while remaining plain enough to understand without the visual effect.

**Enforcement**:

The web app owns the tokens, primitives, and view mapping. TypeScript view models define the API boundary. ESLint, type checking, Vitest, and Playwright cover the component and visitor behavior. Visual review compares the implementation to the retained source capture. Review rejects hard coded one off colors, inaccessible interactive controls, placeholder portfolio data, direct database imports, missing static WebGL fallback, and motion that ignores reduced motion or the effect control.

**Rollout**:

Apply the system first to the public portfolio page and contact flow. Keep the API contract stable. Dashboard work later reuses the Cyber Noir Terminal tokens and primitives. Its exact page composition and interaction patterns remain a separate dashboard decision.

**Exceptions**:

An external image may be used only when its URL is supplied by the API and it has an accessible alternative. A section may use a one off layout when its content shape requires it, but it must still use the Cyber Noir Terminal tokens, focus rules, responsive behavior, and reduced motion policy. No alternate theme is an allowed exception.

## Decision record

The generated Stitch screen is the selected design source. The decision favors source fidelity, technical credibility, and memorability over a familiar portfolio template. The main tradeoff is that a terminal aesthetic has stronger visual and motion demands, so content and controls must remain readable, semantic, and usable with reduced motion. Real API content takes precedence over generated sample data, so empty records are hidden and no fictional content is shipped.

## Build plan

1. Preserve a checked in source capture and define the canonical CSS tokens, source typography stack, and responsive ranges, satisfies **AC-1**, **AC-5**, **AC-9**
2. Apply the source faithful terminal shell, API driven archive sections, and media fallbacks, satisfies **AC-2**, **AC-5**, **AC-6**, **AC-7**
3. Implement semantic source effects, WebGL fallback, reduced motion behavior, and the visitor effect control, satisfies **AC-3**, **AC-4**, **AC-10**
4. Build source faithful loading, empty, error, and contact states, then verify contrast and keyboard behavior, satisfies **AC-3**, **AC-8**, **AC-10**
5. Add unit and browser coverage for real content, static effect fallback, reduced motion, effect control, and narrow to wide layouts, satisfies **AC-1** through **AC-10**

## Consequences

**Positive**:

- The portfolio has a recognizable identity that fits a full stack developer.
- The same tokens can support future dashboard screens without introducing a second visual language.
- Content remains truthful because the UI is constrained by the API response.
- Reduced motion and semantic structure are part of the design contract instead of late fixes.

**Negative and tradeoffs**:

- The terminal metaphor requires careful content hierarchy so it does not feel like a gimmick.
- The exact palette and animated effects need contrast, performance, and reduced motion testing at every interactive state.
- Hiding empty sections means the page changes shape as the owner adds content.
- The source capture must be retained and updated intentionally when the visual direction changes.

**Neutral**:

- This specification does not add an image hosting provider, authentication, or new API endpoints.
- The dashboard can reuse the foundation later; its private workflows remain a separate feature decision.

## Follow up

1. Decide dashboard information architecture and owner interaction patterns before implementing private editing screens.
2. Decide media asset management when URL fields are replaced by uploads.
