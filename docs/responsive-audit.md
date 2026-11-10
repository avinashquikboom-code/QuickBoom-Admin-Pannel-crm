# Admin responsive audit

Scope: active Next.js application under `src/`. `legacy-admin-ui` and `qbsuite-admin-ui` are excluded from the active TypeScript application. No backend, API contracts, theme tokens, dependencies, or navigation destinations changed.

## Architecture and changes

- Shell: `AppShell` → `MainLayout` → shared `Sidebar` and `Header`. Desktop keeps the existing expanded/collapsible sidebar; tablet entry collapses it through a media query listener; mobile retains Base UI's modal drawer, backdrop, focus management and route-selection dismissal. Resizing to desktop dismisses an open mobile drawer.
- Header: prevent flex shrinking of the header, allow search to shrink, label notification/profile controls, keep an open search accessible after resizing.
- Tables: both TanStack adapters use `ui/table`. Replaced mobile CSS that hid sortable headers and turned cells into unlabelled two-column cards with semantic tables in keyboard-focusable horizontal scroll regions. Columns, sorting, selection and actions remain available. Pagination and toolbars wrap.
- Cards: shared cards/grid children may shrink. Stat values and descriptions wrap. Small mobile statistic grids use one column; wider screens retain multiple columns.
- Charts: Recharts already uses `ResponsiveContainer`. Shared chart containers can shrink and date filters now stack rather than squeezing both dates beside a period selector. Existing chart data and data-table alternatives remain intact.
- Reports: search/date filters scale from one to two to three columns, preview filters use two intermediate columns, and report cards may shrink. Existing category scrolling, favourites, report actions and downloads are retained.
- Forms: shared `FormDrawer` provides a shrinking scrollable body and wrapping footer; right sheets use full mobile width, dialogs/confirmation dialogs fit the viewport, and popup widths are bounded. Close buttons have header clearance. Mobile browsers supporting `interactive-widget=resizes-content` resize content above the keyboard. Real-device keyboard behavior still needs verification.
- Modules: HRM statistics/date fields, customer dashboard filters, data capture metrics, CRM forms, target salary pagination, employee forms, departments and dashboard quick actions were audited or adjusted. Master/CRM listings inherit shared table and drawer fixes. Departments retain their existing labelled mobile cards and dedicated mobile sort control.
- Styling: Tailwind v4 default breakpoints, plus existing 440px card breakpoint. Existing fonts, colors, borders and shadows retained.

## Reproduce browser checks

Start the app with `node node_modules/next/dist/bin/next dev -p 3107`. Run `node scripts/check-responsive.cjs` with an available Playwright installation (`PLAYWRIGHT_MODULE` can point to its absolute module path); `CHROME_PATH` optionally selects Chrome and `BASE_URL` changes the local URL. No dependency installation is required if Playwright is already available. `ROUTE_FILTER` optionally narrows the route scan.

The script scans static admin pages and section routes from navigation at the twelve requested sizes, checks document/main overflow and visible controls outside the content region, and exercises mobile navigation selection/backdrop dismissal, search and the employee drawer. It excludes Base UI's intentionally invisible accessibility inputs from visual measurements. It does not stub API responses or submit business mutations. Results are written to `/tmp/qb-responsive-results.json`.

## Validation limits

The backend was unreachable during local validation. Data-dependent forms, populated tables/charts, report generation, PDFs, permission-gated controls and successful mutations require a working authenticated backend for end-to-end verification. Empty/error-state viewport checks cannot certify those states. No mock data was introduced.

The repository's existing Node tests have 39 passes and 31 failures, identical on the unmodified HEAD baseline and the working tree. Failures include removed legacy page paths and existing API assertions. TypeScript and whitespace checks pass.

## Local results (2026-11-10)

- 83 static and navigation-derived admin routes × 12 viewports = 996 route/viewport checks passed, with no detected document/main overflow or visible controls outside the main content bounds.
- Exact viewports: 1920×1080, 1600×900, 1440×900, 1366×768, 1280×800, 1024×768, 768×1024, 600×900, 430×932, 390×844, 375×667, 320×568.
- Mobile navigation opened, dismissed on selection, and dismissed on outside click; expandable search opened and closed.
- Employee drawer passed viewport bounds and horizontal overflow checks at all twelve sizes plus 390×400 (shortened viewport). This simulates reduced available height; it is not a real device keyboard test.
- Visually inspected 320px HRM dashboard and shortened mobile employee drawer screenshots.
- API-backed success states remain unverified, as described above. Automated geometry checks are not a substitute for reviewing every populated screen visually.
