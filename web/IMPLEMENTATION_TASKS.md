# Web UI Implementation Tasks

**Project**: EasyTransfer 2.0 Web UI  
**Framework**: Next.js 14 (App Router) + React 18  
**Status**: 10% Complete (1/10 tasks)  
**Last Updated**: November 15, 2025

---

## Task Tracking Legend

- [ ] Not Started
- [⏳] In Progress
- [✅] Completed
- [⚠️] Blocked
- [🔄] Under Review

---

## Task 1: Project Setup & Core Architecture
**Status**: [✅] Completed  
**Priority**: Critical (Foundation)  
**Estimated Effort**: Small

### Description
Initialize Next.js 14 project with TypeScript, App Router, Tailwind CSS, and Ant Design. Set up the project structure with proper folders (app/, components/, lib/, hooks/). Configure RTL (right-to-left) layout for Arabic interface with Ant Design ConfigProvider. Set up TanStack Query (React Query) for state management instead of Redux. Configure environment variables for backend API URL. Install and configure all necessary dependencies including Ant Design with Arabic locale support.

### Deliverables
- [✅] Next.js 14 project initialization with TypeScript
- [✅] App Router structure (app/, components/, lib/, hooks/)
- [✅] Tailwind CSS configuration with RTL plugin
- [✅] Ant Design installation and ConfigProvider setup
- [✅] Arabic locale (arEG) integration
- [✅] TanStack Query setup with QueryClientProvider
- [✅] Environment configuration (.env.local, .env.example)
- [✅] Root layout with RTL direction (html dir="rtl")
- [✅] package.json with all dependencies
- [✅] TypeScript configuration (tsconfig.json)
- [✅] API client (lib/api.ts) with cookie support
- [✅] Status configuration (lib/statusConfig.ts)

### Acceptance Criteria
- Project compiles successfully with Next.js 14 ✅
- RTL layout works correctly (Arabic text flows right-to-left) ✅
- Ant Design components render with Arabic locale ✅
- TanStack Query provider wraps application ✅
- Environment variables loaded correctly ✅
- No build errors or warnings ✅
- Tailwind CSS styles apply correctly ✅
- API client configured with credentials: 'include' ✅

### Implementation Notes
- ✅ Next.js 14 with App Router (not Pages Router)
- ✅ Root layout in `app/layout.tsx`:
  - QueryClientProvider wraps entire app
  - ConfigProvider with direction="rtl" and locale={arEG}
  - html lang="ar" dir="rtl"
  - QueryClient configured: staleTime 1 min, no refetchOnWindowFocus
