import React from 'react';
import { getRegisteredRuntimeAPIs } from '@/contexts/runtimeAPIRegistry';
import { isWebRuntime } from '@/lib/desktop';
import { useUIStore } from '@/stores/useUIStore';

type NotificationStreamEvent = {
  type?: string;
  properties?: {
    title?: string;
    body?: string;
    tag?: string;
    requireHidden?: boolean;
    desktopStdoutActive?: boolean;
  };
};

export const useBrowserNotificationStream = (options?: { enabled?: boolean }) => {
  const enabled = options?.enabled ?? true;
  const nativeNotificationsEnabled = useUIStore((state) => state.nativeNotificationsEnabled);

  React.useEffect(() => {
    if (!enabled || !nativeNotificationsEnabled || !isWebRuntime() || typeof window === 'undefined') {
      return;
    }

    if (typeof EventSource === 'undefined') {
      return;
    }

    const apis = getRegisteredRuntimeAPIs();
    if (!apis?.notifications?.notifyAgentCompletion) {
      return;
    }

    const source = new EventSource('/api/notifications/stream');

    source.onmessage = (event) => {
      let payload: NotificationStreamEvent | null = null;
      try {
        payload = JSON.parse(event.data) as NotificationStreamEvent;
      } catch {
        return;
      }

      if (!payload || payload.type !== 'openchamber:notification') {
        return;
      }

      const properties = payload.properties ?? {};
      if (properties.desktopStdoutActive === true) {
        return;
      }

      if (properties.requireHidden === true && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        return;
      }

      void apis.notifications.notifyAgentCompletion({
        title: properties.title,
        body: properties.body,
        tag: properties.tag,
      });
    };

    return () => {
      source.close();
    };
  }, [enabled, nativeNotificationsEnabled]);
};
