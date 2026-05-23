import React, { useState, useEffect, useRef, FormEvent } from "react";
import { 
  Sparkles, 
  Bot, 
  AlertTriangle, 
  ShieldCheck, 
  User, 
  Phone, 
  DollarSign, 
  RefreshCw, 
  Send, 
  Volume2, 
  VolumeX, 
  Flame, 
  BarChart3, 
  Star, 
  CheckCircle, 
  MessageSquare, 
  Activity, 
  Layers, 
  Wrench, 
  Download, 
  Mic, 
  MapPin, 
  Check, 
  UserCheck,
  Calendar,
  Clock,
  Plus
} from "lucide-react";
import { PRESET_SCENARIOS, PresetVoiceScenario } from "./presetsData";
import { Customer, ChatMessage, SystemAnalytics, BusinessPreset } from "./types";

export default function App() {
  // CRM Core States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [activeIndustry, setActiveIndustry] = useState<'real_estate' | 'solar' | 'visa'>("real_estate");
  
  // Input Simulator states
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedScenario, setRecordedScenario] = useState<PresetVoiceScenario | null>(null);
  
  // Agent Pipeline Logs & Highlights
  const [routingLogs, setRoutingLogs] = useState<any>(null);
  const [isTTSActive, setIsTTSActive] = useState<boolean>(true);
  const [lastSpeechAudio, setLastSpeechAudio] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [responseTimes, setResponseTimes] = useState<number[]>([0.72, 0.85, 0.94, 0.81, 0.79]);
  
  // QA Manager Audit states
  const [activeQAFeedback, setActiveQAFeedback] = useState<any>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  
  // Dashboard overall Analytics
  const [analytics, setAnalytics] = useState<SystemAnalytics>({
    totalLeads: 124,
    convertedLeads: 42,
    activeTickets: 18,
    escalatedCount: 5,
    byLanguage: { Hinglish: 54, Punjabi: 45, English: 18, "Hindi/Other": 7 },
    bySentiment: { happy: 32, neutral: 65, angry: 15, vip: 12 },
    industryMetrics: { real_estate: 55, solar: 38, visa: 31 },
    agentMetrics: [
      { name: "Router Agent (Brain)", callsHandled: 124, score: 98, satisfactionRate: 95, resolutions: 124, upsells: 0 },
      { name: "Sales Agent (Leads)", callsHandled: 66, score: 87, satisfactionRate: 85, resolutions: 30, upsells: 18 },
      { name: "Support Agent (Tech)", callsHandled: 42, score: 81, satisfactionRate: 79, resolutions: 32, upsells: 4 },
      { name: "Escalation Agent (VIP)", callsHandled: 16, score: 91, satisfactionRate: 88, resolutions: 12, upsells: 2 }
    ],
    recentReviewsByManager: []
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Smart Consultation & Site-Visit Scheduling States
  const [suggestedSlots, setSuggestedSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [daysElapsed, setDaysElapsed] = useState<number>(0);
  const [lastInteractionStr, setLastInteractionStr] = useState<string>("");
  
  // Custom manual scheduling slot state
  const [showCustomSched, setShowCustomSched] = useState<boolean>(false);
  const [customDate, setCustomDate] = useState<string>("");
  const [customTime, setCustomTime] = useState<string>("10:00 AM");
  const [customAgent, setCustomAgent] = useState<string>("Sanya Sharma (Senior Sales)");
  const [customReason, setCustomReason] = useState<string>("In-person consultation meeting");

  // Fetch suggested slots on selected customer change
  useEffect(() => {
    if (!selectedCustomerId) return;
    
    const fetchSlotsAndDetails = async () => {
      setLoadingSlots(true);
      try {
        const response = await fetch("/api/crm/suggest-slots", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ customerId: selectedCustomerId })
        });
        const data = await response.json();
        if (data && data.slots) {
          setSuggestedSlots(data.slots);
          setDaysElapsed(data.daysActiveThreshold);
          setLastInteractionStr(data.lastInteraction);
        }
      } catch (err) {
        console.error("Error communicating with Punjab schedule server:", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlotsAndDetails();
  }, [selectedCustomerId]);

  // Hook to book a consultation / site visit
  const handleScheduleSlot = async (slot: { date: string; time: string; agentName: string; reason: string; badge?: string }) => {
    if (!selectedCustomerId) {
      triggerToast("Please select a active customer first.");
      return;
    }
    
    try {
      const response = await fetch("/api/crm/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          date: slot.date,
          time: slot.time,
          agentName: slot.agentName,
          reason: slot.reason
        })
      });
      const data = await response.json();
      if (data.success) {
        triggerToast(`Successfully booked ${slot.badge || "Consultation"} on ${slot.date}!`);
        // Update customers data locally to push system announcement log and reflect status 
        setCustomers(prev => prev.map(c => c.id === selectedCustomerId ? data.customer : c));
        // Update general dashboard analytics from server mapping
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
        setShowCustomSched(false);
      } else {
        triggerToast("Failed to book calendar slot on server.");
      }
    } catch (err) {
      console.error("Error in schedule-slot action:", err);
      triggerToast("Failed to book consultation slot.");
    }
  };

  // Business presets static representation
  const presetsInfo = {
    real_estate: {
      name: "Punjab Elite Properties",
      location: "Sector 82, Mohali, Chandigarh",
      description: "Premium builder floor, plots, and flat deals in Zirakpur & Mohali near upcoming Airport road."
    },
    solar: {
      name: "Punjab Green Solar Systems",
      location: "Industrial Focal Point, Ludhiana / Chandigarh Area",
      description: "Leading residential & commercial solar setups with heavy Punjab PSPCL/state subsidies."
    },
    visa: {
      name: "Chandigarh Global Study Visa Specialists",
      location: "Sector 17, Chandigarh (opposite Fountain Plaza)",
      description: "Punjab's most trustable consultants for Canada SDS Study visas, filing, and IELTS/PTE bands guidance."
    }
  };

  // Trigger temporary notification toast
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch initial system state
  useEffect(() => {
    fetchCustomersAndAnalytics();
  }, [activeIndustry]);

  const fetchCustomersAndAnalytics = async () => {
    try {
      const customersRes = await fetch("/api/crm/customers");
      const customersData = (await customersRes.json()) as Customer[];
      setCustomers(customersData);
      
      // Auto-select first customer for chat screen if nothing is selected yet
      if (customersData.length > 0 && !selectedCustomerId) {
        setSelectedCustomerId(customersData[0].id);
      }

      const analyticsRes = await fetch("/api/crm/analytics");
      const analyticsData = (await analyticsRes.json()) as SystemAnalytics;
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Error communicating with Chandigarh AI backend.", err);
    }
  };

  // Keep chat scrolled down
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [customers, selectedCustomerId, isSending]);

  // Handle preset scenario instant loader
  const loadScenario = (scenario: PresetVoiceScenario) => {
    setRecordedScenario(scenario);
    setInputText(scenario.text);
    setActiveIndustry(scenario.industry);
    triggerToast(`Loaded simulated Punjabi script for client: "${scenario.speaker}"`);
  };

  // Reset CRM memory database
  const handleResetData = async () => {
    if (!window.confirm("Are you sure you want to reset all simulated Punjab CRM customers and metrics databases?")) return;
    try {
      const res = await fetch("/api/crm/customers/reset", { method: "POST" });
      const data = await res.json();
      setCustomers(data.customers);
      setAnalytics(data.analytics);
      if (data.customers.length > 0) {
        setSelectedCustomerId(data.customers[0].id);
      }
      setRoutingLogs(null);
      setActiveQAFeedback(null);
      triggerToast("Punjab CRM and Vector Memory databases seeded successfully!");
    } catch (e) {
      triggerToast("Reset state sync failed.");
    }
  };

  // Process Simulated Voice Recording
  const handleSimulatedVoiceRecord = () => {
    if (isRecording) {
      setIsRecording(false);
      triggerToast("Simulated Punjabi Speech-To-Text completed successfully!");
    } else {
      setIsRecording(true);
      triggerToast("Listening... Speak in Hindi, Punjabi, or Hinglish.");
      // Auto-transcribe a random preset scenario if none is drafted helper
      setTimeout(() => {
        setIsRecording(false);
        const randomScen = PRESET_SCENARIOS[Math.floor(Math.random() * PRESET_SCENARIOS.length)];
        loadScenario(randomScen);
      }, 2500);
    }
  };

  // Multi-Agent Pipeline Request Orchestrator
  const handleSendChat = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !selectedCustomerId) return;

    const currentCustomer = customers.find(c => c.id === selectedCustomerId);
    if (!currentCustomer) return;

    setIsSending(true);
    const startTime = Date.now();

    try {
      const payload = {
        message: inputText,
        customerPhone: currentCustomer.phone,
        industry: activeIndustry,
        voiceInput: !!recordedScenario,
        fallbackTTS: isTTSActive
      };

      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Backend pipeline error");

      const data = await res.json();
      
      // Update response latency benchmark
      const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));
      setResponseTimes(prev => [durationSeconds, ...prev.slice(0, 4)]);

      // Display logs
      setRoutingLogs(data.routerLogs);
      
      // Load TTS Base64 if returned
      if (data.audioBase64) {
        setLastSpeechAudio(data.audioBase64);
        playSpeech(data.audioBase64);
      }

      // Clear layout triggers
      setInputText("");
      setRecordedScenario(null);

      // Refresh data
      await fetchCustomersAndAnalytics();
      triggerToast(`Routed through Router Agent to the [${data.routerLogs.routedAgent.toUpperCase()}] agent successfully!`);
    } catch (err) {
      console.error(err);
      triggerToast("Message delivery failed. Operating on smart backup.");
    } finally {
      setIsSending(false);
    }
  };

  // Playback speech synthesis helper
  const playSpeech = (base64Str: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audioUrl = `data:audio/mp3;base64,${base64Str}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setIsPlayingAudio(true);
      audio.play();
      audio.onended = () => {
        setIsPlayingAudio(false);
      };
    } catch (err) {
      console.error("Audio playback error", err);
    }
  };

  // Trigger manual general manager QA audit evaluation
  const triggerManagerAudit = async (custId: string) => {
    setIsAuditing(true);
    triggerToast("Manager Agent is reading chat history and evaluating performance...");
    try {
      const res = await fetch("/api/manager/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: custId, industryPreset: activeIndustry })
      });
      if (!res.ok) throw new Error("Audit generation failure");
      const review = await res.json();
      setActiveQAFeedback(review);
      
      // Refresh analytics to get the newly appended list of audits
      await fetchCustomersAndAnalytics();
      triggerToast(`Audited! Score rating: ${review.rating}/5 stars.`);
    } catch (err) {
      triggerToast("Manager review failed to execute.");
    } finally {
      setIsAuditing(false);
    }
  };

  // Generate a CRM status report to download
  const downloadBackupReport = () => {
    try {
      const backupText = `CHANDIGARH MULTI-AGENT CRM REPORT\nGenerated at: ${new Date().toISOString()}\n\n` + 
        `Total Active Leads: ${customers.length}\n` +
        `Current Industry Context: ${activeIndustry.toUpperCase()}\n\n` +
        `CUSTOMERS DIRECTORY:\n` +
        customers.map(c => `[${c.name} - ${c.phone}] Sentiment: ${c.sentiment.toUpperCase()}, Score: ${c.leadScore}, Priority: ${c.priority.toUpperCase()}\n  Interest: ${c.interest}\n  Last Topic: ${c.lastIssue}\n  Chats count: ${c.history.length}`).join("\n\n");

      const element = document.createElement("a");
      const file = new Blob([backupText], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `CRM-QA-Report-${activeIndustry.toLowerCase()}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      triggerToast("Downloaded diagnostic CRM summary report!");
    } catch (e) {
      triggerToast("Download failed.");
    }
  };

  // Helpers to color coordinate badges
  const getAgentTheme = (role?: string) => {
    switch (role) {
      case "router": return { bg: "bg-green-950/40 text-green-400 border-green-800", text: "Router Agent (Brain)" };
      case "sales": return { bg: "bg-blue-950/40 text-blue-400 border-blue-800", text: "Sales Agent" };
      case "support": return { bg: "bg-cyan-950/40 text-cyan-400 border-cyan-800", text: "Support Agent" };
      case "escalation": return { bg: "bg-red-950/40 text-red-400 border-red-800/80 border-l-red-500 border-l-2", text: "Escalation Agent" };
      default: return { bg: "bg-slate-900 border-slate-700", text: "System Coordinator" };
    }
  };

  const getSentimentTag = (sentiment: string) => {
    switch (sentiment) {
      case "happy": return { bg: "bg-green-900/35 text-green-400 border-green-800", text: "😊 Happy Client" };
      case "angry": return { bg: "bg-red-900/40 text-red-400 border-red-800 animate-pulse", text: "🔥 Urgent Angry" };
      case "vip": return { bg: "bg-purple-900/40 text-purple-400 border-purple-800", text: "👑 Premium VIP" };
      default: return { bg: "bg-slate-800 text-slate-400 border-slate-700", text: "😐 Neutral State" };
    }
  };

  const getPriorityTag = (prio: string) => {
    switch (prio) {
      case "high": return "bg-red-600/20 text-red-400 border border-red-700";
      case "medium": return "bg-orange-600/10 text-orange-400 border border-orange-800/40";
      default: return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  // Find active customer context
  const activeCustomer = customers.find(c => c.id === selectedCustomerId);

  // Compute stats on-the-fly for header (dynamic CRM elements)
  const totalLeadsValue = customers.reduce((acc, c) => {
    // Basic parser for budget and valuation simulation (e.g. ₹85 Lakh = 8500000, 2.2 Lakh = 220000, etc)
    const matches = c.budget.match(/([\d.]+)\s*(Lakh|Crore|Cr)/i);
    if (matches) {
      const val = parseFloat(matches[1]);
      const multiplier = matches[2].toLowerCase().startsWith("cr") ? 100 : 1;
      return acc + (val * multiplier);
    }
    return acc + 10; // Default flat fallback
  }, 0);

  const avgSpeed = (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2);

  return (
    <div id="main-app" className="w-full min-h-screen bg-[#0a0b0d] text-slate-300 flex font-sans select-none overflow-x-hidden antialiased">
      
      {/* Toast Alert Widget */}
      {toastMessage && (
        <div id="app-toast" className="fixed bottom-6 right-6 z-50 bg-[#161a22] border border-orange-500 rounded-lg p-3 text-xs text-slate-100 shadow-2xl flex items-center gap-2 max-w-sm transition-all duration-300">
          <Sparkles className="w-4 h-4 text-orange-500 animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* LEFT NAVIGATION SIDEBAR */}
      <aside id="sidebar-left" className="w-64 bg-[#11141a] border-r border-slate-800 flex flex-col shrink-0">
        
        {/* Brand Banner */}
        <div id="brand-header" className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded flex items-center justify-center font-bold text-white text-sm shrink-0">IN</div>
          <div>
            <h1 className="text-xs font-bold text-white leading-tight tracking-wider">BHARAT AI v2.5</h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Multi-Agent Punjab Hub</p>
          </div>
        </div>

        {/* Sidebar Nav Area */}
        <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
          
          {/* Active Industry context selection */}
          <div>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mb-2 px-1">
              CRM Focus Sector
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => { setActiveIndustry("real_estate"); triggerToast("Industry context switched to Real Estate"); }}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between border transition-all ${
                  activeIndustry === "real_estate" 
                    ? "bg-slate-800/80 text-white border-slate-700" 
                    : "text-slate-400 hover:bg-slate-900 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeIndustry === "real_estate" ? "bg-orange-500" : "bg-slate-600"}`}></span> 
                  Properties (Mohali)
                </div>
                <span className="text-[9px] px-1 bg-slate-900 rounded text-slate-500">RE</span>
              </button>

              <button
                onClick={() => { setActiveIndustry("solar"); triggerToast("Industry context switched to Solar Systems"); }}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between border transition-all ${
                  activeIndustry === "solar" 
                    ? "bg-slate-800/80 text-white border-slate-700" 
                    : "text-slate-400 hover:bg-slate-900 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeIndustry === "solar" ? "bg-orange-500" : "bg-slate-600"}`}></span>
                  Solar Systems
                </div>
                <span className="text-[9px] px-1 bg-slate-900 rounded text-slate-500">SOL</span>
              </button>

              <button
                onClick={() => { setActiveIndustry("visa"); triggerToast("Industry context switched to Visa Specialist"); }}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between border transition-all ${
                  activeIndustry === "visa" 
                    ? "bg-slate-800/80 text-white border-slate-700" 
                    : "text-slate-400 hover:bg-slate-900 border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeIndustry === "visa" ? "bg-orange-500" : "bg-slate-600"}`}></span>
                  Global Visas (CHD)
                </div>
                <span className="text-[9px] px-1 bg-slate-900 rounded text-slate-500">VISA</span>
              </button>
            </div>
          </div>

          {/* Active Copilot Agents */}
          <div>
            <div className="text-[9px] text-slate-500 font-bold mb-2 px-1 uppercase tracking-wider">Agents Queue Status</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/60 rounded border border-slate-850 text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> 
                  <span>Router Agent</span>
                </div>
                <span className="text-[8px] uppercase px-1 bg-green-950 font-mono text-green-400 rounded">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/20 hover:bg-slate-900/40 transition-all rounded text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> 
                  <span>Sales Executive</span>
                </div>
                <span className="text-[8px] uppercase px-1 bg-slate-800 font-mono text-slate-500 rounded">IDLE</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/20 hover:bg-slate-900/40 transition-all rounded text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> 
                  <span>Support Ticket Bot</span>
                </div>
                <span className="text-[8px] uppercase px-1 bg-slate-800 font-mono text-slate-500 rounded">IDLE</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/20 hover:bg-slate-900/40 transition-all rounded text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> 
                  <span>Escalation Director</span>
                </div>
                <span className="text-[8px] uppercase px-1 bg-red-950/40 font-mono text-red-400 rounded">MONITOR</span>
              </div>

              <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/20 hover:bg-slate-900/40 transition-all rounded text-[11px] text-slate-300">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> 
                  <span>QA Manager Agent</span>
                </div>
                <span className="text-[8px] uppercase px-1 bg-purple-950/40 font-mono text-purple-400 rounded">AUDITING</span>
              </div>
            </div>
          </div>

          {/* Voice & Translate Stack */}
          <div>
            <div className="text-[9px] text-slate-500 font-bold mb-2 px-1 uppercase tracking-wider">Voice & TTS Stack</div>
            <div className="p-3 bg-slate-900/60 rounded border border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-[10px]">
                <span className="text-slate-400">Model Engine</span>
                <span className="text-slate-200 font-mono text-[9px] bg-slate-800 px-1 py-0.5 rounded">Gemini 3.5</span>
              </div>
              <div>
                <label className="flex items-center justify-between text-[10px] text-slate-400 cursor-pointer">
                  <span>Gemini Voice Notes (TTS)</span>
                  <button 
                    onClick={() => { setIsTTSActive(!isTTSActive); triggerToast(isTTSActive ? "Voice response muted" : "Voice notes speaker active"); }}
                    className={`p-1 rounded transition-colors ${isTTSActive ? 'text-orange-500 hover:text-orange-600' : 'text-slate-600 hover:text-slate-500'}`}
                  >
                    {isTTSActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  </button>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-slate-500">Whisper Punjab STT</span>
                  <span className="text-green-500 font-mono font-bold">42ms</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-green-500"></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-slate-500">IndicTrans Punjabi</span>
                  <span className="text-green-500 font-mono font-bold">98%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-[98%] h-full bg-green-500"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Database Reset Option */}
          <div className="pt-1">
            <button 
              onClick={handleResetData}
              className="w-full py-1.5 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/50 rounded text-[10px] text-slate-400 hover:text-slate-300 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Re-seed CRM Database
            </button>
          </div>

        </nav>

        {/* Footer info Node */}
        <div id="sidebar-footer" className="p-4 border-t border-slate-800 bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase tracking-tighter italic">CH</div>
            <div>
              <div className="text-xs font-semibold text-white">Chandigarh Hub</div>
              <div className="text-[9px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">Punjab State Node</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE AREA */}
      <main id="main-workspace animate-fade-in" className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* TOP STATUS HEADER BAR */}
        <header id="workspace-header" className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-[#11141a]/50 shrink-0">
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-slate-500 tracking-wider">Total Active Leads</span>
              <span className="text-lg font-mono text-white font-bold leading-tight">
                {analytics.totalLeads > 4 ? analytics.totalLeads : customers.length}
              </span>
            </div>
            
            <div className="h-8 w-[1px] bg-slate-800"></div>
            
            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-slate-500 tracking-wider">Estimated pipeline pipeline</span>
              <span className="text-lg font-mono text-green-400 font-bold leading-tight">
                + ₹{totalLeadsValue.toFixed(1)}L
              </span>
            </div>

            <div className="h-8 w-[1px] bg-slate-800"></div>

            <div className="flex flex-col">
              <span className="text-[9px] uppercase text-slate-500 tracking-wider">Active Client Context</span>
              <span className="text-xs font-bold text-orange-500 capitalize leading-tight">
                {presetsInfo[activeIndustry].name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* WhatsApp simulation tag */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] font-mono text-slate-300 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              WhatsApp Regional API: OK
            </div>

            <button 
              onClick={downloadBackupReport}
              className="bg-orange-600 text-white hover:bg-orange-700 px-3 py-1.5 rounded text-[11px] font-bold uppercase transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              CRM Audit Report
            </button>
          </div>
        </header>

        {/* INTEGRATED DASHBOARD MAIN CONTAINER SCREEN */}
        <div id="workspace-grid" className="flex-1 p-5 grid grid-cols-1 md:grid-cols-12 gap-5 shrink-0">
          
          {/* SECTION A: SIMULATOR WORKSTATION AND CHAT LOG (COL-SPAN-8) */}
          <div className="md:col-span-8 flex flex-col gap-5">
            
            {/* 1. Interactive Context Bar */}
            <div className="bg-[#11141a] rounded-xl border border-slate-800 p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-orange-500" />
                    Multi-Agent Interactive Simulator Console
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Select a client profile below, then pick a Punjabi Voice Scenario or input custom chat to execute real-time multi-agent routing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Context node:</span>
                  <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded font-bold text-[10px] text-orange-500 uppercase font-mono">
                    {activeIndustry}
                  </span>
                </div>
              </div>

              {/* CRM Customer List Select tab */}
              <div id="customer-select-tabs" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {customers.map((c) => {
                  const isActive = c.id === selectedCustomerId;
                  const sentimentColor = c.sentiment === 'angry' ? 'text-red-400 bg-red-950/50' : 'text-slate-400';
                  return (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCustomerId(c.id); setActiveQAFeedback(null); }}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                        isActive 
                          ? "bg-slate-800/80 border-orange-500/80 shadow-md text-white" 
                          : "bg-slate-900/50 border-slate-800 hover:bg-slate-900 hover:border-slate-700 text-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-xs font-bold truncate pr-1">{c.name}</span>
                        <span className="text-[8px] px-1 bg-slate-950 rounded font-mono text-orange-400">Score: {c.leadScore}</span>
                      </div>
                      <div className="flex justify-between items-center w-full mt-1.5 text-[9px] text-slate-500">
                        <span className="truncate">{c.phone}</span>
                        <span className={`text-[8px] px-1 rounded uppercase ${sentimentColor}`}>{c.sentiment}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. CHAT FEED & VOICE CONSOLE */}
            <div className="bg-[#11141a] rounded-xl border border-slate-800 flex flex-col flex-1 min-h-[360px]">
              
              {/* Active Client Banner */}
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Client Dialogue: {activeCustomer ? activeCustomer.name : 'No selection'}
                  </span>
                  <span className="text-[9px] text-slate-500">({activeCustomer?.phone})</span>
                </div>
                
                {/* Audio Playing Ripple */}
                {isPlayingAudio && (
                  <div className="flex items-center gap-1.5 bg-orange-950/40 text-orange-400 px-2 py-0.5 rounded border border-orange-800 text-[10px]">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span>
                    Gemini Punjab TTS playing
                  </div>
                )}
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[320px]">
                {activeCustomer && activeCustomer.history.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-xs">No active conversation history found.</p>
                    <p className="text-[10px]">Type below to start or select a Quick Scenario triggers to populate simulation.</p>
                  </div>
                )}

                {activeCustomer && activeCustomer.history.map((msg) => {
                  const isUser = msg.sender === "customer";
                  const agentInfo = getAgentTheme(msg.agentRole);

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 items-start animate-fade-in ${isUser ? "" : "border-l-2 pl-3 border-orange-500"}`}
                    >
                      {/* Left Avatar Icon */}
                      <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs shrink-0 ${
                        isUser 
                          ? "bg-slate-800 border border-slate-700 text-slate-300" 
                          : msg.agentRole === 'escalation' ? "bg-red-950 text-red-400 border border-red-800" 
                          : "bg-orange-950 text-orange-400 border border-orange-900"
                      }`}>
                        {isUser ? "C" : msg.agentRole ? msg.agentRole.slice(0, 2).toUpperCase() : "AG"}
                      </div>

                      {/* Content block */}
                      <div className="flex-1 bg-slate-900/40 p-2.5 rounded border border-slate-850">
                        <div className="flex justify-between items-center mb-1">
                          
                          {/* Sender title identifier */}
                          <span className="text-[11px] font-bold text-white flex items-center gap-1">
                            {isUser ? activeCustomer.name : agentInfo.text}
                            {!isUser && (
                              <span className="text-[9px] text-slate-500 font-normal italic">
                                ({presetsInfo[activeIndustry].name})
                              </span>
                            )}
                          </span>

                          <div className="flex items-center gap-2">
                            {isUser && msg.isVoice && (
                              <span className="text-[8px] bg-orange-950 text-orange-400 px-1 py-0.5 rounded font-mono uppercase tracking-widest">
                                AUDIO NOTE TRANSCRIPT
                              </span>
                            )}
                            {!isUser && msg.agentRole && (
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-extrabold uppercase ${agentInfo.bg}`}>
                                INTENT: {msg.agentRole.toUpperCase()}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>

                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Punjab Preset Scenarios quick launch */}
              <div id="quick-presets" className="p-3 bg-[#11141a] border-t border-slate-800">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block mb-1.5">
                  ⚡ Immediate Regional Voice/Chat Scenarios
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_SCENARIOS.map((scen) => {
                    return (
                      <button
                        key={scen.id}
                        onClick={() => loadScenario(scen)}
                        className={`text-[10px] px-2 py-1 rounded border text-left transition-all ${
                          recordedScenario?.id === scen.id 
                            ? "bg-orange-950 border-orange-500 text-orange-300" 
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {scen.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendChat} className="p-3 bg-slate-900/60 border-t border-slate-850 flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleSimulatedVoiceRecord}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                    isRecording 
                      ? "bg-red-950 text-red-500 border-red-800 animate-pulse" 
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300"
                  }`}
                  title="Simulate WhatsApp voice message recording"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isRecording ? "Listening & transcribing Hinglish/Punjabi..." : `Type customer message as ${activeCustomer ? activeCustomer.name : 'guest'}...`}
                    className="w-full bg-[#0d0e12] border border-slate-800 focus:border-slate-700 rounded-lg py-2 pl-3 pr-10 text-xs text-slate-100 outline-none placeholder:text-slate-500"
                    disabled={isSending}
                  />
                  {recordedScenario && (
                    <span className="absolute right-2.5 top-2 bg-orange-950 text-orange-400 font-bold border border-orange-800 text-[8px] px-1 py-0.5 rounded uppercase">
                      VOICE TRANSCRIPT
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSending || !inputText.trim()}
                  className="bg-orange-600 hover:bg-orange-700 text-white disabled:bg-slate-800 disabled:text-slate-600 p-2 rounded-lg transition-colors shrink-0"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>

            </div>

            {/* 3. DETECTED AI ROUTER LOGS GRID BLOCK */}
            <div className="bg-[#11141a] rounded-xl border border-slate-800 p-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#94a3b8] flex items-center gap-1.5">
                  <Bot className="w-4.5 h-4.5 text-green-500" />
                  Router Agent Brain: Intent & Memory Analytics (JSON Log)
                </h3>
                <span className="text-[9px] bg-slate-900 px-2 py-0.5 text-slate-500 font-mono rounded">
                  Live Stream Parameters
                </span>
              </div>

              {routingLogs ? (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* JSON view */}
                  <div className="md:col-span-7 bg-[#0a0b0d] p-3 rounded-lg border border-slate-850">
                    <div className="flex justify-between text-[9px] text-slate-500 font-mono mb-1.5 pb-1 border-b border-slate-850">
                      <span>MAPPED METADATA OUTPUT</span>
                      <span className="text-orange-500">200 OK</span>
                    </div>
                    <pre className="text-[10px] text-green-400 font-mono overflow-x-auto leading-relaxed max-h-[140px]">
                      {JSON.stringify(routingLogs, null, 2)}
                    </pre>
                  </div>

                  {/* Graphic scores */}
                  <div className="md:col-span-5 flex flex-col justify-between space-y-2">
                    
                    <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                      <div className="flex justify-between items-center text-[10px] mb-1">
                        <span className="text-slate-400">Escalation Anger Score</span>
                        <span className={`font-mono font-bold ${routingLogs.angerScore > 0.6 ? 'text-red-400' : 'text-slate-300'}`}>
                          {(routingLogs.angerScore * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${routingLogs.angerScore > 0.6 ? 'bg-red-500' : 'bg-orange-500'}`}
                          style={{ width: `${routingLogs.angerScore * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded border border-slate-850">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-slate-400">Memory Update Target</span>
                        <span className="text-orange-500 font-semibold">{routingLogs.interest || 'General'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        Budget Logged: <strong className="text-slate-300">{routingLogs.budget || 'None'}</strong>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2 rounded border border-slate-850 flex justify-between items-center text-[10px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Routing Flag</span>
                        <span className="font-bold text-white capitalize">{routingLogs.routedAgent} agent</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Sentiment Match</span>
                        <span className="font-bold text-green-400 capitalize">{routingLogs.sentiment}</span>
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-slate-500 text-xs">
                  Awaiting simulator input to reveal router pipeline analytics. Sends standard API queries.
                </div>
              )}
            </div>

          </div>

          {/* SECTION B: DENSE CRM DIRECTORY, LEADS QUEUE AND QA REVIEWS (COL-SPAN-4) */}
          <div className="md:col-span-4 flex flex-col gap-5">
            
            {/* 1. HIGH VALUE LEAD QUEUE */}
            <section className="bg-[#11141a] rounded-xl border border-slate-800 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#ea580c] flex items-center gap-1">
                  <Flame className="w-4 h-4 animate-pulse text-orange-500" />
                  Priority Punjab Lead Queue
                </h3>
                <span className="text-[9px] bg-orange-950 text-orange-400 px-1 py-0.5 rounded font-mono font-bold">
                  UPDATED
                </span>
              </div>

              <div className="p-3 space-y-2.5 max-h-[360px] overflow-y-auto">
                {/* Sort leads by value/score */}
                {[...customers].sort((a,b) => b.leadScore - a.leadScore).map((cust) => {
                  const sentimentDetails = getSentimentTag(cust.sentiment);
                  const isCur = cust.id === selectedCustomerId;

                  return (
                    <div 
                      key={cust.id} 
                      onClick={() => { setSelectedCustomerId(cust.id); setActiveQAFeedback(null); }}
                      className={`p-3 rounded border text-left cursor-pointer transition-all ${
                        isCur 
                          ? "bg-slate-900 border-orange-500/80 shadow-md" 
                          : "bg-slate-950 border-slate-850 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            {cust.name}
                            {cust.priority === 'high' && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{cust.phone}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-orange-500">
                            {cust.leadScore}%
                          </span>
                          <span className="block text-[8px] text-slate-500 uppercase">Score rating</span>
                        </div>
                      </div>

                      {/* Client parameters stored in vector-CRM */}
                      <div className="my-2 grid grid-cols-2 gap-1.5 text-[9px] font-medium text-slate-400">
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850 truncate" title={cust.interest}>
                          🎯 {cust.interest}
                        </span>
                        <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-850 truncate">
                          💰 {cust.budget}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] border-t border-slate-900 pt-2 mt-2">
                        <span className={`px-1 py-0.2 rounded text-[8px] uppercase border ${sentimentDetails.bg}`}>
                          {sentimentDetails.text}
                        </span>

                        <button 
                          onClick={(e) => { e.stopPropagation(); triggerManagerAudit(cust.id); }}
                          className="px-2 py-0.5 bg-orange-600/10 hover:bg-orange-600/30 text-orange-500 font-bold border border-orange-500/20 rounded text-[9px] transition-all"
                        >
                          Audit QA
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 1.5 SMART CALENDAR & CONSULTATION SLOTS RECOMMENDATION PANEL */}
            <section className="bg-[#11141a] rounded-xl border border-slate-800 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-805 bg-slate-900/50 flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#f97316] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#f97316]" />
                  Optimal Consultation Slots
                </h3>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">
                  v1.2 Live
                </span>
              </div>

              <div className="p-4 space-y-3.5">
                {activeCustomer ? (
                  <>
                    {/* Active Customer Timeline Context Area */}
                    <div className="bg-[#0a0b0d] p-3 rounded-lg border border-slate-850 space-y-2">
                      <div className="flex justify-between text-[10px] items-center">
                        <span className="text-slate-500 font-semibold uppercase">CLIENT REFERENCE</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px] border border-slate-800">
                          {activeCustomer.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                          {activeCustomer.name}
                        </span>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] text-slate-500 block">LAST INTERACTION</span>
                          <span className="text-[10px] font-mono text-slate-300">
                            {lastInteractionStr || "Calculating..."}
                          </span>
                        </div>
                      </div>

                      {/* Threshold warning & sector availability rules */}
                      <div className="flex justify-between items-center text-[10px] border-t border-slate-900/60 pt-2 mt-1">
                        <span className="text-slate-500 font-medium">Days Elapsed:</span>
                        <span className={`font-mono font-bold ${daysElapsed > 4 ? 'text-red-400' : daysElapsed > 2 ? 'text-orange-400' : 'text-green-400'}`}>
                          {daysElapsed === 0 ? "Active today" : `${daysElapsed} days ago`}
                        </span>
                      </div>
                    </div>

                    {/* Has Booked Appointment already? Show Booking Confirmation and status */}
                    {activeCustomer.appointment ? (
                      <div className="bg-emerald-950/20 border border-emerald-900/40 p-3.5 rounded-lg space-y-2.5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            Confirmed Appointment
                          </div>
                          <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.2 bg-emerald-900/40 text-emerald-400 border border-emerald-800/20 rounded">
                            {activeCustomer.appointment.status}
                          </span>
                        </div>

                        <div className="text-xs font-mono bg-[#061e17] p-2 rounded border border-emerald-900/20 text-slate-200 space-y-1.5">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Date:</span>
                            <span className="font-bold text-white">{activeCustomer.appointment.date}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-400">Time Window:</span>
                            <span className="font-bold text-white">{activeCustomer.appointment.time}</span>
                          </div>
                          <div className="flex justify-between text-[10px] truncate max-w-[280px]">
                            <span className="text-slate-400">With Agent:</span>
                            <span className="font-bold text-[#34d399]">{activeCustomer.appointment.agentName}</span>
                          </div>
                          <div className="border-t border-emerald-900/50 pt-1.5 mt-1.5 text-[9px] text-[#a7f3d0] italic leading-tight">
                            <strong>Reason: </strong> {activeCustomer.appointment.reason}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const updatedHistoryMsg: ChatMessage = {
                              id: `sys-${Date.now()}-cancelled`,
                              sender: "system",
                              text: `🚫 Cancelled consultation on ${activeCustomer.appointment?.date} with ${activeCustomer.appointment?.agentName}.`,
                              timestamp: new Date().toISOString()
                            };

                            setCustomers(prev => prev.map(c => {
                              if (c.id === selectedCustomerId) {
                                return {
                                  ...c,
                                  appointment: undefined,
                                  history: [...c.history, updatedHistoryMsg]
                                };
                              }
                              return c;
                            }));
                            triggerToast("Appointment cancelled safely. Slots updated.");
                          }}
                          className="w-full py-1.5 hover:bg-red-950/20 text-red-500 hover:text-red-400 border border-red-900/30 font-bold rounded text-[10px] transition-all"
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    ) : (
                      /* No appointment yet. Suggest dynamic optimal slots */
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                            AI-OPTIMIZED SLOTS SUGGESTED
                          </span>
                          <span className="text-[9px] text-[#a1a1aa] italic">
                            Availability CHECKED: OK
                          </span>
                        </div>

                        {loadingSlots ? (
                          <div className="py-8 text-center text-xs text-slate-400 flex flex-col gap-2 items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-orange-500 animate-spin" />
                            <span>Computing slot matching probability...</span>
                          </div>
                        ) : (
                          <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-0.5">
                            {suggestedSlots.map((slot) => (
                              <div
                                key={slot.id}
                                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                  slot.isOptimal
                                    ? "bg-slate-900/80 border-orange-500/40 hover:bg-slate-900"
                                    : "bg-slate-950 border-slate-850 hover:bg-slate-900"
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className={`text-[8px] px-1 py-0.2 font-mono font-bold rounded uppercase mr-1.5 ${
                                      slot.isOptimal ? 'bg-orange-950/70 text-orange-400 border border-orange-850' : 'bg-slate-850 border border-slate-800 text-slate-450'
                                    }`}>
                                      {slot.badge}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">Score: {slot.confidenceScore}%</span>
                                  </div>
                                  <button
                                    onClick={() => handleScheduleSlot(slot)}
                                    className="px-2 py-0.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-[9px] transition-all animate-pulse"
                                  >
                                    Accept
                                  </button>
                                </div>

                                <div className="mt-2 text-xs text-white flex items-center gap-1.5 font-bold font-mono">
                                  <Calendar className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  <span>{slot.date}</span>
                                  <span className="text-slate-500 font-normal">|</span>
                                  <Clock className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                  <span>{slot.time}</span>
                                </div>

                                <p className="text-[10px] text-slate-400 mt-1 pb-1.5 border-b border-slate-900/60">
                                  {slot.reason}
                                </p>

                                <div className="text-[9px] text-slate-500 pt-1.5 flex justify-between items-center">
                                  <span>Assigned: <strong className="text-slate-300">{slot.agentName.split(" ")[0]}</strong></span>
                                  <span className="text-[8px] bg-emerald-950/20 text-emerald-400 px-1 rounded font-bold">AVAILABLE</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Expandable Custom Scheduling Form Toggle */}
                        <div className="border-t border-slate-900 pt-3">
                          {!showCustomSched ? (
                            <button
                              onClick={() => {
                                const tom = new Date();
                                tom.setDate(tom.getDate() + 1);
                                setCustomDate(tom.toISOString().split("T")[0]);
                                setShowCustomSched(true);
                              }}
                              className="w-full py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-705 rounded text-[10px] font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5 text-slate-450" />
                              Or Schedule Custom Slot Manually
                            </button>
                          ) : (
                            <div className="bg-[#0a0b0d] p-3 rounded-lg border border-slate-850 space-y-2.5">
                              <div className="flex justify-between items-center text-[10px] font-bold text-white border-b border-slate-900/60 pb-1.5">
                                <span>MANUAL SITE VISIT PLANNER</span>
                                <button
                                  onClick={() => setShowCustomSched(false)}
                                  className="text-slate-500 hover:text-slate-300 text-[9px]"
                                >
                                  Cancel
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="space-y-1">
                                  <label className="text-slate-500 select-none">Date Picker</label>
                                  <input
                                    type="date"
                                    value={customDate}
                                    onChange={(e) => setCustomDate(e.target.value)}
                                    className="w-full bg-[#11141a] text-white border border-slate-800 rounded p-1 text-[10px] focus:outline-none focus:border-orange-500/50"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-slate-500 select-none">Selected Hour</label>
                                  <select
                                    value={customTime}
                                    onChange={(e) => setCustomTime(e.target.value)}
                                    className="w-full bg-[#11141a] text-white border border-slate-800 rounded p-1 text-[10px] focus:outline-none focus:border-orange-500/50"
                                  >
                                    <option value="09:30 AM">09:30 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="02:30 PM">02:30 PM</option>
                                    <option value="04:00 PM">04:00 PM</option>
                                    <option value="06:30 PM">06:30 PM</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1 text-[10px]">
                                <label className="text-slate-500 select-none">Assigned Expert</label>
                                <select
                                  value={customAgent}
                                  onChange={(e) => setCustomAgent(e.target.value)}
                                  className="w-full bg-[#11141a] text-[#f8fafc] border border-slate-800 rounded p-1 text-[10px] focus:outline-none focus:border-orange-500/50"
                                >
                                  <option value="Sanya Sharma (Senior Sales)">Sanya Sharma (Senior Sales)</option>
                                  <option value="Suhail (Escalation Director)">Suhail (Escalation Director)</option>
                                  <option value="Sarabjit Singh (Solar Tech)">Sarabjit Singh (Solar Tech)</option>
                                  <option value="Manpreet (Global Visa Expert)">Manpreet (Global Visa Expert)</option>
                                </select>
                              </div>

                              <div className="space-y-1 text-[10px]">
                                <label className="text-slate-500 select-none">Purpose Description</label>
                                <input
                                  type="text"
                                  value={customReason}
                                  onChange={(e) => setCustomReason(e.target.value)}
                                  className="w-full bg-[#11141a] text-white border border-slate-800 rounded p-1 text-[10px] focus:outline-none focus:border-orange-500/50"
                                  placeholder="e.g. 3 BHK construction walkthrough"
                                />
                              </div>

                              <button
                                onClick={() => {
                                  if (!customDate || !customReason.trim()) {
                                    triggerToast("Please provide both Date and Target.");
                                    return;
                                  }
                                  const d = new Date(customDate);
                                  const formatted = d.toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
                                  
                                  handleScheduleSlot({
                                    date: formatted,
                                    time: customTime,
                                    agentName: customAgent,
                                    reason: customReason,
                                    badge: "Custom Plan"
                                  });
                                }}
                                className="w-full py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded text-[10px] transition-all"
                              >
                                Secure Custom CRM Slot
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No active CRM customer selected to calculate and recommend booking templates.
                  </div>
                )}
              </div>
            </section>

            {/* 2. LIVE QA MANAGER AUDITING REPORT WORKSPACE */}
            <section className="bg-[#11141a] rounded-xl border border-slate-800 flex flex-col">
              <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-slate-200">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  Manager QA Audit Cockpit
                </span>
                <span className="text-[9px] bg-purple-950 text-purple-400 font-mono font-black px-1.5 rounded uppercase">
                  Audit Node
                </span>
              </div>

              <div className="p-4 space-y-3">
                {isAuditing ? (
                  <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                    <span>Manager Agent is running deep audit metrics...</span>
                    <span className="text-[9px] text-slate-500">Critiquing Chandigarh context vocabulary and service timelines</span>
                  </div>
                ) : activeQAFeedback ? (
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                      <div>
                        <span className="text-[9px] text-slate-500 block uppercase">Audited Customer</span>
                        <span className="font-bold text-white text-xs">{activeQAFeedback.customerName || 'CRM Match'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 block uppercase font-mono">QA SCORE</span>
                        <div className="flex items-center gap-0.5 justify-end">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 ${i < activeQAFeedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0a0b0d] p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider mb-1">
                        TRANSCRIPT SNAPSHOT SUMMARY
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300 italic">
                        "{activeQAFeedback.transcriptSnippet}"
                      </p>
                    </div>

                    <div className="bg-[#0a0b0d] p-2.5 rounded border border-slate-850">
                      <span className="text-[9px] text-slate-500 block font-bold uppercase tracking-wider mb-0.5">
                        AGENT PERFORMANCE ANALYTICS
                      </span>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        {activeQAFeedback.agentPerformance}
                      </p>
                    </div>

                    <div className="bg-orange-950/20 border border-orange-900/40 p-2.5 rounded text-orange-400">
                      <span className="text-[9px] text-orange-500 font-bold block uppercase tracking-wider mb-0.5">
                        ACTIONABLE HUMAN COACHING ADVICE
                      </span>
                      <p className="text-[11px] leading-relaxed">
                        {activeQAFeedback.coachingAdvice}
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    <p>No active audit displayed.</p>
                    <p className="text-[9px] mt-1">Select a customer above and click "Audit QA" to request the Manager Agent to analyze performance rating and write coaching tips.</p>
                  </div>
                )}
              </div>
            </section>

          </div>

        </div>

        {/* REGIONAL PERFORMANCE METRICS CHARTS PANEL (BOTTOM GRAPHICS) */}
        <footer id="dashboard-graphics-footer" className="p-5 border-t border-slate-800 bg-[#0d0e12] shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            {/* Speed card */}
            <div className="bg-[#11141a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                AI Avg Response Latency
              </span>
              <div className="my-2.5">
                <span className="text-3xl font-mono text-white font-extrabold">{avgSpeed}s</span>
                <span className="text-[10px] text-slate-500 ml-1">avg speed</span>
              </div>
              <div className="text-[10px] text-green-500 font-bold flex items-center gap-1 leading-none">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse"></span>
                14% faster than standard call center
              </div>
            </div>

            {/* Language Breakdown */}
            <div className="bg-[#11141a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Indic Language Mix (Sales)
              </span>
              
              <div className="my-3 font-mono">
                <div className="flex h-2.5 rounded-full overflow-hidden mb-2 bg-slate-800">
                  <div className="bg-blue-500 text-white" style={{ width: "45%" }} title="Hinglish 45%"></div>
                  <div className="bg-indigo-500 text-white" style={{ width: "35%" }} title="Punjabi 35%"></div>
                  <div className="bg-purple-500 text-white" style={{ width: "20%" }} title="English 20%"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold uppercase">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 45% Hinglish</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> 35% Punjabi</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> 20% Eng</span>
                </div>
              </div>

              <span className="text-[9px] text-slate-500 leading-none">
                Language mapped by AI routing parameters in Punjab
              </span>
            </div>

            {/* Regional Sentiment Map */}
            <div className="bg-[#11141a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Regional Sat. Trend
              </span>
              <div className="flex items-end gap-2.5 h-12 my-2">
                <div className="flex-1 bg-green-500 h-[70%]" title="Happy 70%"></div>
                <div className="flex-1 bg-green-400 h-[85%]" title="Neutral 85%"></div>
                <div className="flex-1 bg-orange-400 h-[60%]" title="VIP status 60%"></div>
                <div className="flex-1 bg-red-400 h-[30%]" title="Angry 30%"></div>
              </div>
              <span className="text-[9px] text-slate-500 block leading-tight">
                Highest Satisfaction Score: <strong className="text-green-400">Mohali (94%)</strong>
              </span>
            </div>

            {/* Historic Coaching Feed */}
            <div className="bg-[#11141a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                Latest General Manager Audit logs
              </span>
              <div className="space-y-1 overflow-y-auto max-h-[85px] text-[10px] text-slate-300 pr-1">
                {analytics.recentReviewsByManager && analytics.recentReviewsByManager.length > 0 ? (
                  analytics.recentReviewsByManager.slice(0, 2).map((item, idx) => (
                    <div key={item.id || idx} className="py-1 border-b border-slate-850/60 last:border-none">
                      <div className="flex justify-between items-center text-[9px] mb-0.5">
                        <span className="text-orange-500 font-bold">{item.customerName}</span>
                        <span>{item.rating}★ rating</span>
                      </div>
                      <p className="text-slate-400 line-clamp-1 italic">"{item.coachingAdvice}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No manager audits triggered yet in this session.</p>
                )}
              </div>
            </div>

          </div>
        </footer>

      </main>

    </div>
  );
}
