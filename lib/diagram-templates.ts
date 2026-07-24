export interface Node {
  id: string
  label: string
  sublabel?: string
  type: "atem" | "pc" | "device" | "converter" | "cloud" | "stream"
  x: number
  y: number
  system: string // e.g., "main", "sub", "control", "external", etc.
}

export interface Connection {
  from: string
  to: string
  label?: string
  type: "hdmi" | "sdi" | "usb" | "wireless" | "ethernet" | "stream" | "audio"
  lineStyle?: "solid" | "dotted" | "thick"
}

export interface Subgraph {
  id: string
  title: string
  x: number
  y: number
  width: number
  height: number
}

export interface DiagramTemplate {
  id: string
  name: string
  description: string
  nodes: Node[]
  connections: Connection[]
  subgraphs: Subgraph[]
}

// Template 0: ZES System — Personal AI Routing & Orchestration Stack
const zesSystem: DiagramTemplate = {
  id: "zes-system",
  name: "ZES System",
  description: "Personal enterprise-grade AI routing & orchestration stack",
  nodes: [
    // ── USER LAYER ──
    { id: "user", label: "The User", sublabel: "Terminal / Claude", type: "pc", x: 540, y: 20, system: "user_layer" },

    // ── AGENTS LAYER ──
    { id: "hermes", label: "HERMES", sublabel: "Orchestrator / Memory", type: "atem", x: 200, y: 140, system: "agents" },
    { id: "codex", label: "CODEX", sublabel: "Engineer / 4-Phase QC", type: "atem", x: 540, y: 140, system: "agents" },
    { id: "claude_agent", label: "CLAUDE", sublabel: "UI/UX / Terminal Face", type: "atem", x: 880, y: 140, system: "agents" },

    // ── MEMORY & COMMS LAYER ──
    { id: "memory_hub", label: "Holographic Memory", sublabel: "fact_store · 111 facts", type: "device", x: 280, y: 300, system: "memory" },
    { id: "ecc", label: "ECC", sublabel: "Enhanced Codex Comms", type: "device", x: 800, y: 300, system: "memory" },
    { id: "master_creds", label: "MASTER CREDS", sublabel: "master.env · 69 lines", type: "converter", x: 540, y: 420, system: "memory" },

    // ── AI ROUTING LAYER ──
    { id: "bitrouter", label: "BITROUTER", sublabel: ":4356 · Rust · 51 models", type: "stream", x: 200, y: 580, system: "routing" },
    { id: "ai_proxy", label: "AI-PROXY", sublabel: ":20129 · Python 3.14", type: "stream", x: 540, y: 580, system: "routing" },
    { id: "router9", label: "9ROUTER", sublabel: ":20128 · Legacy (deprecated)", type: "converter", x: 880, y: 580, system: "routing" },

    // ── SERVICE LAYER ──
    { id: "tor", label: "Tor", sublabel: "9050/9051 · Privacy", type: "device", x: 180, y: 730, system: "services" },
    { id: "iprotate", label: "iprotate", sublabel: "Tor IP · every 15 min", type: "device", x: 420, y: 730, system: "services" },
    { id: "opencode", label: "OpenCode CLI", sublabel: "bitrouter/openai/gpt-5.4-mini", type: "pc", x: 700, y: 730, system: "services" },
    { id: "runsv", label: "runsv / runsvdir", sublabel: "35+ managed services", type: "device", x: 940, y: 730, system: "services" },

    // ── EXTERNAL PROVIDERS ──
    { id: "openai", label: "OpenAI", sublabel: "GPT-5.5 · 123 models", type: "cloud", x: 60, y: 910, system: "providers" },
    { id: "google", label: "Google", sublabel: "Gemini 3.5 Flash", type: "cloud", x: 230, y: 910, system: "providers" },
    { id: "anthropic", label: "Anthropic", sublabel: "Claude · 10 models", type: "cloud", x: 400, y: 910, system: "providers" },
    { id: "groq", label: "Groq", sublabel: "Llama-3.3-70B · 30 rpm", type: "cloud", x: 570, y: 910, system: "providers" },
    { id: "openrouter", label: "OpenRouter", sublabel: "342 models · key-based", type: "cloud", x: 740, y: 910, system: "providers" },
    { id: "mistral", label: "Mistral", sublabel: "Medium · 60 models", type: "cloud", x: 910, y: 910, system: "providers" },
    { id: "nvidia", label: "NVIDIA NIM", sublabel: "Llama-3.1-70B · 118 mods", type: "cloud", x: 1080, y: 910, system: "providers" },
  ],
  connections: [
    // User → Agents
    { from: "user", to: "hermes", label: "Orchestrate", type: "ethernet" },
    { from: "user", to: "codex", label: "Engineer", type: "ethernet" },
    { from: "user", to: "claude_agent", label: "UI/UX", type: "ethernet" },

    // Agents → Memory Hub
    { from: "hermes", to: "memory_hub", label: "Read/Write facts", type: "usb" },
    { from: "codex", to: "ecc", label: "Comms", type: "usb" },
    { from: "claude_agent", to: "ecc", label: "Comms", type: "usb" },

    // Memory → Master Creds
    { from: "memory_hub", to: "master_creds", label: "Secure lookup", type: "sdi", lineStyle: "dotted" },
    { from: "ecc", to: "master_creds", label: "Secure lookup", type: "sdi", lineStyle: "dotted" },

    // Master Creds → Routers
    { from: "master_creds", to: "bitrouter", label: "API keys", type: "ethernet" },
    { from: "master_creds", to: "ai_proxy", label: "API keys", type: "ethernet" },

    // Hermes self-improvement loop
    { from: "hermes", to: "memory_hub", label: "background_review", type: "audio", lineStyle: "dotted" },

    // Routers → Service Layer
    { from: "bitrouter", to: "opencode", label: "Default model", type: "stream" },
    { from: "bitrouter", to: "tor", label: "Via Tor", type: "wireless" },
    { from: "ai_proxy", to: "tor", label: "Via Tor", type: "wireless" },
    { from: "ai_proxy", to: "iprotate", label: "NEWNYM", type: "ethernet" },
    { from: "router9", to: "runsv", label: "Legacy svc", type: "sdi", lineStyle: "dotted" },

    // Routers → Providers
    { from: "bitrouter", to: "openai", label: "OpenAI", type: "stream" },
    { from: "bitrouter", to: "google", label: "Gemini", type: "stream" },
    { from: "ai_proxy", to: "groq", label: "groq/llama-3.3-70b", type: "stream" },
    { from: "ai_proxy", to: "openrouter", label: "openrouter/auto", type: "stream" },
    { from: "ai_proxy", to: "mistral", label: "mistral-medium", type: "stream" },
    { from: "ai_proxy", to: "nvidia", label: "nvidia/llama-3.1-70b", type: "stream" },
    { from: "bitrouter", to: "anthropic", label: "Claude proxy", type: "stream" },
  ],
  subgraphs: [
    { id: "user_layer", title: "User Layer", x: 420, y: 0, width: 300, height: 80 },
    { id: "agents", title: "Agent Layer — Hermes / Codex / Claude", x: 100, y: 110, width: 960, height: 120 },
    { id: "memory", title: "Memory & Credentials", x: 170, y: 270, width: 820, height: 200 },
    { id: "routing", title: "AI Routing Layer (Localhost)", x: 100, y: 550, width: 870, height: 100 },
    { id: "services", title: "Service Layer (runsv)", x: 100, y: 700, width: 950, height: 100 },
    { id: "providers", title: "External AI Providers (via Tor or Direct)", x: 30, y: 880, width: 1180, height: 90 },
  ],
}

