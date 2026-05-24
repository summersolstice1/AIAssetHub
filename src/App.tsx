import React, { useState, useEffect, useMemo } from "react";
import { AppConfig, AppModuleId } from "./types";
import DashboardPanel from "./components/DashboardPanel";
import SystemHubPanel from "./components/SystemHubPanel";
import DevLauncherPanel from "./components/DevLauncherPanel";
import SafeBoxPanel from "./components/SafeBoxPanel";
import LocalSyncPanel from "./components/LocalSyncPanel";
import DevModulePanel from "./components/DevModulePanel";
import { getEnvironmentStatus } from "./services/systemService";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  BriefcaseBusiness, Chrome, Cpu, Laptop, KeyRound, ArrowLeftRight, Clock, 
  GripVertical, Sparkles, Smile, ShieldCheck, AlertCircle, RefreshCw,
  Sun, Moon, Monitor, X, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ToastMessage {
  id: string;
  msg: string;
  type: "success" | "error" | "info";
}

type AppTab = AppModuleId;

interface NavItem {
  id: AppModuleId;
  label: string;
  icon: typeof Chrome;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "AI 看板与导航", icon: Chrome },
  { id: "system", label: "系统监控与环境", icon: Cpu },
  { id: "launcher", label: "软件快捷启动", icon: Laptop },
  { id: "safebox", label: "本地账号保险箱", icon: KeyRound },
  { id: "sync", label: "LAN 双端互传", icon: ArrowLeftRight },
  { id: "projects", label: "项目管理", icon: BriefcaseBusiness },
];

const defaultModuleOrder = navItems.map((item) => item.id);

function normalizeModuleOrder(order?: AppModuleId[]): AppModuleId[] {
  const normalized: AppModuleId[] = [];
  const seen = new Set<AppModuleId>();

  (order || []).forEach((id) => {
    if (defaultModuleOrder.includes(id) && !seen.has(id)) {
      normalized.push(id);
      seen.add(id);
    }
  });

  defaultModuleOrder.forEach((id) => {
    if (!seen.has(id)) {
      normalized.push(id);
      seen.add(id);
    }
  });

  return normalized;
}

