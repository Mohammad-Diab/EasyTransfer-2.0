# Admin & User Web UI – Final Simplified Requirements

## 0. Technology Stack

### 0.1 Core Technologies
- **Language**: TypeScript
- **Framework**: Next.js 14+ (App Router)
- **React Version**: React 18+
- **Styling**: Tailwind CSS
- **Component Library**: Ant Design (with RTL support)
- **State Management**: TanStack Query (React Query) - no Redux
- **Authentication**: JWT stored in httpOnly Cookies

### 0.2 Next.js App Router Structure
```
web/
├── app/
│   ├── layout.tsx              # Root layout (RTL, Ant Design ConfigProvider)
│   ├── page.tsx                # Landing/redirect page
│   ├── login/
│   │   └── page.tsx            # Login page
│   ├── transfers/
│   │   └── page.tsx            # User transfers page
│   ├── admin/
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Admin system dashboard
│   │   ├── users/
│   │   │   └── page.tsx        # Admin users management
│   │   └── transfers/
│   │       └── page.tsx        # Admin's personal transfers
│   └── api/
│       └── auth/
│           └── [...].ts        # API routes for auth (optional)
├── components/
│   ├── Navbar.tsx              # Permission-based navigation
│   ├── TransfersTable.tsx      # Shared table component
│   ├── StatsCards.tsx          # Statistics display
│   └── UserManagement.tsx      # Admin user table
├── lib/
│   ├── api.ts                  # Backend API client (fetch/axios)
│   └── auth.ts                 # Auth helpers (cookie management)
├── hooks/
│   ├── useAuth.ts              # Authentication hook
│   └── useTransfers.ts         # TanStack Query hooks
├── .env.local
├── next.config.js
├── tailwind.config.js
└── package.json
```

### 0.3 Authentication Pattern

**JWT in httpOnly Cookies:**
```typescript
// lib/auth.ts
export async function login(phone: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',  // Send/receive cookies
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });

  // Backend sets httpOnly cookie automatically
  return response.json();
}

export async function getAuthStatus() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
    credentials: 'include',  // Include cookies
  });
  return response.json();
}
```

**No localStorage/sessionStorage for JWT:**
- Backend sets `Set-Cookie: token=<jwt>; HttpOnly; Secure; SameSite=Strict`
- Client automatically includes cookie in requests via `credentials: 'include'`
- Protected from XSS attacks

### 0.4 TanStack Query Setup

**No Redux - Use React Query for State:**
```typescript
// app/layout.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,  // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider direction="rtl" locale={arEG}>
        {children}
      </ConfigProvider>
    </QueryClientProvider>
  );
}
```

**Data Fetching Example:**
```typescript
// hooks/useTransfers.ts
import { useQuery } from '@tanstack/react-query';

export function useMyTransfers() {
  return useQuery({
    queryKey: ['transfers', 'me'],
    queryFn: async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/user/transfers`, {
        credentials: 'include',
      });
      return res.json();
    },
  });
}
```

### 0.5 RTL & Arabic Support

**Tailwind RTL Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('tailwindcss-rtl')],
};
```

**Root Layout RTL:**
```tsx
// app/layout.tsx
import { ConfigProvider } from 'antd';
import arEG from 'antd/locale/ar_EG';

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ConfigProvider direction="rtl" locale={arEG}>
          {children}
        </ConfigProvider>
      </body>
    </html>
  );
}
```

**Keep Numbers LTR:**
```tsx
// components/TransfersTable.tsx
<span className="inline-block" dir="ltr">
  {amount}
</span>
```

### 0.6 Environment Configuration
```env
# Backend API
NEXT_PUBLIC_API_URL=https://api.easytransfer.com

# Environment
NODE_ENV=production|development
```

### 0.7 Key Dependencies
```json
{
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "antd": "^5.12.0",
    "@tanstack/react-query": "^5.17.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.10.0",
    "tailwindcss-rtl": "^0.9.0"
  }
}
```

## Overview

EasyTransfer 2.0 includes a web-based user interface for both regular users and administrators. The UI is a **presentation layer only** - all data, statistics, and permissions are managed by the Backend.

## Core Principles

- **UI = Display Only**: No client-side calculations or business logic
- **Backend = Source of Truth**: All statistics, permissions, and data come from API
- **Permission-Based Navigation**: UI adapts based on backend-provided user permissions
- **Language**: Arabic (RTL) interface with English digits for consistency

## 1. Login Page

### Design
Simple authentication form with minimal fields:

**Fields:**
- Phone number input (must match Telegram-linked number)