- ✅ Tailwind CSS:
  - Plugin: tailwindcss-rtl installed
  - Content paths: app/**, components/**
  - Keep numbers LTR using dir="ltr" on number elements
- ✅ API Client (`lib/api.ts`):
  - Base class with credentials: 'include' for cookies
  - Error handling with Arabic fallback messages
  - Methods match backend endpoints:
    - Auth: requestOtp(), verifyOtp()
    - User: getMe(), getMyTransfers(), getMyStats()
    - Admin: getSystemStats(), getAllUsers(), toggleUserStatus(), etc.
  - Supports pagination, filtering, search parameters
- ✅ Dependencies installed:
  - next: ^14.1.0
  - react: ^18.2.0
  - antd: ^5.12.0
  - @tanstack/react-query: ^5.17.0
  - tailwindcss: ^3.4.0
  - tailwindcss-rtl: ^0.9.0
  - typescript: ^5.3.0
- ✅ Scripts configured:
  - dev: next dev -p 3001
  - build: next build
  - start: next start -p 3001
  - lint: next lint
- ✅ Environment variables:
  - NEXT_PUBLIC_API_URL: http://localhost:3000 (backend URL)
- ✅ Project structure:
  ```
  web/
  ├── app/
  │   ├── layout.tsx       # Root layout with providers
  │   ├── page.tsx         # Home page
  │   ├── login/           # Login page
  │   ├── transfers/       # User transfers page
  │   └── globals.css      # Global styles
  ├── lib/
  │   ├── api.ts           # API client
  │   └── statusConfig.ts  # Status display config
  ├── hooks/              # Custom React hooks
  ├── .env.local          # Local environment
  ├── .env.example        # Example environment
  ├── package.json        # Dependencies
  ├── tailwind.config.js  # Tailwind with RTL
  └── tsconfig.json       # TypeScript config
  ```

### Notes
- ✅ Use Next.js App Router (not Pages Router)
- ✅ Keep numbers LTR (left-to-right) using dir="ltr" on number elements
- ✅ No Redux - use TanStack Query for state management
- ✅ Configure Ant Design with direction="rtl"
- ✅ API client uses credentials: 'include' for httpOnly cookies

---

## Task 2: Authentication System & JWT Cookie Handling
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Implement authentication flow using JWT stored in httpOnly cookies (not localStorage). Create login page with phone number input field. Build authentication API client that communicates with backend using credentials: 'include' for cookie handling. Implement auth helpers in lib/auth.ts for login, logout, and authentication status checks. Create useAuth hook for managing authentication state across components. Handle automatic cookie-based authentication where backend sets httpOnly cookie and client includes it in requests. Build route protection to redirect unauthenticated users to login page.

### Deliverables
- [ ] Login page (app/login/page.tsx)
- [ ] Phone number input with validation
- [ ] Authentication API client (lib/auth.ts)
- [ ] Login function with credentials: 'include'
- [ ] Get auth status function (GET /api/auth/me)
- [ ] Logout function
- [ ] useAuth hook for authentication state
- [ ] Route protection middleware
- [ ] Automatic redirect to /transfers after login
- [ ] Error handling for login failures
- [ ] Loading states during authentication

### Acceptance Criteria
- User can enter phone number and login
- Backend sets httpOnly cookie (Set-Cookie header)
- Cookie automatically included in subsequent requests
- Authentication state persists across page reloads
- Unauthenticated users redirected to login
- Logout clears authentication
- No JWT stored in localStorage/sessionStorage
- Protected routes check authentication status

### Notes
- Use httpOnly cookies for security (XSS protection)
- Backend sets cookie: Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict
- Client uses credentials: 'include' in fetch calls
- Store user permissions from backend response
- Redirect to /transfers after successful login

---

## Task 3: Permission-Based Navigation & Layout
**Status**: [ ] Not Started  
**Priority**: High  
**Estimated Effort**: Small

### Description
Create responsive navigation bar (Navbar component) that adapts based on user permissions returned by backend. Implement permission-based routing where regular users see "My Transfers" only, admins see "My Transfers" and "System Dashboard / Users", and users with both roles see all navigation items. Build root layout with navbar integration and proper RTL structure. Ensure navigation items are determined entirely by backend-provided permissions array, never hardcoded in frontend.

### Deliverables
- [ ] Navbar component (components/Navbar.tsx)
- [ ] Permission-based navigation logic
- [ ] Navigation items for regular user (permissions: ["user"])
- [ ] Navigation items for admin (permissions: ["admin"])
- [ ] Navigation items for both roles (permissions: ["user", "admin"])
- [ ] Root layout integration (app/layout.tsx)
- [ ] Active route highlighting
- [ ] Responsive design (mobile/desktop)
- [ ] Arabic labels for navigation items
- [ ] Logout button in navbar

### Acceptance Criteria
- Navbar displays correct links based on permissions
- Regular users see: "تحويلاتي" (My Transfers)
- Admins see: "تحويلاتي", "لوحة النظام / المستخدمين"
- Users with both roles see all navigation items
- Active route highlighted correctly
- Navbar works on mobile and desktop
- RTL layout correct (navigation flows right-to-left)

### Notes
- Permissions array from backend: ["user"], ["admin"], or ["user", "admin"]
- Navigation labels in Arabic
- Use Ant Design Menu component with RTL support
- Never hardcode permissions in frontend

---

## Task 4: User Transfers Page (My Transfers)
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Large

### Description
Build the user transfers page showing personal transfer history with statistics and table. Implement statistics cards at the top displaying total, pending, processing, successful, and failed transfers fetched from backend. Create transfers table below with columns for ID, phone number, amount, status, and timestamp. Implement server-side pagination, search functionality (phone number and amount), and status display mapping with Arabic labels and colors. Use TanStack Query to fetch data from backend endpoints. Ensure all statistics and data come from backend API, never calculated client-side.

### Deliverables
- [ ] My Transfers page (app/transfers/page.tsx)
- [ ] Statistics cards component (components/StatsCards.tsx)
- [ ] Transfers table component (components/TransfersTable.tsx)
- [ ] Statistics endpoint integration (GET /api/user/transfers/stats)
- [ ] Transfers list endpoint integration (GET /api/user/transfers)
- [ ] Server-side pagination implementation
- [ ] Search box for phone/amount filtering
- [ ] Status display mapping (pending, processing, success, failed)
- [ ] Arabic status labels with color coding
- [ ] TanStack Query hooks (useMyTransfers, useMyStats)
- [ ] Loading states and error handling
- [ ] Empty state when no transfers

### Acceptance Criteria
- Statistics cards display correct counts from backend
- Transfers table shows user's personal transfers only
- Pagination works with backend (page, limit parameters)
- Search filters transfers by phone or amount
- Status displayed with correct Arabic label and color
- Numbers displayed LTR (left-to-right)
- All data fetched from backend (no client calculation)
- Loading spinners shown during data fetch
- Error messages displayed on API failures

### Notes
- Statistics endpoint: GET /api/user/transfers/stats
- Transfers endpoint: GET /api/user/transfers?page=1&limit=10&search=091234
- Status mapping: pending→قيد الانتظار, processing→قيد الإنجاز, success→ناجحة, failed→فاشلة
- Use Ant Design Table component with RTL support
- Keep numbers LTR: <span dir="ltr">{amount}</span>

---

## Task 5: Admin Personal Transfers Page
**Status**: [ ] Not Started  
**Priority**: Medium  
**Estimated Effort**: Small

### Description
Create admin's personal transfers page (identical to user transfers page but under admin routes). This page shows the admin's own transfer history, not system-wide data. Reuse components from user transfers page (StatsCards, TransfersTable) but place under admin routes. Use same backend endpoints as regular user page, which automatically filters by authenticated user ID. Ensure admin can view their personal statistics and transfers separately from system-wide data.

### Deliverables
- [ ] Admin transfers page (app/admin/transfers/page.tsx)
- [ ] Reuse StatsCards component for admin's stats
- [ ] Reuse TransfersTable component for admin's transfers
- [ ] Same statistics endpoint (GET /api/user/transfers/stats)
- [ ] Same transfers endpoint (GET /api/user/transfers)
- [ ] Pagination and search (same as user page)
- [ ] Loading and error states

### Acceptance Criteria
- Admin sees their personal transfer statistics
- Admin sees their personal transfer history
- Data scoped to admin user only (not system-wide)
- Same functionality as regular user page
- Components reused from user transfers page
- Backend automatically filters by authenticated admin ID

### Notes
- This is NOT system-wide data - it's admin's personal transfers
- Use same endpoints as regular user (backend filters by user ID)
- Reuse components to avoid duplication
- Place under /admin/transfers route

---

## Task 6: Admin System Dashboard & Statistics
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Large

### Description
Build admin system dashboard showing system-wide statistics and user management. Implement top section with statistics cards displaying total, pending, processing, successful, and failed transfers across ALL users (not just admin). Create bottom section with users table showing all users with their transfer counts, activation status, and action buttons. Implement server-side pagination and search for users table. Add "New User" button above table to create new users. Implement activate/deactivate toggle for users. Use TanStack Query to fetch system-wide statistics and users list from admin-specific endpoints.

### Deliverables
- [ ] Admin dashboard page (app/admin/dashboard/page.tsx)
- [ ] System-wide statistics cards (reuse/adapt StatsCards)
- [ ] Users table component (components/UserManagement.tsx)
- [ ] System stats endpoint integration (GET /api/admin/system/stats)
- [ ] Users list endpoint integration (GET /api/admin/users)
- [ ] "New User" button and modal/form
- [ ] Create user endpoint integration (POST /api/admin/users)
- [ ] Activate/Deactivate toggle (PUT /api/admin/users/{id}/status)
- [ ] Server-side pagination for users
- [ ] Search functionality (phone, name, user ID)
- [ ] User table columns: ID, phone, name, transfers, success, failed, pending, actions
- [ ] TanStack Query hooks for admin data
- [ ] Loading states and error handling

### Acceptance Criteria
- System-wide statistics show ALL users' transfers
- Users table displays all system users with pagination
- Search filters users by phone, name, or ID
- "New User" button opens creation form
- New user created via backend API
- Activate/Deactivate toggle updates user status
- All data fetched from admin endpoints
- Loading states shown during operations
- Success/error messages displayed

### Notes
- System stats endpoint: GET /api/admin/system/stats (all users)
- Users endpoint: GET /api/admin/users?page=1&limit=20&search=0912
- Create user: POST /api/admin/users {phone, name, telegram_user_id}
- Update status: PUT /api/admin/users/{id}/status {is_active: true/false}
- Use Ant Design Table, Modal, Form components
- Display clear Arabic labels

---

## Task 7: Status Display & Configuration System
**Status**: [ ] Not Started  
**Priority**: Medium  
**Estimated Effort**: Small

### Description
Create unified status display configuration system used across all pages (user and admin). Implement status mapping that converts backend status codes (pending, processing, success, failed) to Arabic labels with appropriate colors and icons. Build reusable status display components (badge, tag, or label) that accept status code and render correct visual representation. Ensure consistency across statistics cards and tables. Store status configuration in shared constants file for easy maintenance.

### Deliverables
- [ ] Status configuration file (lib/statusConfig.ts)
- [ ] Status mapping (pending, processing, success, failed)
- [ ] Arabic labels for each status
- [ ] Color coding (pending→warning, processing→info, success→success, failed→error)
- [ ] Optional: Icons for each status
- [ ] Reusable StatusBadge component
- [ ] StatusTag component for tables
- [ ] Consistent usage across all pages

### Acceptance Criteria
- All status displays use unified configuration
- Status labels in Arabic: قيد الانتظار, قيد الإنجاز, ناجحة, فاشلة
- Color coding consistent: pending=yellow, processing=blue, success=green, failed=red
- Status components reusable across tables and cards
- Easy to update status config in one place
- No hardcoded status labels in components

### Notes
- Status codes from backend: pending, processing, success, failed
- Arabic labels: pending→قيد الانتظار, processing→قيد الإنجاز, success→ناجحة, failed→فاشلة
- Colors: warning (yellow/orange), info (blue), success (green), error (red)
- Use Ant Design Tag or Badge components
- Store in lib/statusConfig.ts for centralized management

---

## Task 8: API Client & TanStack Query Integration
**Status**: [ ] Not Started  
**Priority**: Critical  
**Estimated Effort**: Medium

### Description
Build centralized API client for all backend communication with proper error handling and authentication. Create fetch wrapper in lib/api.ts that includes credentials for cookie handling and proper headers. Implement TanStack Query hooks for all data fetching operations (user stats, user transfers, admin stats, admin users). Configure query cache, stale time, and refetch strategies. Handle loading states, error states, and data mutations (create user, update user status). Ensure all API calls include credentials: 'include' for httpOnly cookie authentication.

### Deliverables
- [ ] API client utility (lib/api.ts)
- [ ] Fetch wrapper with credentials: 'include'
- [ ] Error handling and response parsing
- [ ] TanStack Query hooks (hooks/useTransfers.ts, hooks/useAdmin.ts)
- [ ] useMyTransfers hook (user transfers)
- [ ] useMyStats hook (user statistics)
- [ ] useSystemStats hook (admin system stats)
- [ ] useUsers hook (admin users list)
- [ ] useCreateUser mutation hook
- [ ] useUpdateUserStatus mutation hook
- [ ] Query cache configuration
- [ ] Loading and error state handling

### Acceptance Criteria
- All API calls use centralized client
- Credentials included in all requests (httpOnly cookies)
- TanStack Query manages all data fetching
- Mutations trigger cache invalidation/refetch
- Loading states available to components
- Error states handled gracefully
- Query cache configured properly
- No duplicate API client code

### Notes
- Use credentials: 'include' in all fetch calls
- Configure TanStack Query: staleTime, refetchOnWindowFocus
- Invalidate queries after mutations (create user, update status)
- Backend API base URL from environment variable
- Handle 401 errors (redirect to login)

---

## Task 9: RTL Layout, Arabic Localization & Number Formatting
**Status**: [ ] Not Started  
**Priority**: High  
**Estimated Effort**: Small

### Description
Ensure complete RTL (right-to-left) layout support for Arabic interface across all pages and components. Configure Ant Design with RTL direction and Arabic locale (arEG). Implement proper number display where numbers remain LTR (left-to-right) for readability while text flows RTL. Create utility functions or components for consistent number formatting. Add Arabic labels for all UI elements (buttons, placeholders, table headers, messages). Test RTL layout on all pages to ensure proper alignment and flow.

### Deliverables
- [ ] RTL configuration in root layout (html dir="rtl")
- [ ] Ant Design ConfigProvider with direction="rtl" and locale={arEG}
- [ ] Tailwind RTL plugin configuration
- [ ] Number formatting utility (keep numbers LTR)
- [ ] Arabic labels for all UI elements
- [ ] Arabic placeholders for inputs
- [ ] Arabic table headers
- [ ] Arabic button labels
- [ ] Arabic error/success messages
- [ ] RTL testing on all pages

### Acceptance Criteria
- All text flows right-to-left
- Numbers display left-to-right (0-9)
- Ant Design components render correctly in RTL
- All labels, buttons, headers in Arabic
- Table columns align correctly (RTL)
- Forms flow right-to-left
- No layout breaking in RTL mode
- Consistent number formatting across app

### Notes
- Use <span dir="ltr">{number}</span> for number display
- Configure Tailwind with tailwindcss-rtl plugin
- Import arEG locale from antd/locale/ar_EG
- Test on Chrome, Firefox, Safari for RTL compatibility
- Ensure proper alignment of table columns and forms

---

## Task 10: Error Handling, Loading States & Polish
**Status**: [ ] Not Started  
**Priority**: High  
**Estimated Effort**: Medium

### Description
Implement comprehensive error handling across all pages and API calls with user-friendly Arabic error messages. Create loading states for all data fetching operations using Ant Design Spin component. Build empty states for tables when no data available. Add success notifications for user actions (create user, update status). Implement route guards to protect admin pages from regular users. Handle API errors gracefully with retry options. Add logout functionality with confirmation. Test all user flows and edge cases (network failures, unauthorized access, empty data).

### Deliverables
- [ ] Error handling for all API calls
- [ ] Arabic error messages
- [ ] Loading spinners (Ant Design Spin)
- [ ] Empty states for tables and cards
- [ ] Success notifications (Ant Design message/notification)
- [ ] Route guards for admin pages
- [ ] 401 handling (redirect to login)
- [ ] 403 handling (unauthorized access)
- [ ] Retry logic for failed requests
- [ ] Logout with confirmation dialog
- [ ] Network failure handling
- [ ] Form validation error messages

### Acceptance Criteria
- All API errors show user-friendly Arabic messages
- Loading states displayed during data fetch
- Empty states shown when no data available
- Success messages for user actions (create, update)
- Admin pages protected from regular users
- Unauthorized users redirected appropriately
- Logout clears authentication and redirects to login
- Network failures handled with retry option
- All error messages in Arabic
- Clear visual feedback for all operations

### Notes
- Use Ant Design message.error() for error notifications
- Use Ant Design Spin for loading states
- Empty states: "لا توجد بيانات" (No data available)
- Route guards check user permissions before rendering
- Handle 401: redirect to /login
- Handle 403: show "غير مصرح" (Unauthorized) message
- Logout confirmation: "هل تريد تسجيل الخروج؟"

---

## Overall Progress

**Total Tasks**: 10  
**Completed**: 0  
**In Progress**: 0  
**Not Started**: 10  
**Blocked**: 0  

**Overall Completion**: 0%

---

## Implementation Order (Recommended)

1. **Task 1** - Project Setup & Core Architecture (Foundation)
2. **Task 2** - Authentication System & JWT Cookie Handling (User Access)
3. **Task 3** - Permission-Based Navigation & Layout (Navigation)
4. **Task 8** - API Client & TanStack Query Integration (Infrastructure)
5. **Task 7** - Status Display & Configuration System (Shared Utilities)
6. **Task 4** - User Transfers Page (My Transfers) (Core User Feature)
7. **Task 5** - Admin Personal Transfers Page (Admin Feature)
8. **Task 6** - Admin System Dashboard & Statistics (Admin Feature)
9. **Task 9** - RTL Layout, Arabic Localization & Number Formatting (Localization)
10. **Task 10** - Error Handling, Loading States & Polish (Quality Assurance)

---

## Dependencies Between Tasks

- Task 2 depends on Task 1 (needs project setup)
- Task 3 depends on Task 2 (needs auth to get permissions)
- Task 4 depends on Task 1, 2, 8 (needs setup, auth, API client)
- Task 5 depends on Task 4 (reuses components)
- Task 6 depends on Task 1, 2, 8 (needs setup, auth, API client)
- Task 7 can be implemented alongside Task 4
- Task 8 depends on Task 1, 2 (needs setup and auth)
- Task 9 can be implemented alongside other tasks
- Task 10 depends on all previous tasks (final polish)

---

## Notes & Decisions

### Architecture Decisions
- Next.js 14 App Router (not Pages Router)
- TanStack Query for state management (no Redux)
- httpOnly Cookies for JWT (not localStorage)
- Server-side pagination and filtering
- Backend as single source of truth
- No client-side calculations or business logic

### Authentication Pattern
- JWT stored in httpOnly cookies (XSS protection)
- Backend sets cookie with Set-Cookie header
- Client includes cookie with credentials: 'include'
- Automatic cookie handling (no manual token management)
- Token refresh handled by backend (cookie expiration)

### Permission System
- Permissions from backend: ["user"], ["admin"], or ["user", "admin"]
- Navigation adapts based on permissions array
- Route guards check permissions before rendering
- Admin pages protected from regular users
- Never hardcode permissions in frontend

### Data Fetching Strategy
- TanStack Query for all data fetching
- Query cache with stale time configuration
- Mutations trigger cache invalidation
- Loading states from query status
- Error handling with retry logic

### Localization
- Arabic UI with RTL layout
- Numbers remain LTR for readability
- Ant Design with Arabic locale (arEG)
- All labels, messages, errors in Arabic
- Consistent number formatting

### Component Reusability
- Shared components: StatsCards, TransfersTable, StatusBadge
- Status configuration in centralized file
- API client used across all pages
- TanStack Query hooks for data access
- DRY principle (Don't Repeat Yourself)

---

**Last Review**: November 15, 2025  
**Next Review**: TBD
