'use client';

import * as React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSidebarStore = create(
    persist(
        (set) => ({
            collapsed: false,
            toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
            setCollapsed: (collapsed) => set({ collapsed }),
        }),
        { name: 'qb-admin-sidebar' }
    )
);

/**
 * Hydration-safe hook for accessing sidebar collapsed state.
 * Guarantees that during SSR and initial client hydration, `collapsed` is consistently `false`
 * (matching the server-rendered default), and only returns the stored `localStorage` value after
 * client mount to eliminate React Hydration Error #418.
 */
export function useHydratedSidebar() {
    const [isHydrated, setIsHydrated] = React.useState(false);
    const collapsed = useSidebarStore((s) => s.collapsed);
    const setCollapsed = useSidebarStore((s) => s.setCollapsed);
    const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);

    React.useEffect(() => {
        setIsHydrated(true);
    }, []);

    return {
        collapsed: isHydrated ? collapsed : false,
        isHydrated,
        setCollapsed,
        toggleCollapsed,
    };
}
