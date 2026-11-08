# QB Suite Admin

Next.js App Router, JavaScript/JSX, Tailwind CSS, Inter and Font Awesome.

Run `npm install`, `npm run dev`, `npm run lint`, `npm run check:ui`, and `npm run build`. The production build uses Webpack with Tailwind PostCSS; development uses Next.js defaults.

- `src/components/common/`: the sole reusable UI implementation library. Import directly, e.g. `import { Button } from '@/components/common/Button'`.
- `src/components/icons/FontAwesomeIcon.jsx`: accepts an `icon` definition from `@fortawesome/free-solid-svg-icons`, plus size, label and SVG props. Solid, regular and brands packages are supported; Tailwind controls icon styling.
- `src/theme/`: one token source. Root layout applies the tokens as CSS variables; Tailwind maps to those variables. Inter is loaded globally through Next font with weights 400/500/600/700.
- `src/components/layout/`: shared MainLayout, Sidebar, Header, Breadcrumb. The shell handles desktop navigation and the mobile drawer.
- `src/modules/{crm,production,customer}/`: independent business components, hooks, services, utils and navigation configuration. Do not add local common UI libraries or module palettes.

CRM routes retain their behavior and URL structure. Production and Customer dashboard routes are empty-state entry points pending business workflows and API connections. Existing HRM routes remain available; no new HRM app folder was created. No global application state was needed, so Zustand is not introduced.

See `docs/shared-ui-migration.md` for the audit and migration mapping.

Common APIs retain the existing compound primitives: Modal exports Dialog, DialogContent, DialogTitle, etc.; Drawer exports Sheet equivalents; Dropdown exports DropdownMenu equivalents; Toast exports Toaster. The Modal, Drawer, Dropdown and Toast names are also aliases of their root primitives. Use their title/description components for accessible overlays. No second implementation backs an alias.

DataTable accepts `columns` (`header`, `accessorKey`, `cell`, `className`), `data` with stable `id`s, `pageSize`, `emptyState`, and `isLoading`. Pagination uses `page`, `totalPages`, `onPageChange`. Checkbox/Radio accept native input props plus `label`. DatePicker uses native date input props. FileUpload accepts native file input props, `label`, `description`, and `onFilesChange(files)`. SearchBar accepts Input props. Loading accepts `label`; Skeleton accepts `className`. Buttons, inputs, cards, selects, tabs and overlays retain their existing configurable props and compound APIs.
