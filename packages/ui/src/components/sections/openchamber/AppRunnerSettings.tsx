import React, { useCallback } from 'react';
import { RiPlayLine, RiStopLine, RiTerminalLine } from '@remixicon/react';
import { useAppRunnerStore } from '@/stores/useAppRunnerStore';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';

export const AppRunnerSettings: React.FC = () => {
  const enabled = useAppRunnerStore((s) => s.enabled);
  const command = useAppRunnerStore((s) => s.command);
  const setEnabled = useAppRunnerStore((s) => s.setEnabled);
  const setCommand = useAppRunnerStore((s) => s.setCommand);

  const handleToggleEnabled = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  const handleCommandChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCommand(e.target.value);
    },
    [setCommand]
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="typography-ui-header font-semibold text-foreground">App Runner</h3>
        <p className="typography-meta text-muted-foreground">
          Run a persistent dev server in the bottom panel with start/stop controls, URL detection,
          and quick preview access.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 p-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-10 w-10 rounded-lg flex items-center justify-center',
                enabled ? 'bg-primary/10' : 'bg-muted/50'
              )}
            >
              <RiTerminalLine
                className={cn('h-5 w-5', enabled ? 'text-primary' : 'text-muted-foreground')}
              />
            </div>
            <div className="space-y-0.5">
              <label htmlFor="app-runner-toggle" className="typography-ui-label font-medium cursor-pointer">
                Enable App Runner
              </label>
              <p className="typography-micro text-muted-foreground">
                Show a pinned terminal in the bottom panel
              </p>
            </div>
          </div>
          <Switch
            id="app-runner-toggle"
            checked={enabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>

        <div
          className={cn(
            'space-y-3 rounded-lg border border-border/40 bg-muted/20 p-4 transition-opacity',
            !enabled && 'opacity-50 pointer-events-none'
          )}
        >
          <div className="space-y-1.5">
            <label htmlFor="app-runner-command" className="typography-ui-label font-medium">
              Run Command
            </label>
            <Input
              id="app-runner-command"
              value={command}
              onChange={handleCommandChange}
              placeholder="bun run dev"
              className="font-mono text-sm"
              disabled={!enabled}
            />
            <p className="typography-micro text-muted-foreground">
              The command to execute when starting the app. Use{' '}
              <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+R</kbd> to start/stop.
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border/40 bg-muted/10 p-4">
          <h4 className="typography-ui-label font-medium mb-2">How it works</h4>
          <ul className="space-y-2 typography-meta text-muted-foreground">
            <li className="flex items-start gap-2">
              <RiPlayLine className="h-4 w-4 mt-0.5 text-[color:var(--status-success)] shrink-0" />
              <span>Click the play button or press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+R</kbd> to start your dev server</span>
            </li>
            <li className="flex items-start gap-2">
              <RiStopLine className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
              <span>Click stop or press <kbd className="px-1 py-0.5 rounded bg-muted text-xs">Cmd+R</kbd> again to stop the server</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="h-4 w-4 mt-0.5 text-primary shrink-0 text-center font-bold">://</span>
              <span>Detected localhost URLs appear as buttons for quick preview access</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
