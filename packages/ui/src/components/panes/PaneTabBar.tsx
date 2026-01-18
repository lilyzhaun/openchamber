import React, { useCallback, useState, useRef } from 'react';
import {
  RiChat4Line,
  RiCodeLine,
  RiFolder6Line,
  RiTerminalBoxLine,
  RiGitBranchLine,
  RiAddLine,
  RiCloseLine,
  RiGlobalLine,
  RiHistoryLine,
  type RemixiconComponentType,
} from '@remixicon/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { PaneId, PaneTab, PaneTabType } from '@/stores/usePaneStore';

const TAB_ICONS: Record<PaneTabType, RemixiconComponentType> = {
  chat: RiChat4Line,
  diff: RiCodeLine,
  files: RiFolder6Line,
  terminal: RiTerminalBoxLine,
  git: RiGitBranchLine,
  browser: RiGlobalLine,
};

interface DraggableTabItemProps {
  tab: PaneTab;
  paneId: PaneId;
  isActive: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  onActivate: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent, tabId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, targetTabId: string) => void;
}

const DraggableTabItem: React.FC<DraggableTabItemProps> = ({
  tab,
  paneId,
  isActive,
  isDragOver,
  isDragging,
  onActivate,
  onClose,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}) => {
  const Icon = TAB_ICONS[tab.type] ?? RiChat4Line;

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClose();
    },
    [onClose]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData(
        'application/x-openchamber-tab',
        JSON.stringify({ tabId: tab.id, sourcePane: paneId, tab })
      );
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(e, tab.id);
    },
    [tab, paneId, onDragStart]
  );

  return (
    <div
      onClick={onActivate}
      draggable
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, tab.id)}
      className={cn(
        'group relative flex h-12 items-center gap-1.5 px-3 cursor-pointer select-none',
        'border-r transition-colors',
        isActive
          ? 'bg-background text-foreground'
          : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50',
        isDragging && 'opacity-50',
        isDragOver && 'bg-primary/20'
      )}
      style={{
        borderColor: 'var(--interactive-border)',
      }}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate max-w-[120px] text-sm">{tab.title}</span>
      <button
        type="button"
        onClick={handleClose}
        className={cn(
          'ml-1 h-4 w-4 shrink-0 rounded-sm',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-foreground/10',
          isActive && 'opacity-60'
        )}
        aria-label={`Close ${tab.title}`}
      >
        <RiCloseLine className="h-4 w-4" />
      </button>
    </div>
  );
};

