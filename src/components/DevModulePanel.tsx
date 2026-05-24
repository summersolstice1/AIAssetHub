import React, { useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Check,
  ExternalLink,
  FolderGit2,
  Github,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ServerCog,
  Tag,
  Trash2,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AppConfig, ManagedProject, ManagedProjectScope, ManagedProjectStatus } from "../types";
import { getGithubRepositoryMeta } from "../services/projectService";

interface ProjectManagementPanelProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

interface ProjectFormState {
  name: string;
  scope: ManagedProjectScope;
  status: ManagedProjectStatus;
  localPath: string;
  githubUrl: string;
  environment: string;
  content: string;
  remark: string;
  tagsText: string;
}

type StatusFilter = "all" | ManagedProjectStatus;

const emptyForm = (): ProjectFormState => ({
  name: "",
  scope: "hybrid",
  status: "active",
  localPath: "",
  githubUrl: "",
  environment: "",
  content: "",
  remark: "",
  tagsText: ""
});

const statusMeta: Record<ManagedProjectStatus, { label: string; className: string }> = {
  planning: { label: "规划中", className: "border-sky-500/20 bg-sky-500/10 text-sky-300" },
  active: { label: "开发中", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" },
  paused: { label: "暂停", className: "border-amber-500/20 bg-amber-500/10 text-amber-300" },
  done: { label: "已完成", className: "border-slate-500/20 bg-slate-500/10 text-slate-300" }
};

const scopeMeta: Record<ManagedProjectScope, { label: string; className: string }> = {
  online: { label: "线上", className: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300" },
  offline: { label: "线下", className: "border-orange-500/20 bg-orange-500/10 text-orange-300" },
  hybrid: { label: "线上 + 线下", className: "border-violet-500/20 bg-violet-500/10 text-violet-300" }
};

function cleanOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function parseTags(value: string): string[] {
  return value
    .split(/[,，\s]+/)
    .map((tagName) => tagName.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function formatDate(value?: string): string {
  if (!value) return "未同步";
  return new Date(value).toLocaleString("zh-CN", { hour12: false });
}

export default function DevModulePanel({ config, onUpdateConfig, onNotify }: ProjectManagementPanelProps) {
  const projects = config.managed_projects || [];
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProjectFormState>(() => emptyForm());

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      const source = [
        project.name,
        project.scope,
        project.status,
        project.localPath,
        project.githubUrl,
        project.environment,
        project.content,
        project.remark,
        project.github?.fullName,
        project.github?.language,
        project.tags.join(" ")
      ].filter(Boolean).join(" ").toLowerCase();

      return matchesStatus && (!normalizedQuery || source.includes(normalizedQuery));
    });
  }, [projects, query, statusFilter]);

  const updateProjects = (nextProjects: ManagedProject[]) => {
    onUpdateConfig({
      ...config,
      managed_projects: nextProjects
    });
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  };

  const beginEdit = (project: ManagedProject) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      scope: project.scope,
      status: project.status,
      localPath: project.localPath || "",
      githubUrl: project.githubUrl || project.github?.url || "",
      environment: project.environment || "",
      content: project.content || "",
      remark: project.remark || "",
      tagsText: project.tags.join(", ")
    });
    setShowForm(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const projectName = form.name.trim();

    if (!projectName) {
      onNotify("请先填写项目名称。", "error");
      return;
    }

    const now = new Date().toISOString();
    const githubUrl = cleanOptional(form.githubUrl);
    const existingProject = editingId ? projects.find((project) => project.id === editingId) : undefined;
    const nextProject: ManagedProject = {
      id: existingProject?.id || String(Date.now()),
      name: projectName,
      scope: form.scope,
      status: form.status,
      localPath: cleanOptional(form.localPath),
      githubUrl,
      environment: cleanOptional(form.environment),
      content: cleanOptional(form.content),
      remark: cleanOptional(form.remark),
      tags: parseTags(form.tagsText),
      github: existingProject?.githubUrl === githubUrl ? existingProject.github : undefined,
      updatedAt: now
    };

    const nextProjects = existingProject
      ? projects.map((project) => project.id === existingProject.id ? nextProject : project)
      : [nextProject, ...projects];

    updateProjects(nextProjects);
    onNotify(existingProject ? `项目「${projectName}」已更新。` : `项目「${projectName}」已加入管理。`, "success");
    resetForm();
  };

  const handleDelete = (project: ManagedProject) => {
    updateProjects(projects.filter((item) => item.id !== project.id));
    onNotify(`项目「${project.name}」已移出项目管理。`, "info");
  };

  const handleSyncGithub = async (project: ManagedProject) => {
    const githubUrl = project.githubUrl || project.github?.url;
    if (!githubUrl) {
      onNotify("该项目还没有填写 GitHub 仓库地址。", "error");
      return;
    }

    setSyncingId(project.id);
    try {
      const github = await getGithubRepositoryMeta(githubUrl);
      updateProjects(projects.map((item) => (
        item.id === project.id
          ? { ...item, github, githubUrl: github.url, updatedAt: new Date().toISOString() }
          : item
      )));
      onNotify(`GitHub 仓库「${github.fullName}」信息已同步。`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      onNotify("GitHub 信息同步失败：" + message, "error");
    } finally {
      setSyncingId(null);
    }
  };

  const githubLinkedCount = projects.filter((project) => project.githubUrl || project.github).length;
  const localProjectCount = projects.filter((project) => project.localPath).length;
  const activeProjectCount = projects.filter((project) => project.status === "active").length;

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="project-management-panel">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="bg-violet-500/10 p-2.5 rounded-xl border border-violet-500/20">
            <BriefcaseBusiness className="text-violet-300 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-100">项目管理</h3>
            <p className="text-xs text-slate-400 mt-1">统一管理线上 GitHub 仓库与线下本地开发项目。</p>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            if (!showForm) {
              setEditingId(null);
              setForm(emptyForm());
            }
          }}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          添加项目
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4">
          <FolderGit2 className="w-4 h-4 text-violet-300 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{projects.length}</p>
          <p className="text-[11px] text-slate-500">全部项目</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4">
          <Github className="w-4 h-4 text-slate-300 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{githubLinkedCount}</p>
          <p className="text-[11px] text-slate-500">已关联 GitHub</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4">
          <MapPin className="w-4 h-4 text-orange-300 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{localProjectCount}</p>
          <p className="text-[11px] text-slate-500">本地路径项目</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-slate-900/30 p-4">
          <ServerCog className="w-4 h-4 text-emerald-300 mb-2" />
          <p className="text-2xl font-bold text-slate-100">{activeProjectCount}</p>
          <p className="text-[11px] text-slate-500">开发中</p>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-slate-900/50 border border-white/5 rounded-xl p-4 mb-5 space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                value={form.name}
                onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))}
                placeholder="项目名称"
                className="bg-slate-950/70 border-white/10 text-xs"
              />
              <select
                value={form.scope}
                onChange={(event) => setForm((value) => ({ ...value, scope: event.target.value as ManagedProjectScope }))}
                className="bg-slate-950/70 border border-white/10 rounded-md px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="hybrid">线上 + 线下</option>
                <option value="online">线上项目</option>
                <option value="offline">线下项目</option>
              </select>
              <select
                value={form.status}
                onChange={(event) => setForm((value) => ({ ...value, status: event.target.value as ManagedProjectStatus }))}
                className="bg-slate-950/70 border border-white/10 rounded-md px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="planning">规划中</option>
                <option value="active">开发中</option>
                <option value="paused">暂停</option>
                <option value="done">已完成</option>
              </select>
              <Input
                value={form.tagsText}
                onChange={(event) => setForm((value) => ({ ...value, tagsText: event.target.value }))}
                placeholder="标签，用逗号分隔"
                className="bg-slate-950/70 border-white/10 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={form.localPath}
                onChange={(event) => setForm((value) => ({ ...value, localPath: event.target.value }))}
                placeholder="本地路径，例如 C:\\Projects\\demo"
                className="bg-slate-950/70 border-white/10 text-xs"
              />
              <Input
                value={form.githubUrl}
                onChange={(event) => setForm((value) => ({ ...value, githubUrl: event.target.value }))}
                placeholder="GitHub 仓库地址，例如 https://github.com/user/repo"
                className="bg-slate-950/70 border-white/10 text-xs"
              />
            </div>

            <Input
              value={form.environment}
              onChange={(event) => setForm((value) => ({ ...value, environment: event.target.value }))}
              placeholder="开发环境，例如 Node 20 / Python 3.11 / CUDA 12.4 / Windows"
              className="bg-slate-950/70 border-white/10 text-xs"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Textarea
                value={form.content}
                onChange={(event) => setForm((value) => ({ ...value, content: event.target.value }))}
                placeholder="开发内容、当前目标、功能范围"
                className="min-h-[100px] bg-slate-950/70 border-white/10 text-xs resize-none"
              />
              <Textarea
                value={form.remark}
                onChange={(event) => setForm((value) => ({ ...value, remark: event.target.value }))}
                placeholder="备注，例如部署方式、注意事项、账号说明"
                className="min-h-[100px] bg-slate-950/70 border-white/10 text-xs resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" size="sm" onClick={resetForm} className="text-xs">
                <X className="w-3.5 h-3.5" />
                取消
              </Button>
              <Button type="submit" size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold">
                <Check className="w-3.5 h-3.5" />
                {editingId ? "保存修改" : "保存项目"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-4">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索项目、路径、GitHub、备注或标签"
            className="pl-9 bg-slate-950/70 border-white/10 text-xs"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <TabsList className="bg-slate-950/60 border border-white/5">
            <TabsTrigger value="all" className="text-xs">全部</TabsTrigger>
            <TabsTrigger value="planning" className="text-xs">规划中</TabsTrigger>
            <TabsTrigger value="active" className="text-xs">开发中</TabsTrigger>
            <TabsTrigger value="paused" className="text-xs">暂停</TabsTrigger>
            <TabsTrigger value="done" className="text-xs">已完成</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {filteredProjects.map((project) => {
            const githubUrl = project.githubUrl || project.github?.url;
            const syncing = syncingId === project.id;
            return (
              <Card key={project.id} className="glass-panel rounded-xl border-white/5 p-0">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-sm text-slate-100 truncate">{project.name}</CardTitle>
                      <p className="text-[11px] text-slate-500 mt-1">更新时间: {formatDate(project.updatedAt)}</p>
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Badge variant="outline" className={`rounded-md text-[10px] ${scopeMeta[project.scope].className}`}>
                        {scopeMeta[project.scope].label}
                      </Badge>
                      <Badge variant="outline" className={`rounded-md text-[10px] ${statusMeta[project.status].className}`}>
                        {statusMeta[project.status].label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3">
                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map((tagName) => (
                        <span key={tagName} className="inline-flex items-center gap-1 rounded-md border border-white/5 bg-slate-950/50 px-2 py-1 text-[10px] text-slate-400">
                          <Tag className="w-3 h-3" />
                          {tagName}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-white/5 bg-slate-950/45 p-3 min-w-0">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">Local Path</p>
                      <p className="font-mono text-slate-300 truncate">{project.localPath || "未填写"}</p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-slate-950/45 p-3 min-w-0">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">GitHub</p>
                      <p className="font-mono text-slate-300 truncate">{project.github?.fullName || githubUrl || "未关联"}</p>
                    </div>
                  </div>

                  {project.environment && (
                    <div className="rounded-lg border border-white/5 bg-slate-950/45 p-3">
                      <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">开发环境</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{project.environment}</p>
                    </div>
                  )}

                  {(project.content || project.remark) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="rounded-lg border border-white/5 bg-slate-950/45 p-3">
                        <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">开发内容</p>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{project.content || "未填写"}</p>
                      </div>
                      <div className="rounded-lg border border-white/5 bg-slate-950/45 p-3">
                        <p className="text-[10px] text-slate-500 font-mono uppercase mb-1">备注</p>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{project.remark || "未填写"}</p>
                      </div>
                    </div>
                  )}

                  {project.github && (
                    <div className="rounded-lg border border-emerald-500/10 bg-emerald-500/5 p-3 text-xs">
                      <div className="flex flex-wrap items-center gap-3 text-slate-300">
                        <span className="font-semibold text-emerald-300">{project.github.language}</span>
                        <span>Stars {project.github.stars}</span>
                        <span>Forks {project.github.forks}</span>
                        <span>Issues {project.github.openIssues}</span>
                        <span>Branch {project.github.defaultBranch}</span>
                      </div>
                      {project.github.description && (
                        <p className="mt-2 text-slate-400 leading-relaxed">{project.github.description}</p>
                      )}
                      <p className="mt-2 text-[10px] text-slate-500 font-mono">GitHub 更新: {formatDate(project.github.updatedAt)}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2 pt-1">
                    {githubUrl && (
                      <a
                        href={githubUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 rounded-md border border-white/10 px-3 py-2 text-xs text-slate-300 hover:text-emerald-300 hover:bg-slate-900/60 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        打开 GitHub
                      </a>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSyncGithub(project)}
                      disabled={syncing}
                      className="text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                      同步 GitHub
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => beginEdit(project)} className="text-xs">
                      <Pencil className="w-3.5 h-3.5" />
                      编辑
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(project)} className="text-xs text-rose-300 hover:text-rose-200">
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 text-center text-slate-500 text-xs">
          <BriefcaseBusiness className="w-9 h-9 mb-3 text-slate-600" />
          <p>还没有项目，或当前筛选条件下没有匹配结果。</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-emerald-400 hover:underline">
            添加第一个项目
          </button>
        </div>
      )}
    </div>
  );
}
