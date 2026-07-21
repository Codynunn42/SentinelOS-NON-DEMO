# SentinelOS Brand Guidelines v1.0

Status: Production
Owner: SentinelOS Executive Desk
Effective Date: 2026-07-21

## 1. Brand System Overview

The SentinelOS identity system is built around:

- Sentinel matrix icon (core symbol)
- Wordmark lockup (SentinelOS)
- Controlled color modes for operational clarity across government and enterprise contexts

Brand usage must preserve precision, legibility, and trust signaling in every environment.

## 2. Approved Logo Variants

Only the following variants are approved for production use:

1. Primary Dark: matrix + wordmark on dark background
2. Primary Light: matrix + wordmark on light background
3. Mono White: pure white logo for dark or photo backgrounds (`#FFFFFF`)
4. Mono Black: pure black logo for light backgrounds (`#000000`)

Do not create custom recolors outside the sanctioned token set.

## 3. Color Tokens

### 3.1 Core Tokens

- `sentinel.black`: `#0B0B0B`
- `sentinel.white`: `#FFFFFF`
- `sentinel.red`: `#E10600`
- `sentinel.gray.900`: `#1A1A1A`
- `sentinel.gray.100`: `#F5F5F5`

### 3.2 Usage Guidance

- Use `sentinel.red` sparingly for action accents and status-critical moments.
- Favor `sentinel.black` and `sentinel.white` for executive and operational materials.
- Preserve contrast ratios suitable for accessibility and mission environments.

## 4. Typography System

### 4.1 Primary Typeface

- Family: Montserrat
- Usage: headings, labels, identity lockups

### 4.2 Secondary Typeface

- Family: Inter
- Usage: body text, long-form narrative, table labels

### 4.3 Typographic Rules

- Keep heading letter spacing tight but readable.
- Do not stretch, condense, or outline type in the wordmark.
- Maintain consistent hierarchy across docs, product, and presentation outputs.

## 5. Clear Space and Minimum Sizes

### 5.1 Clear Space

- Minimum clear space around any logo lockup: `1x` the height of the matrix icon module.
- No text, borders, or UI controls may enter the clear space boundary.

### 5.2 Minimum Digital Sizes

- Full lockup minimum width: `160px`
- Icon-only minimum width: `24px`
- Favicon matrix minimum width: `16px`

Do not render the full lockup below minimum width.

## 6. Icon and Favicon Standards

Required outputs:

- App icon (SVG master + PNG exports)
- Platform icon variants (macOS/iOS where required)
- GitHub/avatar square icon
- Favicon set (`.ico` + optional PNG fallbacks)

All exports must originate from the approved vector master files.

## 7. Background and Contrast Rules

- Dark backgrounds: use Primary Dark or Mono White.
- Light backgrounds: use Primary Light or Mono Black.
- Photography/complex imagery: use Mono White with sufficient contrast protection.

Never place logos directly over noisy backgrounds without contrast control.

## 8. Prohibited Modifications

The following are not allowed:

- Re-coloring outside approved tokens
- Distorting proportions
- Rotating logo components
- Applying drop shadows, glows, or bevel effects
- Replacing approved typefaces inside identity lockups
- Rearranging icon and wordmark spacing

## 9. File Naming Convention

Use deterministic names:

- `sentinelos-primary-dark.svg`
- `sentinelos-primary-light.svg`
- `sentinelos-mono-white.svg`
- `sentinelos-mono-black.svg`
- `sentinelos-app-icon.svg`
- `sentinelos-favicon-matrix.svg`

Exports should include platform and dimensions where applicable, for example:

- `app-icon-macos-512x512.png`
- `github-org-avatar-400x400.png`

## 10. Governance and Release Control

Every brand release must include:

- Completed release checklist
- Asset checksum manifest
- Review sign-off (Design + Product + Governance)
- Immutable version tag (`v1.0`, `v1.1`, etc.)

If any required artifact is missing, release is blocked.
