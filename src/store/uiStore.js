import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
    persist(
        (set) => ({
            sidebarOpen: true,
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),

            // Mobile sidebar (always closes after navigation on mobile)
            mobileSidebarOpen: false,
            toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
            setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
        }),
        {
            name: 'ui-storage',
        }
    )
);

export default useUIStore;
