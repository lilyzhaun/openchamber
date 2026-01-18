import React, { useState, useMemo } from 'react';
import {
  RiAddLine,
  RiSubtractLine,
  RiArrowGoBackLine,
  RiGitCommitLine,
  RiLoaderLine,
  RiSparklingLine,
  RiFileLine,
} from '@remixicon/react';
import { cn } from '@/lib/utils';
import { useFileChanges, type FileChange } from '@/hooks/useFileChanges';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface FileChangesPanelProps {
  directory: string | null;
  className?: string;
}

function getStatusColor(status: FileChange['status']): string {
  switch (status) {
    case 'added':
    case 'untracked':
      return 'text-green-500';
    case 'modified':
      return 'text-yellow-500';
    case 'deleted':
      return 'text-red-500';
    case 'renamed':
      return 'text-blue-500';
    default:
      return 'text-muted-foreground';
  }
}

function getStatusLabel(status: FileChange['status']): string {
  switch (status) {
    case 'added':
      return 'A';
    case 'untracked':
      return 'U';
    case 'modified':
      return 'M';
    case 'deleted':
      return 'D';
    case 'renamed':
      return 'R';
    default:
      return '?';
  }
}

export const FileChangesPanel: React.FC<FileChangesPanelProps> = ({
  directory,
  className,
}) => {
  const {
    fileChanges,
    isLoading,
    hasChanges,
    commitAndPush,
    revertFile,
    generateCommitMessage,
  } = useFileChanges(directory);
  
  const [commitMessage, setCommitMessage] = useState('');
  const [isCommitting, setIsCommitting] = useState(false);
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [revertingFiles, setRevertingFiles] = useState<Set<string>>(new Set());
  
  const { additions, deletions } = useMemo(() => {
    return fileChanges.reduce(
      (acc, change) => ({
        additions: acc.additions + change.insertions,
        deletions: acc.deletions + change.deletions,
      }),
      { additions: 0, deletions: 0 }
    );
  }, [fileChanges]);
  
  const handleRevert = async (filePath: string) => {
    setRevertingFiles(prev => new Set(prev).add(filePath));
    
    try {
      const result = await revertFile(filePath);
      if (result.success) {
        toast.success('File reverted');
      } else {
        toast.error(result.error ?? 'Failed to revert file');
      }
    } finally {
      setRevertingFiles(prev => {
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });
    }
  };
  
  const handleGenerateMessage = async () => {
    setIsGeneratingMessage(true);
    
    try {
      const message = await generateCommitMessage();
      if (message) {
        setCommitMessage(message.subject);
        toast.success('Commit message generated');
      } else {
        toast.error('Failed to generate message');
      }
    } finally {
      setIsGeneratingMessage(false);
    }
  };
  
  const handleCommitAndPush = async () => {
    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }
    
    setIsCommitting(true);
    
    try {
      const result = await commitAndPush(commitMessage.trim());
      
      if (result.success) {
        setCommitMessage('');
        if (result.pushed) {
          toast.success('Changes committed and pushed');
        } else {
          toast.success('Changes committed', {
            description: result.error,
          });
        }
      } else {
        toast.error(result.error ?? 'Commit failed');
      }
    } finally {
      setIsCommitting(false);
    }
  };
  
  if (!directory) {
    return (
      <div className={cn('flex h-full items-center justify-center p-4', className)}>
        <p className="text-[11px] text-muted-foreground text-center">
          Select a project to view changes
        </p>
      </div>
    );
  }
  
  if (isLoading && fileChanges.length === 0) {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <RiLoaderLine className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!hasChanges) {
    return (
      <div className={cn('flex h-full items-center justify-center p-4', className)}>
        <p className="text-[11px] text-muted-foreground text-center">
          No changes
        </p>
      </div>
    );
  }
  
  return (
    <div className={cn('flex h-full flex-col overflow-hidden', className)}>
      <div 
        className="flex items-center gap-3 border-b px-3 py-2"
        style={{ borderColor: 'var(--interactive-border)' }}
      >
        <span className="text-[11px] font-medium text-foreground">
          {fileChanges.length} file{fileChanges.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-0.5 text-green-500 font-medium">
            <RiAddLine className="h-3 w-3" />
            {additions}
          </span>
          <span className="flex items-center gap-0.5 text-red-500 font-medium">
            <RiSubtractLine className="h-3 w-3" />
            {deletions}
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {fileChanges.map((change) => {
          const isReverting = revertingFiles.has(change.path);
          const fileName = change.path.split('/').pop() ?? change.path;
          const dirPath = change.path.slice(0, change.path.length - fileName.length - 1);
          
          return (
            <div
              key={change.path}
              className="group flex items-center gap-2 border-b px-3 py-1.5 hover:bg-muted/30 transition-colors"
              style={{ borderColor: 'var(--interactive-border)' }}
            >
              <span className={cn('w-3 text-[10px] font-mono font-medium shrink-0', getStatusColor(change.status))}>
                {getStatusLabel(change.status)}
              </span>
              
              <RiFileLine className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-baseline gap-1 truncate">
                  <span className="text-[11px] font-medium text-foreground truncate">{fileName}</span>
                </div>
                {dirPath && (
                  <div className="truncate text-[10px] text-muted-foreground">
                    {dirPath}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1.5 text-[10px] shrink-0">
                {change.insertions > 0 && (
                  <span className="text-green-500 font-medium">+{change.insertions}</span>
                )}
                {change.deletions > 0 && (
                  <span className="text-red-500 font-medium">-{change.deletions}</span>
                )}
              </div>
              
              <button
                onClick={() => handleRevert(change.path)}
                disabled={isReverting}
                className={cn(
                  'opacity-0 group-hover:opacity-100 transition-opacity shrink-0',
                  'p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground',
                  isReverting && 'opacity-100'
                )}
                title="Revert changes"
              >
                {isReverting ? (
                  <RiLoaderLine className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RiArrowGoBackLine className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
      
      <div 
        className="border-t p-2 space-y-2"
        style={{ borderColor: 'var(--interactive-border)' }}
      >
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder="Commit message..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className={cn(
              'flex-1 px-2.5 py-1.5 text-[11px] rounded',
              'bg-muted/50 border',
              'focus:outline-none focus:ring-1 focus:ring-primary',
              'placeholder:text-muted-foreground'
            )}
            style={{ borderColor: 'var(--interactive-border)' }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCommitAndPush();
              }
            }}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleGenerateMessage}
            disabled={isGeneratingMessage || !hasChanges}
            title="Generate commit message with AI"
          >
            {isGeneratingMessage ? (
              <RiLoaderLine className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RiSparklingLine className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
        
        <Button
          className="w-full h-7 text-[11px]"
          onClick={handleCommitAndPush}
          disabled={isCommitting || !commitMessage.trim()}
        >
          {isCommitting ? (
            <>
              <RiLoaderLine className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Committing...
            </>
          ) : (
            <>
              <RiGitCommitLine className="mr-1.5 h-3.5 w-3.5" />
              Commit & Push
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