// Template 1: Dual ATEM Studio Setup (Current default)
const dualAtemStudio: DiagramTemplate = {
  id: "dual-atem-studio",
  name: "Dual ATEM Studio",
  description: "Two ATEM switchers with SDI bridge, cameras, and streaming",
  nodes: [
    { id: "youtube", label: "YouTube", sublabel: "Live", type: "cloud", x: 1100, y: 30, system: "external" },
    { id: "pc1", label: "PC Actor 1", type: "pc", x: 60, y: 100, system: "main" },
    { id: "pc2", label: "PC Actor 2", type: "pc", x: 60, y: 190, system: "main" },
    { id: "pc3", label: "PC 3", type: "pc", x: 60, y: 280, system: "main" },
    { id: "stream_bridge", label: "ATEM Streaming", sublabel: "Bridge", type: "stream", x: 60, y: 370, system: "main" },
    { id: "atem_r", label: "ATEM Mini Pro", type: "atem", x: 240, y: 220, system: "main" },
    { id: "ipad", label: "iPad", sublabel: "MultiView", type: "device", x: 420, y: 130, system: "main" },
    { id: "bidi", label: "BiDi Converter", type: "converter", x: 420, y: 250, system: "main" },
    { id: "screen", label: "Screen", type: "device", x: 420, y: 370, system: "main" },
    { id: "cam1", label: "Camera", type: "device", x: 600, y: 100, system: "sub" },
    { id: "sdi_conv", label: "SDI to HDMI", type: "converter", x: 600, y: 200, system: "sub" },
    { id: "holly_tx", label: "Hollyland TX", type: "device", x: 720, y: 100, system: "sub" },
    { id: "holly_rx", label: "Hollyland RX", type: "device", x: 840, y: 100, system: "sub" },
    { id: "insta360", label: "Insta360", sublabel: "Webcam", type: "device", x: 720, y: 310, system: "sub" },
    { id: "pc_shared", label: "PC 4", sublabel: "Play & YouTube", type: "pc", x: 720, y: 410, system: "sub" },
    { id: "atem_l", label: "ATEM Mini Pro ISO", type: "atem", x: 920, y: 220, system: "sub" },
    { id: "multi_mon", label: "Multi Monitor", type: "device", x: 1100, y: 170, system: "sub" },
    { id: "ssd", label: "SSD Recording", type: "device", x: 1100, y: 290, system: "sub" },
  ],
  connections: [
    { from: "pc1", to: "atem_r", label: "HDMI In 1", type: "hdmi" },
    { from: "pc2", to: "atem_r", label: "HDMI In 2", type: "hdmi" },
    { from: "pc3", to: "atem_r", label: "HDMI In 3", type: "hdmi" },
    { from: "stream_bridge", to: "atem_r", label: "HDMI In 4", type: "hdmi" },
    { from: "atem_r", to: "ipad", label: "Type-C (MV)", type: "usb" },
    { from: "atem_r", to: "bidi", label: "HDMI Out", type: "hdmi" },
    { from: "bidi", to: "screen", label: "HDMI", type: "hdmi" },
    { from: "sdi_conv", to: "atem_l", label: "HDMI In 1", type: "hdmi" },
    { from: "cam1", to: "holly_tx", type: "hdmi" },
    { from: "holly_tx", to: "holly_rx", label: "Wireless", type: "wireless" },
    { from: "holly_rx", to: "atem_l", label: "HDMI In 2", type: "hdmi" },
    { from: "insta360", to: "pc_shared", label: "USB", type: "usb" },
    { from: "pc_shared", to: "atem_l", label: "HDMI In 3", type: "hdmi" },
    { from: "atem_l", to: "multi_mon", label: "HDMI (MV)", type: "hdmi" },
    { from: "atem_l", to: "ssd", label: "Type-C (ISO)", type: "usb" },
    { from: "bidi", to: "sdi_conv", label: "SDI Line", type: "sdi" },
    { from: "atem_l", to: "stream_bridge", label: "Ethernet", type: "ethernet" },
    { from: "pc_shared", to: "youtube", label: "Stream", type: "stream" },
  ],
  subgraphs: [
    { id: "main", title: "Main System (Left)", x: 30, y: 50, width: 530, height: 400 },
    { id: "sub", title: "Sub System (Right)", x: 570, y: 50, width: 660, height: 400 },
  ],
}

