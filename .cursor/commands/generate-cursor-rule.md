You are a senior frontend architect specializing in React/Next.js + Tailwind + shadcn-ui / Radix ecosystems.

Analyze the attached codebase deeply (@ui/button.tsx @ui/card.tsx @components/ @lib/utils.ts @app/ etc. or @codebase).

Your goal: reverse-engineer and document ALL recurring patterns, conventions, and "vibe" rules as Cursor project rules.

Step-by-step:

1. Identify and list my exact coding style preferences:
   - File/folder structure & naming (kebab-case? PascalCase? feature folders?)
   - Component patterns (forwardRef? asChild? Slot? cva variants?)
   - Class merging (cn from shadcn? clsx? tailwind-merge?)
   - Variant system & defaults (which variants exist on Button/Card/Input? What are my custom "vibe"/gradient ones?)
   - Spacing/layout tokens (p-4 space-y-6 gap-6 etc.)
   - Animation/hover/focus patterns (scale-102 transition-200 ring-offset-2 etc.)
   - Dark mode / theme strategy (css vars? class strategy?)
   - Accessibility defaults (aria-*, focus-visible)
   - Import order & organization
   - TypeScript strictness & prop patterns
   - Custom utils/hooks patterns (useUser? cn? formatDate?)

2. Infer non-functional rules:
   - Responsiveness approach (mobile-first? specific breakpoints?)
   - Performance (memo? useCallback? Server Components?)
   - Error/loading states
   - Testing hints if any

3. Output in multiple ready-to-save .mdc files for .cursor/rules/ folder:

   File 1: ui-primitives.mdc
   - Rules for /ui/ wrappers (Button, Card, Input, Dialog etc.)

   File 2: components.mdc
   - Rules for feature/domain components (dashboard, auth etc.)

   File 3: styling.mdc
   - Tailwind + cn + variants + animations

   File 4: architecture.mdc
   - Folder structure, Server vs Client, data fetching patterns

   File 5: general.mdc
   - Global rules (TypeScript, imports, commits etc.)

Each file should start with clear instructions like:
"""
Always follow these rules when suggesting or editing code in this project.
Use cn() for class merging.
Prefer cva + VariantProps for variants.
Default to my "vibe" variant on interactive elements unless specified otherwise.
"""

Make rules very specific, give code examples from the codebase where possible (short snippets).
Keep each rule concise but strict.

Do NOT suggest changes to existing code — only document & enforce what already exists.
Output the full content of each .mdc file in markdown code blocks so I can copy-paste.