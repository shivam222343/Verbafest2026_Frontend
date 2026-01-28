import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'dark', // 'light' or 'dark'
            toggleTheme: () => set((state) => ({
                theme: state.theme === 'dark' ? 'light' : 'dark'
            })),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'theme-storage', // localStorage key
        }
    )
);

export default useThemeStore;
