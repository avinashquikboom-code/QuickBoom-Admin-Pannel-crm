'use client';
import React from 'react';
import { useEmployeeWizardStore } from '@/lib/stores/employee-wizard-store';
import { InputField } from './FormField';
import { Checkbox } from '@/components/common/Checkbox';
import { Label } from '@/components/common/Label';


export function Step5MobileAccess({ password, onPasswordChange }) {
  const store = useEmployeeWizardStore();

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
              <InputField label="Initial password (optional)" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} hint="Leave blank to use the default password. Use at least 6 characters for a custom password." />
              <p className="text-xs text-slate-500">Employees can sign in using their employee email, employee ID, or mobile number.</p>
            </div>
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
