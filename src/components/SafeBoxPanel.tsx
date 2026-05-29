import React, { useState } from "react";
import { AppConfig, EncryptionMethod, PasswordItem, PasswordsConfig } from "../types";
import { ShieldAlert, Plus, Eye, EyeOff, Copy, Trash2, KeyRound, Sparkles, CreditCard, Globe, Lock, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import CollapseToggle from "./CollapseToggle";

interface SafeBoxProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

type SafeBoxCat = keyof PasswordsConfig; // "software" | "web" | "finance"
type SafeBoxSubmodule = "categories" | "credentials";
const SAFEBOX_UNLOCK_PASSWORD = "123";
const SAFEBOX_UNLOCK_SESSION_KEY = "ai_asset_hub_safebox_unlocked";
const encryptionOptions: Array<{ value: EncryptionMethod; label: string; description: string }> = [
  { value: "AES-256-GCM", label: "AES-256-GCM", description: "推荐：适合本地凭据加密" },
  { value: "AES-256-CBC", label: "AES-256-CBC", description: "兼容模式，需要后端 IV 管理" },
  { value: "ChaCha20-Poly1305", label: "ChaCha20-Poly1305", description: "现代 AEAD 算法策略" },
  { value: "Local-DPAPI", label: "Windows DPAPI", description: "绑定当前 Windows 用户" }
];

export default function SafeBoxPanel({ config, onUpdateConfig, onNotify }: SafeBoxProps) {
  const [activeTab, setActiveTab] = useState<SafeBoxCat>("software");
  const [visibleItems, setVisibleItems] = useState<{ [id: string]: boolean }>({});
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem(SAFEBOX_UNLOCK_SESSION_KEY) === "true");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [collapsedSubmodules, setCollapsedSubmodules] = useState<SafeBoxSubmodule[]>([]);

  // Local Add entry form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remark, setRemark] = useState("");
  const [encryption, setEncryption] = useState<EncryptionMethod>("AES-256-GCM");
  const isSubmoduleCollapsed = (id: SafeBoxSubmodule) => collapsedSubmodules.includes(id);
  const toggleSubmodule = (id: SafeBoxSubmodule) => {
    setCollapsedSubmodules((current) => (
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    ));
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockPassword !== SAFEBOX_UNLOCK_PASSWORD) {
      setUnlockError("保险箱密码不正确。");
      onNotify("保险箱验证失败。", "error");
      return;
    }

    sessionStorage.setItem(SAFEBOX_UNLOCK_SESSION_KEY, "true");
    setIsUnlocked(true);
    setUnlockPassword("");
    setUnlockError("");
    onNotify("保险箱验证通过。", "success");
  };

  const handleCopy = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    onNotify(`「${title}」已安全解密复制到系统剪切板。`, "success");
  };

  const toggleVisibility = (id: string) => {
    setVisibleItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !account || !password) {
      onNotify("请务必填写名称、账号和独立密匙！", "error");
      return;
    }

    const currentTabCategory = config.passwords[activeTab] || [];
    const newCredential: PasswordItem = {
      id: String(Date.now()),
      name,
      account,
      password,
      encryption,
      remark: remark || "暂无特别备注"
    };

    const updatedCategoryList = [
      ...currentTabCategory,
      newCredential
    ];

    const updatedConfig = {
      ...config,
      passwords: {
        ...config.passwords,
        [activeTab]: updatedCategoryList
      }
    };

    onUpdateConfig(updatedConfig);
    setName("");
    setAccount("");
    setPassword("");
    setRemark("");
    setEncryption("AES-256-GCM");
    setShowAddForm(false);
    onNotify(`「${name}」已成功隔离归档在 [${getCategoryLabel(activeTab)}] 中。`, "success");
  };

  const handleDeleteCredential = (id: string, name: string) => {
    const currentTabCategory = config.passwords[activeTab] || [];
    const updatedCategoryList = currentTabCategory.filter(item => item.id !== id);
    
    const updatedConfig = {
      ...config,
      passwords: {
        ...config.passwords,
        [activeTab]: updatedCategoryList
      }
    };

    onUpdateConfig(updatedConfig);
    onNotify(`凭证项「${name}」已自本地完全粉碎清除。`, "info");
  };

  const getCategoryLabel = (cat: SafeBoxCat) => {
    switch(cat) {
      case "software": return "软件账号 / Token";
      case "web": return "网站登录凭证";
      case "finance": return "资产卡号 & 备忘";
    }
  };

  const renderCategoryIcon = (cat: SafeBoxCat) => {
    switch(cat) {
      case "software": return <KeyRound className="w-4 h-4 text-emerald-400" />;
      case "web": return <Globe className="w-4 h-4 text-emerald-400" />;
      case "finance": return <CreditCard className="w-4 h-4 text-emerald-400" />;
    }
  };

  const categories: SafeBoxCat[] = ["software", "web", "finance"];
  const activeCredentialCount = (config.passwords[activeTab] || []).length;

  if (!isUnlocked) {
    return (
      <div className="glass-panel p-8 rounded-2xl relative overflow-hidden" id="safe-box-auth-panel">
        <div className="max-w-md mx-auto space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
              <Lock className="w-9 h-9 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">本地账号保险箱验证</h3>
              <p className="text-xs text-slate-400 mt-1">进入保险箱前需要输入访问密码。默认密码为 123，后续可接入设置模块修改。</p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="bg-slate-900/60 border border-white/5 rounded-2xl p-5 space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">保险箱访问密码</label>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="请输入保险箱密码"
                autoFocus
                className="w-full bg-slate-950 px-3 py-2 text-sm text-slate-200 border border-white/5 rounded-lg focus:border-emerald-500 outline-none"
              />
            </div>
            {unlockError && (
              <p className="text-xs text-rose-400">{unlockError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              解锁保险箱
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden" id="safe-box-panel">
      {/* Absolute design accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />

      {/* Header Container */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4.5 mb-5.5">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
            <KeyRound className="text-emerald-400 w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-100 flex items-center gap-2">
              本地坚固保险箱 Workspace
              <span className="text-[10px] uppercase font-mono tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded">
                密保物理隔离
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              纯本地 AES-256 水平阻断存储，不上传至任何云端服务器，保障资产密码终极防泄漏。
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 transition-all self-end"
        >
          <Plus className="w-4 h-4" />
          <span>存入密码本</span>
        </button>
      </div>

      {/* Adding Credential Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddCredential}
            className="bg-slate-900/60 p-5 border border-white/5 rounded-2xl mb-5 space-y-4 overflow-hidden"
          >
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-display">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              向「{getCategoryLabel(activeTab)}」归档新凭据密钥
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-mono">凭证条目名称</label>
                <input
                  type="text"
                  placeholder="例如: GitHub / 阿里云控制台"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-mono">登录账号/卡号</label>
                <input
                  type="text"
                  placeholder="手机、邮箱或卡号"
                  required
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-mono">密码密保明文</label>
                <input
                  type="password"
                  placeholder="写入需要加密沉淀的密码"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">个性化备忘备注信息</label>
              <input
                type="text"
                placeholder="例如: 该卡主币种为USD，已开启二次独立支付验证(2FA)"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-mono">加密方式</label>
              <select
                value={encryption}
                onChange={(e) => setEncryption(e.target.value as EncryptionMethod)}
                className="w-full bg-slate-950 px-3 py-2 text-xs text-slate-200 border border-white/5 rounded focus:border-emerald-500 outline-none"
              >
                {encryptionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 text-xs pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-slate-800 px-3.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-700 transition"
              >
                取消
              </button>
              <button
                type="submit"
                className="bg-emerald-500 text-slate-950 font-bold px-4 py-1.5 rounded hover:bg-emerald-400 transition"
              >
                授权并归档存入
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-100 font-display">凭据分类标签</h4>
          <p className="text-xs text-slate-400 mt-1">按软件、网站、资产分类查看本地密码本。</p>
        </div>
        <CollapseToggle collapsed={isSubmoduleCollapsed("categories")} onToggle={() => toggleSubmodule("categories")} />
      </div>

      {/* Custom Tabs Navigation Header */}
      {isSubmoduleCollapsed("categories") ? (
        <div className="rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 text-xs text-slate-400 mb-5">
          已收纳分类标签：当前分类「{getCategoryLabel(activeTab)}」，共 {activeCredentialCount} 条凭据。
        </div>
      ) : (
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-white/5 mb-5">
          {categories.map((tab) => {
            const isActive = tab === activeTab;
            const count = (config?.passwords?.[tab] || []).length;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setShowAddForm(false);
                }}
                className={`flex-1 flex items-center justify-center space-x-2 text-xs py-2 rounded-lg font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-emerald-400 shadow-lg font-bold border border-emerald-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                }`}
              >
                {renderCategoryIcon(tab)}
                <span>{getCategoryLabel(tab)}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-900 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-100 font-display">当前分类凭据卡片</h4>
          <p className="text-xs text-slate-400 mt-1">当前分类共 {activeCredentialCount} 条，支持显示、复制和删除。</p>
        </div>
        <CollapseToggle collapsed={isSubmoduleCollapsed("credentials")} onToggle={() => toggleSubmodule("credentials")} />
      </div>

      {/* Grid of credential Cards */}
      {isSubmoduleCollapsed("credentials") ? (
        <div className="rounded-xl border border-white/5 bg-slate-900/30 px-4 py-3 text-xs text-slate-400">
          已收纳「{getCategoryLabel(activeTab)}」凭据列表，共 {activeCredentialCount} 条。
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(!config.passwords[activeTab] || config.passwords[activeTab].length === 0) ? (
          <div className="col-span-full py-12 text-slate-500 text-center flex flex-col items-center justify-center space-y-2 font-mono text-xs">
            <ShieldAlert className="w-8 h-8 text-slate-700 animate-pulse" />
            <p>在这个子保密大类「{getCategoryLabel(activeTab)}」下，您尚未存放任何密保密钥</p>
            <button onClick={() => setShowAddForm(true)} className="text-emerald-400 hover:underline">
              点我快速存放第一笔
            </button>
          </div>
        ) : (
          config.passwords[activeTab].map((item: PasswordItem) => {
            const isVisible = visibleItems[item.id] || false;
            return (
              <div
                key={item.id}
                className="bg-slate-900/30 hover:bg-slate-900/60 border border-white/5 hover:border-emerald-500/20 rounded-2xl p-4.5 space-y-3.5 group transition-all duration-300"
              >
                {/* Visual Card Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-950 p-2 rounded-xl text-slate-400 border border-white/5 group-hover:text-emerald-400 transition-colors">
                      {renderCategoryIcon(activeTab)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500 tracking-wider uppercase font-mono mt-0.5">
                        DESKTOP SECURE CARD
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteCredential(item.id, item.name)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Secure content row */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Account detail */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 space-y-0.5">
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">账号/卡号</span>
                    <span className="font-semibold text-slate-300 truncate tracking-tight flex items-center justify-between">
                      <span className="truncate select-all inline-block max-w-[120px]" title={item.account}>{item.account}</span>
                      <button
                        onClick={() => handleCopy(item.account, item.name + " 账号")}
                        className="text-slate-500 hover:text-emerald-400 transition ml-1 shrink-0"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </span>
                  </div>

                  {/* Password detail with show/hide */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5 space-y-0.5 relative">
                    <span className="text-[9px] font-mono text-zinc-500 block uppercase">密保密码</span>
                    <span className="font-mono text-slate-300 flex items-center justify-between">
                      <span className="truncate max-w-[100px] select-all font-semibold tracking-tight">
                        {isVisible ? item.password : "••••••••"}
                      </span>
                      <div className="flex items-space-x-1 shrink-0">
                        <button
                          onClick={() => toggleVisibility(item.id)}
                          className="text-slate-500 hover:text-white transition p-0.5 mr-1"
                        >
                          {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleCopy(item.password || "", item.name + " 密码")}
                          className="text-slate-500 hover:text-emerald-400 transition p-0.5"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </span>
                  </div>
                </div>

                {/* Safe Card footer remark details */}
                <div className="bg-slate-950/40 p-2 rounded-xl text-[10px] text-slate-400 font-sans border border-white/5 italic">
                  <div>备注: {item.remark || "暂无特别备注"}</div>
                  <div className="mt-1 font-mono text-emerald-400">加密策略: {item.encryption || "AES-256-GCM"}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
}
