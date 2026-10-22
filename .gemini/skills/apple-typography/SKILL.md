---
name: apple-typography
description: Apple-inspired typography design system and standards for SysMaira public web interfaces. Enforces native SF Pro font stacks, fluid clamp-based type scales, refined letter-spacing (tracking), harmonious line heights, and WCAG 2.2 AA accessibility, with strict dashboard isolation.
---

# Apple Typography Design System Skill

This skill defines the typography standards, tokens, and implementation guidelines for the SysMaira public-facing website. It delivers a modern, minimalist, Apple-caliber editorial feel characterized by native system fonts, optically balanced letter-spacing, tight heading line heights, comfortable body reading rhythm, and accessible contrast.

## 1. Principles & Design Philosophy

1. **Native System Font Stack**:
   - Uses native operating system typography (`-apple-system`, `BlinkMacSystemFont`, `"SF Pro Display"`, `"SF Pro Text"`, `"Helvetica Neue"`, `Arial`, `sans-serif`).
   - Zero external font downloads (no layout shifts, zero render-blocking FOIT/FOUT, instant zero-latency paint).
   - High legibility on Apple hardware (San Francisco / SF Pro) while falling back seamlessly to Segoe UI, Roboto, or Helvetica on Windows/Linux/Android.

2. **Optical Heading Tightness & Open Body**:
   - Large display headlines use tight line heights (`1.05`–`1.12`) and negative letter-spacing (`-0.035em` to `-0.025em`) to appear cohesive and monolithic.
   - Body copy uses open line heights (`1.6`–`1.68`) and subtle negative tracking (`-0.011em`) for effortless long-form readability.
   - Micro-copy, eyebrow kickers, and badge tags use uppercase styling with expanded tracking (`+0.05em` to `+0.08em`) and semibold weights (`600`).

3. **Fluid Responsive Scales (`clamp`)**:
   - Viewport-responsive typography prevents awkward text breaks on tablets and avoids oversized text on laptops.
   - Text scales smoothly between small mobile viewports (375px) and wide desktop screens (1440px+).

4. **Strict Dashboard Isolation**:
   - All Apple typography tokens, font family declarations, and utility classes are scoped strictly to `.public-root` and `.public-surface`.
   - Never alter or leak public typography tokens into `/dashboard/*` routes or dashboard-specific components.

---

## 2. Typography Token Specification

### Font Stacks
```css
/* Primary Sans Stack */
--font-apple-system: -apple-system, BlinkMacSystemFont, "SF Pro Display",
  "SF Pro Text", "Helvetica Neue", Arial, sans-serif;

/* Monospace Code / Metric Stack */
--font-mono-system: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco,
  Consolas, "Liberation Mono", "Courier New", monospace;
```

### Font Size Scale (`clamp`)
| Token | Mobile | Desktop Target | Usage |
| :--- | :--- | :--- | :--- |
| `--font-size-hero` | `2.5rem` (40px) | `4.5rem` (72px) | Hero main headline |
| `--font-size-h1` | `2.125rem` (34px) | `3.5rem` (56px) | Page titles, primary section headers |
| `--font-size-h2` | `1.75rem` (28px) | `2.625rem` (42px) | Section titles, feature headers |
| `--font-size-h3` | `1.25rem` (20px) | `1.75rem` (28px) | Card titles, subsection headings |
| `--font-size-h4` | `1.125rem` (18px) | `1.35rem` (21.6px) | Compact card titles, modal titles |
| `--font-size-body-lg`| `1.0625rem` (17px) | `1.25rem` (20px) | Subheadings, lead introduction paragraphs |
| `--font-size-body` | `1rem` (16px) | `1rem` (16px) | Standard body text, feature lists |
| `--font-size-small` | `0.875rem` (14px) | `0.875rem` (14px) | Secondary metadata, captions, inputs |
| `--font-size-caption`| `0.75rem` (12px) | `0.75rem` (12px) | Eyebrow badges, kickers, timestamps |

