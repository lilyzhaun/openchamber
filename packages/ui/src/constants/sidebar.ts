import type { IconName } from "@/components/icon/icons";

export type SidebarSection = 'sessions' | 'agents' | 'commands' | 'skills' | 'mcp' | 'providers' | 'usage' | 'git-identities' | 'settings';

export type IconComponent = IconName;

export interface SidebarSectionConfig {
    id: SidebarSection;
    label: string;
    description: string;
    icon: IconComponent;
}

export function getSidebarSectionConfig(t: (key: string) => string): SidebarSectionConfig[] {
    return [
        { id: 'sessions', label: t('sidebar.sections.sessions.label'), description: t('sidebar.sections.sessions.description'), icon: RiChatAi3Line },
        { id: 'agents', label: t('sidebar.sections.agents.label'), description: t('sidebar.sections.agents.description'), icon: RiBrainAi3Line },
        { id: 'commands', label: t('sidebar.sections.commands.label'), description: t('sidebar.sections.commands.description'), icon: RiCommandLine },
        { id: 'skills', label: t('sidebar.sections.skills.label'), description: t('sidebar.sections.skills.description'), icon: RiBookLine },
        { id: 'mcp', label: t('sidebar.sections.mcp.label'), description: t('sidebar.sections.mcp.description'), icon: RiPlugLine },
        { id: 'providers', label: t('sidebar.sections.providers.label'), description: t('sidebar.sections.providers.description'), icon: RiStackLine },
        { id: 'usage', label: t('sidebar.sections.usage.label'), description: t('sidebar.sections.usage.description'), icon: RiBarChart2Line },
        { id: 'git-identities', label: t('sidebar.sections.gitIdentities.label'), description: t('sidebar.sections.gitIdentities.description'), icon: RiGitBranchLine },
        { id: 'settings', label: t('sidebar.sections.settings.label'), description: t('sidebar.sections.settings.description'), icon: RiSettings3Line },
    ];
}

export const SIDEBAR_SECTIONS: SidebarSectionConfig[] = [
    {
        id: 'sessions',
        label: 'Sessions',
        description: 'Browse and manage chat sessions scoped to the current directory.',
        icon: "chat-ai-3",
    },
    {
        id: 'agents',
        label: 'Agents',
        description: 'Configure OpenCode agents, prompts, and permissions.',
        icon: "brain-ai-3",
    },
    {
        id: 'commands',
        label: 'Commands',
        description: 'Create and maintain custom slash commands for OpenCode.',
        icon: "command",
    },
    {
        id: 'skills',
        label: 'Skills',
        description: 'Create reusable instruction files for agents to load on-demand.',
        icon: "book",
    },
    {
        id: 'mcp',
        label: 'MCP',
        description: 'Manage Model Context Protocol servers and their configurations.',
        icon: "plug-line",
    },
    {
        id: 'providers',
        label: 'Providers',
        description: 'Configure AI model providers and API credentials.',
        icon: "stack",
    },
    {
        id: 'usage',
        label: 'Usage',
        description: 'Monitor API quota and usage across providers.',
        icon: "bar-chart-2",
    },
    {
        id: 'git-identities',
        label: 'Git Identities',
        description: 'Manage Git profiles with different credentials and SSH keys.',
        icon: "git-branch",
    },
    {
        id: 'settings',
        label: 'OpenChamber',
        description: 'OpenChamber app settings: themes, fonts, and preferences.',
        icon: "settings-3",
    },
];

const sidebarSectionLabels = {} as Record<SidebarSection, string>;
const sidebarSectionDescriptions = {} as Record<SidebarSection, string>;
const sidebarSectionConfigMap = {} as Record<SidebarSection, SidebarSectionConfig>;

SIDEBAR_SECTIONS.forEach((section) => {
    sidebarSectionLabels[section.id] = section.label;
    sidebarSectionDescriptions[section.id] = section.description;
    sidebarSectionConfigMap[section.id] = section;
});

export const SIDEBAR_SECTION_LABELS = sidebarSectionLabels;
export const SIDEBAR_SECTION_DESCRIPTIONS = sidebarSectionDescriptions;
export const SIDEBAR_SECTION_CONFIG_MAP = sidebarSectionConfigMap;