// Template 2: Simple Streaming Setup
const simpleStreaming: DiagramTemplate = {
  id: "simple-streaming",
  name: "Simple Streaming",
  description: "Basic single PC streaming setup with camera and mic",
  nodes: [
    { id: "pc", label: "Streaming PC", type: "pc", x: 300, y: 200, system: "main" },
    { id: "camera", label: "Camera", sublabel: "Webcam", type: "device", x: 100, y: 120, system: "main" },
    { id: "mic", label: "Microphone", sublabel: "USB", type: "device", x: 100, y: 220, system: "main" },
    { id: "capture", label: "Capture Card", type: "converter", x: 100, y: 320, system: "main" },
    { id: "console", label: "Game Console", type: "device", x: 100, y: 420, system: "main" },
    { id: "monitor", label: "Monitor", type: "device", x: 500, y: 120, system: "main" },
    { id: "headphones", label: "Headphones", type: "device", x: 500, y: 220, system: "main" },
    { id: "stream_deck", label: "Stream Deck", type: "device", x: 500, y: 320, system: "main" },
    { id: "twitch", label: "Twitch", sublabel: "Live", type: "cloud", x: 700, y: 200, system: "external" },
  ],
  connections: [
    { from: "camera", to: "pc", label: "USB", type: "usb" },
    { from: "mic", to: "pc", label: "USB", type: "usb" },
    { from: "console", to: "capture", label: "HDMI", type: "hdmi" },
    { from: "capture", to: "pc", label: "USB 3.0", type: "usb" },
    { from: "pc", to: "monitor", label: "HDMI", type: "hdmi" },
    { from: "pc", to: "headphones", label: "Audio", type: "audio" },
    { from: "stream_deck", to: "pc", label: "USB", type: "usb" },
    { from: "pc", to: "twitch", label: "Stream", type: "stream" },
  ],
  subgraphs: [
    { id: "main", title: "Streaming Setup", x: 70, y: 70, width: 560, height: 420 },
  ],
}

