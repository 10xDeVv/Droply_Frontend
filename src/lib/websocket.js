import { Client } from '@stomp/stompjs';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';

export class WebSocketService {
    constructor() {
        this.client = null;
        this.sub = null;
        this.listeners = new Map();
    }

    connect(roomId) {
        if (this.client?.active) return;

        this.client = new Client({
            brokerURL: `${WS_URL}/ws`,
            reconnectDelay: 3000,
            onConnect: () => {
                this.sub = this.client.subscribe(`/topic/room/${roomId}`, (frame) => {
                    try {
                        const msg = JSON.parse(frame.body);
                        this.handleMessage(msg);
                    } catch (e) {
                        console.error('Bad STOMP frame', e, frame.body);
                    }
                });
            },
            onStompError: (f) => console.error('STOMP error', f.headers, f.body),
            onWebSocketError: (e) => console.error('WS error', e),
        });

        this.client.activate();
    }

    handleMessage(message) {
        const { type, payload } = message || {};
        const handlers = this.listeners.get(type) || [];
        handlers.forEach((h) => h(payload));
    }

    subscribe(type, handler) {
        if (!this.listeners.has(type)) this.listeners.set(type, []);
        this.listeners.get(type).push(handler);
        return () => {
            const arr = this.listeners.get(type) || [];
            this.listeners.set(type, arr.filter((h) => h !== handler));
        };
    }

    disconnect() {
        try { this.sub?.unsubscribe(); } catch {}
        try { this.client?.deactivate(); } catch {}
        this.client = null;
        this.listeners.clear();
    }
}
