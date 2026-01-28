import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'https://verbafest2026.onrender.com').replace('/api', '');

export const useSocket = () => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection
        socketRef.current = io(SOCKET_URL, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketRef.current.on('connect', () => {
            console.log('✅ Socket connected:', socketRef.current.id);
        });

        socketRef.current.on('disconnect', () => {
            console.log('❌ Socket disconnected');
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return socketRef.current;
};

// Hook for admin to join admin room
export const useAdminSocket = (callbacks = {}) => {
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        // Join admin room
        socket.emit('join:admin');

        // Listen for panel events
        if (callbacks.onPanelCreated) {
            socket.on('panel:created', callbacks.onPanelCreated);
        }

        if (callbacks.onJudgeLoggedIn) {
            socket.on('judge:logged_in', callbacks.onJudgeLoggedIn);
        }

        if (callbacks.onEvaluationSubmitted) {
            socket.on('evaluation:submitted', callbacks.onEvaluationSubmitted);
        }

        if (callbacks.onSubEventStarted) {
            socket.on('subevent:started', callbacks.onSubEventStarted);
        }

        if (callbacks.onSubEventStopped) {
            socket.on('subevent:stopped', callbacks.onSubEventStopped);
        }

        if (callbacks.onAdminRequest) {
            socket.on('admin:request', callbacks.onAdminRequest);
        }

        if (callbacks.onTopicUsedBulk) {
            socket.on('topic:used_bulk', callbacks.onTopicUsedBulk);
        }

        if (callbacks.onTopicClaimed) {
            socket.on('topic:claimed', callbacks.onTopicClaimed);
        }

        if (callbacks.onTopicReset) {
            socket.on('topic:reset', callbacks.onTopicReset);
        }

        // Cleanup
        return () => {
            socket.off('panel:created');
            socket.off('judge:logged_in');
            socket.off('evaluation:submitted');
            socket.off('subevent:started');
            socket.off('subevent:stopped');
            socket.off('admin:request');
            socket.off('topic:used_bulk');
            socket.off('topic:claimed');
            socket.off('topic:reset');
        };
    }, [socket, callbacks]);

    return socket;
};

// Hook for judges to join panel room
export const useJudgeSocket = (panelId, callbacks = {}) => {
    const socket = useSocket();

    useEffect(() => {
        if (!socket || !panelId) return;

        // Join panel-specific room
        socket.emit('join:panel', panelId);

        // Listen for evaluation updates
        if (callbacks.onEvaluationUpdated) {
            socket.on('evaluation:updated', callbacks.onEvaluationUpdated);
        }

        if (callbacks.onGroupAssigned) {
            socket.on('group:assigned', callbacks.onGroupAssigned);
        }

        // Cleanup
        return () => {
            socket.off('evaluation:updated');
            socket.off('group:assigned');
        };
    }, [socket, panelId, callbacks]);

    return socket;
};

// Hook for round-specific updates
export const useRoundSocket = (roundId, callbacks = {}) => {
    const socket = useSocket();

    useEffect(() => {
        if (!socket || !roundId) return;

        // Join round-specific room
        socket.emit('join:round', roundId);

        // Listen for round events
        if (callbacks.onGroupFormed) {
            socket.on('group:formed', callbacks.onGroupFormed);
        }

        if (callbacks.onGroupUpdated) {
            socket.on('group:updated', callbacks.onGroupUpdated);
        }

        // Cleanup
        return () => {
            socket.off('group:formed');
            socket.off('group:updated');
        };
    }, [socket, roundId, callbacks]);

    return socket;
};

// Hook for participants to join personal and event rooms
export const useParticipantSocket = (participantId, subEventIds = [], callbacks = {}) => {
    const socket = useSocket();

    useEffect(() => {
        if (!socket || !participantId) return;

        // Join personal room
        socket.emit('join:participant', participantId);

        // Join sub-event rooms
        subEventIds.forEach(id => {
            socket.emit('join:subevent', id);
        });

        // Listen for status updates
        if (callbacks.onStatusUpdated) {
            socket.on('participant:status_updated', callbacks.onStatusUpdated);
        }

        if (callbacks.onRoundStarted) {
            socket.on('round:started', callbacks.onRoundStarted);
        }

        if (callbacks.onRoundEnded) {
            socket.on('round:ended', callbacks.onRoundEnded);
        }

        if (callbacks.onNotificationReceived) {
            socket.on('participant:notification', callbacks.onNotificationReceived);
        }

        // Cleanup
        return () => {
            socket.off('participant:status_updated');
            socket.off('round:started');
            socket.off('round:ended');
            socket.off('participant:notification');
        };
    }, [socket, participantId, subEventIds, callbacks]);

    return socket;
};

export default useSocket;
