import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getSafeStorage } from './utils/safeStorage';

export type AppRunnerStatus = 'stopped' | 'starting' | 'running' | 'crashed';

export interface DetectedUrl {
  url: string;
  port: number;
  detectedAt: number;
}

interface AppRunnerStore {
  enabled: boolean;
  command: string;
  status: AppRunnerStatus;
  terminalSessionId: string | null;
  detectedUrls: DetectedUrl[];
  lastExitCode: number | null;
  
  setEnabled: (enabled: boolean) => void;
  setCommand: (command: string) => void;
  setStatus: (status: AppRunnerStatus) => void;
  setTerminalSessionId: (sessionId: string | null) => void;
  addDetectedUrl: (url: string, port: number) => void;
  clearDetectedUrls: () => void;
  setLastExitCode: (code: number | null) => void;
  reset: () => void;
}

const URL_REGEX = /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)(?:\/[^\s]*)?/g;

export const parseUrlsFromText = (text: string): DetectedUrl[] => {
  const urls: DetectedUrl[] = [];
  const seen = new Set<string>();
  
  let match;
  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    const port = parseInt(match[1], 10);
    
    if (!seen.has(url)) {
      seen.add(url);
      urls.push({ url, port, detectedAt: Date.now() });
    }
  }
  
  URL_REGEX.lastIndex = 0;
  return urls;
};

export const useAppRunnerStore = create<AppRunnerStore>()(
  persist(
    (set) => ({
      enabled: false,
      command: 'bun run dev',
      status: 'stopped',
      terminalSessionId: null,
      detectedUrls: [],
      lastExitCode: null,

      setEnabled: (enabled) => set({ enabled }),
      setCommand: (command) => set({ command }),
      setStatus: (status) => set({ status }),
      setTerminalSessionId: (terminalSessionId) => set({ terminalSessionId }),
      
      addDetectedUrl: (url, port) => set((state) => {
        const exists = state.detectedUrls.some(u => u.url === url);
        if (exists) return state;
        return {
          detectedUrls: [...state.detectedUrls, { url, port, detectedAt: Date.now() }]
        };
      }),
      
      clearDetectedUrls: () => set({ detectedUrls: [] }),
      setLastExitCode: (lastExitCode) => set({ lastExitCode }),
      
      reset: () => set({
        status: 'stopped',
        terminalSessionId: null,
        detectedUrls: [],
        lastExitCode: null,
      }),
    }),
    {
      name: 'openchamber-app-runner',
      storage: createJSONStorage(() => getSafeStorage()),
      partialize: (state) => ({
        enabled: state.enabled,
        command: state.command,
      }),
    }
  )
);
