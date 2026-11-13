# TESC Portal — Preservation Audit (read before restyling)

## Routes (`src/main.tsx`)

- `""` → redirect `bulletin/-1`; `bulletin/:postId` → `Bulletin`; `bulletin` → `-1`.
- `form` → `Form id=""` (create). `profile` → `Profile`. `org-management` → `OrgManagement`.
- `organization/:id` → `/org-management`. `profile/all-attended-events` → `/profile`
  (being replaced by a real `/profile/attendance-history` page). `my-events` → `/profile`
  (being replaced by a real `/my-events` page).
- No edit route: edit is modal-only via `useEditModal.openEditModal`. `Home.tsx` is an
  unrouted stub. `TableItem.tsx`, `NewProfile.tsx`, `TescOrgProfileEditor.tsx`,
  `RsvpOrAttendanceButton.tsx` are dead/orphaned — leave them alone.

## Bulletin / Discover

- `Bulletin.tsx` orchestrates: `selection` (string, from URL `postId`; `-1` = none →
  `WelcomePage`), `eventTimeFilter` ("current"|"past"), `forumMode`, `portalMode`
  ("events"|"recruiter"). `BulletinDisplay` switches recruiter → `MemberResume`, else `EventInfo`.
- Data: `useBulletin` → `queryEventsBySearchAndFilters` (Supabase `events`, lean select,
  `deleted=false`, client `filterEventsForInternalVisibility` + slot enrichment from
  `event_slot_stats` view + normalized `questions`); recruiter mode → `queryPeopleBySearchAndFilters`
  on `users` (`resume_visible=true`). User status via `fetchRSVPAndAttended` → `rsvpByEvent` /
  `attendedByEvent`. `EventInfo` lazy-loads `content` via `fetchEventContent`.
- `Event` type (`src/lib/constants.ts`): id, title, content?, location_str, location?,
  start_date, end_date, tags[], poster, orgs{name,pfp_str}, org_id, attendance, rsvp,
  attendance_cap?, track_attendance?, rsvp_required?, food_provided?, as_funding?,
  manual_attendance?, type? ("internal"|"external"|"forum"), attendance_token?, slots?,
  questions?, dependent_on, password?, created_at, UID.
- Org avatar URL is hardcoded: `https://mxbwjmjpevvyejnugisy.supabase.co/storage/v1/object/public/profile.images/<org name>/<pfp_str>`,
  fallback `https://placehold.co/600x600`. Poster area pulses when `poster` empty (non-internal).
- Interactions: search (400ms debounce, `ilike title`), category tags (fixed list in
  constants), org filter (dynamic `fetchOrgs`), type filter (internal/external, only when
  `activeOrgRole != ""`), sort "Most Recent" (default, `compareEventsByRecency`) / "Event Name (A-Z)".
  Upcoming/Past by `end_date` (fallback `start_date`) vs now; switching resets selection to `-1`.
  Pagination 8/page (`SIDEBAR_PAGE_SIZE`), Prev/Next + "X–Y of N", auto-jump to selected item's page.
- Forum mode: three-dot nav; forum pill + "+" opens create-forum-post modal; forum list
  `type==="forum"`, sorted `created_at` desc; forum detail hides poster/date/location/food/calendar/directions/tags.
- RSVP/attendance: `EventSlotPicker` shown only when `slots.length>0` AND
  (`track_attendance || rsvp_required || type==="internal" || questions.length>0`). Slot status
  labels + `seatsTaken/capacity` (`src/lib/slotTime.ts`); RSVP / Switch slot / Remove RSVP /
  Attend per `getSlotQrAction`; same-day lock when `rsvp_required` (`isSlotRsvpLocked`).
  Registration questions asked first when required unanswered (`hasUnansweredRequired`);
  answers saved via `saveEventQuestionAnswers` after RSVP/attendance. Logged-out → login modal
  with context. Check-in prompts event password via `window.prompt` (`logAttendance`).
  `as_funding` events open the AS attendance form in a new tab.
- QR flow (`useQrEventFlow`): `?from=qr&token=…` → fetch by id if not listed, pending flow if
  logged out, auto-open `QrSlotPickerModal`; completion in `sessionStorage` (`tesc_qr_completed_<id>`).
- Google Calendar: `formatGoogleCalendarEvent` (`America/Los_Angeles`); Directions:
  `formatGoogleMapsLocation(location_str)`. Food: "Food provided: …" only when non-blank, non-forum.
- Edit pencil in `EventInfo` header only for `type==="internal"` → `openEditModal` (refetches
  full event incl. content/password, maps slots/questions into `formdata`) → `Form` overlay;
  on success closes + `fetchData()`.
