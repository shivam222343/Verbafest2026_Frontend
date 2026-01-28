import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useNotificationStore = create(
    persist(
        (set) => ({
            notifications: [],
            unreadCount: 0,
            addNotification: (notification) => set((state) => ({
                notifications: [{ ...notification, read: false, id: notification.id || Date.now().toString() }, ...state.notifications],
                unreadCount: state.unreadCount + 1
            })),
            markAllAsRead: () => set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, read: true })),
                unreadCount: 0
            })),
            clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
            removeNotification: (id) => set((state) => {
                const notification = state.notifications.find(n => n.id === id);
                const updated = state.notifications.filter(n => n.id !== id);
                return {
                    notifications: updated,
                    unreadCount: Math.max(0, state.unreadCount - (notification?.read ? 0 : 1))
                };
            })
        }),
        {
            name: 'participant-notifications',
        }
    )
);

export default useNotificationStore;