// Template 3: Podcast Setup
const podcastSetup: DiagramTemplate = {
  id: "podcast-setup",
  name: "Podcast Studio",
  description: "Multi-person podcast setup with audio mixer",
  nodes: [
    { id: "mixer", label: "Audio Mixer", sublabel: "Rodecaster", type: "atem", x: 350, y: 200, system: "main" },
    { id: "mic1", label: "Host Mic", sublabel: "XLR", type: "device", x: 100, y: 100, system: "main" },
    { id: "mic2", label: "Guest Mic 1", sublabel: "XLR", type: "device", x: 100, y: 200, system: "main" },
    { id: "mic3", label: "Guest Mic 2", sublabel: "XLR", type: "device", x: 100, y: 300, system: "main" },
    { id: "mic4", label: "Guest Mic 3", sublabel: "XLR", type: "device", x: 100, y: 400, system: "main" },
    { id: "hp1", label: "Host HP", type: "device", x: 200, y: 100, system: "main" },
    { id: "hp2", label: "Guest HP 1", type: "device", x: 200, y: 200, system: "main" },
    { id: "hp3", label: "Guest HP 2", type: "device", x: 200, y: 300, system: "main" },
    { id: "hp4", label: "Guest HP 3", type: "device", x: 200, y: 400, system: "main" },
    { id: "recorder", label: "SD Recorder", type: "device", x: 550, y: 150, system: "main" },
    { id: "pc", label: "Recording PC", type: "pc", x: 550, y: 270, system: "main" },
    { id: "camera", label: "PTZ Camera", type: "device", x: 750, y: 150, system: "sub" },
    { id: "atem", label: "ATEM Mini", type: "atem", x: 750, y: 270, system: "sub" },
    { id: "monitor", label: "Program Monitor", type: "device", x: 950, y: 200, system: "sub" },
    { id: "youtube", label: "YouTube", sublabel: "Podcast", type: "cloud", x: 950, y: 320, system: "external" },
  ],
  connections: [
    { from: "mic1", to: "mixer", label: "XLR", type: "audio" },
    { from: "mic2", to: "mixer", label: "XLR", type: "audio" },
    { from: "mic3", to: "mixer", label: "XLR", type: "audio" },
    { from: "mic4", to: "mixer", label: "XLR", type: "audio" },
    { from: "mixer", to: "hp1", label: "HP Out", type: "audio" },
    { from: "mixer", to: "hp2", label: "HP Out", type: "audio" },
    { from: "mixer", to: "hp3", label: "HP Out", type: "audio" },
    { from: "mixer", to: "hp4", label: "HP Out", type: "audio" },
    { from: "mixer", to: "recorder", label: "Line Out", type: "audio" },
    { from: "mixer", to: "pc", label: "USB", type: "usb" },
    { from: "camera", to: "atem", label: "HDMI", type: "hdmi" },
    { from: "pc", to: "atem", label: "HDMI", type: "hdmi" },
    { from: "mixer", to: "atem", label: "Audio In", type: "audio" },
    { from: "atem", to: "monitor", label: "HDMI Out", type: "hdmi" },
    { from: "atem", to: "youtube", label: "Stream", type: "stream" },
  ],
  subgraphs: [
    { id: "main", title: "Audio Setup", x: 70, y: 50, width: 560, height: 430 },
    { id: "sub", title: "Video Setup", x: 720, y: 100, width: 310, height: 280 },
  ],
}