function isAppModuleId(value: string): value is AppModuleId {
  return defaultModuleOrder.includes(value as AppModuleId);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [systemTime, setSystemTime] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showAbout, setShowAbout] = useState(false);
  const [draggedModule, setDraggedModule] = useState<AppModuleId | null>(null);
  const [dragOverModule, setDragOverModule] = useState<AppModuleId | null>(null);

  const orderedNavItems = useMemo(() => {
    const order = normalizeModuleOrder(config?.module_order);
    return order
      .map((id) => navItems.find((item) => item.id === id))
      .filter((item): item is NavItem => Boolean(item));
  }, [config?.module_order]);

  // Dynamic twinkling stars coordinates
  const starsArray = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1.2}px`,
      delay: `${Math.random() * 4.5}s`,
      duration: `${2.0 + Math.random() * 4.0}s`,
    }));
  }, []);

  // Periodically refresh dynamic UTC-relative clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString("zh-CN", { hour12: false }) + " UTC/Local");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync initial configuration from Express database handler
  const loadConfiguration = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/config");
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        triggerToast("同步后端发生错误，无法提取配置文件", "error");
      }
    } catch (err: any) {
      triggerToast("后端连通故障，开启模拟缓存模式: " + err.message, "info");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfiguration();
  }, []);

  useEffect(() => {
    getEnvironmentStatus().catch((err) => {
      console.warn("Startup environment probe failed", err);
    });
  }, []);

  // Notification Toast Manager
  const triggerToast = (msg: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Upstream dynamic updates from sub-panels onto backend database
  const handleUpdateConfig = async (newConfig: AppConfig) => {
    setConfig(newConfig);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      if (!res.ok) {
        triggerToast("主数据库配置文件修改提交失败！", "error");
      }
    } catch (err: any) {
      console.warn("Express update failure, local fallback only", err);
    }
  };

  const handleModuleDragStart = (event: React.DragEvent<HTMLDivElement>, id: AppModuleId) => {
    setDraggedModule(id);
    setDragOverModule(id);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
  };

  const handleModuleDragOver = (event: React.DragEvent<HTMLDivElement>, id: AppModuleId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDragOverModule(id);
  };

  const handleModuleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: AppModuleId) => {
    event.preventDefault();
    const rawSourceId = draggedModule || event.dataTransfer.getData("text/plain");
    setDraggedModule(null);
    setDragOverModule(null);

    if (!config || !isAppModuleId(rawSourceId) || rawSourceId === targetId) {
      return;
    }

    const currentOrder = normalizeModuleOrder(config.module_order);
    const sourceIndex = currentOrder.indexOf(rawSourceId);
    const targetIndex = currentOrder.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    const nextOrder = [...currentOrder];
    const [movedId] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(targetIndex, 0, movedId);
    handleUpdateConfig({ ...config, module_order: nextOrder });
    triggerToast("模块顺序已保存。", "success");
  };

  const handleModuleDragEnd = () => {
    setDraggedModule(null);
    setDragOverModule(null);
  };

  // Fun Windows Style Frame event reactions
  const handleMinimize = () => {
    triggerToast("窗口已收起至 Windows 全局任务栏系统托盘后台中 (模拟状态)", "info");
  };

  const handleMaximize = () => {
    triggerToast("窗口分辨率已自适应当前高分辨率显示器视口拉平 (模拟状态)", "success");
  };

  const handleClose = () => {
    triggerToast("进程锁定：当前为局域网 Express 无线同步骨干常驻进程，请不要人为终止控制台运行！", "error");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    triggerToast(`模式已切换为：${!isDarkMode ? "星空深色模式" : "日光浅色模式"}`, "success");
  };

  if (loading || !config) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#000000] text-slate-400 font-mono text-xs space-y-4">
        {/* Dynamic circular pulse loading */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 animate-spin" />
          <Cpu className="text-emerald-400 w-6 h-6 animate-pulse" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold text-slate-300 tracking-wider font-mono uppercase">AI ASSET OS BOOT LOADER</p>
          <p className="text-slate-500 text-[10px]">Loading Windows NT Kernel and checking background database rules...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
    <div className={`min-h-screen starry-universe ${isDarkMode ? "dark" : "light-theme"} text-[#e2e8f0] flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300 font-sans relative antialiased transition-all duration-500 pb-12`}>
      
      {/* 🌌 Space Twinkling Star Sparks Rendering (Only available during night mode) */}
      {isDarkMode && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {starsArray.map((star) => (
            <div
              key={star.id}
              className="star-element bg-white absolute"
              style={{
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                "--star-delay": star.delay,
                "--star-duration": star.duration,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}

      {/* 🖥️ Windows OS Main Window Shell */}
      <div className="max-w-[1400px] w-full mx-auto px-4 pt-4 sm:pt-6 flex-1 flex flex-col space-y-4 z-10 relative">
        
        {/* 🪟 Windows Signature Title Bar & Container Frame Header */}
        <header className="glass-panel rounded-t-xl flex flex-col relative overflow-visible text-slate-200 border-b-2 border-emerald-500/30" id="windows-app-shell-header">
          
          {/* Title Bar Level */}
          <div className={`px-4 py-2 flex items-center justify-between border-b ${isDarkMode ? "border-white/5 bg-slate-950/80" : "border-slate-200 bg-white/90"} transition-all duration-300`} id="win-accented-top">
            {/* Windows Left Icon and Path */}
            <div className="flex items-center space-x-2.5">
              <div className="bg-emerald-500 p-1.5 rounded-md text-slate-950">
                <Monitor className="w-4 h-4 shrink-0" />
              </div>
              <div className="flex items-center space-x-1.5 font-mono text-xs font-semibold">
                <span className={`${isDarkMode ? "text-emerald-400" : "text-emerald-600"} font-bold`}>AIAssetHub.exe</span>
                <span className="text-slate-500 italic hidden md:inline">Local Desktop Hub</span>
              </div>
            </div>

            {/* Windows 11 Signature System Action Buttons on the Right */}
            <div className="flex items-center space-x-0" id="win-controls-right">
              {/* Day/Night Theme Control Accent Button */}
              <button 
                onClick={toggleTheme}
                className={`flex items-center space-x-1.5 px-3 py-1 mr-4 rounded-md text-xs font-semibold font-mono transition-transform active:scale-95 border ${
                  isDarkMode 
                    ? "bg-slate-900/80 hover:bg-slate-800 border-white/10 text-amber-400" 
                    : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800"
                }`}
                title="一键转换系统日夜运行环境"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    <span>日光模式</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    <span>星空夜色</span>
                  </>
                )}
              </button>

              <button 
                onClick={handleMinimize}
                className="w-11 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="最小化"
              >
                <span className="text-base">─</span>
              </button>
              <button 
                onClick={handleMaximize}
                className="w-11 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="最大化"
              >
                <div className="w-3.5 h-3.5 border-2 border-slate-400 rounded-sm hover:border-white" />
              </button>
              <button 
                onClick={handleClose}
                className="w-11 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#E81123] hover:font-bold transition-colors"
                title="安全关闭"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Native classic Menu Bar Layout Level */}
          <div className={`px-4 py-1.5 flex flex-wrap items-center justify-between text-xs font-semibold gap-3 ${isDarkMode ? "bg-slate-900/40 text-slate-400" : "bg-slate-100/60 text-slate-600"}`}>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab("sync")}
                className="hover:text-emerald-400 transition cursor-pointer pr-1 text-emerald-500 font-bold"
              >
                同步
              </button>
              <button 
                onClick={loadConfiguration}
                className="hover:text-emerald-400 transition flex items-center gap-1.5 cursor-pointer pr-1"
                title="自动拉取最新持久化配置"
              >
                <RefreshCw className="w-3 h-3" />
                刷新
              </button>
              <button 
                onClick={() => setShowAbout(true)} 
                className="hover:text-emerald-400 transition cursor-pointer pr-1 flex items-center gap-1 text-emerald-400 font-bold"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                关于
              </button>
            </div>

            {/* Bottom mini status badge */}
            <div className="flex items-center space-x-3 text-xs font-mono">
              <Badge variant="outline" className="bg-emerald-500/10 px-2.5 py-0.5 rounded text-emerald-400 border-emerald-500/20 uppercase tracking-widest text-[9px] font-bold">
                Local
              </Badge>
              <div className="flex items-center space-x-2 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400 select-all">{systemTime}</span>
              </div>
            </div>
          </div>

          {/* Sub-header inside our window containing App Brand & metadata details */}
          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/10 backdrop-blur border-t border-white/5 relative">
            <div className="flex items-center space-x-4">
              <div className="bg-emerald-500/25 text-emerald-300 p-2.5 rounded-xl border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] shrink-0">
                <Sparkles className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-bold font-display text-white tracking-wide">AI & Asset Hub</h1>
                  <Badge className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded font-semibold tracking-wider uppercase border border-emerald-500/30 hover:bg-emerald-500/20">
                    MVP
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">本地优先的 AI、资产、系统与同步工作台。</p>
              </div>
            </div>

            {/* Config metadata readout */}
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 shrink-0 bg-black/40 p-2 rounded-xl border border-white/5">
              <span className="text-slate-500">用户:</span>
              <span className="text-emerald-400 font-bold max-w-[120px] truncate" title={config.user_profile?.email || "Admin User"}>
                {config.user_profile?.email || "Admin User"}
              </span>
            </div>
          </div>

        </header>

        {/* Dynamic Double-column Body section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4.5 flex-1 items-start">
          
          {/* Column Navigation Menu Bar (Tab Panel Selector) */}
          <Card className="lg:col-span-1 glass-panel p-2.5 rounded-xl border-slate-700/50">
            <div className="hidden lg:flex items-center justify-between px-2 pb-2 text-[10px] font-mono text-slate-500">
              <span>拖拽排序</span>
              <GripVertical className="w-3.5 h-3.5" />
            </div>
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible" id="centralized-navigation">
              {orderedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isDragging = draggedModule === item.id;
                const isDropTarget = dragOverModule === item.id && draggedModule !== item.id;
                return (
                  <div
                    key={item.id}
                    data-module-id={item.id}
                    draggable
                    onDragStart={(event) => handleModuleDragStart(event, item.id)}
                    onDragOver={(event) => handleModuleDragOver(event, item.id)}
                    onDrop={(event) => handleModuleDrop(event, item.id)}
                    onDragEnd={handleModuleDragEnd}
                    className={`flex-1 lg:flex-initial rounded-lg transition-all ${
                      isDragging ? "opacity-45 scale-[0.98]" : ""
                    } ${
                      isDropTarget ? "ring-1 ring-emerald-400/60 bg-emerald-500/10" : ""
                    }`}
                    title="按住拖拽可调整模块顺序"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant={isActive ? "secondary" : "ghost"}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full justify-center lg:justify-start gap-2 px-3 py-5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-grab active:cursor-grabbing ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-300 border-l-[3px] border-emerald-500 shadow-sm"
                              : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-200 border-l-[3px] border-transparent"
                          }`}
                        >
                          <GripVertical className="hidden lg:block w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-slate-300" />
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : ""} ${item.id === "system" && isActive ? "animate-spin" : ""}`} />
                          <span className="truncate">{item.label}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.label} · 拖拽可排序</TooltipContent>
                    </Tooltip>
                  </div>
                );
              })}
            </nav>
          </Card>

          {/* Column Main Content display area */}
          <main className="lg:col-span-4" id="primary-workspace">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {activeTab === "dashboard" && (
                  <DashboardPanel 
                    config={config} 
                    onUpdateConfig={handleUpdateConfig}
                    onNotify={triggerToast}
                  />
                )}
                {activeTab === "system" && (
                  <SystemHubPanel 
                    onNotify={triggerToast}
                  />
                )}
                {activeTab === "launcher" && (
                  <DevLauncherPanel 
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    onNotify={triggerToast}
                  />
                )}
                {activeTab === "safebox" && (
                  <SafeBoxPanel 
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    onNotify={triggerToast}
                  />
                )}
                {activeTab === "sync" && (
                  <LocalSyncPanel 
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    onNotify={triggerToast}
                  />
                )}
                {activeTab === "projects" && (
                  <DevModulePanel
                    config={config}
                    onUpdateConfig={handleUpdateConfig}
                    onNotify={triggerToast}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="glass-panel max-w-md border-slate-700/80 text-slate-200">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-mono text-sm text-emerald-400">
              <Monitor className="w-4 h-4" />
              关于 AI & Asset Hub
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-400 shrink-0">
                <Sparkles className="w-8 h-8 animate-pulse text-emerald-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">AI & Asset Hub MVP Enterprise</p>
                <p className="text-slate-400">版本号 22H2 build 2026.5.23 (Windows 企业版)</p>
                <p className="text-slate-400">系统拥有者：{config.user_profile?.email || "Sonwani Surbhi"}</p>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="bg-slate-900 p-3.5 rounded-lg border border-white/5 space-y-2 font-mono text-[11px] text-slate-300">
              <p className="text-slate-400">运行架构: Windows NT Kernel Client Porting Host</p>
              <p className="text-slate-400">持久化通道: express_db / config.json file system</p>
              <p className="text-slate-400">本地局域网: Mobile Gateway Sync Listener (Configured Port)</p>
              <p className="text-slate-400">安全系数: SHA-256 加密保险箱数据库</p>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              本整合系统已将所有需要的数据在当前局域网(WLAN/LAN)与主设备中持久化同步。通过顶部的模式转换系统，可在深色闪烁繁星环境与清风日光环境切换。
            </p>

            <div className="flex justify-end pt-1">
              <Button
                type="button"
                size="sm"
                onClick={() => setShowAbout(false)}
                className="bg-emerald-400 hover:bg-emerald-500 text-slate-950"
              >
                确定
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating high-fidelity Micro-Toast Notice Board queue */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full font-sans" id="toast-board">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`p-4 rounded-xl border text-xs shadow-2xl flex items-start space-x-3 backdrop-blur-md pointer-events-auto ${
                t.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
                  : t.type === "error"
                  ? "bg-rose-950/90 border-rose-500/30 text-rose-200"
                  : "bg-slate-900/90 border-white/15 text-slate-200"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {t.type === "success" && <ShieldCheck className="w-4.5 h-4.5 text-emerald-400" />}
                {t.type === "error" && <AlertCircle className="w-4.5 h-4.5 text-rose-400" />}
                {t.type === "info" && <Smile className="w-4.5 h-4.5 text-indigo-400" />}
              </div>
              <div className="flex-1">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-300 mb-0.5">
                  {t.type === "success" ? "安全提示 / Success" : t.type === "error" ? "警报提示 / Warning" : "状态提示 / Info"}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-200">{t.msg}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

    </div>
    </TooltipProvider>
  );
}
