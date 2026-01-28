import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            userRole: null, // 'admin' or 'participant'

            setAuth: (user, token, role) => set({
                user,
                token,
                isAuthenticated: true,
                userRole: role
            }),

            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false,
                userRole: null
            }),

            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
