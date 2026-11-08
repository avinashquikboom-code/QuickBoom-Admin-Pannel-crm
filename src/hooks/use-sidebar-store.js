'use client';

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
