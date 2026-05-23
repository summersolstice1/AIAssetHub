import React, { useState } from "react";
import { AppConfig, AIApp, APIKey, PromptItem } from "../types";
import { 
  Chrome, ExternalLink, Key, Eye, EyeOff, Copy, Check, Plus, 
  Terminal, Trash2, Edit3, BookOpen, Layers, CheckCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DashboardPanelProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

export default function DashboardPanel({ config, onUpdateConfig, onNotify }: DashboardPanelProps) {
  // Local toggle states for each API key's password visibility
  const [visibleKeys, setVisibleKeys] = useState<{ [id: string]: boolean }>({});
  // Current active category for Prompt Library
  const [activePromptCategory, setActivePromptCategory] = useState<string>("Code");

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
    if (!newPromptTitle || !newPromptContent) {
      onNotify("标题与 Prompt 主体内容缺一不可！", "error");
      return;
    }

    const currentCatPrompts = config.prompts[activePromptCategory] || [];
    const updatedCatList: PromptItem[] = [
      ...currentCatPrompts,
      { id: String(Date.now()), title: newPromptTitle, content: newPromptContent }
    ];

    const updatedPrompts = {
      ...config.prompts,
      [activePromptCategory]: updatedCatList
    };

    onUpdateConfig({ ...config, prompts: updatedPrompts });
    setNewPromptTitle("");
    setNewPromptContent("");
    setShowAddPrompt(false);
    onNotify(`已在「${activePromptCategory}」分类中成功沉淀新 Prompt 模板。`, "success");
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

  const promptCategories = Object.keys(config.prompts || { "Code": [], "Writing": [], "Design": [] });

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

          <button
            onClick={() => setShowAddApp(!showAddApp)}
            className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>添加应用</span>
          </button>
        </div>

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {config.ai_apps && config.ai_apps.map((app) => (
            <div
              key={app.id}
              className="group p-4 bg-slate-900/40 rounded-xl border border-white/5 hover:border-emerald-500/30 flex items-center justify-between hover:bg-emerald-500/[0.02] transition-all relative"
            >
              <a
                href={app.url}
                target="_blank"
                rel="referrer noopener"
                className="flex items-center space-x-3 text-slate-300 hover:text-emerald-400 transition-colors flex-1"
              >
                <div className="bg-slate-850 p-2 rounded-lg text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 transition-colors">
                  <Chrome className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold leading-normal text-slate-200 group-hover:text-emerald-400 truncate">{app.name}</p>
                  <span className="text-[10px] text-slate-500 font-mono truncate hidden sm:block">网页访问</span>
                </div>
              </a>

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDeleteApp(app.id, app.name)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="移除此卡片"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <a
                  href={app.url}
                  target="_blank"
                  rel="referrer noopener"
                  className="text-slate-500 hover:text-emerald-400 p-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
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

          <button
            onClick={() => setShowAddKey(!showAddKey)}
            className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>登记 Key</span>
          </button>
        </div>

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
      </div>

      {/* 📝 Sub Module 3: Prompt Repository Workspace */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="prompt-submodule">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <BookOpen className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-100">AI 提示词沉淀工作间</h3>
              <p className="text-xs text-slate-400 mt-1">沉淀您在不同场景、职能及模式下的黄金提示词 Prompt</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddPrompt(!showAddPrompt)}
            className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>沉淀 Prompt</span>
          </button>
        </div>

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
              <h4 className="text-xs font-bold text-slate-300">沉淀高质量 Prompt 至当前分类 [{activePromptCategory}]</h4>
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
      </div>
    </div>
  );
}
