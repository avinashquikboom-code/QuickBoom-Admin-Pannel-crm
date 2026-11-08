'use client';
import React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { InputField, FormField } from './FormField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';
import { FontAwesomeIcon } from '@/components/icons/FontAwesomeIcon';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const ROLES = ['Admin', 'Manager', 'Supervisor', 'Employee', 'Viewer'];
const PERMISSIONS = [
  { id: 'attendance', label: 'Attendance Management' },
  { id: 'leave', label: 'Leave Management' },
  { id: 'payroll', label: 'Payroll Access' },
  { id: 'reports', label: 'Reports & Analytics' },
  { id: 'expenses', label: 'Expense Claims' },
  { id: 'timesheet', label: 'Timesheet Management' },
  { id: 'projects', label: 'Project Management' },
  { id: 'team_management', label: 'Team Management' },
];

export function Step5MobileAccess() {
  const store = useEmployeeWizardStore();

  const handlePermissionToggle = (permission) => {
    if (store.permissions.includes(permission)) {
      store.removePermission(permission);
    } else {
      store.addPermission(permission);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Mobile App Access & Permissions</h2>
        <p className="text-xs text-slate-500 mt-1">Configure mobile app access and assign permissions</p>
      </div>

      {/* Enable Mobile Access Toggle */}
      <div className="p-4 border-2 border-slate-200 rounded-lg bg-slate-50/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Enable Mobile App Access</h3>
            <p className="text-xs text-slate-500 mt-1">Allow this employee to access the mobile application</p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="enableMobile"
              checked={store.enableMobileAccess}
              onCheckedChange={(checked) => store.updateField('enableMobileAccess', checked)}
            />
            <Label htmlFor="enableMobile" className="cursor-pointer">
              {store.enableMobileAccess ? 'Enabled' : 'Disabled'}
            </Label>
          </div>
        </div>
      </div>

      {/* Mobile Access Configuration */}
      {store.enableMobileAccess && (
        <div className="space-y-6">
          {/* Login Credentials */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Login Credentials</h3>
            <div className="space-y-3">
              <InputField
                label="Login Email"
                type="email"
                placeholder="employee@company.com"
                value={store.loginEmail}
                onChange={(e) => store.updateField('loginEmail', e.target.value)}
                hint="Email for mobile app login"
              />

              <InputField
                label="Username (Optional)"
                placeholder="Auto-generated if empty"
                value={store.username}
                onChange={(e) => store.updateField('username', e.target.value)}
                hint="Leave empty for auto-generated username"
              />

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
                <FontAwesomeIcon icon={faInfoCircle} className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  A secure password setup link will be sent to the login email. The employee must set their password before first login.
                </p>
              </div>
            </div>
          </div>

          {/* Role & Permissions */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Role & Permissions</h3>
            <div className="space-y-3">
              <FormField label="Application Role">
                <Select value={store.applicationRole} onValueChange={(value) => store.updateField('applicationRole', value)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role} className="text-xs">
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <div>
                <Label className="text-xs font-semibold text-slate-800 mb-3 block">
                  Assign Permissions
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PERMISSIONS.map((permission) => (
                    <div key={permission.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`perm-${permission.id}`}
                        checked={store.permissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <Label htmlFor={`perm-${permission.id}`} className="text-xs font-medium cursor-pointer">
                        {permission.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Feature Access</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors">
                <div>
                  <Label className="text-xs font-medium text-slate-800 block">Attendance Access</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Allow check-in/check-out via mobile</p>
                </div>
                <Checkbox
                  checked={store.enableAttendanceAccess}
                  onCheckedChange={(checked) => store.updateField('enableAttendanceAccess', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors">
                <div>
                  <Label className="text-xs font-medium text-slate-800 block">Location Tracking</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Enable GPS location tracking during work</p>
                </div>
                <Checkbox
                  checked={store.enableLocationTracking}
                  onCheckedChange={(checked) => store.updateField('enableLocationTracking', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors">
                <div>
                  <Label className="text-xs font-medium text-slate-800 block">Push Notifications</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Receive announcements and alerts</p>
                </div>
                <Checkbox
                  checked={store.enablePushNotifications}
                  onCheckedChange={(checked) => store.updateField('enablePushNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50/50 transition-colors">
                <div>
                  <Label className="text-xs font-medium text-slate-800 block">Employee Self-Service</Label>
                  <p className="text-xs text-slate-500 mt-0.5">Access leave, expense & payroll services</p>
                </div>
                <Checkbox
                  checked={store.enableEmployeeSelfService}
                  onCheckedChange={(checked) => store.updateField('enableEmployeeSelfService', checked)}
                />
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">Account Status</h3>
            <FormField label="Mobile Account Status">
              <Select value={store.accountStatus} onValueChange={(value) => store.updateField('accountStatus', value)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active" className="text-xs">
                    Active - Account is active
                  </SelectItem>
                  <SelectItem value="Inactive" className="text-xs">
                    Inactive - Account is disabled
                  </SelectItem>
                  <SelectItem value="Suspended" className="text-xs">
                    Suspended - Account temporarily suspended
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </div>
      )}

      {/* No Mobile Access Info */}
      {!store.enableMobileAccess && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            Mobile app access is disabled. The employee can still access the web portal. Enable mobile access above to configure app-specific settings.
          </p>
        </div>
      )}
    </div>
  );
}