### Authentication Flow
1. User enters phone number
2. Backend validates and returns:
   ```json
   {
     "user_id": "123",
     "phone": "0912345678",
     "name": "محمد",
     "permissions": ["user", "admin"],  // Can be one or both
     "token": "jwt_token_here"
   }
   ```
3. UI always redirects to **My Transfers** page after successful login
4. Backend determines user role(s) - no role selection in UI

### Backend Endpoint
```
POST /api/auth/login
{
  "phone": "0912345678"
}
```

## 2. Navigation (Navbar)

### Permission-Based Display

Navigation links are determined by `permissions` array from backend:

**Regular User (`permissions: ["user"]`):**
- My Transfers

**Admin (`permissions: ["admin"]`):**
- My Transfers
- System Dashboard / Users

**Both Roles (`permissions: ["user", "admin"]`):**
- My Transfers
- System Dashboard / Users

### Implementation Note
```javascript
// Example navigation logic
const navItems = [];
if (user.permissions.includes('user') || user.permissions.includes('admin')) {
  navItems.push({ title: 'تحويلاتي', path: '/transfers' });
}
if (user.permissions.includes('admin')) {
  navItems.push({ title: 'لوحة النظام / المستخدمين', path: '/admin/dashboard' });
}
```

## 3. User Page – My Transfers

### Top Section: Statistics Cards

Display user-specific transfer statistics:

**Cards:**
1. **Total Transfers** (إجمالي التحويلات)
2. **Pending** (قيد الانتظار)
3. **Successful** (ناجحة)
4. **Failed** (فاشلة)
5. **Processing** (قيد الإنجاز)

**Backend Endpoint:**
```
GET /api/user/transfers/stats
Response:
{
  "total": 150,
  "pending": 5,
  "successful": 140,
  "failed": 3,
  "processing": 2
}
```

### Bottom Section: Transfers Table

**Columns:**
- ID
- Phone Number (رقم الهاتف)
- Amount (المبلغ)
- Status (الحالة)

**Features:**
- Pagination (server-side)
- Single search box (searches phone number and amount)
- No delete actions

**Backend Endpoint:**
```
GET /api/user/transfers?page=1&limit=10&search=091234
Response:
{
  "transfers": [
    {
      "id": "req_123",
      "phone": "0912345678",
      "amount": 50,
      "status": "success"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 10
}
```

### Status Display Mapping

```javascript
const STATUS_LABELS = {
  'pending': 'قيد الانتظار',
  'processing': 'قيد الإنجاز',
  'success': 'ناجحة',
  'failed': 'فاشلة'
};
```

## 4. Admin – My Transfers

### Identical to User Page

This page shows the **admin's personal transfers** only.

- Same statistics cards (scoped to admin user)
- Same transfers table
- Same search functionality
- Same pagination

**Important:** This is NOT system-wide data - it's the admin's own transfer history.

**Backend Endpoint:**
```
GET /api/user/transfers/stats
GET /api/user/transfers?page=1&limit=10&search=...
```
(Same endpoints as regular user, filtered by authenticated user ID)

## 5. Admin – System Dashboard / Users

### Top Section: System-Wide Statistics Cards

Display **all system transfers** across all users:

**Cards:**
1. **Total Transfers** (إجمالي التحويلات - النظام)
2. **Pending** (قيد الانتظار)
3. **Successful** (ناجحة)
4. **Failed** (فاشلة)
5. **Processing** (قيد الإنجاز)

**Backend Endpoint:**
```
GET /api/admin/system/stats
Response:
{
  "total": 15000,
  "pending": 120,
  "successful": 14500,
  "failed": 300,
  "processing": 80
}
```

### Bottom Section: Users Table

**Columns:**
- User ID
- Phone Number (رقم الهاتف)
- Name (الاسم)
- Total Transfers (إجمالي التحويلات)
- Successful (ناجحة)
- Failed (فاشلة)
- Pending (قيد الانتظار)
- Actions (إجراءات)

**Features:**
- "New User" button above table (زر "مستخدم جديد")
- Pagination (server-side)
- Search box (searches phone number, name, user ID)
- Row actions: Activate/Deactivate toggle

