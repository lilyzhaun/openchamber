import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGitStore } from '@/stores/useGitStore';
import * as gitApi from '@/lib/gitApi';
import type { GitStatusFile } from '@/lib/api/types';

export interface FileChange {
  path: string;
  index: string;
  working_dir: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked' | 'unknown';
  insertions: number;
  deletions: number;
  isStaged: boolean;
}

function parseFileStatus(file: GitStatusFile): FileChange['status'] {
  const index = file.index;
  const workingDir = file.working_dir;
  
  if (index === '?' || workingDir === '?') return 'untracked';
  if (index === 'A' || workingDir === 'A') return 'added';
  if (index === 'D' || workingDir === 'D') return 'deleted';
  if (index === 'R' || workingDir === 'R') return 'renamed';
  if (index === 'M' || workingDir === 'M') return 'modified';
  
  return 'unknown';
}

function isFileStaged(file: GitStatusFile): boolean {
  return file.index !== ' ' && file.index !== '?' && file.index !== '!';
}

export function useFileChanges(directory: string | null) {
  const gitStore = useGitStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastRefreshRef = useRef<number>(0);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const directoryState = useMemo(() => {
    if (!directory) return null;
    return gitStore.getDirectoryState(directory);
  }, [gitStore, directory]);
  
  const status = directoryState?.status ?? null;
  
  const fileChanges = useMemo<FileChange[]>(() => {
    if (!status?.files) return [];
    
    return status.files.map((file) => {
      const diffStats = status.diffStats?.[file.path];
      return {
        path: file.path,
        index: file.index,
        working_dir: file.working_dir,
        status: parseFileStatus(file),
        insertions: diffStats?.insertions ?? 0,
        deletions: diffStats?.deletions ?? 0,
        isStaged: isFileStaged(file),
      };
    });
  }, [status]);
  
  const stagedFiles = useMemo(() => 
    fileChanges.filter(f => f.isStaged),
    [fileChanges]
  );
  
  const unstagedFiles = useMemo(() => 
    fileChanges.filter(f => !f.isStaged),
    [fileChanges]
  );
  
  const refreshChanges = useCallback(async () => {
    if (!directory) return;
    
    const now = Date.now();
    if (now - lastRefreshRef.current < 1000) return;
    lastRefreshRef.current = now;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await gitStore.fetchStatus(directory, gitApi, { silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch git status');
    } finally {
      setIsLoading(false);
    }
  }, [directory, gitStore]);
  
  const revertFile = useCallback(async (filePath: string) => {
    if (!directory) return { success: false, error: 'No directory' };
    
    try {
      await gitApi.revertGitFile(directory, filePath);
      await refreshChanges();
      return { success: true };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to revert file';
      return { success: false, error };
    }
  }, [directory, refreshChanges]);
  
  const commitAndPush = useCallback(async (
    message: string,
    options: { addAll?: boolean; files?: string[] } = {}
  ) => {
    if (!directory) return { success: false, error: 'No directory' };
    if (!message.trim()) return { success: false, error: 'Commit message required' };
    
    try {
      const commitResult = await gitApi.createGitCommit(directory, message, {
        addAll: options.addAll ?? true,
        files: options.files,
      });
      
      if (!commitResult.success) {
        return { success: false, error: 'Commit failed' };
      }
      
      const pushResult = await gitApi.gitPush(directory, {});
      
      if (!pushResult.success) {
        return { 
          success: true, 
          commit: commitResult.commit,
          pushed: false,
          error: 'Committed but push failed' 
        };
      }
      
      await refreshChanges();
      
      return { 
        success: true, 
        commit: commitResult.commit,
        pushed: true,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Commit failed';
      return { success: false, error };
    }
  }, [directory, refreshChanges]);
  
  const generateCommitMessage = useCallback(async () => {
    if (!directory) return null;
    
    const filePaths = fileChanges.map(f => f.path);
    if (filePaths.length === 0) return null;
    
    try {
      const result = await gitApi.generateCommitMessage(directory, filePaths);
      return result.message;
    } catch {
      return null;
    }
  }, [directory, fileChanges]);
  
  useEffect(() => {
    if (!directory) return;
    
    refreshChanges();
    
    refreshIntervalRef.current = setInterval(() => {
      refreshChanges();
    }, 5000);
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [directory, refreshChanges]);
  
  return {
    fileChanges,
    stagedFiles,
    unstagedFiles,
    status,
    isLoading,
    error,
    refreshChanges,
    revertFile,
    commitAndPush,
    generateCommitMessage,
    hasChanges: fileChanges.length > 0,
    hasStagedChanges: stagedFiles.length > 0,
  };
}
