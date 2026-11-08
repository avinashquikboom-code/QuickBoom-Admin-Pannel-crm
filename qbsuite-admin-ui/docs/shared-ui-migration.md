# Shared UI migration

Audit: existing CRM and HRM screens use Base UI primitives in components/ui, composed UI in components/shared, and a reusable dashboard KpiCard. CRM pages repeat table/search markup; there are no Production or Customer admin screens or API clients. Existing data is local mock data. Geist and scattered green/slate utility colors are used. The original icon dependency was replaced by Font Awesome across the admin; unused alternative icon dependencies were removed.

Plan: consolidate implementations first, update all imports, convert frontend TS/TSX to JS/JSX without changing handlers, centralize tokens and shell, move CRM business screens under modules/crm/components, add honest empty-state module entry points for Production and Customer, then lint/build and check imports. Existing HRM routes are preserved without creating an HRM app folder. Backend and sibling mobile apps are out of scope.

Mapping:

- components/ui/button → components/common/Button
- components/ui/input → components/common/Input
- components/ui/textarea → components/common/Textarea
- components/ui/select → components/common/Select
- components/ui/dropdown-menu → components/common/Dropdown
- components/ui/separator → components/common/Separator
- components/ui/table → components/common/Table
- components/ui/badge → components/common/Badge
- components/ui/dialog → components/common/Modal
- components/ui/avatar → components/common/Avatar
- components/ui/command → components/common/Command
- components/ui/calendar → components/common/Calendar
- components/ui/tooltip → components/common/Tooltip
- components/ui/sonner → components/common/Toast
- components/ui/label → components/common/Label
- components/ui/sheet → components/common/Drawer
- components/ui/popover → components/common/Popover
- components/ui/input-group → components/common/InputGroup
- components/ui/card → components/common/Card
- components/ui/tabs → components/common/Tabs
- components/shared/ConfirmDialog → components/common/ConfirmDialog
- components/shared/DataTable → components/common/DataTable
- components/shared/EmptyState → components/common/EmptyState
- components/shared/PageHeader → components/common/PageHeader
- components/shared/StatusBadge → components/common/StatusBadge
- components/dashboard/KpiCard → components/common/StatCard
- components/layout/TopNav → components/layout/Header
- components/layout/Breadcrumbs → components/layout/Breadcrumb

CRM route files → modules/crm/components/*Page.jsx (route wrappers preserve URLs). Module hooks/services/utils folders are reserved for future business logic; do not add local copies of shared UI. Production/Customer use the same common DataTable, Button, Input, Modal, Badge and global shell. No backend endpoints are invented.

Validation: ESLint passed. Next.js production build passed with all 30 pages generated. The default build now uses Webpack and standard Tailwind PostCSS because this environment blocks the Turbopack CSS worker's local port. Browser smoke checks verified CRM search, lead details and stage updates, the mobile navigation drawer, Production modal, and Customer entry page. Browser-computed Inter and #5EC269 verified at 390px. Production and Customer are intentionally unconnected entry points; no prior workflows existed to migrate.

## Admin icon standard

All admin icon rendering uses `components/icons/FontAwesomeIcon.jsx`. Import only the required icon definitions from the solid, regular or brands Font Awesome packages. The root layout imports Font Awesome support CSS once, and the wrapper disables automatic CSS injection according to the official Next.js integration: https://docs.fontawesome.com/web/use-with/react/use-with/ . Sizing, spacing, colors and animations use Tailwind classes. Icon-only controls keep their accessible labels; standalone meaningful icons accept `label`.

The UI generator configuration omits the obsolete icon library setting because it does not support Font Awesome. Adapt generated icons to the wrapper before use; `npm run check:ui` rejects unsupported icon libraries. No global application state was needed; existing local state remains local. Mobile icon standards and backend files are unchanged.
