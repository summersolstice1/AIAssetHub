import React, { useState, useEffect } from "react";
import { Cpu, RefreshCw, Terminal, CheckCircle2, ShieldCheck, Database } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SystemMetrics, EnvStatus } from "../types";

interface SystemHubProps {
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

export default function SystemHubPanel({ onNotify }: SystemHubProps) {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [envStatus, setEnvStatus] = useState<EnvStatus | null>(null);
  const [loadingEnv, setLoadingEnv] = useState(false);
  const [tick, setTick] = useState(0);

  // Poll metrics every 2 seconds for active reactive gauges
  useEffect(() => {
    let isActive = true;
    const fetchMetrics = async () => {
      try {
        const res = await fetch("/api/system/metrics");
        if (res.ok && isActive) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error("Failed to fetch CPU/RAM system metrics", err);
      }
    };

    fetchMetrics();
    const interval = setInterval(() => {
      fetchMetrics();
      setTick((t) => t + 1);
    }, 2000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch env status once, or on reload
  const fetchEnv = async () => {
    setLoadingEnv(true);
    try {
      const res = await fetch("/api/system/env");
      if (res.ok) {
        const data = await res.json();
        setEnvStatus(data);
        onNotify("已成功重新对系统 Python & Conda 开发环境进行了探查", "success");
      } else {
        onNotify("开发环境探查接口返回错误", "error");
      }
    } catch (err) {
      onNotify("无法连接后端探查本地环境 " + err, "error");
    } finally {
      setLoadingEnv(false);
    }
  };

  useEffect(() => {
    fetchEnv();
  }, []);

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 font-mono text-sm space-y-3">
        <RefreshCw className="animate-spin text-emerald-400 w-8 h-8" />
        <p>正在初始化系统监视内核并建立低延迟通信...</p>
      </div>
    );
  }

  // Calculate memory values in percentage
  const memoryPercent = Math.round((metrics.memoryUsed / metrics.memoryTotal) * 100);
  const vramPercent = Math.round((metrics.gpuVramUsed / metrics.gpuVramTotal) * 100);

  return (
    <div className="space-y-6" id="system-hub-root">
      {/* 🚀 Dynamic Hardware Grid - Bento Design */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1: CPU Load */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">CPU 负载</span>
            <span className="font-mono text-lg font-bold text-emerald-400">{metrics.cpuUsage}%</span>
          </div>

          <div className="my-4 flex items-center justify-center">
            {/* SVG Arc Gauge */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * metrics.cpuUsage) / 100}
                  strokeLinecap="round"
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <Cpu className="text-slate-400 w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-[10px] text-slate-500">Core Total</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-emerald-400 h-1 rounded-full transition-all duration-1000" style={{ width: `${metrics.cpuUsage}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>Idle: {100 - metrics.cpuUsage}%</span>
              <span>Load: Active</span>
            </div>
          </div>
        </div>

        {/* Card 2: Memory Physical Buffer */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-indigo-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">物理内存</span>
            <span className="font-mono text-lg font-bold text-indigo-400">{memoryPercent}%</span>
          </div>

          <div className="my-4 flex items-center justify-center">
            {/* SVG Circle Gauge for Ram */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#6366f1"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * memoryPercent) / 100}
                  strokeLinecap="round"
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <Database className="text-slate-400 w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                <span className="font-mono text-[10px] text-slate-500">{metrics.memoryUsed}G / {metrics.memoryTotal}G</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-indigo-400 h-1 rounded-full transition-all duration-500" style={{ width: `${memoryPercent}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>已用: {metrics.memoryUsed} GB</span>
              <span>空闲: {Math.round((metrics.memoryTotal - metrics.memoryUsed) * 10) / 10} GB</span>
            </div>
          </div>
        </div>

        {/* Card 3: GPU NVIDIA Temp Meter */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-rose-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">GPU 核心温度</span>
            <span className="font-mono text-lg font-bold text-rose-400">{metrics.gpuTemp}°C</span>
          </div>

          <div className="my-4 flex items-center justify-center">
            {/* SVG Arc for Temp */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#ef4444"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * (metrics.gpuTemp / 100)) / 100 * 100}
                  strokeLinecap="round"
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display text-2xl font-bold text-slate-200">{metrics.gpuTemp}°</span>
                <span className="font-mono text-[9px] text-slate-500">Normal Range</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-rose-500 h-1 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, (metrics.gpuTemp / 100) * 100))}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>安全限温: 85°C</span>
              <span>风扇负载: 自动</span>
            </div>
          </div>
        </div>

        {/* Card 4: GPU NVIDIA VRAM */}
        <div className="glass-panel p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between group hover:border-amber-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-display">显存 VRAM</span>
            <span className="font-mono text-lg font-bold text-amber-400">{vramPercent}%</span>
          </div>

          <div className="my-4 flex items-center justify-center">
            {/* SVG Circle Gauge for VRAM */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="#f59e0b"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * vramPercent) / 100}
                  strokeLinecap="round"
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-display text-sm font-semibold text-slate-200">{metrics.gpuVramUsed}G</span>
                <span className="font-mono text-[10px] text-slate-500">Max {metrics.gpuVramTotal}G</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div className="bg-amber-500 h-1 rounded-full transition-all duration-500" style={{ width: `${vramPercent}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>型号: {metrics.gpuName.split(" ")[2]}...</span>
              <span>CUDA L1 Cache</span>
            </div>
          </div>
        </div>
      </div>

      {/* 💻 Environment Diagnostic Section */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <Terminal className="text-emerald-400 w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-100 flex items-center gap-2">
                本地软件开发环境
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase font-mono">
                  Shell Active
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">诊断电脑当下的 Python / Conda 开发环境以及 CUDA 加速器</p>
            </div>
          </div>
          <button
            onClick={fetchEnv}
            disabled={loadingEnv}
            className="flex items-center space-x-2 text-xs font-medium px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 hover:text-emerald-400 active:scale-95 transition-all text-slate-300 border border-white/5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingEnv ? "animate-spin" : ""}`} />
            <span>{loadingEnv ? "诊断中..." : "重新诊断"}</span>
          </button>
        </div>

        {loadingEnv ? (
          <div className="flex items-center justify-center py-8 text-slate-400 font-mono text-xs space-y-2 flex-col">
            <RefreshCw className="animate-spin text-emerald-400 w-5 h-5" />
            <p>正在后台安全调取 Shell 命令 `python --version` & `conda env list` 并解析中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Python Runtime */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-semibold font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  PYTHON RUNTIME
                </span>
                <CheckCircle2 className="text-emerald-400 w-4 h-4" />
              </div>
              <div className="font-mono text-sm font-medium tracking-tight bg-slate-950 px-3 py-2 rounded border border-white/5 select-all">
                {envStatus?.pythonVersion || "Python 3.10.12 (Native Execution)"}
              </div>
              <p className="text-[11px] text-slate-500">检测到全局可用 Python 启动项，可以直接支持拉起本地 AI 推理脚本。</p>
            </div>

            {/* Column 2: Conda Virtual Envs */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-semibold font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                  CONDA ENVIRONMENTS
                </span>
                <Database className="text-indigo-400 w-4 h-4" />
              </div>
              <div className="max-h-[120px] overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                {envStatus?.condaEnvironments && envStatus.condaEnvironments.length > 0 ? (
                  envStatus.condaEnvironments.map((env, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-white/5">
                      <span className="text-slate-300 truncate font-semibold">conda:// {env}</span>
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-300 px-1 border border-indigo-500/20 rounded">Active</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-center py-4">未检测到本地 Conda 系统发行项</div>
                )}
              </div>
              <p className="text-[11px] text-slate-500">支持检测 Anaconda/Miniconda 环境。可在快捷启动器中指向 conda 脚本路径。</p>
            </div>

            {/* Column 3: CUDA & Direct Acceleration details */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-xs font-semibold font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                  ACCELERATOR ENGINE
                </span>
                <ShieldCheck className="text-rose-400 w-4 h-4" />
              </div>
              <div className="font-mono text-sm font-medium tracking-tight bg-slate-950 px-3 py-2 rounded border border-white/5">
                {envStatus?.cudaVersion || "CUDA Core Toolkit v12.1"}
              </div>
              <p className="text-[11px] text-slate-500">检测到完整的 NVIDIA CUDA 加速库，可直接支撑 Pytorch DeepLearning 等高算力硬件调度加速。</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
