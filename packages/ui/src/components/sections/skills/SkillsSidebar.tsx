import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui';
import { isMobileDeviceViaCSS } from '@/lib/device';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RiAddLine, RiDeleteBinLine, RiFileCopyLine, RiMore2Line, RiEditLine, RiBookOpenLine } from '@remixicon/react';
import { useSkillsStore, type DiscoveredSkill } from '@/stores/useSkillsStore';
import { cn } from '@/lib/utils';
import { ScrollableOverlay } from '@/components/ui/ScrollableOverlay';
import { SettingsProjectSelector } from '@/components/sections/shared/SettingsProjectSelector';
import { SidebarGroup } from '@/components/sections/shared/SidebarGroup';

interface SkillsSidebarProps {
  onItemSelect?: () => void;
}

export const SkillsSidebar: React.FC<SkillsSidebarProps> = ({ onItemSelect }) => {
  const [renameDialogSkill, setRenameDialogSkill] = React.useState<DiscoveredSkill | null>(null);
  const [renameNewName, setRenameNewName] = React.useState('');
  const [deleteDialogSkill, setDeleteDialogSkill] = React.useState<DiscoveredSkill | null>(null);
  const [isDeletePending, setIsDeletePending] = React.useState(false);
  const [openMenuSkill, setOpenMenuSkill] = React.useState<string | null>(null);

  const {
    selectedSkillName,
    skills,
    setSelectedSkill,
    setSkillDraft,
    createSkill,
    deleteSkill,
    getSkillDetail,
  } = useSkillsStore();

  // Skills are loaded by the Settings shell when this page is active.

  const bgClass = 'bg-background';

  const handleCreateNew = () => {
    // Generate unique name
    const baseName = 'new-skill';
    let newName = baseName;
    let counter = 1;
    while (skills.some((s) => s.name === newName)) {
      newName = `${baseName}-${counter}`;
      counter++;
    }

    // Set draft and open the page for editing
    setSkillDraft({ name: newName, scope: 'user', source: 'opencode', description: '' });
    setSelectedSkill(newName);
    onItemSelect?.();


  };

  const handleDeleteSkill = async (skill: DiscoveredSkill) => {
    setDeleteDialogSkill(skill);
  };

  const handleConfirmDeleteSkill = async () => {
    if (!deleteDialogSkill) {
      return;
    }

    setIsDeletePending(true);
    const success = await deleteSkill(deleteDialogSkill.name);
    if (success) {
      toast.success(`技能“${deleteDialogSkill.name}”已删除`);
      setDeleteDialogSkill(null);
    } else {
      toast.error('删除技能失败');
    }
    setIsDeletePending(false);
  };

  const handleDuplicateSkill = async (skill: DiscoveredSkill) => {
    const baseName = skill.name;
    let copyNumber = 1;
    let newName = `${baseName}-copy`;

    while (skills.some((s) => s.name === newName)) {
      copyNumber++;
      newName = `${baseName}-copy-${copyNumber}`;
    }

    // Get full skill detail to copy
    const detail = await getSkillDetail(skill.name);
    if (!detail) {
      toast.error('加载技能详情用于复制失败');
      return;
    }

    // Set draft with prefilled values from source skill
      setSkillDraft({
        name: newName,
        scope: skill.scope || 'user',
        source: skill.source || 'opencode',
        description: detail.sources.md.fields.includes('description') ? '' : '', // Will be populated from page
        instructions: '',
      });
    setSelectedSkill(newName);


  };

  const handleOpenRenameDialog = (skill: DiscoveredSkill) => {
    setRenameNewName(skill.name);
    setRenameDialogSkill(skill);
  };

  const handleRenameSkill = async () => {
    if (!renameDialogSkill) return;

    const sanitizedName = renameNewName.trim().replace(/\s+/g, '-').toLowerCase();

    if (!sanitizedName) {
      toast.error('技能名称不能为空');
      return;
    }

    if (sanitizedName === renameDialogSkill.name) {
      setRenameDialogSkill(null);
      return;
    }

    if (skills.some((s) => s.name === sanitizedName)) {
      toast.error('已存在同名技能');
      return;
    }

    // Get full detail to copy
    const detail = await getSkillDetail(renameDialogSkill.name);
    if (!detail) {
      toast.error('加载技能详情失败');
      setRenameDialogSkill(null);
      return;
    }

    // Create new skill with new name
    const success = await createSkill({
      name: sanitizedName,
      description: '已重命名的技能', // Will need proper description
      scope: renameDialogSkill.scope,
      source: renameDialogSkill.source,
    });

    if (success) {
      // Delete old skill
      const deleteSuccess = await deleteSkill(renameDialogSkill.name);
      if (deleteSuccess) {
        toast.success(`技能已重命名为“${sanitizedName}”`);
        setSelectedSkill(sanitizedName);
      } else {
        toast.error('重命名后删除旧技能失败');
      }
    } else {
      toast.error('重命名技能失败');
    }

    setRenameDialogSkill(null);
  };

  // Separate project and user skills
  const projectSkills = skills.filter((s) => s.scope === 'project');
  const userSkills = skills.filter((s) => s.scope === 'user');

  // Helper: group a list of skills by their domain folder
  function groupSkillsByFolder(list: DiscoveredSkill[]) {
    const groups: Record<string, DiscoveredSkill[]> = {};
    const ungrouped: DiscoveredSkill[] = [];
    for (const skill of list) {
      if (skill.group) {
        if (!groups[skill.group]) groups[skill.group] = [];
        groups[skill.group].push(skill);
      } else {
        ungrouped.push(skill);
      }
    }
    const sortedGroups = Object.keys(groups)
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        name,
        skills: [...groups[name]].sort((a, b) => a.name.localeCompare(b.name)),
      }));
    ungrouped.sort((a, b) => a.name.localeCompare(b.name));
    return { sortedGroups, ungrouped };
  }

  const groupedProjectSkills = useMemo(() => groupSkillsByFolder(projectSkills), [projectSkills]);
  const groupedUserSkills = useMemo(() => groupSkillsByFolder(userSkills), [userSkills]);

  return (
    <div className={cn('flex h-full flex-col', bgClass)}>
      <div className="border-b px-3 pt-4 pb-3">
        <h2 className="text-base font-semibold text-foreground mb-3">技能</h2>
        <SettingsProjectSelector className="mb-3" />
        <div className="flex items-center justify-between gap-2">
          <span className="typography-meta text-muted-foreground">共 {skills.length} 个</span>
          <Button size="sm"
            variant="ghost"
            className="h-7 w-7 px-0 -my-1 text-muted-foreground"
            onClick={handleCreateNew}
          >
            <RiAddLine className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollableOverlay outerClassName="flex-1 min-h-0" className="space-y-1 px-3 py-2 overflow-x-hidden">
        {skills.length === 0 ? (
          <div className="py-12 px-4 text-center text-muted-foreground">
            <RiBookOpenLine className="mx-auto mb-3 h-10 w-10 opacity-50" />
            <p className="typography-ui-label font-medium">尚未配置技能</p>
            <p className="typography-meta mt-1 opacity-75">使用上方的 + 按钮创建一个</p>
          </div>
        ) : (
          <>
            {projectSkills.length > 0 && (
              <>
                <div className="px-2 pb-1.5 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  项目技能
                </div>
                {groupedProjectSkills.sortedGroups.map(({ name: groupName, skills: groupSkills }) => (
                  <SidebarGroup
                    key={groupName}
                    label={groupName}
                    count={groupSkills.length}
                    storageKey="project-skills"
                  >
                    {groupSkills.map((skill) => (
                      <SkillListItem
                        key={skill.name}
                        skill={skill}
                        isSelected={selectedSkillName === skill.name}
                        onSelect={() => {
                          setSelectedSkill(skill.name);
                          onItemSelect?.();

                        }}
                        onRename={() => handleOpenRenameDialog(skill)}
                        onDelete={() => handleDeleteSkill(skill)}
                        onDuplicate={() => handleDuplicateSkill(skill)}
                        isMenuOpen={openMenuSkill === skill.name}
                        onMenuOpenChange={(open) => setOpenMenuSkill(open ? skill.name : null)}
                      />
                    ))}
                  </SidebarGroup>
                ))}
                {groupedProjectSkills.ungrouped.map((skill) => (
                  <SkillListItem
                    key={skill.name}
                    skill={skill}
                    isSelected={selectedSkillName === skill.name}
                    onSelect={() => {
                      setSelectedSkill(skill.name);
                      onItemSelect?.();

                    }}
                    onRename={() => handleOpenRenameDialog(skill)}
                    onDelete={() => handleDeleteSkill(skill)}
                    onDuplicate={() => handleDuplicateSkill(skill)}
                    isMenuOpen={openMenuSkill === skill.name}
                    onMenuOpenChange={(open) => setOpenMenuSkill(open ? skill.name : null)}
                  />
                ))}
              </>
            )}

            {userSkills.length > 0 && (
              <>
                <div className="px-2 pb-1.5 pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  用户技能
                </div>
                {groupedUserSkills.sortedGroups.map(({ name: groupName, skills: groupSkills }) => (
                  <SidebarGroup
                    key={groupName}
                    label={groupName}
                    count={groupSkills.length}
                    storageKey="user-skills"
                  >
                    {groupSkills.map((skill) => (
                      <SkillListItem
                        key={skill.name}
                        skill={skill}
                        isSelected={selectedSkillName === skill.name}
                        onSelect={() => {
                          setSelectedSkill(skill.name);
                          onItemSelect?.();

                        }}
                        onRename={() => handleOpenRenameDialog(skill)}
                        onDelete={() => handleDeleteSkill(skill)}
                        onDuplicate={() => handleDuplicateSkill(skill)}
                        isMenuOpen={openMenuSkill === skill.name}
                        onMenuOpenChange={(open) => setOpenMenuSkill(open ? skill.name : null)}
                      />
                    ))}
                  </SidebarGroup>
                ))}
                {groupedUserSkills.ungrouped.map((skill) => (
                  <SkillListItem
                    key={skill.name}
                    skill={skill}
                    isSelected={selectedSkillName === skill.name}
                    onSelect={() => {
                      setSelectedSkill(skill.name);
                      onItemSelect?.();

                    }}
                    onRename={() => handleOpenRenameDialog(skill)}
                    onDelete={() => handleDeleteSkill(skill)}
                    onDuplicate={() => handleDuplicateSkill(skill)}
                    isMenuOpen={openMenuSkill === skill.name}
                    onMenuOpenChange={(open) => setOpenMenuSkill(open ? skill.name : null)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </ScrollableOverlay>

      <Dialog
        open={deleteDialogSkill !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletePending) {
            setDeleteDialogSkill(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>删除技能</DialogTitle>
            <DialogDescription>
              确定要删除技能“{deleteDialogSkill?.name}”吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              size="sm"
              className="text-foreground hover:bg-interactive-hover hover:text-foreground"
              variant="ghost"
              onClick={() => setDeleteDialogSkill(null)}
              disabled={isDeletePending}
            >
               取消
            </Button>
            <Button size="sm" onClick={handleConfirmDeleteSkill} disabled={isDeletePending}>
               删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogSkill !== null} onOpenChange={(open) => !open && setRenameDialogSkill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名技能</DialogTitle>
            <DialogDescription>
              为技能“{renameDialogSkill?.name}”输入一个新名称
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameNewName}
            onChange={(e) => setRenameNewName(e.target.value)}
            placeholder="新技能名称..."
            className="text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSkill();
              }
            }}
          />
          <DialogFooter>
            <Button
              size="sm"
              className="text-foreground hover:bg-interactive-hover hover:text-foreground"
              variant="ghost"
              onClick={() => setRenameDialogSkill(null)}
            >
              取消
            </Button>
            <Button size="sm" onClick={handleRenameSkill}>
              重命名
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface SkillListItemProps {
  skill: DiscoveredSkill;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  isMenuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

const SkillListItem: React.FC<SkillListItemProps> = ({
  skill,
  isSelected,
  onSelect,
  onDelete,
  onRename,
  onDuplicate,
  isMenuOpen,
  onMenuOpenChange,
}) => {
  const isMobile = isMobileDeviceViaCSS();
  return (
    <div
      className={cn(
        'group relative flex items-center rounded-md px-1.5 py-1 transition-all duration-200 select-none',
        isSelected ? 'bg-interactive-selection' : 'hover:bg-interactive-hover'
      )}
      onContextMenu={!isMobile ? (e) => {
        e.preventDefault();
        onMenuOpenChange(true);
      } : undefined}
    >
      <div className="flex min-w-0 flex-1 items-center">
        <button
          onClick={onSelect}
          className="flex min-w-0 flex-1 flex-col gap-0 rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          tabIndex={0}
        >
          <div className="flex items-center gap-1.5">
            <span className="typography-ui-label font-normal truncate text-foreground">
              {skill.name}
            </span>
            <span className="typography-micro text-muted-foreground bg-muted px-1 rounded flex-shrink-0 leading-none pb-px border border-border/50">
              {skill.scope}
            </span>
            {skill.source === 'claude' && (
              <span className="typography-micro text-muted-foreground bg-muted px-1 rounded flex-shrink-0 leading-none pb-px border border-border/50">
                claude
              </span>
            )}
            {skill.source === 'agents' && (
              <span className="typography-micro text-muted-foreground bg-muted px-1 rounded flex-shrink-0 leading-none pb-px border border-border/50">
                agents
              </span>
            )}
          </div>
        </button>

        <DropdownMenu open={isMenuOpen} onOpenChange={onMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button size="sm"
              variant="ghost"
              className="h-6 w-6 px-0 flex-shrink-0 -mr-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            >
              <RiMore2Line className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-fit min-w-20">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
            >
              <RiEditLine className="h-4 w-4 mr-px" />
                重命名
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <RiFileCopyLine className="h-4 w-4 mr-px" />
               复制
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <RiDeleteBinLine className="h-4 w-4 mr-px" />
               删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
