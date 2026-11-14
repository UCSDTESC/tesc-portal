# TESC Portal Redesign — Design System & Implementation Contract

Frontend-only redesign. Backend, Supabase schema, services (`src/services/*`),
hooks (`src/lib/hooks/*`), and pure logic libs (`src/lib/*.ts`) are **untouched**.
Only presentation (JSX/Tailwind) changes. No mock data — every list still comes
from the existing services/hooks.

## Audit notes

See `AUDIT.md` in this folder for the full preservation map (routes, permission
gates, handlers that must keep being called unchanged, quirks).

## Tokens (Tailwind v4, in `src/index.css` `@theme`)

Keep the existing token names (`--color-blue`, `--color-navy`, `--color-lightBlue`,
`--font-DM`) so untouched files still compile; add the new ones below.

- Font: **Inter** (Google Fonts import). Body `font-family: Inter, system-ui, sans-serif`.
  Keep `--font-DM` alias pointing at Inter for compat.
- Brand navy scale: `--color-navy-950: #081826`, `--color-navy-900: #0f2440`,
  `--color-navy-800: #1c2e4a`, `--color-navy-700: #243a5c`.
- Brand blue: `--color-brand-700: #11426b` (existing `--color-blue`), `--color-brand-600: #1d5c8a`,
  `--color-brand-500: #2f7fc1`, `--color-brand-50: #eef5fb`.
- Surfaces: app bg `--color-surface: #f5f7fa`, card white, border `--color-line: #e5e9f0`.
- Text: ink `#0f1f33`, secondary `#5b6b80`, muted `#8a97a8`.
- Success `#15803d`, warning `#b45309`, danger `#b91c1c` (use existing `--color-destructive`).
- Radius: cards `rounded-2xl` (1rem), inputs/buttons `rounded-xl` (0.75rem), pills `rounded-full`.
- Shadows: card `shadow-[0_1px_2px_rgba(15,31,51,0.06),0_8px_24px_-12px_rgba(15,31,51,0.18)]`,
  hover lift `hover:-translate-y-0.5` + slightly deeper shadow, `transition-all duration-200`.
- Focus: `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2`.

## Shared components (new, `src/components/shell/` and `src/components/ui/`)

- `AppShell` — sidebar + topbar + `<Outlet/>` area. Replaces `Navbar`/`Footer` layout
  in `Page.tsx`. Sidebar 264px expanded / 76px collapsed (desktop), overlay drawer
  on mobile with backdrop. Topbar 64px sticky, white/translucent + blur.
