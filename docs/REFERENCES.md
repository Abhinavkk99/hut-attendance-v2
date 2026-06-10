# References & Attributions

This project builds on open-source libraries, design-system components, and external
tools. All third-party software is used under its respective open-source licence, and
all are attributed below. Versions reflect `package.json` / `package-lock.json`.

## 1. Core Framework & Build Tooling

| Library | Version | Licence | Purpose |
|---------|---------|---------|---------|
| react | 18.3.1 | MIT | UI rendering library |
| react-dom | 18.3.1 | MIT | React DOM renderer |
| react-router | 7.13.0 | MIT | Client-side routing & route guards |
| typescript (via tooling) | — | Apache-2.0 | Static typing |
| vite | 6.3.5 | MIT | Dev server & production bundler |
| @vitejs/plugin-react | 4.7.0 | MIT | React support for Vite |
| @tailwindcss/vite | 4.1.12 | MIT | Tailwind integration for Vite |
| tailwindcss | 4.1.12 | MIT | Utility-first CSS framework |
| tw-animate-css | 1.3.8 | MIT | Animation utilities for Tailwind |

## 2. Backend / Data

| Library | Version | Licence | Purpose |
|---------|---------|---------|---------|
| @supabase/supabase-js | ^2.99.2 | MIT | Client for Supabase (Postgres, Auth, RLS) |

Supabase itself (the hosted PostgreSQL + Auth + Row-Level Security platform) is the
project's backend-as-a-service. Documentation: https://supabase.com/docs

## 3. UI Component Primitives (Radix UI)

All Radix UI primitives are used under the **MIT** licence. They provide the
accessible, unstyled building blocks wrapped by the shadcn/ui components in
`src/app/components/ui/`.

| Library | Version |
|---------|---------|
| @radix-ui/react-accordion | 1.2.3 |
| @radix-ui/react-alert-dialog | 1.1.6 |
| @radix-ui/react-aspect-ratio | 1.1.2 |
| @radix-ui/react-avatar | 1.1.3 |
| @radix-ui/react-checkbox | 1.1.4 |
| @radix-ui/react-collapsible | 1.1.3 |
| @radix-ui/react-context-menu | 2.2.6 |
| @radix-ui/react-dialog | 1.1.6 |
| @radix-ui/react-dropdown-menu | 2.1.6 |
| @radix-ui/react-hover-card | 1.1.6 |
| @radix-ui/react-label | 2.1.2 |
| @radix-ui/react-menubar | 1.1.6 |
| @radix-ui/react-navigation-menu | 1.2.5 |
| @radix-ui/react-popover | 1.1.6 |
| @radix-ui/react-progress | 1.1.2 |
| @radix-ui/react-radio-group | 1.2.3 |
| @radix-ui/react-scroll-area | 1.2.3 |
| @radix-ui/react-select | 2.1.6 |
| @radix-ui/react-separator | 1.1.2 |
| @radix-ui/react-slider | 1.2.3 |
| @radix-ui/react-slot | 1.1.2 |
| @radix-ui/react-switch | 1.1.3 |
| @radix-ui/react-tabs | 1.1.3 |
| @radix-ui/react-toggle | 1.1.2 |
| @radix-ui/react-toggle-group | 1.1.2 |
| @radix-ui/react-tooltip | 1.1.8 |

## 4. UI Helpers, Styling & Interaction

| Library | Version | Licence | Purpose |
|---------|---------|---------|---------|
| class-variance-authority | 0.7.1 | Apache-2.0 | Variant-based component styling |
| clsx | 2.1.1 | MIT | Conditional className joining |
| tailwind-merge | 3.2.0 | MIT | Merge/de-duplicate Tailwind classes |
| lucide-react | 0.487.0 | ISC | Icon set |
| sonner | 2.0.3 | MIT | Toast notifications |
| cmdk | 1.1.1 | MIT | Command-menu component |
| vaul | 1.1.2 | MIT | Drawer component |
| next-themes | 0.4.6 | MIT | Theme (dark/light) management |
| input-otp | 1.4.2 | MIT | One-time-passcode input |
| react-day-picker | 8.10.1 | MIT | Date picker |
| react-hook-form | 7.55.0 | MIT | Form state & validation |
| react-resizable-panels | 2.1.7 | MIT | Resizable layout panels |
| @popperjs/core | 2.11.8 | MIT | Positioning engine |
| react-popper | 2.3.0 | MIT | React bindings for Popper |
| embla-carousel-react | 8.6.0 | MIT | Carousel |
| react-slick | 0.31.0 | MIT | Carousel/slider |
| react-responsive-masonry | 2.7.1 | MIT | Masonry grid layout |
| react-dnd | 16.0.1 | MIT | Drag-and-drop |
| react-dnd-html5-backend | 16.0.1 | MIT | HTML5 backend for react-dnd |
| canvas-confetti | 1.9.4 | ISC | Celebratory confetti effect |
| motion | 12.23.24 | MIT | Animation library |
| @emotion/react | 11.14.0 | MIT | CSS-in-JS (MUI dependency) |
| @emotion/styled | 11.14.1 | MIT | Styled API for Emotion |
| @mui/material | 7.3.5 | MIT | Material UI components |
| @mui/icons-material | 7.3.5 | MIT | Material UI icon set |

## 5. Data Visualisation & Dates

| Library | Version | Licence | Purpose |
|---------|---------|---------|---------|
| recharts | 2.15.2 | MIT | Charts for the Reports page |
| date-fns | 3.6.0 | MIT | Date formatting/manipulation |

## 6. Design System & Assets

| Source | Licence / Terms | Usage |
|--------|-----------------|-------|
| [shadcn/ui](https://ui.shadcn.com/) | MIT | Component patterns in `src/app/components/ui/` (built on Radix UI + Tailwind) |
| [Unsplash](https://unsplash.com) | [Unsplash Licence](https://unsplash.com/license) | Placeholder photography |
| Figma Make | Vendor tooling | Initial UI scaffold was exported from a Figma Make project (`figma:asset/` imports resolved in `vite.config.ts`) |

(See also `ATTRIBUTIONS.md` in the repository root.)

## 7. Tools & Platforms

| Tool | Purpose |
|------|---------|
| Git / GitHub | Version control and hosting (`Abhinavkk99/hut-attendance-v2`) |
| Supabase | Database, authentication, row-level security |
| Vercel | Deployment (`hut-attendance-v2.vercel.app`) |
| npm | Dependency management |

## 8. Documentation & Standards Consulted

- React documentation — https://react.dev
- React Router documentation — https://reactrouter.com
- Supabase Auth & Row-Level Security guides — https://supabase.com/docs/guides/auth
- PostgreSQL Row Security Policies — https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- OWASP guidance on access control & privilege escalation — https://owasp.org/Top10/
- Tailwind CSS documentation — https://tailwindcss.com/docs

## Licence Summary

The third-party libraries are distributed under permissive open-source licences —
predominantly **MIT**, with **ISC** (lucide-react, canvas-confetti) and **Apache-2.0**
(class-variance-authority, TypeScript) — all of which permit use, modification, and
distribution with attribution.
