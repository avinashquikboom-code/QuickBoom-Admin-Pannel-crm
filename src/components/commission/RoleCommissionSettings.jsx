'use client';

import * as React from 'react';
import { RoleCommissionConfigurationsCard } from './RoleCommissionConfigurationsCard';
import { PreviewCommissionCard } from './PreviewCommissionCard';
import api from '../../../lib/api';

const unwrap = (value) => value?.data ?? value;

export function RoleCommissionSettings() {
  const [roles, setRoles] = React.useState([]);

  React.useEffect(() => {
    let isMounted = true;
    api
      .get('/commissions/configs/roles')
      .then((res) => {
        if (isMounted) setRoles(unwrap(res) || []);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-5 sm:space-y-6">
      <RoleCommissionConfigurationsCard
        roles={roles}
        onRolesLoaded={(loaded) => setRoles(loaded)}
      />
      <PreviewCommissionCard roles={roles} />
    </div>
  );
}
