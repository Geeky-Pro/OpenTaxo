# UI Context — Taxonomy & Catalog Planner

> Current UI baseline (2026-10-16): RTL-first Next.js workspace with a dashboard, taxonomy list/tree/browser, Product Type detail editor, and central definition workspaces. Theme tokens are implemented in `app/globals.css`; update this document alongside token or navigation changes.

## Design Philosophy

- **Mobile-first, RTL-default**: Every design decision starts from a 360px RTL viewport and scales up.
- **Functional elegance**: Clean, information-dense UI without visual noise. Every pixel serves a purpose.
- **Dark mode native**: Dark theme is co-equal with light, not an afterthought.
- **Arabic typography first**: Font choices and sizing optimized for Arabic readability.

## Color System — Semantic Tokens

All colors are defined as CSS custom properties in HSL format for easy theme switching.

### Light Theme

```css
:root {
  /* Backgrounds */
  --background: 0 0% 100%;           /* Page background */
  --background-muted: 210 20% 98%;   /* Subtle sections, cards */
  --background-elevated: 0 0% 100%;  /* Drawers, modals, popovers */

  /* Foregrounds */
  --foreground: 222 47% 11%;         /* Primary text */
  --foreground-muted: 215 16% 47%;   /* Secondary text, placeholders */

  /* Brand / Primary */
  --primary: 221 83% 53%;            /* Buttons, active states */
  --primary-foreground: 210 40% 98%; /* Text on primary */

  /* Accents */
  --accent: 210 40% 96%;             /* Hover backgrounds, selection */
  --accent-foreground: 222 47% 11%;

  /* Destructive */
  --destructive: 0 84% 60%;          /* Delete buttons, error states */
  --destructive-foreground: 0 0% 100%;

  /* Borders & Rings */
  --border: 214 32% 91%;
  --ring: 221 83% 53%;

  /* Tree-specific */
  --tree-indent-line: 214 32% 91%;   /* Vertical indent guides */
  --tree-node-hover: 210 40% 96%;    /* Node hover background */
  --tree-node-focus: 221 83% 53% / 0.08; /* Focused subtree tint */
}
```

### Dark Theme

```css
.dark {
  --background: 222 47% 6%;
  --background-muted: 217 33% 10%;
  --background-elevated: 215 28% 12%;

  --foreground: 210 40% 98%;
  --foreground-muted: 215 20% 55%;

  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 6%;

  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 72% 51%;
  --destructive-foreground: 210 40% 98%;

  --border: 217 33% 17%;
  --ring: 217 91% 60%;

  --tree-indent-line: 217 33% 20%;
  --tree-node-hover: 217 33% 14%;
  --tree-node-focus: 217 91% 60% / 0.06;
}
```

## Typography Scale

### Font Stack

```css
--font-sans: 'IBM Plex Sans Arabic', 'Segoe UI', system-ui, sans-serif;
--font-mono: 'IBM Plex Mono', 'Cascadia Code', monospace;
```

Loaded through `next/font/google` in `app/layout.tsx`:

- Primary: **IBM Plex Sans Arabic** (weights: 400, 500, 600, 700)
- Monospace: **IBM Plex Mono** (weight: 400)

### Scale (Tailwind Defaults)

| Token | Size | Line Height | Usage |
| ------- | ------ | ------------- | ------- |
| `text-xs` | 12px | 16px | Badges, captions, metadata |
| `text-sm` | 14px | 20px | Secondary text, table cells, form labels |
| `text-base` | 16px | 24px | Body text, tree node labels, form inputs |
| `text-lg` | 18px | 28px | Section headings, drawer titles |
| `text-xl` | 20px | 28px | Page titles |
| `text-2xl` | 24px | 32px | Hero headings (rarely used) |

### Font Weight Usage

| Weight | Tailwind | Usage |
| -------- | ---------- | ------- |
| 400 | `font-normal` | Body text, descriptions |
| 500 | `font-medium` | Tree node labels, form labels |
| 600 | `font-semibold` | Section headings, button text |
| 700 | `font-bold` | Page titles, emphasis |

## Spacing & Layout

### Base Unit