// Template 4: Conference/Webinar Setup
const conferenceSetup: DiagramTemplate = {
  id: "conference-setup",
  name: "Conference Room",
  description: "Conference setup with multiple displays and video conferencing",
  nodes: [
    { id: "pc_presenter", label: "Presenter PC", type: "pc", x: 100, y: 150, system: "main" },
    { id: "pc_guest", label: "Guest PC", type: "pc", x: 100, y: 280, system: "main" },
    { id: "atem", label: "ATEM Mini Extreme", type: "atem", x: 300, y: 220, system: "main" },
    { id: "cam_front", label: "Front Camera", type: "device", x: 100, y: 400, system: "main" },
    { id: "cam_room", label: "Room Camera", type: "device", x: 300, y: 400, system: "main" },
    { id: "main_display", label: "Main Display", sublabel: "Projector", type: "device", x: 520, y: 100, system: "main" },
    { id: "confidence", label: "Confidence", sublabel: "Monitor", type: "device", x: 520, y: 220, system: "main" },
    { id: "multiview", label: "MultiView", type: "device", x: 520, y: 340, system: "main" },
    { id: "audio_mixer", label: "Audio Mixer", type: "device", x: 720, y: 150, system: "sub" },
    { id: "wireless_mic", label: "Wireless Mic", sublabel: "Handheld", type: "device", x: 720, y: 280, system: "sub" },
    { id: "lav_mic", label: "Lav Mic", sublabel: "Presenter", type: "device", x: 720, y: 380, system: "sub" },
    { id: "streaming_pc", label: "Streaming PC", type: "pc", x: 920, y: 150, system: "sub" },
    { id: "zoom", label: "Zoom", sublabel: "Meeting", type: "cloud", x: 920, y: 280, system: "external" },
    { id: "youtube", label: "YouTube", sublabel: "Live", type: "cloud", x: 920, y: 380, system: "external" },
  ],
  connections: [
    { from: "pc_presenter", to: "atem", label: "HDMI In 1", type: "hdmi" },
    { from: "pc_guest", to: "atem", label: "HDMI In 2", type: "hdmi" },
    { from: "cam_front", to: "atem", label: "HDMI In 3", type: "hdmi" },
    { from: "cam_room", to: "atem", label: "HDMI In 4", type: "hdmi" },
    { from: "atem", to: "main_display", label: "HDMI Out 1", type: "hdmi" },
    { from: "atem", to: "confidence", label: "HDMI Out 2", type: "hdmi" },
    { from: "atem", to: "multiview", label: "MV Out", type: "hdmi" },
    { from: "wireless_mic", to: "audio_mixer", label: "Audio", type: "audio" },
    { from: "lav_mic", to: "audio_mixer", label: "Audio", type: "audio" },
    { from: "audio_mixer", to: "atem", label: "Line In", type: "audio" },
    { from: "atem", to: "streaming_pc", label: "USB-C", type: "usb" },
    { from: "streaming_pc", to: "zoom", label: "Stream", type: "stream" },
    { from: "streaming_pc", to: "youtube", label: "Stream", type: "stream" },
  ],
  subgraphs: [
    { id: "main", title: "Video System", x: 70, y: 100, width: 560, height: 380 },
    { id: "sub", title: "Audio & Streaming", x: 690, y: 100, width: 310, height: 340 },
  ],
}

