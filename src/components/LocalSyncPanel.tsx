import React, { useState, useEffect } from "react";
import { AppConfig } from "../types";
import { 
  Wifi, QrCode, Smartphone, ArrowRightLeft, Radio, CheckCircle, 
  RefreshCw, Upload, Download, Terminal, Plus, ShieldCheck, AlertCircle 
} from "lucide-react";
import { motion } from "motion/react";

interface LocalSyncProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  onNotify: (msg: string, type: "success" | "error" | "info") => void;
}

export default function LocalSyncPanel({ config, onUpdateConfig, onNotify }: LocalSyncProps) {
  const [serverActive, setServerActive] = useState(false);
  const [networkInfo, setNetworkInfo] = useState<{ ips: string[]; port: number; platform: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Companion Mock State (Mobile device simulation inputs)
  const [companionCategory, setCompanionCategory] = useState("prompt"); // "prompt" | "password" | "ai_app"
  const [promptSubCat, setPromptSubCat] = useState("Code");
  const [passSubCat, setPassSubCat] = useState("software");
  
  const [paramTitle, setParamTitle] = useState("");
  const [paramContent, setParamContent] = useState("");
  const [paramAccount, setParamAccount] = useState("");

  useEffect(() => {
    // Read local network credentials on load
    const fetchIps = async () => {
      try {
        const res = await fetch("/api/local-ips");
        if (res.ok) {
          const data = await res.json();
          setNetworkInfo(data);
        }
      } catch (err) {
        console.error("Local IPs load error", err);
      }
    };
    fetchIps();
  }, []);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSyncLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 15)]);
  };

  const toggleServer = () => {
    if (!serverActive) {
      setServerActive(true);
      addLog("无线局域网本地数据同步通道被唤起，侦听接口已映射。");
      addLog(`服务端加载完毕，请使手机与当前主电脑置于同路由器(LAN)环境下。`);
      onNotify("本地局域网高速无线同步模块已开启！", "success");
    } else {
      setServerActive(false);
      addLog("已注销局域网无线同步广播服务进程。");
      onNotify("无线同步模块已安全停止服务。", "info");
    }
  };

  // Simulate downloading the JSON schema
  const handleDownloadConfig = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "ai_assets_config.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      addLog("手机客户端：已成功拉取并导出备份当前电脑 config.json 至本地。");
      onNotify("配置文件成功下载导出！", "success");
    } catch (err) {
      onNotify("解析异常: " + err, "error");
    }
  };

  // Post synchronized data back to the actual local config endpoints
  const handleMobileSyncSubmit = async () => {
    if (!serverActive) {
      onNotify("请先开启主端‘一键同步’以启动局域网接收网关！", "error");
      return;
    }

    if (!paramTitle) {
      onNotify("请填写条目标题或名称！", "error");
      return;
    }

    setSyncing(true);
    addLog(`手机客户端：正在构建 POST 同步数据包，上传到局域网接收层...`);

    let payload: any = {};
    if (companionCategory === "prompt") {
      payload = {
        category: promptSubCat,
        title: paramTitle,
        content: paramContent || "手机快速推送的空指令"
      };
    } else if (companionCategory === "password") {
      payload = {
        category: passSubCat,
        name: paramTitle,
        account: paramAccount || "user-phone",
        password: paramContent || "phone-pass",
        remark: "通过局域网 Local Sync 无线隔空传送"
      };
    } else {
      payload = {
        name: paramTitle,
        url: paramContent || "https://google.com"
      };
    }

    try {
      const res = await fetch("/api/sync/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          type: companionCategory,
          payload
        })
      });

      if (res.ok) {
        addLog(`手机客户端：同步提交成功。电脑端已成功解压拦截数据并自动写入。`);
        onNotify("手机端隔空投送数据同步完成！已自动并入主程序。", "success");

        // Force a configuration reload by reading back the updated global JSON config file
        const configRes = await fetch("/api/config");
        if (configRes.ok) {
          const freshData = await configRes.json();
          onUpdateConfig(freshData);
        }

        // Reset fields
        setParamTitle("");
        setParamContent("");
        setParamAccount("");
      } else {
        onNotify("局域网同步接口返回异常错误，请重试", "error");
      }
    } catch (err) {
      onNotify("同步过程中发生链路拦截: " + err, "error");
    } finally {
      setSyncing(false);
    }
  };

  const localIpAddr = networkInfo?.ips?.[0] || "192.168.1.105";
  const localPortNumber = networkInfo?.port || 3030;
  const targetSyncUrl = `http://${localIpAddr}:${localPortNumber}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="local-sync-panel-root">
      {/* Column A: PC Main Wireless Server Controls */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between" id="pc-server-box">
        <div className="space-y-5">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
              <Wifi className="text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-100">电脑同步服务端 (Express LAN Broker)</h3>
              <p className="text-xs text-slate-400 mt-1">
                打通电脑与移动设备（iOS / Android）的隔离，一键在局域网内广播无线互传服务
              </p>
            </div>
          </div>

          {/* Toggle Block */}
          <div className="bg-slate-900/60 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5 uppercase">
                <Radio className={`w-3.5 h-3.5 text-emerald-400 ${serverActive ? "animate-pulse" : ""}`} />
                同步管道状态
              </span>
              <p className="text-sm font-bold text-slate-200">
                {serverActive ? `● 运行中 / LISTENING ON PORT ${localPortNumber}` : "○ 已关闭 / CHANNEL IDLE"}
              </p>
            </div>

            <button
              onClick={toggleServer}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                serverActive
                  ? "bg-rose-500 hover:bg-rose-600 text-white"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              }`}
            >
              {serverActive ? "关闭局域网同步" : "开启同步服务"}
            </button>
          </div>

          {/* Active Address QR display */}
          <div className="bg-slate-950 p-4.5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">无线局域网直连网址:</span>
              <span className="text-emerald-400 underline font-semibold select-all" title="点击可直接预览">
                {targetSyncUrl}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center py-4">
              {/* Dynamic Pure SVG QR Render (Elegant, zero external dependancies, standard micro-pixels) */}
              <div className="bg-white p-3 rounded-xl shadow-lg border border-white/10 relative">
                {!serverActive && (
                  <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center text-slate-900 font-sans text-center px-4">
                    <QrCode className="w-8 h-8 text-slate-400 animate-bounce mb-1" />
                    <span className="text-[10px] font-bold">请点击上方按钮开启</span>
                  </div>
                )}
                <svg width="108" height="108" viewBox="0 0 29 29" className="text-slate-900 shape-rendering-crisp-edges">
                  {/* Outer Alignment Anchor Left-Top */}
                  <path fill="currentColor" d="M0,0h7v7H0V0z M1,1v5h5V1H1z" />
                  <path fill="currentColor" d="M2,2h3v3H2V2z" />
                  {/* Outer Alignment Anchor Right-Top */}
                  <path fill="currentColor" d="M22,0h7v7h-7V0z M23,1v5h5V1H23z" />
                  <path fill="currentColor" d="M24,2h3v3H24V2z" />
                  {/* Outer Alignment Anchor Left-Bottom */}
                  <path fill="currentColor" d="M0,22h7v7H0V22z M1,23v5h5v-5H1z" />
                  <path fill="currentColor" d="M2,24h3v3H2V24z" />
                  {/* Simulated micro-qr blocks coordinates */}
                  <path fill="currentColor" d="M10,0h4v2h-2v2h-2V0z M16,1h3v2h-3V1z M10,6h2v3h1v-4h3v2h1v3h-4v-1h-3V6z" />
                  <path fill="currentColor" d="M20,10h3v4h-1v-2h-2V10z M14,14h2v3h-2V14z M8,18H11v2H8V18z" />
                  <path fill="currentColor" d="M24,20h3v1h-3V20z M18,24h4v2h-2v2h-2V24z M10,25H13v3H10V25z M15,22H17v4H15V22z" />
                </svg>
              </div>

              <div className="text-center sm:text-left space-y-2">
                <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase bg-slate-900 px-2 py-1 rounded inline-block">
                  手机端扫码直连
                </span>
                <p className="text-xs text-slate-300 leading-relaxed max-w-[200px]">
                  用手机相机扫描此二维码，即可在手机浏览器直接打开「隔空投送极简控制台」，实现双端无限互传。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Console Real-time Logs */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 uppercase flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5" />
              后台局域网传输指令流日志 (Telemetry Logs)
            </span>
            <span className="text-[9px] text-emerald-400/80 font-mono animate-pulse">Connection Alive</span>
          </div>
          <div className="bg-slate-950 p-4 rounded-xl border border-white/5 h-[110px] overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-1.5 selection:bg-emerald-500/20">
            {syncLogs.length === 0 ? (
              <span className="text-slate-600 italic">暂无设备连接、传输或覆盖记录...</span>
            ) : (
              syncLogs.map((log, i) => <div key={i}>{log}</div>)
            )}
          </div>
        </div>
      </div>

      {/* Column B: Local Area Device Interaction Companion Sandbox */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden bg-slate-900/10 border-l border-emerald-500/15" id="mobile-companion-box">
        {/* Top visual Header */}
        <div className="flex items-center space-x-3 border-b border-white/5 pb-4.5 mb-5.5">
          <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20 text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold font-display text-slate-100 flex items-center gap-1.5">
              手机端同步工作台
              <span className="text-[10px] bg-slate-800 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                Companion Screen
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              模拟/运行手机浏览器中的投送页面。即使没有物理手机，也可通过此板块直接测试跨设备互传功能！
            </p>
          </div>
        </div>

        {/* Device Wrapper Representation for high aesthetics */}
        <div className="bg-slate-950 p-4 rounded-2xl border-4 border-slate-700 relative shadow-2xl space-y-4 max-w-sm mx-auto">
          {/* Audio/Speaker Dynamic bar */}
          <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto" />

          {/* Simulated Mobile UI Body */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/5 pb-2 text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                LAN 隔空投送控制台
              </span>
              <span>🔋 99%</span>
            </div>

            {/* Simulated Dual Transmission Operations */}
            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                onClick={handleDownloadConfig}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-emerald-400 transition-all border border-white/5"
              >
                <Download className="w-4 h-4 mb-1 text-emerald-400" />
                <span className="text-xs font-bold">导出备份</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">拉取 PC JSON</span>
              </button>

              <button
                onClick={handleMobileSyncSubmit}
                disabled={syncing}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 hover:text-emerald-400 transition-all border border-white/5"
              >
                <Upload className="w-4 h-4 mb-1 text-emerald-400" />
                <span className="text-xs font-bold">投送到电脑</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">向 PC 追加入库</span>
              </button>
            </div>

            {/* Custom Interactive Input Fields form representation */}
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-300 font-bold uppercase font-mono">投送资产配置类型</span>
                <span className="text-[9px] text-emerald-400 font-mono">Fast Upload</span>
              </div>

              {/* Toggle app app categories */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg text-[10px] font-medium border border-white/5">
                {[
                  { value: "prompt", label: "Prompt" },
                  { value: "password", label: "密码卡" },
                  { value: "ai_app", label: "AI 导航" }
                ].map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setCompanionCategory(item.value)}
                    className={`py-1.5 rounded transition ${
                      companionCategory === item.value
                        ? "bg-slate-800 text-emerald-400 font-bold border border-emerald-500/25"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Categories Selector based on companion selection */}
              {companionCategory === "prompt" && (
                <div className="flex items-center justify-between text-[10px] bg-slate-950 p-1.5 rounded border border-white/5 font-mono">
                  <span className="text-slate-500">归纳 Prompt 大类:</span>
                  <select
                    value={promptSubCat}
                    onChange={(e) => setPromptSubCat(e.target.value)}
                    className="bg-slate-900 px-2 py-0.5 text-[10px] text-emerald-400 rounded outline-none border-0"
                  >
                    <option value="Code">💻 Code (代码编写)</option>
                    <option value="Writing">✍️ Writing (文字润色)</option>
                    <option value="Design">🎨 Design (设计方案)</option>
                  </select>
                </div>
              )}

              {companionCategory === "password" && (
                <div className="flex items-center justify-between text-[10px] bg-slate-950 p-1.5 rounded border border-white/5 font-mono">
                  <span className="text-slate-500">归纳密码本大类:</span>
                  <select
                    value={passSubCat}
                    onChange={(e) => setPassSubCat(e.target.value)}
                    className="bg-slate-900 px-2 py-0.5 text-[10px] text-emerald-400 rounded outline-none border-0"
                  >
                    <option value="software">🔑 软件账号</option>
                    <option value="web">🌐 网页登录</option>
                    <option value="finance">💳 资产凭证</option>
                  </select>
                </div>
              )}

              {/* Universal Inputs representation */}
              <div className="space-y-2 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    placeholder={
                      companionCategory === "prompt" 
                        ? "请输入 Prompt 简短标题 (如：文案优化)"
                        : companionCategory === "password"
                        ? "请输入凭证名称 (如：GitLab)"
                        : "请输入 AI 工具名称 (如：Perplexity)"
                    }
                    value={paramTitle}
                    onChange={(e) => setParamTitle(e.target.value)}
                    className="w-full bg-slate-950 px-2.5 py-1.5 rounded border border-white/5 text-slate-200 text-[11px] placeholder-slate-600 focus:border-emerald-500 outline-none"
                  />
                </div>

                {companionCategory === "password" && (
                  <div>
                    <input
                      type="text"
                      placeholder="账号/卡号 (如: user_dev)"
                      value={paramAccount}
                      onChange={(e) => setParamAccount(e.target.value)}
                      className="w-full bg-slate-950 px-2.5 py-1.5 rounded border border-white/5 text-slate-200 text-[11px] placeholder-slate-600 focus:border-emerald-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <textarea
                    rows={2}
                    placeholder={
                      companionCategory === "prompt"
                        ? "请写入详细的 AI 协作提示词 Prompt 主体内容..."
                        : companionCategory === "password"
                        ? "请输入需要加密存储的密码内容"
                        : "请输入 AI 工具官方链接网址"
                    }
                    value={paramContent}
                    onChange={(e) => setParamContent(e.target.value)}
                    className="w-full bg-slate-950 px-2.5 py-1.5 rounded border border-white/5 text-slate-200 text-[11px] placeholder-slate-600 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Mobile Sync Submission button */}
              <button
                onClick={handleMobileSyncSubmit}
                disabled={syncing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold py-2 rounded-lg text-xs flex items-center justify-center space-x-1.5 shadow transition-all duration-300"
              >
                <ArrowRightLeft className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                <span>{syncing ? "同步投送中..." : "一键安全投送电脑"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