`4px` (Tailwind's default). All spacing uses multiples of 4.

### Consistent Spacing Tokens

| Context | Value | Tailwind |
| --------- | ------- | ---------- |
| Component internal padding | 12px | `p-3` |
| Card padding | 16px | `p-4` |
| Section gap | 24px | `gap-6` |
| Page horizontal padding (mobile) | 16px | `px-4` |
| Page horizontal padding (desktop) | 32px | `md:px-8` |
| Bottom nav height | 64px | `h-16` |
| Top bar height | 56px | `h-14` |

## Border Radius

| Token | Value | Usage |
| ------- | ------- | ------- |
| `rounded-sm` | 4px | Small badges, tags |
| `rounded-md` | 6px | Inputs, buttons |
| `rounded-lg` | 8px | Cards, dropdowns |
| `rounded-xl` | 12px | Modals, drawers |
| `rounded-full` | 9999px | Avatars, circular buttons |

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
```

Dark mode shadows use slightly higher opacity values for visibility.

## Tree View Visual Conventions

### Indentation

- Each tree level indents by **24px** (`ps-6` in Tailwind).
- Vertical indent guide lines are 1px wide, colored `--tree-indent-line`.
- Lines connect from the parent's expand/collapse icon to the child node.

### Node Anatomy

```text
[▶/▼ Expand] [📁 Icon]  اسم الفئة  [⋯ Actions]
```

- **Expand toggle**: 20×20px, `ChevronLeft` icon (rotates on expand in RTL).
  - RTL: `ChevronLeft` = pointing towards start = collapsed.
  - Expanded: rotated 90° counter-clockwise.
- **Category icon**: 20×20px, either the uploaded image (rounded) or a default `Folder` icon.
- **Label**: `text-base font-medium`, truncated with ellipsis on overflow.
- **Actions**: Hidden by default, visible on hover/focus. Three-dot menu (`MoreHorizontal` icon).

### Focus / Isolate Mode

- Clicking "Focus" on a node replaces the tree with only that subtree.
- A breadcrumb bar appears at the top: `الرئيسية > إلكترونيات > هواتف`.
- Clicking any breadcrumb segment navigates to that subtree level.
- An "Exit Focus" button returns to the full tree.

### Node States

| State | Visual |
| ------- | -------- |
| Default | `bg-transparent` |
| Hover | `bg-[--tree-node-hover]` with `rounded-lg` |
| Selected | `bg-[--tree-node-focus]` with `ring-1 ring-[--ring]` |
| Drop target | `border-2 border-dashed border-[--primary]` |
| Disabled (disqualified) | `opacity-40 cursor-not-allowed` |

## Vaul Drawer Conventions

### Trigger Behavior

- Tapping a tree node opens the Quick Edit drawer.
- Drawer uses Vaul's `<Drawer.Root>` with `shouldScaleBackground={true}`.

### Drawer Layout

```text
┌─────────────────────────────────┐
│  ───── (drag handle)            │
│                                 │
│  اسم الفئة (عربي) *            │
│  [input field]                  │
│                                 │
│  Category Name (English)        │
│  [input field]                  │
│                                 │
│  Slug                           │
│  [input field] (auto-generated) │
│                                 │
│  الفئة الأصل                    │
│  [select dropdown]              │
│                                 │
│  ┌───────┐ ┌──────────────────┐ │
│  │ حذف   │ │    حفظ التغييرات │ │
│  └───────┘ └──────────────────┘ │
│                                 │
│  [تعديل شامل →]                │
│  (link to /categories/[id])     │
└─────────────────────────────────┘
```

### Drawer Snap Points

- Default: `0.6` (60% of viewport height)
- Expanded: `0.9` (90% — for longer content)
- Dismissable by dragging down below `0.25`.

## Icon Usage (Lucide React)

| Purpose | Icon | Notes |
| --------- | ------ | ------- |
| Category (default) | `Folder` | When no image uploaded |
| Category (has children) | `FolderTree` | |
| Attribute | `Tag` | |
| Add / Create | `Plus` | |
| Edit | `Pencil` | |
| Delete | `Trash2` | Always destructive red |
| Search | `Search` | |
| Expand (RTL) | `ChevronLeft` | Rotates on expand |
| Collapse (RTL) | `ChevronDown` | |
| Back / Navigate up | `ArrowRight` | RTL: "back" = right |
| More actions | `MoreHorizontal` | Three-dot menu |
| Focus / Isolate | `Crosshair` | |
| Exit Focus | `Minimize2` | |
| Export | `Download` | |
| Image upload | `ImagePlus` | |
| Theme toggle (light) | `Sun` | |
| Theme toggle (dark) | `Moon` | |
| Home | `Home` | Bottom nav |
| Attributes | `Tags` | Bottom nav |
| Settings | `Settings` | Bottom nav (future) |

## Current Workspace Navigation

- Dashboard: `/`.
- Taxonomy management: `/taxonomy` (search, type filter, parent context, quick create/edit, details navigation).
- Tree editor: `/tree`.
- Hierarchy browser: `/browse/[[...slug]]`.
- Node detail / Product Type attribute editor: `/categories/[id]`.
- Central definitions index: `/definitions`; workspaces are `/attributes`, `/data-types`, `/value-sets`, `/measurements`, and `/unit-conversions`.
- Login and denied-access pages hide the main application navigation.

Keep controls touch-friendly, maintain visible keyboard focus, and make destructive/archive actions explicit. Prefer a single source of truth for tokens in `app/globals.css` and this document; do not introduce competing hard-coded theme palettes.

## Responsive Breakpoints

| Breakpoint | Tailwind | Width | Layout Changes |
| ------------ | ---------- | ------- | ---------------- |
| Mobile (default) | — | < 768px | Bottom nav, single column, drawer edits |
| Tablet | `md:` | ≥ 768px | Wider content and tree nodes; top bar remains visible |
| Desktop | `xl:` | ≥ 1280px | Expanded top navigation; mobile bottom navigation is hidden |

## Transition & Animation Tokens

```css
--transition-fast: 150ms ease;     /* Hover effects, icon rotations */
--transition-normal: 200ms ease;   /* Drawer open, menu expand */
--transition-slow: 300ms ease;     /* Page transitions, focus mode */
```

Use Tailwind's `transition-*` and `duration-*` utilities mapped to these values:

- `duration-150` for fast
- `duration-200` for normal
- `duration-300` for slow