### Weights & Line Heights
```css
/* Font Weights */
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Line Heights */
--line-height-hero: 1.06;
--line-height-heading: 1.15;
--line-height-subheading: 1.3;
--line-height-body: 1.62;
--line-height-relaxed: 1.75;

/* Letter Spacing (Tracking) */
--tracking-hero: -0.035em;
--tracking-h1: -0.03em;
--tracking-h2: -0.025em;
--tracking-h3: -0.018em;
--tracking-body: -0.011em;
--tracking-eyebrow: 0.08em;
```

---

## 3. Semantic CSS Utility Classes

Within `.public-root`, the following semantic helper classes provide direct application of the Apple typography standards:

```css
/* Hero Display Headline */
.apple-hero-headline {
  font-family: var(--font-apple-system);
  font-size: var(--font-size-hero);
  line-height: var(--line-height-hero);
  letter-spacing: var(--tracking-hero);
  font-weight: 700;
}

/* Primary Section Title (H2) */
.apple-section-title {
  font-family: var(--font-apple-system);
  font-size: var(--font-size-h2);
  line-height: var(--line-height-heading);
  letter-spacing: var(--tracking-h2);
  font-weight: 700;
}

/* Section Eyebrow / Kicker */
.apple-eyebrow {
  font-family: var(--font-apple-system);
  font-size: var(--font-size-caption);
  line-height: 1.4;
  letter-spacing: var(--tracking-eyebrow);
  font-weight: 600;
  text-transform: uppercase;
}

/* Lead Subheading Paragraph */
.apple-lead {
  font-size: var(--font-size-body-lg);
  line-height: var(--line-height-body);
  letter-spacing: var(--tracking-body);
  font-weight: 400;
  max-width: 65ch;
}

/* Standard Body Copy */
.apple-body {
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  letter-spacing: var(--tracking-body);
  font-weight: 400;
}
```

---

## 4. Accessibility & Contrast Standards (WCAG 2.2 AA)

1. **Color Contrast Ratios**:
   - Body copy (`#475569` on `#f8fafc` in light mode, `#94a3b8` on `#020617` in dark mode) achieves `>= 4.5:1` contrast.
   - Headings (`#0f172a` in light mode, `#f8fafc` in dark mode) achieve `>= 11:1` contrast.
   - Eyebrows & badges (`#0284c7` on `#e0f2fe` / `#06b6d4` on `#083344`) achieve `>= 4.5:1` contrast.

2. **Reading Line Lengths (Ergonomics)**:
   - Paragraphs are constrained to `max-w-2xl` or `max-w-3xl` (`60` to `75` characters per line) to eliminate cognitive strain during continuous reading.

3. **Subpixel Antialiasing**:
   - `-webkit-font-smoothing: antialiased;` and `-moz-osx-font-smoothing: grayscale;` are enabled globally on `.public-root` for crisp rendering across all Retina and high-DPI screens.

---

## 5. Usage in Public Components (Examples)

### Example 1: Section Header
```tsx
<div className="max-w-3xl">
  <p className="apple-eyebrow text-violet-600 dark:text-cyan-400">
    Enterprise Solutions
  </p>
  <h2 className="apple-section-title mt-3 text-slate-900 dark:text-white">
    High-performance engineering tailored to your operational scale.
  </h2>
  <p className="apple-lead mt-4 text-slate-600 dark:text-slate-300">
    Every service is backed by documented PostgreSQL schemas, containerized deployment pipelines, and guaranteed SLA contracts.
  </p>
</div>
```

### Example 2: Interactive Card Heading
```tsx
<div className="glass-card p-8 rounded-3xl">
  <span className="font-mono text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-cyan-400">
    2 Weeks Delivery
  </span>
  <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
    Starter Sprint
  </h3>
  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
    Rapid deep-dive assessment of your existing software, data schemas, security compliance, and performance bottlenecks.
  </p>
</div>
```

---

## 6. How to Reference in Future Prompts

To activate or align any future design or component work with this skill, instruct the assistant:
> "Follow the `apple-typography` skill specifications in `.gemini/skills/apple-typography/SKILL.md` for all font scales, tracking, line heights, and public-scoped design tokens."

