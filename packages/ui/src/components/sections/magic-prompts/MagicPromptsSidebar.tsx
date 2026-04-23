import React from 'react';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { useI18n } from '@/contexts/useI18n';
import { useMagicPromptsStore } from '@/stores/useMagicPromptsStore';
import { cn } from '@/lib/utils';

interface MagicPromptsSidebarProps {
  onItemSelect?: () => void;
}

export const MagicPromptsSidebar: React.FC<MagicPromptsSidebarProps> = ({ onItemSelect }) => {
  const { t } = useI18n();
  const selectedPromptId = useMagicPromptsStore((state) => state.selectedPromptId);
  const setSelectedPromptId = useMagicPromptsStore((state) => state.setSelectedPromptId);

  const grouped = React.useMemo(() => {
    return [
      {
        group: t('settings.magicPromptsSidebar.group.git'),
        items: [
          { id: 'git.commit.generate', title: t('settings.magicPrompts.prompt.commitGeneration.title') },
          { id: 'git.pr.generate', title: t('settings.magicPrompts.prompt.prGeneration.title') },
          { id: 'git.conflict.resolve', title: t('settings.magicPrompts.prompt.conflictResolution.title') },
          { id: 'git.integrate.cherrypick.resolve', title: t('settings.magicPrompts.prompt.cherryPickConflictResolution.title') },
        ],
      },
      {
        group: t('settings.magicPromptsSidebar.group.github'),
        items: [
          { id: 'github.pr.review', title: t('settings.magicPrompts.prompt.prReview.title') },
          { id: 'github.issue.review', title: t('settings.magicPrompts.prompt.issueReview.title') },
          { id: 'github.pr.checks.review', title: t('settings.magicPrompts.prompt.prFailedChecksReview.title') },
          { id: 'github.pr.comments.review', title: t('settings.magicPrompts.prompt.prCommentsReview.title') },
          { id: 'github.pr.comment.single', title: t('settings.magicPrompts.prompt.singlePrCommentReview.title') },
        ],
      },
      {
        group: t('settings.magicPromptsSidebar.group.planning'),
        items: [
          { id: 'plan.todo', title: t('settings.magicPrompts.prompt.todoPlanning.title') },
          { id: 'plan.improve', title: t('settings.magicPrompts.prompt.improvePlan.title') },
          { id: 'plan.implement', title: t('settings.magicPrompts.prompt.implementPlan.title') },
        ],
      },
      {
        group: 'Session',
        items: [
          { id: 'session.summary', title: 'Session Summary' },
          { id: 'session.review', title: 'Workspace Review' },
        ],
      },
    ] as const;
  }, [t]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b px-3 pt-4 pb-3">
        <h2 className="text-base font-semibold text-foreground">{t('settings.magicPromptsSidebar.title')}</h2>
        <p className="typography-meta mt-1 text-muted-foreground">{t('settings.magicPromptsSidebar.description')}</p>
      </div>

      <ScrollableOverlay outerClassName="flex-1 min-h-0" className="space-y-3 px-3 py-2 overflow-x-hidden">
        {grouped.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="typography-micro px-1 text-muted-foreground">{group.group}</div>
            {group.items.map((item) => {
              const selected = selectedPromptId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedPromptId(item.id);
                    onItemSelect?.();
                  }}
                  className={cn(
                    'flex w-full items-center rounded-md px-2 py-1.5 text-left transition-colors',
                    selected ? 'bg-interactive-selection text-foreground' : 'text-foreground hover:bg-interactive-hover'
                  )}
                >
                  <span className="typography-ui-label truncate font-normal">{item.title}</span>
                </button>
              );
            })}
          </div>
        ))}
      </ScrollableOverlay>
    </div>
  );
};