**Backend Endpoint:**
```
GET /api/admin/users?page=1&limit=20&search=0912
Response:
{
  "users": [
    {
      "id": "user_123",
      "phone": "0912345678",
      "name": "محمد",
      "total_transfers": 50,
      "successful": 45,
      "failed": 2,
      "pending": 3,
      "is_active": true
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

### User Actions

**Activate/Deactivate User:**
```
PUT /api/admin/users/{user_id}/status
{
  "is_active": true/false
}
```

**Create New User:**
```
POST /api/admin/users
{
  "phone": "0912345678",
  "name": "اسم المستخدم",
  "telegram_user_id": "123456789"  // Optional
}
```

## 6. Unified Transfer Status Codes

### Backend Status Values (Standardized)

All API responses use these exact status codes:
- `pending`
- `processing`
- `success`
- `failed`

### UI Display Mapping

```javascript
const STATUS_CONFIG = {
  pending: {
    label: 'قيد الانتظار',
    color: 'warning',  // Yellow/Orange
    icon: 'clock'
  },
  processing: {
    label: 'قيد الإنجاز',
    color: 'info',  // Blue
    icon: 'spinner'
  },
  success: {
    label: 'ناجحة',
    color: 'success',  // Green
    icon: 'check-circle'
  },
  failed: {
    label: 'فاشلة',
    color: 'error',  // Red
    icon: 'x-circle'
  }
};
```

### Consistency Requirements
- All cards use these status codes
- All tables use these status codes
- No custom status values in UI
- Backend is the single source of truth for status definitions

## 7. General UX Notes

### Language & Direction
- **UI Language**: Arabic (RTL layout)
- **Numbers**: English digits (0-9) for consistency with backend
- **Currency**: Display amounts as-is from backend

### Data Source
- **All statistics**: Fetched from backend, never calculated client-side
- **All table data**: Paginated server-side, not client-side
- **All permissions**: Determined by backend on login

### UI Responsibilities
- Display data from backend
- Send user actions to backend
- Show loading states
- Display error messages from backend
- Handle navigation based on permissions

### UI Does NOT
- Calculate statistics
- Validate business rules
- Determine user permissions
- Process transfers
- Generate reports (unless backend provides them)

## 8. Technology Recommendations

### Frontend Stack (Suggested)
- **Framework**: React, Vue.js, or Angular
- **UI Library**: Material-UI, Ant Design (with RTL support)
- **State Management**: Redux, Vuex, or Context API
- **HTTP Client**: Axios
- **Routing**: React Router, Vue Router, or Angular Router

### RTL Considerations
```css
/* Root direction */
html {
  direction: rtl;
}

/* Ensure proper number display */
.number {
  direction: ltr;
  display: inline-block;
}
```

## 9. API Summary

### Authentication
- `POST /api/auth/login` - User login

### User Endpoints
- `GET /api/user/transfers/stats` - User transfer statistics
- `GET /api/user/transfers` - User transfers list (paginated, searchable)

### Admin Endpoints
- `GET /api/admin/system/stats` - System-wide statistics
- `GET /api/admin/users` - All users list (paginated, searchable)
- `POST /api/admin/users` - Create new user
- `PUT /api/admin/users/{user_id}/status` - Activate/Deactivate user

## 10. Implementation Checklist

### Phase 1: Authentication
- [ ] Create login page
- [ ] Implement phone number input
- [ ] Handle login API call
- [ ] Store authentication token
- [ ] Redirect to My Transfers

### Phase 2: User Interface
- [ ] Create My Transfers page
- [ ] Implement statistics cards
- [ ] Create transfers table with pagination
- [ ] Add search functionality
- [ ] Implement status display mapping

### Phase 3: Admin Interface
- [ ] Create System Dashboard page
- [ ] Implement system-wide statistics cards
- [ ] Create users table with pagination
- [ ] Add user search functionality
- [ ] Implement "New User" button/modal
- [ ] Add Activate/Deactivate toggle

### Phase 4: Navigation & Permissions
- [ ] Create permission-based navbar
- [ ] Implement route guards
- [ ] Handle unauthorized access
- [ ] Test different permission combinations

### Phase 5: Polish
- [ ] Implement RTL layout
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test with Arabic content
- [ ] Verify number display (English digits)

## 11. Sample Data Structures

### User Object
```json
{
  "id": "user_123",
  "phone": "0912345678",
  "name": "محمد ديب",
  "telegram_user_id": "123456789",
  "permissions": ["user", "admin"],
  "is_active": true,
  "created_at": "2025-11-01T10:00:00Z"
}
```

### Transfer Object
```json
{
  "id": "req_abc123",
  "user_id": "user_123",
  "phone": "0919876543",
  "amount": 50,
  "status": "success",
  "created_at": "2025-11-14T15:30:00Z",
  "completed_at": "2025-11-14T15:31:00Z",
  "notes": "Optional notes"
}
```

### Statistics Object
```json
{
  "total": 150,
  "pending": 5,
  "processing": 2,
  "successful": 140,
  "failed": 3
}
```
