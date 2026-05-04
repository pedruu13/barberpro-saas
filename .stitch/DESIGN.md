# Design System: BarberPro — Modern Noir / Artisan Heritage

## 1. Visual Theme & Atmosphere
The design system targets high-end grooming establishments that operate at the intersection of craftsmanship and cutting-edge technology. The brand personality is "Technological Noir" — sophisticated, mysterious, and precision-engineered. 

- **Density:** 6 (Balanced, prioritized for workflow clarity)
- **Variance:** 7 (Offset asymmetric layouts for an editorial, non-generic feel)
- **Motion:** 5 (Fluid CSS transitions with weighty spring physics)

The atmosphere evokes the feeling of a bespoke tailoring shop or a high-end gentleman's club. It avoids generic tech patterns by using asymmetric layouts, generous whitespace (black-space), and a focus on high-quality typography that feels "human-made."

## 2. Color Palette & Roles
The palette is centered on a "Midnight and Gold" theme.
- **Midnight Canvas** (#121414) — Primary background surface (Never use #000000)
- **Deep Surface** (#1A1A1A) — Card and container fill, tonal layering
- **Artisan Gold** (#D4AF37) — Primary accent for CTAs, active states, and brand highlights
- **Warm Silver** (#E2E2E2) — Primary text, ensuring high contrast against the dark base
- **Muted Bronze** (#99907C) — Secondary text, metadata, and thin structural lines
- **Whisper Border** (rgba(255, 255, 255, 0.1)) — Subtle dividers and strokes

## 3. Typography Rules
- **Display/Headlines:** Noto Serif — Track-tight, controlled scale. Conveys tradition and elegance.
- **Body:** Manrope — Relaxed leading, 65ch max-width. Ensures exceptional legibility and modern clarity.
- **Mono:** JetBrains Mono — For timestamps, pricing, and system data.
- **Banned:** Inter (BANNED for premium context), generic system fonts, standard serifs (Times New Roman).

## 4. Component Stylings
- **Buttons:** Sharp edges (0px) or minimal 4px radius. Solid Gold (#D4AF37) background with black text for primary actions. Ghost style with gold border for secondary.
- **Cards:** Tonal layering (Deep Surface #1A1A1A). No heavy shadows; hierarchy through thin borders and slight background shifts.
- **Inputs:** Underlined style (ledger-like) or charcoal-filled containers with gold focus rings. Labels above.
- **Loaders:** Skeletal shimmer matching layout dimensions. No generic spinners.

## 5. Layout Principles
- **Purposeful Whitespace:** prioritize "black-space" to guide the eye. Leave columns empty for luxury feel.
- **Asymmetry:** Centered Hero layouts are BANNED. Use 2-column zig-zag or offset grids.
- **Precision Grid:** 12-column desktop grid with 24px gutters. Container max-width 1200px.
- **Responsive:** Strict single-column collapse below 768px. All tap targets minimum 44px.

## 6. Motion & Interaction
- **Spring Physics:** `stiffness: 100, damping: 20` for premium weight.
- **Cascade Reveals:** Staggered mounting for lists and sections.
- **Interactive:** Hover states increase border opacity or add subtle amber inner-glow. Hardware-accelerated transforms only.

## 7. Anti-Patterns (Banned AI Tells)
- **No Emojis:** Strictly professional and architectural.
- **No Pure Black:** (#000000 is banned; use Midnight #121414).
- **No "AI Purple":** No neon purple glows or generic tech gradients.
- **No Overlapping Elements:** Clean spatial separation only.
- **No AI Copy Clichés:** "Elevate", "Seamless", "Unleash", "Next-Gen". Use authoritative, craftsman-like copy.
- **No Fabricated Data:** Use [metric] placeholders if real data is absent.
- **No Broken Links:** Use high-contrast monochromatic imagery or desaturated textures.