// Template 5: Live Event Multi-Cam
const liveEventSetup: DiagramTemplate = {
  id: "live-event",
  name: "Live Event Multi-Cam",
  description: "Multi-camera live event with SDI infrastructure",
  nodes: [
    { id: "cam1", label: "Camera 1", sublabel: "Wide", type: "device", x: 80, y: 100, system: "main" },
    { id: "cam2", label: "Camera 2", sublabel: "Close", type: "device", x: 80, y: 200, system: "main" },
    { id: "cam3", label: "Camera 3", sublabel: "Roaming", type: "device", x: 80, y: 300, system: "main" },
    { id: "sdi_conv1", label: "SDI to HDMI", type: "converter", x: 220, y: 100, system: "main" },
    { id: "sdi_conv2", label: "SDI to HDMI", type: "converter", x: 220, y: 200, system: "main" },
    { id: "wireless_rx", label: "Wireless RX", type: "device", x: 220, y: 300, system: "main" },
    { id: "atem", label: "ATEM Mini Extreme ISO", type: "atem", x: 400, y: 200, system: "main" },
    { id: "graphics_pc", label: "Graphics PC", type: "pc", x: 400, y: 350, system: "main" },
    { id: "hyperdeck", label: "HyperDeck", sublabel: "Recording", type: "device", x: 600, y: 100, system: "sub" },
    { id: "streaming_encoder", label: "Streaming", sublabel: "Encoder", type: "stream", x: 600, y: 220, system: "sub" },
    { id: "program_mon", label: "Program", sublabel: "Monitor", type: "device", x: 600, y: 340, system: "sub" },
    { id: "audio_board", label: "Audio Board", type: "device", x: 800, y: 150, system: "sub" },
    { id: "stage_audio", label: "Stage Audio", type: "device", x: 800, y: 280, system: "sub" },
    { id: "youtube", label: "YouTube", sublabel: "Live", type: "cloud", x: 800, y: 400, system: "external" },
  ],
  connections: [
    { from: "cam1", to: "sdi_conv1", label: "SDI", type: "sdi" },
    { from: "cam2", to: "sdi_conv2", label: "SDI", type: "sdi" },
    { from: "cam3", to: "wireless_rx", label: "Wireless", type: "wireless" },
    { from: "sdi_conv1", to: "atem", label: "HDMI In 1", type: "hdmi" },
    { from: "sdi_conv2", to: "atem", label: "HDMI In 2", type: "hdmi" },
    { from: "wireless_rx", to: "atem", label: "HDMI In 3", type: "hdmi" },
    { from: "graphics_pc", to: "atem", label: "HDMI In 4", type: "hdmi" },
    { from: "atem", to: "hyperdeck", label: "HDMI Out", type: "hdmi" },
    { from: "atem", to: "streaming_encoder", label: "USB-C", type: "usb" },
    { from: "atem", to: "program_mon", label: "MV Out", type: "hdmi" },
    { from: "audio_board", to: "atem", label: "Line In", type: "audio" },
    { from: "audio_board", to: "stage_audio", label: "Main Out", type: "audio" },
    { from: "streaming_encoder", to: "youtube", label: "RTMP", type: "stream" },
  ],
  subgraphs: [
    { id: "main", title: "Video Switching", x: 50, y: 50, width: 500, height: 380 },
    { id: "sub", title: "Output & Audio", x: 570, y: 50, width: 310, height: 380 },
  ],
}

