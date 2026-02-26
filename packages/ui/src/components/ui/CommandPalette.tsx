import React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import { useUIStore } from '@/stores/useUIStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useDirectoryStore } from '@/stores/useDirectoryStore';
import { useConfigStore } from '@/stores/useConfigStore';
import { useThemeSystem } from '@/contexts/useThemeSystem';
import { useI18n } from '@/contexts/useI18n';
import { useDeviceInfo } from '@/lib/device';
import { RiAddLine, RiChatAi3Line, RiCheckLine, RiCodeLine, RiComputerLine, RiGitBranchLine, RiLayoutLeftLine, RiLayoutRightLine, RiMoonLine, RiQuestionLine, RiSettings3Line, RiSunLine, RiTerminalBoxLine, RiTimeLine } from '@remixicon/react';
import { createWorktreeSession } from '@/lib/worktreeSessionCreator';
import { formatShortcutForDisplay, getEffectiveShortcutCombo } from '@/lib/shortcuts';
import { isDesktopShell, isVSCodeRuntime, isWebRuntime } from '@/lib/desktop';
import { SETTINGS_PAGE_METADATA, SETTINGS_GROUP_LABELS, type SettingsRuntimeContext } from '@/lib/settings/metadata';

export const CommandPalette: React.FC = () => {
  const { t } = useI18n();

  const settingsPageTitleKeyBySlug = React.useMemo<Record<string, string>>(() => ({
    home: 'settings.pages.home',
    projects: 'settings.pages.projects',
    providers: 'settings.pages.providers',
    usage: 'settings.pages.usage',
    agents: 'settings.pages.agents',
    commands: 'settings.pages.commands',
    mcp: 'settings.pages.mcp',
    'skills.installed': 'settings.pages.skillsInstalled',
    'skills.catalog': 'settings.pages.skillsCatalog',
    git: 'settings.pages.git',
    appearance: 'settings.pages.appearance',
    chat: 'settings.pages.chat',
    shortcuts: 'settings.pages.shortcuts',
    sessions: 'settings.pages.sessions',
    notifications: 'settings.pages.notifications',
    voice: 'settings.pages.voice',
  }), []);
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    setHelpDialogOpen,
    setActiveMainTab,
    setSettingsDialogOpen,
    setSettingsPage,
    setSessionSwitcherOpen,
    setTimelineDialogOpen,
    toggleSidebar,
    toggleRightSidebar,
    setRightSidebarOpen,
    setRightSidebarTab,
    toggleBottomTerminal,
    setBottomTerminalExpanded,
    isBottomTerminalExpanded,
    shortcutOverrides,
  } = useUIStore();

  const {
    openNewSessionDraft,
    setCurrentSession,
    getSessionsByDirectory,
  } = useSessionStore();

  const settingsAutoCreateWorktree = useConfigStore((state) => state.settingsAutoCreateWorktree);

  const { currentDirectory } = useDirectoryStore();
  const { themeMode, setThemeMode } = useThemeSystem();

  const handleClose = () => {
    setCommandPaletteOpen(false);
  };

  const handleCreateSession = async () => {
    setActiveMainTab('chat');
    setSessionSwitcherOpen(false);
    openNewSessionDraft();
    handleClose();
  };

  const handleOpenSession = (sessionId: string) => {
    setCurrentSession(sessionId);
    handleClose();
  };

  const handleSetThemeMode = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    handleClose();
  };

  const handleShowHelp = () => {
    setHelpDialogOpen(true);
    handleClose();
  };

  const handleCreateWorktreeSession = () => {
    handleClose();
    createWorktreeSession();
  };

  const { isMobile } = useDeviceInfo();

  const handleOpenSessionList = () => {
    if (isMobile) {
      const { isSessionSwitcherOpen } = useUIStore.getState();
      setSessionSwitcherOpen(!isSessionSwitcherOpen);
    } else {
      toggleSidebar();
    }
    handleClose();
  };

  const handleOpenDiffPanel = () => {
    setActiveMainTab('diff');
    handleClose();
  };

  const handleOpenGitPanel = () => {
    setActiveMainTab('git');
    handleClose();
  };

  const handleOpenTerminal = () => {
    setActiveMainTab('terminal');
    handleClose();
  };

  const handleOpenSettings = () => {
    setSettingsDialogOpen(true);
    handleClose();
  };

  const handleOpenSettingsPage = (slug: string) => {
    setSettingsPage(slug);
    setSettingsDialogOpen(true);
    handleClose();
  };

  const settingsRuntimeCtx = React.useMemo<SettingsRuntimeContext>(() => {
    const isDesktop = isDesktopShell();
    return { isVSCode: isVSCodeRuntime(), isWeb: !isDesktop && isWebRuntime(), isDesktop };
  }, []);

  const settingsPages = React.useMemo(() => {
    return SETTINGS_PAGE_METADATA
      .filter((p) => p.slug !== 'home')
      .filter((p) => (p.isAvailable ? p.isAvailable(settingsRuntimeCtx) : true));
  }, [settingsRuntimeCtx]);

  const settingsItems = React.useMemo(() => {
    const groupLabel = (group: string) => (SETTINGS_GROUP_LABELS as Record<string, string>)[group] ?? group;
    return settingsPages
      .slice()
      .sort((a, b) => {
        const g = groupLabel(a.group).localeCompare(groupLabel(b.group));
        if (g !== 0) return g;
        const aTitle = t(settingsPageTitleKeyBySlug[a.slug] ?? 'settings.home.title');
        const bTitle = t(settingsPageTitleKeyBySlug[b.slug] ?? 'settings.home.title');
        return aTitle.localeCompare(bTitle);
      });
  }, [settingsPages, settingsPageTitleKeyBySlug, t]);

  const getSettingsGroupLabel = React.useCallback((group: string) => {
    const keyByGroup: Record<string, string> = {
      appearance: 'settings.groups.appearance',
      projects: 'settings.groups.projects',
      general: 'settings.groups.general',
      opencode: 'settings.groups.opencode',
      git: 'settings.groups.git',
      skills: 'settings.groups.skills',
      usage: 'settings.groups.usage',
      advanced: 'settings.groups.advanced',
    };
    const key = keyByGroup[group];
    if (key) {
      return t(key);
    }
    return (SETTINGS_GROUP_LABELS as Record<string, string>)[group] ?? group;
  }, [t]);

  const getSettingsPageTitle = React.useCallback((slug: string) => {
    const key = settingsPageTitleKeyBySlug[slug] ?? 'settings.home.title';
    return t(key);
  }, [settingsPageTitleKeyBySlug, t]);

  const handleToggleRightSidebar = () => {
    toggleRightSidebar();
    handleClose();
  };

  const handleOpenRightSidebarGit = () => {
    setRightSidebarOpen(true);
    setRightSidebarTab('git');
    handleClose();
  };

  const handleOpenRightSidebarFiles = () => {
    setRightSidebarOpen(true);
    setRightSidebarTab('files');
    handleClose();
  };

  const handleToggleTerminalDock = () => {
    toggleBottomTerminal();
    handleClose();
  };

  const handleToggleTerminalExpanded = () => {
    setBottomTerminalExpanded(!isBottomTerminalExpanded);
    handleClose();
  };

  const handleOpenTimeline = () => {
    setTimelineDialogOpen(true);
    handleClose();
  };

  const directorySessions = getSessionsByDirectory(currentDirectory ?? '');
  const currentSessions = React.useMemo(() => {
    return directorySessions.slice(0, 5);
  }, [directorySessions]);

  const shortcut = React.useCallback((actionId: string) => {
    return formatShortcutForDisplay(getEffectiveShortcutCombo(actionId, shortcutOverrides));
  }, [shortcutOverrides]);

  return (
    <CommandDialog open={isCommandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder={t('commandPalette.inputPlaceholder')} />
      <CommandList>
        <CommandEmpty>{t('commandPalette.noResults')}</CommandEmpty>

        <CommandGroup heading={t('commandPalette.groups.actions')}>
          <CommandItem onSelect={handleOpenSessionList}>
            <RiLayoutLeftLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openSessionList')}</span>
            <CommandShortcut>{shortcut('toggle_sidebar')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleCreateSession}>
            <RiAddLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.newSession')}</span>
            <CommandShortcut>
              {settingsAutoCreateWorktree ? shortcut('new_chat_worktree') : shortcut('new_chat')}
            </CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleCreateWorktreeSession}>
            <RiGitBranchLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.newSessionWithWorktree')}</span>
            <CommandShortcut>
              {settingsAutoCreateWorktree ? shortcut('new_chat') : shortcut('new_chat_worktree')}
            </CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleToggleRightSidebar}>
            <RiLayoutRightLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.toggleRightSidebar')}</span>
            <CommandShortcut>{shortcut('toggle_right_sidebar')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenRightSidebarGit}>
            <RiGitBranchLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openRightSidebarGit')}</span>
            <CommandShortcut>{shortcut('open_right_sidebar_git')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenRightSidebarFiles}>
            <RiLayoutRightLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openRightSidebarFiles')}</span>
            <CommandShortcut>{shortcut('open_right_sidebar_files')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleToggleTerminalDock}>
            <RiTerminalBoxLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.toggleTerminalDock')}</span>
            <CommandShortcut>{shortcut('toggle_terminal')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleToggleTerminalExpanded}>
            <RiTerminalBoxLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.toggleTerminalExpanded')}</span>
            <CommandShortcut>{shortcut('toggle_terminal_expanded')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleShowHelp}>
            <RiQuestionLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.keyboardShortcuts')}</span>
            <CommandShortcut>{shortcut('open_help')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenDiffPanel}>
            <RiCodeLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openDiffPanel')}</span>
            <CommandShortcut>{shortcut('open_diff_panel')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenTerminal}>
            <RiTerminalBoxLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openTerminal')}</span>
            <CommandShortcut>{shortcut('open_terminal_panel')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenGitPanel}>
            <RiGitBranchLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openGitPanel')}</span>
            <CommandShortcut>{shortcut('open_git_panel')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenTimeline}>
            <RiTimeLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openTimeline')}</span>
            <CommandShortcut>{shortcut('open_timeline')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleOpenSettings}>
            <RiSettings3Line className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openSettings')}</span>
            <CommandShortcut>{shortcut('open_settings')}</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => handleOpenSettingsPage('skills.catalog')}>
            <RiSettings3Line className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.actions.openSkillsCatalog')}</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading={t('commandPalette.groups.settings')}>
          {settingsItems.map((page) => (
            <CommandItem key={page.slug} onSelect={() => handleOpenSettingsPage(page.slug)}>
              <RiSettings3Line className="mr-2 h-4 w-4" />
              <span>{getSettingsGroupLabel(page.group)}: {getSettingsPageTitle(page.slug)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t('commandPalette.groups.theme')}>
          <CommandItem onSelect={() => handleSetThemeMode('light')}>
            <RiSunLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.theme.light')}</span>
            {themeMode === 'light' && <RiCheckLine className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem onSelect={() => handleSetThemeMode('dark')}>
            <RiMoonLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.theme.dark')}</span>
            {themeMode === 'dark' && <RiCheckLine className="ml-auto h-4 w-4" />}
          </CommandItem>
          <CommandItem onSelect={() => handleSetThemeMode('system')}>
            <RiComputerLine className="mr-2 h-4 w-4" />
            <span>{t('commandPalette.theme.system')}</span>
            {themeMode === 'system' && <RiCheckLine className="ml-auto h-4 w-4" />}
          </CommandItem>
        </CommandGroup>

        {currentSessions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading={t('commandPalette.groups.recentSessions')}>
              {currentSessions.map((session) => (
                <CommandItem
                  key={session.id}
                  onSelect={() => handleOpenSession(session.id)}
                >
                  <RiChatAi3Line className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {session.title || t('commandPalette.untitledSession')}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {}
      </CommandList>
    </CommandDialog>
  );
};
