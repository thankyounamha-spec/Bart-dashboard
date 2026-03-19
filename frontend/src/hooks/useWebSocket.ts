import { useEffect, useRef, useCallback, useState } from 'react';
import type { FileChangeEvent } from '@/types';

interface UseWebSocketOptions {
  projectId: string | null;
  onFileChange?: (event: FileChangeEvent) => void;
  enabled?: boolean;
}

interface UseWebSocketResult {
  connected: boolean;
}

/**
 * Connect to ws://localhost:3001 for file change events.
 * Triggers data reload on change events.
 */
export function useWebSocket({
  projectId,
  onFileChange,
  enabled = true,
}: UseWebSocketOptions): UseWebSocketResult {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!enabled || !projectId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const ws = new WebSocket(`${protocol}//${host}:6173/ws`);

      ws.onopen = () => {
        setConnected(true);
        // Subscribe to project events
        ws.send(JSON.stringify({ type: 'subscribe', projectId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as FileChangeEvent;
          if (data.projectId === projectId && onFileChange) {
            onFileChange(data);
          }
        } catch {
          // Ignore non-JSON messages
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        setConnected(false);
        // Reconnect after 5 seconds
        reconnectTimerRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      wsRef.current = ws;
    } catch {
      // WebSocket not available, will retry
      setConnected(false);
      reconnectTimerRef.current = setTimeout(connect, 5000);
    }
  }, [projectId, onFileChange, enabled]);

  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { connected };
}
