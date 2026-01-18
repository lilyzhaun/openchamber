import React from 'react';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { CommandPalette } from '../ui/CommandPalette';
import { HelpDialog } from '../ui/HelpDialog';
import { WorktreeSidebar } from '@/components/sidebar';
import { SessionDialogs } from '@/components/session/SessionDialogs';
import { MobileOverlayPanel } from '@/components/ui/MobileOverlayPanel';
import { DiffWorkerProvider } from '@/contexts/DiffWorkerProvider';
import { MultiRunLauncher } from '@/components/multirun';
import { WorkspacePane } from '@/components/panes';
import { usePaneStore, usePanes } from '@/stores/usePaneStore';
import { useSessionStore } from '@/stores/useSessionStore';

import { useUIStore } from '@/stores/useUIStore';
import { useUpdateStore } from '@/stores/useUpdateStore';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { useDeviceInfo } from '@/lib/device';
import { useEdgeSwipe } from '@/hooks/useEdgeSwipe';
import { cn } from '@/lib/utils';

import { SettingsView } from '@/components/views';

export const MainLayout: React.FC = () => {
    const {
        isSidebarOpen,
        setIsMobile,
        isSessionSwitcherOpen,
        setSessionSwitcherOpen,
        isSettingsDialogOpen,
        setSettingsDialogOpen,
        isMultiRunLauncherOpen,
        setMultiRunLauncherOpen,
        multiRunLauncherPrefillPrompt,
    } = useUIStore();
    
    const currentDirectory = useDirectoryStore((state) => state.currentDirectory);
    const worktreeId = currentDirectory ?? 'global';

    const { rightPaneVisible, rightPaneWidth, setRightPaneWidth } = usePaneStore();
    const { addTab, activateTabByIndex, closeActiveTab, focusedPane } = usePanes(worktreeId);
    const { createSession, setCurrentSession } = useSessionStore();
    const [isResizing, setIsResizing] = React.useState(false);

    const { isMobile } = useDeviceInfo();
    const [isDesktopRuntime, setIsDesktopRuntime] = React.useState<boolean>(() => {
        if (typeof window === 'undefined') {
            return false;
        }
        return typeof window.opencodeDesktop !== 'undefined';
    });

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }
        setIsDesktopRuntime(typeof window.opencodeDesktop !== 'undefined');
    }, []);

    useEdgeSwipe({ enabled: true });

    React.useEffect(() => {
        if (typeof window === 'undefined' || isMobile) return;

        const handleKeyDown = async (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;
            if (!isMeta) return;

            if (e.key >= '1' && e.key <= '9') {
                e.preventDefault();
                const index = parseInt(e.key, 10) - 1;
                activateTabByIndex(index);
                return;
            }

            if (e.key === 't' && !e.shiftKey) {
                e.preventDefault();
                const session = await createSession();
                if (session?.id) {
                    addTab(focusedPane, {
                        type: 'chat',
                        title: session.title || 'New Chat',
                        sessionId: session.id,
                    });
                    setCurrentSession(session.id);
                }
                return;
            }

            if (e.key === 'w' && !e.shiftKey) {
                e.preventDefault();
                closeActiveTab();
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobile, activateTabByIndex, closeActiveTab, addTab, focusedPane, createSession, setCurrentSession]);

    const checkForUpdates = useUpdateStore((state) => state.checkForUpdates);
    React.useEffect(() => {
        const timer = setTimeout(() => {
            checkForUpdates();
        }, 3000);
        return () => clearTimeout(timer);
    }, [checkForUpdates]);

    React.useEffect(() => {
        const previous = useUIStore.getState().isMobile;
        if (previous !== isMobile) {
            setIsMobile(isMobile);
        }
    }, [isMobile, setIsMobile]);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        let timeoutId: number | undefined;

        const handleResize = () => {
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }

            timeoutId = window.setTimeout(() => {
                useUIStore.getState().updateProportionalSidebarWidths();
            }, 150);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    const isSettingsActive = isSettingsDialogOpen && !isMobile;

    const handleResizeStart = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);

        const startX = e.clientX;
        const startWidth = rightPaneWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const delta = startX - moveEvent.clientX;
            const newWidth = Math.max(280, Math.min(800, startWidth + delta));
            setRightPaneWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [rightPaneWidth, setRightPaneWidth]);

    return (
        <DiffWorkerProvider>
            <div
                className={cn(
                    'main-content-safe-area h-[100dvh]',
                    isMobile ? 'flex flex-col' : 'flex',
                    isDesktopRuntime ? 'bg-transparent' : 'bg-background'
                )}
            >
                <CommandPalette />
                <HelpDialog />
                <SessionDialogs />

                {isMobile ? (
                    <>
                        <div
                            className={cn(
                                'flex flex-1 overflow-hidden bg-background',
                                (isSettingsDialogOpen || isMultiRunLauncherOpen) && 'hidden'
                            )}
                        >
                        <WorkspacePane
                            paneId="left"
                            worktreeId={worktreeId}
                            className="flex-1"
                            onOpenHistory={() => setSessionSwitcherOpen(true)}
                        />
                        </div>

                        <MobileOverlayPanel
                            open={isSessionSwitcherOpen}
                            onClose={() => setSessionSwitcherOpen(false)}
                            title="Sessions"
                        >
                            <WorktreeSidebar mobileVariant />
                        </MobileOverlayPanel>

                        {isMultiRunLauncherOpen && (
                            <div className="absolute inset-0 z-10 bg-background header-safe-area">
                                <ErrorBoundary>
                                    <MultiRunLauncher
                                        initialPrompt={multiRunLauncherPrefillPrompt}
                                        onCreated={() => setMultiRunLauncherOpen(false)}
                                        onCancel={() => setMultiRunLauncherOpen(false)}
                                    />
                                </ErrorBoundary>
                            </div>
                        )}

                        {isSettingsDialogOpen && (
                            <div className="absolute inset-0 z-10 bg-background header-safe-area">
                                <ErrorBoundary><SettingsView onClose={() => setSettingsDialogOpen(false)} /></ErrorBoundary>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {!isSettingsActive && (
                            <Sidebar isOpen={isSidebarOpen} isMobile={isMobile}>
                                <WorktreeSidebar />
                            </Sidebar>
                        )}

                        <div className="flex flex-1 overflow-hidden relative">
                            <div className={cn('flex flex-1 overflow-hidden', (isSettingsActive || isMultiRunLauncherOpen) && 'invisible')}>
                            <WorkspacePane
                                paneId="left"
                                worktreeId={worktreeId}
                                className="flex-1"
                                onOpenHistory={() => setSessionSwitcherOpen(true)}
                            />
                            {rightPaneVisible && (
                                <>
                                    <div
                                        className={cn(
                                            'w-1 cursor-col-resize hover:bg-primary/20 transition-colors shrink-0',
                                            isResizing && 'bg-primary/30'
                                        )}
                                        onMouseDown={handleResizeStart}
                                        style={{ borderLeft: '1px solid var(--interactive-border)' }}
                                    />
                                    <WorkspacePane
                                        paneId="right"
                                        worktreeId={worktreeId}
                                        className="shrink-0"
                                        style={{ width: rightPaneWidth }}
                                        onOpenHistory={() => setSessionSwitcherOpen(true)}
                                    />
                                </>
                            )}
                            </div>

                            {isMultiRunLauncherOpen && (
                                <div className={cn('absolute inset-0 z-10', isDesktopRuntime ? 'bg-transparent' : 'bg-background')}>
                                    <ErrorBoundary>
                                        <MultiRunLauncher
                                            initialPrompt={multiRunLauncherPrefillPrompt}
                                            onCreated={() => setMultiRunLauncherOpen(false)}
                                            onCancel={() => setMultiRunLauncherOpen(false)}
                                        />
                                    </ErrorBoundary>
                                </div>
                            )}
                        </div>

                        {isSettingsActive && (
                            <div className={cn('absolute inset-0 z-10', isDesktopRuntime ? 'bg-transparent' : 'bg-background')}>
                                <ErrorBoundary><SettingsView onClose={() => setSettingsDialogOpen(false)} /></ErrorBoundary>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DiffWorkerProvider>
    );
};
