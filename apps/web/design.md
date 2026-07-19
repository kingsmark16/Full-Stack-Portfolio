# Midnight Workshop design direction

**Source**: Stitch project `Mark Angel: Midnight Workshop`, screen `Cyber Noir Terminal - Animated Archive`.

## Character

Cyber noir terminal meets a careful workshop archive. The page should feel like opening a well maintained developer workstation, not a generic dark theme. Green phosphor signals activity, cyan marks navigation and metadata, and amber calls attention to warnings or selected states. The visual tone is precise, technical, editorial, and quietly personal.

## Composition

The public screen is a complete archive surface with these regions, in order:

1. A skip link and compact utility navigation with the wordmark and anchor links.
2. An identity hero with a terminal prompt, the real profile name and biography, optional avatar, and contact and resume actions.
3. A system status strip that explains the archive and the source of its content.
4. A project archive that appears only when projects exist, with project metadata, description, technologies, and optional links or image.
5. A capability matrix that appears only when skills exist, using names and optional icons from the API.
6. A history timeline that appears only when experience exists.
7. Supporting archive panels for education, certifications, and services when those arrays are not empty.
8. The existing contact form in a terminal panel, with its loading, success, and error states.
9. A small footer with the real contact email and archive status.

## Tokens

The token values live in `src/app/globals.css`. The names are stable and all new page styles must reference them.

```text
--background       deepest page background
--on-background    primary terminal text
--primary          phosphor signal and active border
--secondary        attention and metadata signal
--surface          panel background
--surface-container raised panel background
--outline          focus and active border
--error            error signal
--muted            supporting text
--faint            quiet border and supporting text
--font-terminal    interface and terminal copy
--terminal-width   centered archive shell width
--terminal-space   shared shell spacing
--terminal-shadow  terminal panel glow
```

## Typography

Use Space Mono for terminal language, labels, navigation, metadata, and form copy. Use a high contrast display face for the profile name and primary section headings. If the display face is not available locally, use a system display fallback. Body copy remains at least `1rem` on small screens.

## Layout and responsive behavior

Use a centered shell with a wide reading measure. The desktop layout uses an archive grid and split panels. At narrow widths, all content becomes one column, navigation links wrap or become a compact list, project metadata stacks, and no section causes horizontal scrolling. Interactive targets remain at least 44 CSS pixels through padding.

## Motion and effects

Use subtle opacity and transform transitions for section reveals, status changes, and focus feedback. CRT scanlines, cursor blink, and noise are decorative only and must remain low intensity. The effects control is keyboard reachable and exposes its state with `aria-pressed`; it pauses and resumes the nonessential WebGL, scanline, and flicker layers. Disable looping effects and collapse transition durations under `prefers-reduced-motion: reduce`. Never hide required content behind animation.

## Build mandate

Build the public page as a full Cyber Noir Terminal archive, not a naked form or a hero stub. Use the real API response, hide empty sections, keep all controls semantic and keyboard reachable, and preserve the existing API and contact contracts. Do not ship generated sample projects, employers, skills, or fake statistics. Use CSS terminal visuals when optional image URLs are absent.
