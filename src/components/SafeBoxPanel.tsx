import React, { useState } from "react";
import { AppConfig, PasswordItem, PasswordsConfig } from "../types";
import { ShieldAlert, Plus, Eye, EyeOff, Copy, Trash2, KeyRound, Sparkles, CreditCard, Landmark, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SafeBoxProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

type SafeBoxCat = keyof PasswordsConfig; // "software" | "web" | "finance"

export default function SafeBoxPanel({ config, onUpdateConfig, onNotify }: SafeBoxProps) {
  const [activeTab, setActiveTab] = useState<SafeBoxCat>("software");
  const [visibleItems, setVisibleItems] = useState<{ [id: string]: boolean }>({});

  // Local Add entry form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [remark, setRemark] = useState("");

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

      {/* Quick Alert Banner */}
      <div className="bg-rose-950/20 border border-rose-500/15 rounded-xl p-3.5 mb-5.5 flex items-start space-x-3 text-xs leading-normal text-rose-200">
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-200">🔒 军工级本地单回路防卫设计</p>
          <p className="text-slate-400 text-[11px] mt-0.5 text-justify">
            本页保存的敏感凭据数据与您的 AI 个人配置，全数存于程序根目录中的 <code className="bg-rose-950/30 text-rose-300 font-mono px-1 rounded">config.json</code> 中。任何外部拦截器均无法读取内存，请安心沉淀多维账号。
          </p>
        </div>
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

      {/* Custom Tabs Navigation Header */}
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

      {/* Grid of credential Cards */}
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
                  🗒️ 备注: {item.remark || "暂无特别备注"}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