- Points chip: `users.points` by email, diamond icon; hidden for `company` / recruiter mode.
  Recruiter mode: Export CSV of People list; without `canAccessRecruiterData` (`role === "company"`)
  shows login prompt. `company` role forces recruiter mode, hides org avatar/points/toggle.
- Internal events: visible only if `activeOrgName === "super_org"` or `userOrgIds` contains
  `org_id`; logged-out see none. `internalFilter` flag exists but no UI sets it.
- Keep unchanged: `useBulletin` + `BulletinContext`, `useQrEventFlow`, `useEditModal`,
  `src/services/event.tsx`, `src/services/user.tsx` (`editRSVP`, `logAttendance`,
  `logAttendanceWithToken`, `fetchRSVPAndAttended`), `src/services/eventQuestions.tsx`,
  `src/lib/eventListOrder.ts`, `src/lib/slotTime.ts`, `src/lib/eventQuestions.ts`,
  `src/lib/internalEventVisibility.ts`, `src/lib/eventLinks.ts`, `src/lib/googleCalendar.ts`,
  `src/lib/sidebarPage.ts`, read-only Tiptap `Editor.tsx` for `content` HTML.
- Quirks: search input uncontrolled; sort radio not state-bound; detail has no skeleton
  (body shows literal "Loading..."); sidebar skeleton only on first load (min 100ms, 300ms fade);
  mobile sidebar is an absolute overlay `w-[300px]`; `document.title` updates per selection.

## Profile

- `/profile` → `Profile.tsx` renders only `EditMemberProfile` (default mode); renders
  nothing for `role === "company"`. Title "My Profile | TESC Portal".
- Fields (direct Supabase query on `users` by `User.email`): first/last name (required),
  major (select from `majors` in constants, required), grad year (integer, currentYear-1 ..
  currentYear+15), resume link (optional, valid http/https URL), resume PDF upload
  (`accept="application/pdf"`, staged as `pendingResumeFile`, uploaded on save only via
  `uploadResumePdf`, bucket `resumes`, path `<userId>/resume.pdf`, upsert), recruiter sharing
  checkbox "Share my resume with TESC recruiting partners" (`resume_visible`, default true).
- Save: validate → upload PDF if pending → `users.update(...)` by email. Toast
  "Successfully updated profile info" + `onComplete?.()` or `navigate("/")`. Save disabled
  while errors exist or (non-onboarding) not dirty; "Unsaved changes / All changes saved"
  indicator; Cancel is a no-op on the profile page (no `onCancel` passed).
- Resume preview (right card, `<iframe>`): pending file blob URL → signed URL
  (`getResumeSignedUrl`) → Drive-style preview of `resume_link` (`getPdfPreviewUrl`).
  "Open resume" link except for blob previews. Card only renders when a preview URL exists.
- `EditMemberProfile` also used in `LoginModal` as `mode="onboarding"` (`onComplete=finishProfileSetup`):
  title "Complete your profile", single-column `max-w-3xl`, no Cancel, save always enabled,
  resume-sharing validation skipped. Non-onboarding requires a resume source if sharing is on.
- `NewProfile.tsx` is an org profile-picture uploader (orphaned, logic duplicated in
  `EditOrgModal`): 2 MB image limit, bucket `profile.images` at `<orgName>/<file.name>`, updates `orgs.pfp_str`.
- Quirks: `fetchMemberData()` called twice in one effect; `resume_visible` defaults true
  before data loads; no client-side resume size check; no delete-resume action.

## Attendance history

- `ListAttendedEvents` (prop `userId`, optional `title` default "Recently Attended Events"):
  bottom of profile form + `MemberResume` ("Events Attended"). Horizontal-scroll `EventCard`s;
  click → `/bulletin/:id`.
- `PageAllAttendEvents`: full history page (currently unreachable — route redirects to `/profile`).
  Filters past events only (end < now), text search over title/location/category/description,
  "Showing X of Y". `AllAttendedEventsList`: near-duplicate grid with in-place `EventDetails`
  modal + stub `handleAddFeedback` (logs only); no route.
- Data: `fetchAttendedEvents(userId)` (`src/services/user.tsx`): `events_log` where
  `attended=true`, then `events` (not deleted). `AttendedEvent`: id, title, `date` as
  `"start - end"` string, location from `location_str`, points, category = `tags[0] || 'General'`,
  description = `content`, coverImage = `poster`. All sort newest-first by parsing start of `date`.