interface NewTabMenuProps {
  onSelect: (type: PaneTabType) => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const NewTabMenu: React.FC<NewTabMenuProps> = ({ onSelect, onClose, anchorRef }) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  React.useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
  }, [anchorRef]);

  const options: { type: PaneTabType; label: string; icon: RemixiconComponentType }[] = [
    { type: 'chat', label: 'New Chat', icon: RiChat4Line },
    { type: 'terminal', label: 'Terminal', icon: RiTerminalBoxLine },
    { type: 'files', label: 'Files', icon: RiFolder6Line },
    { type: 'diff', label: 'Diff', icon: RiCodeLine },
    { type: 'git', label: 'Git', icon: RiGitBranchLine },
  ];

  return (
    <div
      className="fixed z-50 min-w-[140px] rounded-md border bg-popover p-1 shadow-md"
      style={{ 
        borderColor: 'var(--interactive-border)',
        top: position.top,
        left: position.left,
      }}
    >
      {options.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          type="button"
          onClick={() => {
            onSelect(type);
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Icon className="h-4 w-4" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
};

interface PaneTabBarProps {
  paneId: PaneId;
  tabs: PaneTab[];
  activeTabId: string | null;
  onActivateTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onReorderTabs: (sourceId: string, targetId: string) => void;
  onAddTab: (type: PaneTabType) => void;
  onMoveTabFromPane?: (sourcePane: PaneId, tabId: string) => void;
  onOpenHistory?: () => void;
}

export const PaneTabBar: React.FC<PaneTabBarProps> = ({
  paneId,
  tabs,
  activeTabId,
  onActivateTab,
  onCloseTab,
  onReorderTabs,
  onAddTab,
  onMoveTabFromPane,
  onOpenHistory,
}) => {
  const [draggingTabId, setDraggingTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [showNewTabMenu, setShowNewTabMenu] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggingTabId(tabId);
    const target = e.currentTarget as HTMLElement;
    const cleanup = () => {
      setDraggingTabId(null);
      setDragOverTabId(null);
      target.removeEventListener('dragend', cleanup);
    };
    target.addEventListener('dragend', cleanup);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggingTabId(null);
    setDragOverTabId(null);
  }, []);

  const handleTabDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    if (e.dataTransfer.types.includes('application/x-openchamber-tab')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverTabId(tabId);
    }
  }, []);

  const handleTabDragLeave = useCallback(() => {
    setDragOverTabId(null);
  }, []);

  const handleTabDrop = useCallback(
    (e: React.DragEvent, targetTabId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverTabId(null);

      const tabData = e.dataTransfer.getData('application/x-openchamber-tab');
      if (!tabData) return;

      try {
        const { tabId: sourceTabId, sourcePane } = JSON.parse(tabData) as {
          tabId: string;
          sourcePane: PaneId;
        };

        if (sourcePane === paneId && sourceTabId !== targetTabId) {
          onReorderTabs(sourceTabId, targetTabId);
        } else if (sourcePane !== paneId && onMoveTabFromPane) {
          onMoveTabFromPane(sourcePane, sourceTabId);
        }
      } catch { /* empty */ }
    },
    [paneId, onReorderTabs, onMoveTabFromPane]
  );

  const handleBarDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-openchamber-tab')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  }, []);

  const handleBarDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      
      const tabData = e.dataTransfer.getData('application/x-openchamber-tab');
      if (!tabData) return;

      try {
        const { tabId: sourceTabId, sourcePane } = JSON.parse(tabData) as {
          tabId: string;
          sourcePane: PaneId;
        };

        if (sourcePane !== paneId && onMoveTabFromPane) {
          onMoveTabFromPane(sourcePane, sourceTabId);
        }
      } catch { /* empty */ }
    },
    [paneId, onMoveTabFromPane]
  );

  return (
    <div
      className="flex h-12 items-stretch border-b bg-muted/20 overflow-x-auto"
      style={{ borderColor: 'var(--interactive-border)' }}
      data-pane-id={paneId}
      onDragEnd={handleDragEnd}
      onDragOver={handleBarDragOver}
      onDrop={handleBarDrop}
    >
      {tabs.map((tab) => (
        <DraggableTabItem
          key={tab.id}
          tab={tab}
          paneId={paneId}
          isActive={tab.id === activeTabId}
          isDragOver={dragOverTabId === tab.id}
          isDragging={draggingTabId === tab.id}
          onActivate={() => onActivateTab(tab.id)}
          onClose={() => onCloseTab(tab.id)}
          onDragStart={handleDragStart}
          onDragOver={(e) => handleTabDragOver(e, tab.id)}
          onDragLeave={handleTabDragLeave}
          onDrop={handleTabDrop}
        />
      ))}

      <div className="relative flex items-center">
        <button
          ref={addButtonRef}
          type="button"
          onClick={() => setShowNewTabMenu((v) => !v)}
          className="flex h-full items-center justify-center px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Add new tab"
        >
          <RiAddLine className="h-4 w-4" />
        </button>
        {showNewTabMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowNewTabMenu(false)}
            />
            <NewTabMenu
              onSelect={onAddTab}
              onClose={() => setShowNewTabMenu(false)}
              anchorRef={addButtonRef}
            />
          </>
        )}
      </div>

      <div className="flex-1" />

      {onOpenHistory && (
        <Tooltip delayDuration={700}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onOpenHistory}
              className="flex h-full items-center justify-center px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-l"
              style={{ borderColor: 'var(--interactive-border)' }}
              aria-label="Session history"
            >
              <RiHistoryLine className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Session History</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
