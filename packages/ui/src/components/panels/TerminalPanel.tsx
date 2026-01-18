import React from 'react';
import { RiTerminalBoxLine, RiCommandLine } from '@remixicon/react';
import { cn } from '@/lib/utils';

interface TerminalPanelProps {
  directory: string | null;
  className?: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({
  directory,
  className,
}) => {
  if (!directory) {
    return (
      <div className={cn('flex h-full items-center justify-center p-4', className)}>
        <p className="text-[11px] text-muted-foreground text-center">
          Select a project to open terminal
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('flex h-full flex-col bg-background/50', className)}>
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted/50">
          <RiTerminalBoxLine className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[11px] font-medium text-foreground">
            Terminal
          </p>
          <p className="text-[10px] text-muted-foreground max-w-[180px]">
            Use the main terminal tab for full terminal access
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded">
          <RiCommandLine className="h-3 w-3" />
          <span>Cmd+4</span>
        </div>
      </div>
    </div>
  );
};
