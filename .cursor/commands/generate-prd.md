Act as a product engineer + reverse-engineer.

Context: entire project or selected parts (@app/dashboard @components/ @ui/ @lib/ @prisma/ etc.)

Task: Create a structured, lightweight PRD / Feature Documentation based ONLY on what is currently implemented.

Structure the output exactly like this markdown:

# Project PRD - [Inferred Project Name, e.g. Personal Dashboard / Task App]

## 1. Overview & Purpose
2-4 sentence summary of what the app does based on routes, components, data flow.

## 2. User Roles
- List inferred roles (e.g. authenticated user, admin, guest)

## 3. Core Screens / Features
For each major route/page/component group:
- Name (e.g. Dashboard Overview)
- Purpose
- Key elements & interactions
- Data sources (Server Components? API calls? Prisma?)
- Inferred business rules / validations

## 4. Functional Requirements
- Bullet list grouped by domain (Auth, Dashboard, Settings, etc.)
- What the system allows/requires

## 5. Non-Functional Requirements (inferred)
- Responsiveness
- Accessibility hints
- Performance / loading patterns
- Animations / UX polish
- Dark mode

## 6. Data Model Summary
- Main entities (from Prisma / types / hooks)
- Relationships

## 7. Edge Cases & Assumptions
- What the code handles (e.g. empty states, errors, optimistic UI)

## 8. Future Extension Notes
- Obvious missing parts / hooks for future (but do NOT invent features)

Use Vietnamese for the final document if preferred (since I'm in VN), but keep technical terms in English.
Be precise — only describe implemented behavior, no assumptions or new ideas.