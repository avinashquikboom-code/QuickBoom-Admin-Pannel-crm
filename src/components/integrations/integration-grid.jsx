'use client';

import { IntegrationCard } from './integration-card';
import { INTEGRATION_ICONS } from './integration-icons';

export function IntegrationGrid({ providers, states, onConfigure, onTest }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {providers.map((provider) => {
        const Icon = INTEGRATION_ICONS[provider.id] ?? INTEGRATION_ICONS.default;
        return (
          <IntegrationCard
            key={provider.id}
            provider={provider}
            icon={Icon}
            state={states[provider.id]}
            onConfigure={onConfigure}
            onTest={onTest}
          />
        );
      })}
    </div>
  );
}