- States: "Loading attended events…", "Could not load attended events.", empty
  "It looks like you haven't attended any events yet!", login gate "Please log in to view history."
  No pagination. Totals only as diamond badge + "N TESC events attended" in `MemberResume`.

## Organizations & admin

- `/org-management` → `OrgManagement.tsx`; redirects to `/profile` if no `User.id` or
  `myOrgs.length === 0`. Org picture from `orgs.pfp_str` via public URL from `profile.images`
  bucket; "Edit +" overlay opens `EditOrgModal` when `canManageOrg` is true.
- Gates (`src/lib/roles.ts`): `canManageOrgProfile` = board | org leader | super_user;
  `canManageUsers` = `super_org` + super_user; `canManageOrgMembers` = non-super_org + org leader.
  Role precedence: company > super_user > org leader > board > member. Others see
  "You are a member of this organization. Board or org leader access is required…".
- Org switching UI lives outside these files; these only consume `activeOrgName`,
  `activeOrgRole`, `myOrgs` from `UserContext`. `activeOrgId` derived by matching `myOrgs` by name.
- `ProfileAdminTables`: view switcher (Select) between "Posted Events" (`DataTable`, "New Event"
  link to `/form`), "Org Members" (`OrgMembersPanel`, if `showOrgMembers` + `orgId`), "User Management"
  (`UserAdminPanel`, if `showUserAdmin`); else plain "My Posted Events" heading. Shared pagination
  state; view change resets to page 1.
- `OrgMembersPanel`: `listOrgMembers(orgId, search, page-1, pageSize)` → RPC
  `org_leader_list_members`; columns name/email/major/grad year/points/role/actions; 300ms debounced
  search; per-row role select → `assignOrgRoleByEmail`; "Remove" with `window.confirm` →
  `removeOrgMemberByEmail`; "Assign role by email" form (email + role select). Role options from
  `fetchOrgLeaderRoleOptions` (assignable `member`/`board`/`org leader`). Total count from
  `rows[0]?.total_count`.
- `UserAdminPanel`: `listAllUsersAdmin(search)` loads all users (300ms debounce); sorting, per-column
  filter popups, column show/hide all client-side; hidden columns persist in localStorage
  (`USER_ADMIN_COLUMNS_STORAGE_KEY`). Row "View" → `UserDetailDrawer`.
- `UserDetailDrawer`: `getUserAdminDetail(userId)` — name/email/major/grad year/points/open RSVPs/
  events attended/resume-visible/resume link + resume preview. `UserRolesEditor`: per-row org+role
  selects → `setUserOrgRole`; "Remove" confirm → `removeUserOrgRole`; "Add membership" (org select
  limited to unassigned orgs + role select). Reloads user + `onRolesChanged` after changes.
- `EditOrgModal`: two ref-based editors saved in parallel (`Promise.all`): `ProfilePicUploader`
  (2 MB image, `profile.images`, `orgs.pfp_str`) + `OrgProfileEditor` (TipTap `Editor`, loads/saves
  `orgs.profile`, `normalizeTiptapHtml` strips empty → `null`).
- `OrgAttendanceInsights` (hook `useOrgAttendanceInsights` + RPC `get_org_attendance_insights`):
  stat cards (check-ins, unique attendees, open RSVPs, attended last 30d with % change vs prev 30d,
  upcoming events, next event), Pie chart (group-by tag/venue/time-of-day/org/year/major; "org"
  only when viewing all orgs), Line chart (daily/weekly/monthly/quarterly, start/end filters).
  Super-org users get Organization + Event selectors. PDF exports (`attendanceChartUtils.ts`:
  `exportPieChartPdf`, `exportLineChartPdf`, `exportInsightsReportPdf`, jsPDF).
- Recruiter: `MemberResume.tsx` (candidate view, gated by `canAccessRecruiterData` = `company` only);
  `WelcomePageCompany` states logged_out/unauthorized/authorized; login via
  `setLoginRecruiterMode(true)` + `setShowLoginModal(true)`. Shared placeholder avatar for all candidates.

## App shell & auth

- `Page.tsx` owns `UserContext.Provider` + all auth/org state; renders `<Navbar />`,
  `<div className="pt-[10vh]">` + `<Outlet />`, `<Footer />`. Keep the provider and logic;
  only layout changes. Navbar height `h-[10vh]` is load-bearing in 3 places: Navbar,
  `Page` `pt-[10vh]`, `Toaster` class `mt-[calc(10vh+3.5rem)]` in `main.tsx` — update all three.
