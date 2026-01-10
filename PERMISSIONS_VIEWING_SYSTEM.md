# Permissions Viewing System Documentation

## Overview

The Permissions Viewing System allows administrators to view detailed permissions for each user based on their role. This is critical for security oversight, compliance, and administrative management.

## Features

### 1. View Permissions Button
- **Location**: Actions column in the User Management table
- **Icon**: Eye icon (👁️)
- **Tooltip**: "View permissions"
- **Behavior**: Opens a modal showing all permissions for the selected user

### 2. Permissions Modal
- **Header**: Shows user's full name and role
- **Content**: Organized into 6 permission categories
- **Visual Indicators**: 
  - ✓ Green checkmark for granted permissions
  - ✗ Gray X for denied permissions

### 3. Permission Categories

The system tracks 25 permissions across 6 categories:

#### Patient Management (4 permissions)
- View patients
- Create patients
- Edit patients
- Delete patients

#### Diagnostics (6 permissions)
- Laboratory: View/Create lab orders
- X-Ray: View/Create X-ray orders
- Ultrasound: View/Create ultrasound orders

#### Clinical (3 permissions)
- Treatment access (view/manage treatments)
- Pharmacy access (view/dispense medications)
- Prescribe medications

#### Financial (5 permissions)
- View daily cash reports
- Process payments
- View invoices
- Create invoices
- Generate financial reports

#### User Management (4 permissions)
- View users
- Create users
- Edit users
- Delete users

#### Settings & Administration (3 permissions)
- Service management
- Billing settings access
- System settings access

## Permission Matrix by Role

### Admin
**Full Access** - All 25 permissions granted

### Doctor
**Clinical Focus** - 16/25 permissions
- ✅ Patient Management: View, Create, Edit
- ✅ Diagnostics: Full access (all Lab, X-Ray, Ultrasound)
- ✅ Clinical: Full access
- ✅ Financial: View reports only
- ❌ User Management: None
- ❌ Settings: None

### Lab
**Laboratory Specialist** - 7/25 permissions
- ✅ Patient Management: View only
- ✅ Diagnostics: Lab full access, X-Ray/Ultrasound view only
- ❌ Clinical: None
- ❌ Financial: None
- ❌ User Management: None
- ❌ Settings: None

### Radiology
**Imaging Specialist** - 7/25 permissions
- ✅ Patient Management: View only
- ✅ Diagnostics: X-Ray/Ultrasound full access, Lab view only
- ❌ Clinical: None
- ❌ Financial: None
- ❌ User Management: None
- ❌ Settings: None

### Reception
**Front Desk** - 11/25 permissions
- ✅ Patient Management: View, Create, Edit
- ✅ Diagnostics: View only (all)
- ✅ Financial: View reports, Process payments, View/Create invoices
- ❌ Clinical: None
- ❌ User Management: None
- ❌ Settings: None

### Pharmacy
**Pharmacy Operations** - 3/25 permissions
- ✅ Patient Management: View only
- ✅ Clinical: Pharmacy access only
- ❌ Diagnostics: None
- ❌ Financial: None
- ❌ User Management: None
- ❌ Settings: None

## Technical Implementation

### Files Created/Modified

1. **`client/src/lib/permissions.ts`**
   - Defines `Permissions` interface
   - Implements `getPermissionsByRole()` function
   - Provides `countGrantedPermissions()` utility

2. **`client/src/components/PermissionsModal.tsx`**
   - React component for displaying permissions
   - Responsive design with category sections
   - Visual indicators for granted/denied permissions

3. **`client/src/pages/UserManagement.tsx`**
   - Added Eye icon button to Actions column
   - Integrated PermissionsModal component
   - Added click handler for viewing permissions

### Usage

```typescript
import { getPermissionsByRole } from '@/lib/permissions';

// Get permissions for a role
const permissions = getPermissionsByRole('doctor');

// Check a specific permission
if (permissions.patientManagement.view) {
  // User can view patients
}
```

## Accessibility Features

- **Keyboard Navigation**: ESC to close modal, Tab to navigate
- **ARIA Labels**: Proper labels for screen readers
- **Focus Management**: Focus is managed when modal opens/closes
- **Visual Clarity**: High contrast colors for granted/denied states

## Security Note

This feature is for **VIEWING permissions only**. It does NOT allow editing permissions. Permission changes must be done by changing a user's role through the existing Edit User functionality.

## Future Enhancements (Optional)

- Permission count badge (e.g., "16/25" in table)
- Export permissions to PDF for auditing
- Permission comparison between roles
- Audit trail for permission views
