import React, { useEffect, useState } from "react";
import { AppConfig, AIApp, APIKey, PromptItem, OnlinePromptSource } from "../types";
import { 
  Bot,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  Chrome,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe2,
  Image,
  Key,
  Link as LinkIcon,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Terminal,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type DashboardSubmodule = "aiApps" | "apiKeys" | "prompts";
type PromptWorkspaceMode = "local" | "online";

interface DashboardPanelProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

function isHttpUrl(value: string): boolean {
  try {
    const parsedUrl = new URL(value);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}

export default function DashboardPanel({ config, onUpdateConfig, onNotify }: DashboardPanelProps) {
  // Local toggle states for each API key's password visibility
  const [visibleKeys, setVisibleKeys] = useState<{ [id: string]: boolean }>({});
  // Current active category for Prompt Library
  const [activePromptCategory, setActivePromptCategory] = useState<string>("Code");
  const [activePromptMode, setActivePromptMode] = useState<PromptWorkspaceMode>("local");

  // Local Form state to add elements
  const [showAddApp, setShowAddApp] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppUrl, setNewAppUrl] = useState("");

  const [showAddKey, setShowAddKey] = useState(false);
  const [newKeyPlatform, setNewKeyPlatform] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [newKeyUrl, setNewKeyUrl] = useState("");

  const [showAddPrompt, setShowAddPrompt] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");
  const [promptTargetCategory, setPromptTargetCategory] = useState("Code");
  const [customPromptCategory, setCustomPromptCategory] = useState("");
  const [showAddOnlinePromptSource, setShowAddOnlinePromptSource] = useState(false);
  const [newPromptSourceUseCase, setNewPromptSourceUseCase] = useState("");
  const [newPromptSourceDescription, setNewPromptSourceDescription] = useState("");
  const [newPromptSourceName, setNewPromptSourceName] = useState("");
  const [newPromptSourceUrl, setNewPromptSourceUrl] = useState("");
  const [collapsedSubmodules, setCollapsedSubmodules] = useState<DashboardSubmodule[]>(["apiKeys", "prompts"]);

  useEffect(() => {
    setPromptTargetCategory(activePromptCategory);
    setCustomPromptCategory("");
  }, [activePromptCategory]);

  const promptCategories = Object.keys(config.prompts || { "Code": [], "Writing": [], "Design": [] });
  const onlinePromptSources = config.online_prompt_sources || [];
  const localPromptTotal = promptCategories.reduce((total, category) => {
    return total + (config.prompts[category]?.length || 0);
  }, 0);

  // Copy clip helper
  const handleCopy = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    onNotify(`「${title}」已安全复制到您的剪贴板。`, "success");
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Add a new AI App Nav card
  const handleAddApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName || !newAppUrl) {
      onNotify("请填写完整的应用名称与链接！", "error");
      return;
    }

    const updatedApps: AIApp[] = [
      ...config.ai_apps,
      { id: String(Date.now()), name: newAppName, url: newAppUrl }
    ];

    const updatedConfig = { ...config, ai_apps: updatedApps };
    onUpdateConfig(updatedConfig);
    setNewAppName("");
    setNewAppUrl("");
    setShowAddApp(false);
    onNotify("已加入新 AI 导航应用并完成自动同步。", "success");
  };

  // Delete an AI App
  const handleDeleteApp = (id: string, name: string) => {
    const updatedApps = config.ai_apps.filter(app => app.id !== id);
    onUpdateConfig({ ...config, ai_apps: updatedApps });
    onNotify(`应用「${name}」已成功移除。`, "info");
  };

  // Add a new API Key card
  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyPlatform || !newKeyValue) {
      onNotify("请填写平台名称和密匙密钥！", "error");
      return;
    }

    const updatedKeys: APIKey[] = [
      ...config.api_keys,
      { 
        id: String(Date.now()), 
        platform: newKeyPlatform, 
        key: newKeyValue, 
        dashboard_url: newKeyUrl || "https://platform.openai.com" 
      }
    ];

    onUpdateConfig({ ...config, api_keys: updatedKeys });
    setNewKeyPlatform("");
    setNewKeyValue("");
    setNewKeyUrl("");
    setShowAddKey(false);
    onNotify("已成功登记新的 API 凭证密匙并安全加密。", "success");
  };

  // Delete API key
  const handleDeleteKey = (id: string, platform: string) => {
    const updatedKeys = config.api_keys.filter(k => k.id !== id);
    onUpdateConfig({ ...config, api_keys: updatedKeys });
    onNotify(`API 凭证「${platform}」已完全销毁。`, "info");
  };

  // Add a new prompt to current selected category
  const handleAddPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCategory = promptTargetCategory === "__custom__"
      ? customPromptCategory.trim()
      : promptTargetCategory;

    if (!targetCategory) {
      onNotify("请先选择或填写一个 Prompt 标签。", "error");
      return;
    }

    if (!newPromptTitle || !newPromptContent) {
      onNotify("标题与 Prompt 主体内容缺一不可！", "error");
      return;
    }

    const currentCatPrompts = config.prompts[targetCategory] || [];
    const updatedCatList: PromptItem[] = [
      ...currentCatPrompts,
      { id: String(Date.now()), title: newPromptTitle, content: newPromptContent }
    ];

    const updatedPrompts = {
      ...config.prompts,
      [targetCategory]: updatedCatList
    };

    onUpdateConfig({ ...config, prompts: updatedPrompts });
    setNewPromptTitle("");
    setNewPromptContent("");
    setCustomPromptCategory("");
    setPromptTargetCategory(targetCategory);
    setActivePromptCategory(targetCategory);
    setShowAddPrompt(false);
    onNotify(`已在「${targetCategory}」标签中成功沉淀新 Prompt 模板。`, "success");
  };

  // Delete Prompt
  const handleDeletePrompt = (id: string, title: string) => {
    const currentCatPrompts = config.prompts[activePromptCategory] || [];
    const updatedCatList = currentCatPrompts.filter(p => p.id !== id);
    const updatedPrompts = {
      ...config.prompts,
      [activePromptCategory]: updatedCatList
    };
    onUpdateConfig({ ...config, prompts: updatedPrompts });
    onNotify(`Prompt 提示词「${title}」已废弃删除。`, "info");
  };

  const handleAddOnlinePromptSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const suitableUse = newPromptSourceUseCase.trim();
    const description = newPromptSourceDescription.trim();
    const name = newPromptSourceName.trim();
    const url = newPromptSourceUrl.trim();

    if (!suitableUse || !description || !name || !url) {
      onNotify("请补齐适合用途、说明、名称与链接。", "error");
      return;
    }

    if (!isHttpUrl(url)) {
      onNotify("线上资源链接需要是 http 或 https 地址。", "error");
      return;
    }

    const updatedSources: OnlinePromptSource[] = [
      ...onlinePromptSources,
      { id: String(Date.now()), suitable_use: suitableUse, description, name, url }
    ];

    onUpdateConfig({ ...config, online_prompt_sources: updatedSources });
    setNewPromptSourceUseCase("");
    setNewPromptSourceDescription("");
    setNewPromptSourceName("");
    setNewPromptSourceUrl("");
    setShowAddOnlinePromptSource(false);
    onNotify(`线上 Prompt 资源「${name}」已登记。`, "success");
  };

  const handleDeleteOnlinePromptSource = (id: string, name: string) => {
    const updatedSources = onlinePromptSources.filter((source) => source.id !== id);
    onUpdateConfig({ ...config, online_prompt_sources: updatedSources });
    onNotify(`线上 Prompt 资源「${name}」已移除。`, "info");
  };

  const isSubmoduleCollapsed = (id: DashboardSubmodule) => collapsedSubmodules.includes(id);
  const toggleSubmodule = (id: DashboardSubmodule) => {
    setCollapsedSubmodules((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const renderCollapseButton = (id: DashboardSubmodule) => {
    const collapsed = isSubmoduleCollapsed(id);
    return (
      <button
        type="button"
        onClick={() => toggleSubmodule(id)}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900/70 text-slate-300 hover:text-emerald-300 hover:bg-slate-800 border border-white/5 transition-all"
      >
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        <span>{collapsed ? "展开" : "收纳"}</span>
      </button>
    );
  };

  const getAiAppVisual = (app: AIApp): { Icon: typeof Chrome; tone: string; hint: string } => {
    const source = `${app.name} ${app.url}`.toLowerCase();
    if (source.includes("chatgpt") || source.includes("openai")) {
      return { Icon: MessageCircle, tone: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", hint: "Chat" };
    }
    if (source.includes("claude") || source.includes("anthropic")) {
      return { Icon: BrainCircuit, tone: "bg-orange-500/10 text-orange-300 border-orange-500/20", hint: "Reasoning" };
    }
    if (source.includes("gemini") || source.includes("google")) {
      return { Icon: Sparkles, tone: "bg-sky-500/10 text-sky-300 border-sky-500/20", hint: "Assistant" };
    }
    if (source.includes("deepseek")) {
      return { Icon: Bot, tone: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20", hint: "Coding" };
    }
    if (source.includes("perplexity") || source.includes("search")) {
      return { Icon: Search, tone: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20", hint: "Search" };
    }
    if (source.includes("midjourney") || source.includes("image") || source.includes("stable")) {
      return { Icon: Image, tone: "bg-pink-500/10 text-pink-300 border-pink-500/20", hint: "Image" };
    }
    return { Icon: Chrome, tone: "bg-slate-500/10 text-slate-300 border-white/10", hint: "Web" };
  };

  return (
    <div className="space-y-6" id="dashboard-panel-root">
      {/* 🗺️ Sub Module 1: AI Navigator Grid */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="navigator-submodule">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <Chrome className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-100">AI 应用工作导航</h3>
              <p className="text-xs text-slate-400 mt-1">一键呼叫常用的个人 AI 工作环境网页</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderCollapseButton("aiApps")}
            <button
              onClick={() => setShowAddApp(!showAddApp)}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>添加应用</span>
            </button>
          </div>
        </div>

        {isSubmoduleCollapsed("aiApps") ? (
          <div className="rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
            已收纳 {config.ai_apps?.length || 0} 个 AI 应用入口。
          </div>
        ) : (
        <>
        {/* Form panel to add apps */}
        <AnimatePresence>
          {showAddApp && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddApp}
              className="bg-slate-900/60 p-4 border border-white/5 rounded-xl mb-4 space-y-3 overflow-hidden"
            >
              <h4 className="text-xs font-bold text-slate-300">加入高频 AI 聚合应用</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="例如: DeepSeek, Midjourney"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="网页 URL (例如: https://chat.deepseek.com)"
                  value={newAppUrl}
                  onChange={(e) => setNewAppUrl(e.target.value)}
                  className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddApp(false)}
                  className="bg-slate-800 px-3 py-1.5 rounded text-slate-300 hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-emerald-400"
                >
                  保存添加
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Card Stream */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {config.ai_apps && config.ai_apps.map((app) => {
            const visual = getAiAppVisual(app);
            const Icon = visual.Icon;
            return (
              <div
                key={app.id}
                className="group min-h-[130px] p-3 bg-slate-900/25 rounded-xl border border-white/5 hover:border-emerald-500/25 hover:bg-slate-900/45 transition-all relative"
              >
                <a
                  href={app.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-full flex-col items-center justify-center text-center text-slate-300 hover:text-emerald-300 transition-colors"
                >
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-transform group-hover:-translate-y-0.5 ${visual.tone}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <p className="mt-2 w-full px-1 text-xs font-bold leading-normal text-slate-200 group-hover:text-emerald-300 truncate">
                    {app.name}
                  </p>
                  <span className="mt-1 text-[10px] text-slate-500 font-mono truncate">{visual.hint}</span>
                </a>

                <div className="absolute top-2 right-2 flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteApp(app.id, app.name)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                    title="移除此卡片"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-slate-500 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800"
                    title="打开链接"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>

      {/* 🔐 Sub Module 2: credentials key manager */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="apikey-submodule">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <Key className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-100">API Key 凭证资产看板</h3>
              <p className="text-xs text-slate-400 mt-1">本地安全管理 AI 服务端密钥资产，一键脱敏复制与账单跳转</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderCollapseButton("apiKeys")}
            <button
              onClick={() => setShowAddKey(!showAddKey)}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>登记 Key</span>
            </button>
          </div>
        </div>

        {isSubmoduleCollapsed("apiKeys") ? (
          <div className="rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
            已收纳 {config.api_keys?.length || 0} 条 API Key 凭证。
          </div>
        ) : (
        <>
        {/* Adding key Form */}
        <AnimatePresence>
          {showAddKey && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddKey}
              className="bg-slate-900/60 p-4 border border-white/5 rounded-xl mb-4 space-y-3 overflow-hidden"
            >
              <h4 className="text-xs font-bold text-slate-300">安全储存密钥凭证</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="平台 (例如: Anthropic)"
                  value={newKeyPlatform}
                  onChange={(e) => setNewKeyPlatform(e.target.value)}
                  className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="写入绝对 API Key (sk-...)"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="控制台账单网址 (选填)"
                  value={newKeyUrl}
                  onChange={(e) => setNewKeyUrl(e.target.value)}
                  className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddKey(false)}
                  className="bg-slate-800 px-3 py-1.5 rounded text-slate-300 hover:bg-slate-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-emerald-400"
                >
                  安全保存
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* API Keys Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 font-mono">
                <th className="py-2.5 px-3">平台类别</th>
                <th className="py-2.5 px-3">API Key 密保存储</th>
                <th className="py-2.5 px-3 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody>
              {config.api_keys && config.api_keys.map((k) => {
                const isVisible = visibleKeys[k.id] || false;
                return (
                  <tr key={k.id} className="border-b border-white/5 hover:bg-slate-900/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-200">{k.platform}</td>
                    <td className="py-3 px-3 font-mono">
                      <span className="bg-slate-950/80 px-2 py-1 rounded text-slate-300 border border-white/5 select-all inline-block max-w-[280px] sm:max-w-[450px] truncate">
                        {isVisible ? k.key : "••••••••••••••••••••••••••••••••"}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-end space-x-2.5">
                        <button
                          onClick={() => toggleKeyVisibility(k.id)}
                          className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
                          title={isVisible ? "隐藏" : "明文显示"}
                        >
                          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleCopy(k.key, k.platform + " API Key")}
                          className="text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-slate-800"
                          title="安全复制明文"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={k.dashboard_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-indigo-400 p-1 rounded hover:bg-slate-800"
                          title="跳转控制台 Billing 后台"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleDeleteKey(k.id, k.platform)}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800"
                          title="完全焚毁"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
        )}
      </div>

      {/* 📝 Sub Module 3: Prompt Repository Workspace */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="prompt-submodule">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <BookOpen className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-100">AI 提示词库</h3>
              <p className="text-xs text-slate-400 mt-1">本地模板与线上 Prompt 资源分层管理</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {renderCollapseButton("prompts")}
            <button
              onClick={() => {
                if (activePromptMode === "local") {
                  setShowAddPrompt(!showAddPrompt);
                  setShowAddOnlinePromptSource(false);
                  return;
                }

                setShowAddOnlinePromptSource(!showAddOnlinePromptSource);
                setShowAddPrompt(false);
              }}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{activePromptMode === "local" ? "沉淀 Prompt" : "登记资源"}</span>
            </button>
          </div>
        </div>

        {isSubmoduleCollapsed("prompts") ? (
          <div className="rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
            已收纳 {localPromptTotal} 条本地 Prompt，{onlinePromptSources.length} 个线上资源。
          </div>
        ) : (
        <>
        <div className="grid grid-cols-2 gap-2 bg-slate-950/40 border border-white/5 rounded-xl p-1 mb-4">
          <button
            type="button"
            onClick={() => {
              setActivePromptMode("local");
              setShowAddOnlinePromptSource(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activePromptMode === "local"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:bg-slate-900/70 hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>本地</span>
            <span className="font-mono text-[10px]">{localPromptTotal}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePromptMode("online");
              setShowAddPrompt(false);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              activePromptMode === "online"
                ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/20"
                : "text-slate-400 hover:bg-slate-900/70 hover:text-slate-200"
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>线上</span>
            <span className="font-mono text-[10px]">{onlinePromptSources.length}</span>
          </button>
        </div>

        {activePromptMode === "local" ? (
          <>
          {/* Add prompt form */}
          <AnimatePresence>
            {showAddPrompt && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddPrompt}
                className="bg-slate-900/60 p-4 border border-white/5 rounded-xl mb-4 space-y-3 overflow-hidden"
              >
                <h4 className="text-xs font-bold text-slate-300">沉淀高质量 Prompt 至指定标签</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select
                    value={promptTargetCategory}
                    onChange={(e) => setPromptTargetCategory(e.target.value)}
                    className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                  >
                    {promptCategories.map((catKey) => (
                      <option key={catKey} value={catKey}>{catKey}</option>
                    ))}
                    <option value="__custom__">+ 自定义新标签</option>
                  </select>
                  {promptTargetCategory === "__custom__" ? (
                    <input
                      type="text"
                      placeholder="输入自定义标签，例如: 面试 / 产品 / 日报"
                      value={customPromptCategory}
                      onChange={(e) => setCustomPromptCategory(e.target.value)}
                      className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                    />
                  ) : (
                    <div className="bg-slate-950/70 px-3 py-2 text-xs text-slate-400 border border-white/5 rounded font-mono">
                      当前写入标签: {promptTargetCategory}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="模板简短标题，如「精简周报润色」"
                    value={newPromptTitle}
                    onChange={(e) => setNewPromptTitle(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                  />
                  <textarea
                    placeholder="在此写入完整的 Prompt 占位模板，例如: '请作为资深软件设计者，请帮我重构以下 React 组件...'"
                    rows={4}
                    value={newPromptContent}
                    onChange={(e) => setNewPromptContent(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none resize-none"
                  />
                </div>
                <div className="flex justify-end space-x-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPrompt(false)}
                    className="bg-slate-800 px-3 py-1.5 rounded text-slate-300 hover:bg-slate-700"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-emerald-400"
                  >
                    确定沉淀
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Double-column Category Layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Category left rail */}
            <div className="md:col-span-1 space-y-1">
              <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-2 mb-2 block font-display">
                提示词大类
              </span>
              {promptCategories.map((catKey) => {
                const count = (config.prompts[catKey] || []).length;
                const isActive = catKey === activePromptCategory;
                return (
                  <button
                    key={catKey}
                    onClick={() => {
                      setActivePromptCategory(catKey);
                      setShowAddPrompt(false);
                    }}
                    className={`w-full flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl transition-all font-medium ${
                      isActive
                        ? "bg-emerald-500/10 text-emerald-300 border-l-[3px] border-emerald-500 font-semibold"
                        : "text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border-l-[3px] border-transparent"
                    }`}
                  >
                    <span className="truncate">{catKey}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-500"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* List panel on right */}
            <div className="md:col-span-3 space-y-4">
              <AnimatePresence mode="popLayout">
                {(!config.prompts[activePromptCategory] || config.prompts[activePromptCategory].length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 font-mono text-xs">
                    <Terminal className="text-slate-700 w-8 h-8 mb-2" />
                    <p>当前选中的提示词分类 [ {activePromptCategory} ] 暂无模板</p>
                    <button
                      onClick={() => setShowAddPrompt(true)}
                      className="mt-3 text-emerald-400 hover:underline"
                    >
                      一键登记首条 Prompt
                    </button>
                  </div>
                ) : (
                  config.prompts[activePromptCategory].map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="bg-slate-900/30 border border-white/5 rounded-xl p-4.5 space-y-3 group hover:border-emerald-500/25 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {p.title}
                        </span>
                        <div className="flex items-center space-x-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopy(p.content, p.title + " Prompt")}
                            className="flex items-center space-x-1 bg-slate-800 hover:bg-emerald-500/10 hover:text-emerald-300 text-[11px] px-2.5 py-1 rounded-lg text-slate-300 transition-all font-mono"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>一键复制 Prompt</span>
                          </button>
                          <button
                            onClick={() => handleDeletePrompt(p.id, p.title)}
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="bg-slate-950/70 p-3 rounded-lg border border-white/5 max-h-[160px] overflow-y-auto">
                        <p className="text-slate-400 leading-relaxed font-sans text-xs whitespace-pre-wrap select-all selection:bg-emerald-500/20">
                          {p.content}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
          </>
        ) : (
          <>
          <AnimatePresence>
            {showAddOnlinePromptSource && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddOnlinePromptSource}
                className="bg-slate-900/60 p-4 border border-white/5 rounded-xl mb-4 space-y-3 overflow-hidden"
              >
                <h4 className="text-xs font-bold text-slate-300">登记线上 Prompt 资源</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="适合用途，例如: ChatGPT 角色扮演、写作、学习、办公"
                    value={newPromptSourceUseCase}
                    onChange={(e) => setNewPromptSourceUseCase(e.target.value)}
                    className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="资源名称，例如: awesome-chatgpt-prompts"
                    value={newPromptSourceName}
                    onChange={(e) => setNewPromptSourceName(e.target.value)}
                    className="bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                  />
                </div>
                <textarea
                  placeholder="说明，例如: 经典开源提示词库，适合快速找各种让 AI 扮演某角色的 Prompt。"
                  rows={3}
                  value={newPromptSourceDescription}
                  onChange={(e) => setNewPromptSourceDescription(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none resize-none"
                />
                <input
                  type="url"
                  placeholder="链接，例如: https://github.com/awesome-chatgpt-prompts/awesome-chatgpt-prompts-github.git"
                  value={newPromptSourceUrl}
                  onChange={(e) => setNewPromptSourceUrl(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
                <div className="flex justify-end space-x-2 text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddOnlinePromptSource(false)}
                    className="bg-slate-800 px-3 py-1.5 rounded text-slate-300 hover:bg-slate-700"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-emerald-400"
                  >
                    保存资源
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {onlinePromptSources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 font-mono text-xs">
                  <Globe2 className="text-slate-700 w-8 h-8 mb-2" />
                  <p>暂无线上 Prompt 资源</p>
                  <button
                    onClick={() => setShowAddOnlinePromptSource(true)}
                    className="mt-3 text-emerald-400 hover:underline"
                  >
                    登记首个线上资源
                  </button>
                </div>
              ) : (
                onlinePromptSources.map((source) => (
                  <motion.div
                    key={source.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="bg-slate-900/30 border border-white/5 rounded-xl p-4 space-y-3 group hover:border-emerald-500/25 transition-colors"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                            {source.name}
                          </span>
                          <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
                            ONLINE
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-400">
                          {source.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 self-start opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(source.url, source.name + " 链接")}
                          className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800"
                          title="复制链接"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-800"
                          title="打开链接"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteOnlinePromptSource(source.id, source.name)}
                          className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800"
                          title="删除资源"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/70 px-2.5 py-1 text-slate-300">
                        <Globe2 className="h-3.5 w-3.5 flex-none text-emerald-400" />
                        <span className="truncate">{source.suitable_use}</span>
                      </span>
                      <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/5 bg-slate-950/70 px-2.5 py-1 text-slate-500">
                        <LinkIcon className="h-3.5 w-3.5 flex-none text-slate-500" />
                        <span className="break-all">{source.url}</span>
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}