- `Navbar.tsx`: `bg-blue` (#11426b), TESC logo (`/TESC.png`) → `/`. No page links, no mobile nav.
  Org switcher `OrgDropdown` only when logged in + `myOrgs.length > 0`; value is org **name**.
  Logged-out: "Log in" pill (`setLoginRecruiterMode(false); setShowLoginModal(true)`).
- `BasicMenu.tsx` (MUI Popper): non-company: Profile (`/profile`); Org Management
  (`/org-management`) if `myOrgs.length > 0`; "New Event" (`/form`) if
  `canManageOrgProfile(activeOrgRole)`; Logout → `handleSignOut`. Logged out: "Log in".
- `LoginModal.tsx`: member mode = single "Continue with Google" → `handleGoogleAuth`.
  Recruiter mode = email/password sign-in, register (client-side password-confirm),
  forgot-password: `handleSendRecovery` → 6-digit OTP (`MuiOtpInput`, `type: "recovery"`) →
  reset password → `handleUpdatePassword`, then `navigate("bulletin")`. Signup OTP `type: "email"`.
  Post-login: if `memberNeedsProfileSetup`, modal switches to `EditMemberProfile mode="onboarding"`
  (max-w-5xl, 90vh) with "Complete later" skip; backdrop click blocked during setup.
  `Page.tsx` also auto-prompts setup on login (skipped for `company`, or if skipped before).
  Sign-up blocked for non-`@ucsd.edu` unless recruiter mode. Logout: `signOut()`, clear user,
  `navigate("bulletin")`, toast. Auth restore: `onAuthStateChange` (ignores `TOKEN_REFRESHED`),
  `consumeAuthReturnTo()` QR deep-link restore, OAuth errors via `consumeAuthCallbackError`.
- `Footer.tsx`: radial gradient `#114675` → navy, social icons (mail, Instagram, LinkedIn, X,
  Discord), feedback Google Form link. No nav links.

## Event form & admin data

- Create: route `/form` → `<Form id={""} onSuccess={() => {}} />`. Edit: modal only —
  `DataTable` row click → `useEditModal.openEditModal(event)` → portal `EditModal` with
  `<Form formdata={currEdit} id={curID} editEvent onSuccess={close + fetchData} />`.
  `openEditModal` refetches via `fetchEventById` if content/password null, maps slots/questions
  into `formdata` (`toLocalDatetimeInput`, `markQuestionAnswerCounts`). Also
  `openCreateForumPostModal` (type `forum`, blank form).
- Layout: two columns desktop — form left (`lg:w-1/2`) + sticky live preview (`EventInfo`,
  `preview` prop) right. Edit `mt-5`, create `mt-20`.
- Fields: Title (required, autofocus; placeholder "Forum post title" for forum). Event Code /
  password only when `track_attendance`, required, with tooltip. Time slots (`EventSlotsEditor`):
  add/remove (min 1), `datetime-local`; start change auto-sets end = start+1h if invalid;
  per-slot capacity only when `track_attendance`. Event start/end derived from slots
  (`deriveEventRange`). Questions (`EventQuestionsEditor`): max 8, types text/choice/yes_no,
  required checkbox; answered questions cannot be removed (`has_answers`). Recurring (create only,
  non-forum): none/daily/weekly/biweekly/monthly + end date (min = first slot date). Toggles
  (MUI Switch): Track attendance; Require RSVP before day of event; AS funding; "Dependent on
  another event?" → embedded `ProfileAdminTables` to pick parent (`dependent_on`). Type select:
  internal/external; internal = no tags/poster; forum hides slots/questions/recurring/location/
  food/funding/tags/poster. Location: MUI `Autocomplete` freeSolo over ~90 hardcoded UCSD venues
  (`locations` in constants); value is `location_str`. `Map.tsx` (Google Places) is NOT used by
  Form — only by `EventInfo`. Food provided (required text). Manual attendance (number, only when
  track_attendance off). Tags: MUI multi-Select + Chips over fixed list (fundraiser, social,
  career, workshop, hackathon, GBM, panels/talks, other); hidden internal/forum. Poster upload:
  dashed button, `accept="image/*"`, 2 MB limit, bucket `event.images` at
  `{sanitizedOrgName}/{Date.now()}-{filename}`, upsert, 220px preview; hidden internal/forum.
  Description: Tiptap rich-text `Editor.tsx`, stored as HTML.
- Validation (`handleSubmit`): recurring end date required and ≥ first slot start; slots ≥1
  (non-forum), each end > start (`validateEventSlots`); questions `validateEventQuestions`
  (max 8, prompt required, choice ≥2 options). Errors in local state + `DisplayToast`.
- Create: `createEvent(formData, activeOrgName)` — resolves org uuid by name; forum: null dates,
  empty tags/poster/location; internal: no tags/poster; `attendance_cap` = sum of slot capacities
  (null if any uncapped); `attendance_token` via `crypto.randomUUID()` when tracking. Recurring
  creates up to 100 occurrences, returns first id/token. Success: reset form; tracking + token →
  `EventQrModal`, else `navigate("/")`. QR modal close → `/bulletin/{eventId}`.
- Update: `updateEvent(id, formData)` — same payload rules, generates token if tracking newly
  enabled, upserts slots (protects slots with RSVPs in `events_log`) and questions (protects answered).
  Edit-mode "Show QR Code" (tracking only) → `fetchEventAttendanceToken(id)` → `EventQrModal`.
- `EventQrModal`: `QRCodeSVG` of `buildEventQrUrl(eventId, token)`, copy-link, download PNG, Done.
- `DataTable` (`useData(User, orgName)` → `fetchEventByOrg`; soft-delete via `deleteEvent`,
  realtime `postgres_changes` subscription + 60s interval recomputing 1-hour RSVP/attendance deltas
  localStorage-backed): 14 columns (`DATA_TABLE_COLUMNS`); column visibility toggle persisted
  (`dataTable-hiddenColumns`); defaults hidden: created_at, attendance_cap, track_attendance,
  as_funding, actions; `org_name` hidden when viewing a specific org. Per-column filter popups
  (date range, location/tags multi-select, text, yes/no, numeric ops); sorting per column;
  pagination 5/10/20. `embedded` mode reuses it as row-picker (filters non-external there).
  Row click → edit modal. Actions (stopPropagation): delete (`DeleteConfirmationModal`, shadcn
  `AlertDialog`, `isDeleting`), QR (tracking events), registrants eye (tracking or questions) →
  dropdown of `fetchEventRegistrantsWithAnswers` rows + CSV download (`buildRegistrantCsv`,
  filename `registrants-{title}.csv`). RSVP/Attendance cells use `AnimatedNumber` (550ms eased,
  green/red on change, `+N`/`-N` last-hour badge).
- Quirks: Navbar height load-bearing (see above); Form renders Track-attendance switch and
  Event-type select twice when track_attendance is off (duplicate `id="event-type"`); double
  `autoFocus` (Title + Event Code); DataTable `<>` fragment without key in onRowClick mode;
  `useData` loading bug (early return without `setLoading(false)` — DataTable keys off
  `data === null` instead); org identity is by **name**; `activeOrgName === "super_org"` is a
  magic string; `pendingQrFlow` is set but `Page.tsx` never consumes it; Editor Placeholder
  has no placeholder text; live preview builds synthetic `Event` from `formData` on every keystroke.

## Design system today

- Tailwind v4 (CSS-first, no tailwind.config). Tokens in `src/index.css` `@theme`:
  `--color-blue: #11426b`, `--color-navy: #1c2e4a`, `--color-lightBlue: #a1c7e7`,
  `--color-offWhite: #dbdada`, `--color-lightPink: #ffe6e6`, `--color-gray: #bbb`,
  `--color-darkGray: #333`; `--font-DM: "DM Sans"` (imported). shadcn oklch neutral palette,
  `--radius: 0.625rem`, `.dark` variant defined but no toggle. `:root` declares PT Sans but
  it is never imported (body falls back to system sans). Headings often
  `font-DM font-bold text-navy` + `[text-shadow:0px_2.83px_2.83px#0000001A]`.
- shadcn/ui components in `src/components/components/ui/`: alert-dialog, button, card, input,
  label, select, separator + custom org-dropdown. `cn` at `src/components/lib/utils.ts`.
  `components.json` aliases (`@/`) disagree with Vite aliases (`@components`, `@lib`, …).
- MUI v7 used alongside shadcn (BasicMenu, Switch, Autocomplete, Select/Chip/TextField, MuiOtpInput).
- Other libs: `motion` (variants `container`/`item` in constants), Tiptap, lucide-react,
  react-icons, @ant-design/icons (mixed icon sets — prefer lucide in new code), react-router v7,
  React 19, react-hot-toast (top-right; `Toaster` has `mt-[calc(10vh+3.5rem)]`), qrcode.react,
  react-csv, @vis.gl/react-google-maps, tw-animate-css.
- `WelcomePage`: gradient hero (`#3B7DB6` → blue → navy, rounded 22px) + shadcn Card;
  `WelcomePageCompany` has authorized/logged_out/unauthorized states.