- `PageHeader` — page title, subtitle, actions slot.
- `EmptyState`, `LoadingSkeleton` — consistent loading/empty/error presentation.
- `StatCard` — label, big value, optional delta/hint.
- `EventCard` (redesigned) — poster/cover, org avatar+name, title, date/time,
  venue, tag chips, status (RSVP'd / Attended / Full / Past). Click navigates.
- `FilterBar` — search input + dropdown filters + sort, shared by Discover.
- `OrgAvatar` — org picture when it loads, else a navy tile with the org's
  initial. Used by event cards (`SidebarItem`), event details (`EventInfo`).
  Never use `placehold.co` for avatars; the old fallback `<img>` rendered a
  broken-image icon whenever that service was unreachable, and the old
  `imageURL` branch in `SidebarItem` was effectively dead (the URL string is
  always truthy). Posters likewise fall back to the pulsing `bg-brand-100`
  placeholder on load error (`onError`), never a broken `<img>`.
- Sidebar brand: the TESC logo PNG is white artwork (built for the old navy
  navbar), so it sits on a navy tile (`bg-navy-900` rounded-xl) on the white
  sidebar — bare on white it is nearly invisible.
- Forum posts have no poster: `EventInfo` renders no poster block at all for
  `type === "forum"` (pre-redesign code rendered the empty pulsing
  placeholder, which looked like a large blank blue box in the detail view
  and the form preview). The form's Media section is likewise hidden for
  forum posts — its only remaining field for forum was the poster upload.
- Edit modals (`BulletinEditModal`, DataTable's `EditModal`) are portaled to
  `document.body`, outside the AppShell, so their overlay must offset the
  desktop sidebar (`lg:pl-[264px]` expanded, `lg:pl-[76px]` collapsed, read
  from the same `tesc-sidebar-collapsed` localStorage key the shell uses) or
  the panel centers on the full viewport and slides underneath the sidebar.
  The overlay is top-aligned (`items-start`, `overflow-y-auto`) so a tall
  form's top stays reachable by scrolling; the form panel uses
  `mx-auto my-5` (the old `m-auto mt-5` had conflicting margin utilities).
  The form also takes an `inModal` prop: in the modal it always renders its
  white panel (`editEvent || inModal`), because the create-mode form has no
  panel of its own and its header otherwise collides with the page header
  showing through the dimmed backdrop. On the `/form` page the form stays
  panel-less, as before.

## App shell rules

- Sidebar nav (permission-gated exactly as today): Discover (`/bulletin/-1`),
  My Events (`/my-events`), Attendance History (`/profile/attendance-history`),
  Profile (`/profile`), Organizations (`/org-management`, only if `myOrgs.length > 0`),
  New Event (`/form`, only if `canManageOrgProfile(activeOrgRole)`), Admin is covered
  by Organizations (Posted Events / Org Members / User Management views inside
  `OrgManagement`). Recruiter mode (`role === "company"`) shows Discover (candidate
  browser) + Profile hidden, as today.
- Topbar: page title/breadcrumb, org switcher (`OrgDropdown`, same value contract —
  org **name**), points diamond chip (member mode only, same Supabase fetch as
  `CheckBoxes` does today), avatar menu (`BasicMenu`, same items/handlers).
- `Page.tsx` keeps owning `UserContext.Provider` and all auth/org logic; only its
  rendered layout changes. Update the `pt-[10vh]` offset to match the new topbar
  (64px) and the `Toaster` offset in `main.tsx` accordingly.
- Mobile: sidebar becomes a slide-over; topbar shows a menu button. No page links
  in the old navbar remain — everything lives in the sidebar.
- `Footer` is retired from the app shell (keep the file; social/feedback links move
  into the sidebar footer area).

## Routes (preserve; only these additions)

- `/` → `/bulletin/-1` (unchanged). `/bulletin/:postId` (unchanged).
- `/my-events` — NEW real page (was a redirect to `/profile`). Lists events the user
  RSVP'd to (via existing `fetchRSVPAndAttended` + `fetchEventById`), upcoming first.
- `/profile/attendance-history` — NEW real page rendering `PageAllAttendEvents`
  (was a redirect to `/profile`). Keep the old redirect target working by having
  `/profile/all-attended-events` redirect to the new route instead.
- `/organization/:id` → `/org-management` (unchanged). `/form`, `/profile`,
  `/org-management` (unchanged).

## Per-area rules

- **Discover (`Bulletin`)**: keep `useBulletin` + `BulletinContext` intact. Replace
  layout only: hero (compact), featured first upcoming event, filter bar (search,
  category, org, type, sort), Upcoming/Past toggle, responsive card grid (replaces
  the left event list), detail view on card click navigates to `/bulletin/:id`
  and shows `EventInfo` restyled (large poster, info sidebar with date/venue/food/
  calendar/directions, slot picker unchanged). Forum mode, recruiter mode, QR flow,
  edit modal, pagination behaviour all preserved.
- **Event details (`EventInfo`)**: keep fetch of `content`, slot picker, questions
  modal, QR banner, edit pencil gating (`type === "internal"`), Google Calendar +
  Directions links, food line. Restyle layout only.
- **Profile (`EditMemberProfile`)**: keep every field, validation rule, save flow,
  resume upload/preview (`uploadResumePdf`, `getResumeSignedUrl`, `getPdfPreviewUrl`),
  recruiter-sharing checkbox, onboarding mode differences. Restyle layout only.
  Cancel in non-onboarding stays a no-op (no `onCancel` passed) — do not invent
  behaviour; keep the button as-is visually.
- **Attendance**: `ListAttendedEvents`, `PageAllAttendEvents`, `AllAttendedEventsList`,
  `EventCard`/`EventDetails` (attended-event type) — restyle only; keep
  `fetchAttendedEvents`, newest-first sort, past-only filter + search on the full
  history page.
- **Organizations (`OrgManagement` + panels)**: keep all `canManage*` gates, RPC
  calls, pagination/search state, chart data + PDF exports. Restyle only.
- **Event form (`Form` + editors)**: keep every field, validation, create/update
  flows, poster upload, QR modal, live `EventInfo` preview. Restyle layout only.
  Do NOT fix the duplicated switch/type-select quirk unless the fix is trivial and
  behaviour-identical — flag it instead.
- **Admin data table**: keep columns, filters, sorting, pagination, delete flow,
  QR/registrants actions, CSV export. Restyle only.
- **Login modal**: keep both modes (Google member / email-OTP recruiter), recovery
  flow, onboarding profile setup. Restyle only.

## Verification

- `npm run build` (tsc + vite) must pass; `npm run lint` with no new errors;
  `npm test` (vitest) must pass — do not break existing pure-logic tests.
- `npm run dev` + spot-check routes: `/bulletin/-1`, `/bulletin/<id>`, `/profile`,
  `/my-events`, `/profile/attendance-history`, `/org-management`, `/form`
  (logged-out states must still render login prompts, not crash).