// Template 6: Zoom Meeting/Webinar Setup
const zoomMeetingSetup: DiagramTemplate = {
  id: "zoom-meeting",
  name: "Zoom Meeting",
  description: "Professional Zoom meeting and webinar setup",
  nodes: [
    { id: "host_pc", label: "Host PC", sublabel: "Zoom", type: "pc", x: 350, y: 200, system: "main" },
    { id: "webcam", label: "Webcam", sublabel: "4K", type: "device", x: 100, y: 100, system: "main" },
    { id: "usb_mic", label: "USB Mic", sublabel: "Condenser", type: "device", x: 100, y: 200, system: "main" },
    { id: "capture", label: "Capture Card", type: "converter", x: 100, y: 300, system: "main" },
    { id: "doc_cam", label: "Document Camera", type: "device", x: 100, y: 400, system: "main" },
    { id: "main_monitor", label: "Main Monitor", sublabel: "Participants", type: "device", x: 550, y: 100, system: "main" },
    { id: "second_monitor", label: "Second Monitor", sublabel: "Share Screen", type: "device", x: 550, y: 220, system: "main" },
    { id: "speaker", label: "Speaker", type: "device", x: 550, y: 340, system: "main" },
    { id: "ring_light", label: "Ring Light", type: "device", x: 250, y: 100, system: "main" },
    { id: "atem", label: "ATEM Mini", sublabel: "Optional", type: "atem", x: 750, y: 150, system: "sub" },
    { id: "camera", label: "Camera", sublabel: "HDMI", type: "device", x: 750, y: 280, system: "sub" },
    { id: "slides_pc", label: "Slides PC", type: "pc", x: 750, y: 400, system: "sub" },
    { id: "zoom_cloud", label: "Zoom", sublabel: "Cloud", type: "cloud", x: 950, y: 200, system: "external" },
    { id: "recording", label: "Cloud Recording", type: "cloud", x: 950, y: 330, system: "external" },
  ],
  connections: [
    { from: "webcam", to: "host_pc", label: "USB", type: "usb" },
    { from: "usb_mic", to: "host_pc", label: "USB", type: "usb" },
    { from: "doc_cam", to: "capture", label: "HDMI", type: "hdmi" },
    { from: "capture", to: "host_pc", label: "USB 3.0", type: "usb" },
    { from: "host_pc", to: "main_monitor", label: "HDMI 1", type: "hdmi" },
    { from: "host_pc", to: "second_monitor", label: "HDMI 2", type: "hdmi" },
    { from: "host_pc", to: "speaker", label: "Audio", type: "audio" },
    { from: "camera", to: "atem", label: "HDMI In 1", type: "hdmi" },
    { from: "slides_pc", to: "atem", label: "HDMI In 2", type: "hdmi" },
    { from: "atem", to: "host_pc", label: "USB Webcam", type: "usb" },
    { from: "host_pc", to: "zoom_cloud", label: "Stream", type: "stream" },
    { from: "zoom_cloud", to: "recording", label: "Recording", type: "stream" },
  ],
  subgraphs: [
    { id: "main", title: "Basic Setup", x: 70, y: 50, width: 560, height: 430 },
    { id: "sub", title: "Advanced (Multi-Source)", x: 720, y: 100, width: 160, height: 380 },
  ],
}

// Template 7: Empty Template
const emptyTemplate: DiagramTemplate = {
  id: "empty",
  name: "Empty",
  description: "Start from scratch",
  nodes: [],
  connections: [],
  subgraphs: [],
}

export const diagramTemplates: DiagramTemplate[] = [
  zesSystem,
  dualAtemStudio,
  simpleStreaming,
  podcastSetup,
  conferenceSetup,
  liveEventSetup,
  zoomMeetingSetup,
  emptyTemplate,
]

export const getTemplateById = (id: string): DiagramTemplate | undefined => {
  return diagramTemplates.find((t) => t.id === id)
}

export const defaultTemplate = zesSystem
