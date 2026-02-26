import React from 'react';
import { RiGitBranchLine } from '@remixicon/react';

import { OpenChamberLogo } from '@/components/ui/OpenChamberLogo';
import { TextLoop } from '@/components/ui/TextLoop';
import { useThemeSystem } from '@/contexts/useThemeSystem';
import { useI18n } from '@/contexts/useI18n';
import { useRuntimeAPIs } from '@/hooks/useRuntimeAPIs';
import { useEffectiveDirectory } from '@/hooks/useEffectiveDirectory';
import { useGitStatus, useGitStore } from '@/stores/useGitStore';

interface ChatEmptyStateProps {
    showDraftContext?: boolean;
}

const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({
    showDraftContext = false,
}) => {
    const { t } = useI18n();
    const { currentTheme } = useThemeSystem();
    const { git } = useRuntimeAPIs();
    const effectiveDirectory = useEffectiveDirectory();
    const { setActiveDirectory, fetchStatus } = useGitStore();
    const gitStatus = useGitStatus(effectiveDirectory ?? null);

    // Use theme's muted foreground for secondary text
    const textColor = currentTheme?.colors?.surface?.mutedForeground || 'var(--muted-foreground)';
    const branchName = typeof gitStatus?.current === 'string' && gitStatus.current.trim().length > 0
        ? gitStatus.current.trim()
        : null;
    const phrases = React.useMemo(
        () => [
            t('chat.empty.fixTests'),
            t('chat.empty.refactorReadable'),
            t('chat.empty.addValidation'),
            t('chat.empty.optimizeFunction'),
            t('chat.empty.writeTests'),
            t('chat.empty.explainHow'),
            t('chat.empty.addFeature'),
            t('chat.empty.debugHelp'),
            t('chat.empty.reviewCode'),
            t('chat.empty.simplifyLogic'),
            t('chat.empty.addErrorHandling'),
            t('chat.empty.newComponent'),
            t('chat.empty.updateDocs'),
            t('chat.empty.findBug'),
            t('chat.empty.improvePerformance'),
            t('chat.empty.addTypeDefinitions'),
        ],
        [t],
    );

    React.useEffect(() => {
        if (!showDraftContext || !effectiveDirectory) {
            return;
        }

        setActiveDirectory(effectiveDirectory);

        const state = useGitStore.getState().directories.get(effectiveDirectory);
        if (!state?.status && state?.isGitRepo !== false) {
            void fetchStatus(effectiveDirectory, git, { silent: true });
        }
    }, [effectiveDirectory, fetchStatus, git, setActiveDirectory, showDraftContext]);

    return (
        <div className="flex flex-col items-center justify-center min-h-full w-full gap-6">
            <OpenChamberLogo width={140} height={140} className="opacity-20" isAnimated />
            {showDraftContext && (
                <div className="max-w-[calc(100%-2rem)] flex flex-col items-center gap-1">
                    {branchName && (
                        <div className="inline-flex items-center gap-1 text-body-md" style={{ color: textColor }}>
                            <RiGitBranchLine className="h-4 w-4 shrink-0" />
                            <span className="overflow-hidden whitespace-nowrap" title={branchName}>{branchName}</span>
                        </div>
                    )}
                </div>
            )}
            <TextLoop
                className="text-body-md"
                interval={4}
                transition={{ duration: 0.5 }}
            >
                {phrases.map((phrase) => (
                    <span key={phrase} style={{ color: textColor }}>"{phrase}…"</span>
                ))}
            </TextLoop>
        </div>
    );
};

export default React.memo(ChatEmptyState);
