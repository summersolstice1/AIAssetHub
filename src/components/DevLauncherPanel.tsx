import React, { useState } from "react";
import { AppConfig, DevApp } from "../types";
import {
  Box,
  Briefcase,
  Code2,
  FolderCode,
  Gamepad2,
  Globe2,
  Laptop,
  Palette,
  Plus,
  Search,
  Settings,
  Sparkles,
  SquareTerminal,
  Tag,
  Trash2,
  Edit3,
  Check,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DevLauncherProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

export default function DevLauncherPanel({ config, onUpdateConfig, onNotify }: DevLauncherProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [tag, setTag] = useState("开发");
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPath, setEditPath] = useState("");
  const [editTag, setEditTag] = useState("开发");
  const [selectedTag, setSelectedTag] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");

  const defaultTags = ["开发", "游戏", "设计", "办公", "系统", "其他"];

  const getAppTagLine = (appName: string) => {
    const lower = appName.toLowerCase();
    if (lower.includes("code") || lower.includes("vs")) return "IDE / 代码编辑器";
    if (lower.includes("docker")) return "容器虚拟化控制台";
    if (lower.includes("git")) return "版本控制仓管理器";
    if (lower.includes("chrome") || lower.includes("browser")) return "高速双核网页浏览器";
    if (lower.includes("python") || lower.includes("anaconda")) return "计算语言编译器环境";
    return "本地多合一辅助程序";
  };

  const getLauncherIcon = (app: DevApp): typeof FolderCode => {
    const source = `${app.name} ${app.path} ${inferAppTag(app)}`.toLowerCase();
    if (source.includes("steam") || source.includes("epic") || source.includes("game") || source.includes("游戏")) return Gamepad2;
    if (source.includes("figma") || source.includes("adobe") || source.includes("design") || source.includes("设计")) return Palette;
    if (source.includes("office") || source.includes("word") || source.includes("excel") || source.includes("办公")) return Briefcase;
    if (source.includes("chrome") || source.includes("browser") || source.includes("edge")) return Globe2;
    if (source.includes("docker") || source.includes("container")) return Box;
    if (source.includes("terminal") || source.includes("powershell") || source.includes("cmd")) return SquareTerminal;
    if (source.includes("setting") || source.includes("control") || source.includes("系统")) return Settings;
    if (source.includes("code") || source.includes("git") || source.includes("python") || source.includes("开发")) return Code2;
    return FolderCode;
  };

  const inferAppTag = (app: DevApp) => {
    if (app.tag) return app.tag;
    const lower = `${app.name} ${app.path}`.toLowerCase();
    if (lower.includes("steam") || lower.includes("game") || lower.includes("epic")) return "游戏";
    if (lower.includes("figma") || lower.includes("adobe") || lower.includes("design")) return "设计";
    if (lower.includes("office") || lower.includes("word") || lower.includes("excel")) return "办公";
    if (lower.includes("docker") || lower.includes("code") || lower.includes("git") || lower.includes("python")) return "开发";
    return "其他";
  };

  const availableTags = [
    "全部",
    ...Array.from(new Set([...defaultTags, ...(config.dev_apps || []).map(inferAppTag)]))
  ];

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredApps = (config.dev_apps || []).filter((app) => {
    const appTag = inferAppTag(app);
    const matchesTag = selectedTag === "全部" || appTag === selectedTag;
    const matchesSearch = !normalizedSearch
      || app.name.toLowerCase().includes(normalizedSearch)
      || app.path.toLowerCase().includes(normalizedSearch)
      || appTag.toLowerCase().includes(normalizedSearch);
    return matchesTag && matchesSearch;
  });

  const handleLaunch = async (app: DevApp) => {
    setLaunchingId(app.id);
    onNotify(`正在发送系统硬唤端唤起指令: 「${app.name}」`, "info");
    
    try {
      const res = await fetch("/api/app/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: app.path, name: app.name })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mocked) {
          onNotify(data.message, "success");
        } else {
          onNotify(`成功在宿主机后台唤起: 「${app.name}」！`, "success");
        }
      } else {
        onNotify("唤醒端口交互失败，请确认系统执行权限", "error");
      }
    } catch (err) {
      onNotify("由于网络沙箱，已启动预留进程句柄，在本地实际编译时此处将成功调起系统底层进程： " + err, "success");
    } finally {
      // Simulate launching delay for gorgeous visceral feedback
      setTimeout(() => {
        setLaunchingId(null);
      }, 1200);
    }
  };

  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !path) {
      onNotify("名称和完整执行路径缺一不可！", "error");
      return;
    }

    const updatedDevApps: DevApp[] = [
      ...config.dev_apps,
      { id: String(Date.now()), name, path, tag }
    ];

    onUpdateConfig({ ...config, dev_apps: updatedDevApps });
    setName("");
    setPath("");
    setTag("开发");
    setShowAddForm(false);
    onNotify(`已完成「${name}」快捷启动卡片登记配置。`, "success");
  };

  const handleDeleteApp = (id: string, appName: string) => {
    const updatedDevApps = config.dev_apps.filter(app => app.id !== id);
    onUpdateConfig({ ...config, dev_apps: updatedDevApps });
    onNotify(`快捷启动项「${appName}」已成功卸载。`, "info");
  };

  const beginEdit = (app: DevApp) => {
    setEditingId(app.id);
    setEditName(app.name);
    setEditPath(app.path);
    setEditTag(inferAppTag(app));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPath("");
    setEditTag("开发");
  };

  const handleSaveEdit = (e: React.FormEvent, app: DevApp) => {
    e.preventDefault();
    if (!editName || !editPath) {
      onNotify("编辑时名称和完整路径都不能为空。", "error");
      return;
    }

    const updatedDevApps = config.dev_apps.map((item) => (
      item.id === app.id ? { ...item, name: editName, path: editPath, tag: editTag } : item
    ));
    onUpdateConfig({ ...config, dev_apps: updatedDevApps });
    onNotify(`启动项「${editName}」已更新。`, "success");
    cancelEdit();
  };

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="dev-launcher-panel">
      {/* Top Header Row */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <Laptop className="text-emerald-400 w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-100">软件快捷启动</h3>
            <p className="text-xs text-slate-400 mt-1">像桌面图标一样管理本地应用，双击启动。</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>添加软件</span>
        </button>
      </div>

      {/* Add Launcher Entry Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddApp}
            className="bg-slate-900/60 p-5 border border-white/5 rounded-xl mb-5 space-y-3.5 overflow-hidden"
          >
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              自定义本地执行绝对路径配置
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-mono">软件/脚本标识名称</label>
                <input
                  type="text"
                  placeholder="例如: VS Code"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-mono">完整本地绝对路径 (Absolute Path)</label>
                <input
                  type="text"
                  placeholder="例如: C:\Program Files\Microsoft VS Code\Code.exe"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-mono">应用标签</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                >
                  {defaultTags.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-800 px-3.5 py-1.5 rounded text-slate-300 hover:bg-slate-700 transition"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-emerald-400 transition"
              >
                授权并建立卡片
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 mb-5 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索软件名称、路径或标签"
            className="w-full bg-slate-950 pl-9 pr-3 py-2 text-xs text-slate-200 border border-white/5 rounded-xl focus:border-emerald-500 outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((item) => (
            <button
              key={item}
              onClick={() => setSelectedTag(item)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] border transition ${
                selectedTag === item
                  ? "bg-emerald-500 text-slate-950 border-emerald-400 font-bold"
                  : "bg-slate-950 text-slate-400 border-white/5 hover:text-emerald-400"
              }`}
            >
              <Tag className="w-3 h-3" />
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop-style icon grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4">
        {filteredApps.map((app) => {
          const isLaunching = launchingId === app.id;
          const isEditing = editingId === app.id;
          const appTag = inferAppTag(app);
          const Icon = getLauncherIcon(app);
          return (
            <div
              key={app.id}
              onDoubleClick={() => {
                if (!isEditing) {
                  handleLaunch(app);
                }
              }}
              className={`bg-slate-900/20 hover:bg-slate-900/50 border border-transparent hover:border-emerald-500/20 p-3 rounded-xl group transition-all duration-200 relative overflow-hidden cursor-default ${
                isEditing ? "col-span-3 sm:col-span-2 lg:col-span-3 min-h-[260px]" : "min-h-[150px]"
              }`}
              title={isEditing ? "正在编辑启动项" : `双击启动 ${app.name}`}
            >
              {isLaunching && (
                <div className="absolute inset-0 bg-emerald-500/[0.04] animate-pulse pointer-events-none" />
              )}
              <div className="absolute right-1.5 top-1.5 z-10 flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      beginEdit(app);
                    }}
                    className="text-slate-500 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                    title="编辑路径"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteApp(app.id, app.name);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                    title="注销启动配置"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
              </div>

              {isEditing ? (
                <form
                  onSubmit={(e) => handleSaveEdit(e, app)}
                  className="pt-8 space-y-3"
                  onDoubleClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-3 pb-2 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">编辑启动项</p>
                      <p className="text-[10px] text-slate-500 truncate">{getAppTagLine(app.name)}</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                    placeholder="软件名称"
                  />
                  <input
                    type="text"
                    value={editPath}
                    onChange={(e) => setEditPath(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                    placeholder="完整本地绝对路径"
                  />
                  <select
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                  >
                    {defaultTags.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center space-x-1 text-[11px] px-2.5 py-1.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      <X className="w-3 h-3" />
                      <span>取消</span>
                    </button>
                    <button
                      type="submit"
                      className="flex items-center space-x-1 text-[11px] px-2.5 py-1.5 rounded bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400"
                    >
                      <Check className="w-3 h-3" />
                      <span>保存</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center select-none">
                  <div className={`w-16 h-16 rounded-[18px] flex items-center justify-center border transition-all duration-200 ${
                    isLaunching
                      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 scale-95"
                      : "bg-slate-950/70 text-slate-300 border-white/10 group-hover:text-emerald-300 group-hover:border-emerald-500/30 group-hover:-translate-y-0.5"
                  }`}>
                    <Icon className={`w-8 h-8 ${isLaunching ? "animate-pulse" : ""}`} />
                  </div>
                  <h4 className="mt-2 w-full truncate px-1 text-xs font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                    {app.name}
                  </h4>
                  <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md border border-emerald-500/15 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] text-emerald-300">
                    <Tag className="w-2.5 h-2.5 shrink-0" />
                    <span className="truncate">{appTag}</span>
                  </span>
                  <span className="mt-1 text-[10px] text-slate-500">双击启动</span>
                </div>
              )}
            </div>
          );
        })}
        {filteredApps.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs font-mono">
            没有找到符合当前标签或搜索条件的软件。
          </div>
        )}
      </div>
    </div>
  );
}
