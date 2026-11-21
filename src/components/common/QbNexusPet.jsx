'use client';

import * as React from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  RotateCcw,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Settings2,
  AlertTriangle,
  Check,
  CheckCircle,
  Radio,
  Pause,
  Play,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { readSession } from '@/lib/auth/admin-session';
import { useAuthStore } from '../../../lib/store';
import api from '../../../lib/api';

const STORAGE_KEY = 'qb_nexus_chat_history_v1';
const VOICE_PREFS_KEY = 'qb-nexus-preferences-v2';
const LEGACY_WAKE_ENABLED_KEY = 'qb-nexus-wake-enabled-v2';
const DEFAULT_GREETING = "Hello! I'm Nexus, your QB AI assistant. How can I help you today?";

// Supported Languages & Spoken Acknowledgements
export const SUPPORTED_LANGUAGES = [
  {
    code: 'en-US',
    label: 'English',
    nativeLabel: 'English',
    ack: "Yes, I'm here. How can I help you?",
  },
  {
    code: 'hi-IN',
    label: 'Hindi',
    nativeLabel: 'हिन्दी',
    ack: 'जी, मैं सुन रहा हूँ। बताइए, मैं आपकी क्या मदद कर सकता हूँ?',
  },
  {
    code: 'mr-IN',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    ack: 'हो, मी ऐकत आहे. सांगा, मी तुमची काय मदत करू?',
  },
  {
    code: 'gu-IN',
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
    ack: 'જી, હું સાંભળી રહ્યો છું. કહો, હું તમારી શું મદદ કરી શકું?',
  },
];

const INITIAL_MESSAGES = [
  {
    id: 'welcome-msg',
    sender: 'bot',
    text: "Hello! I'm QB Nexus, your central AI Operations Manager. Start a voice session or type below to command CRM, HRM, Tasks, or Reports.",
    time: 'Just now',
    suggestions: [
      "How many pending leads do we have today?",
      "Assign 5 pending leads to Rahul",
      "Today’s attendance summary",
      "View open operational tasks",
    ],
  },
];

function renderFormattedText(text) {
  if (!text) return null;
  const lines = String(text).split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
    const formattedLine = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={partIdx} className="bg-black/10 px-1 py-0.5 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
      }
      return part;
    });

    return (
      <React.Fragment key={lineIdx}>
        {formattedLine}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

/**
 * 11 Synchronized Robot Animation States:
 * IDLE, STANDBY, WAKE_DETECTED, OPENING, GREETING, LISTENING, PROCESSING, SPEAKING, EXECUTING, SUCCESS, ERROR
 */
function NexusFace({ state = 'IDLE', blinking = false, className }) {
  const isError = state === 'ERROR';
  const isSuccess = state === 'SUCCESS';
  const isThinking = state === 'PROCESSING' || state === 'EXECUTING';
  const isSpeaking = state === 'SPEAKING' || state === 'GREETING';
  const isListening = state === 'LISTENING';
  const isWakeDetected = state === 'WAKE_DETECTED' || state === 'OPENING';
  const isStandby = state === 'STANDBY';

  return (
    <svg className={cn('relative z-10', className)} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      {/* Antenna with live status glow */}
      <path d="M32 16V8" stroke="#20C466" strokeWidth="3" strokeLinecap="round" />
      <circle
        cx="32"
        cy="7"
        r="4"
        fill={isError ? '#FB923C' : '#20C466'}
        className={cn(
          (isListening || isStandby || isWakeDetected) && 'qb-nexus-antenna'
        )}
      />

      {/* Head chassis */}
      <rect x="14" y="16" width="36" height="26" rx="8" fill="#FFF" stroke="#173D30" strokeWidth="2.5" />
      <rect x="10" y="24" width="4" height="10" rx="2" fill={isError ? '#FB923C' : '#20C466'} />
      <rect x="50" y="24" width="4" height="10" rx="2" fill={isError ? '#FB923C' : '#20C466'} />
      <rect x="18" y="21" width="28" height="15" rx="5" fill="#173D30" />

      {/* Eyes & Expressions according to state */}
      {isError ? (
        <g stroke="#FB923C" strokeWidth="2" strokeLinecap="round">
          <path d="m23 26 5 2" /><path d="m41 26-5 2" />
          <circle cx="26" cy="30" r="1.3" fill="#FB923C" /><circle cx="38" cy="30" r="1.3" fill="#FB923C" />
        </g>
      ) : isSuccess ? (
        /* Happy arch eyes (^ ^) */
        <g stroke="#20C466" strokeWidth="2.2" strokeLinecap="round">
          <path d="m23 29 3-3 3 3" />
          <path d="m35 29 3-3 3 3" />
        </g>
      ) : isWakeDetected ? (
        /* Excited alert eyes */
        <g fill="#20C466">
          <circle cx="26" cy="28.5" r="3.5" />
          <circle cx="38" cy="28.5" r="3.5" />
          <circle cx="27" cy="27.5" r="1.2" fill="#FFF" />
          <circle cx="39" cy="27.5" r="1.2" fill="#FFF" />
        </g>
      ) : blinking ? (
        /* Blinking line eyes */
        <g stroke="#20C466" strokeWidth="2.2" strokeLinecap="round">
          <path d="M23 29h6" /><path d="M35 29h6" />
        </g>
      ) : (
        /* Default / Thinking / Speaking / Listening eyes */
        <g fill="#20C466">
          <circle cx={isThinking ? 27 : 26} cy={isThinking ? 27 : 28.5} r={isListening ? 3.2 : 3} />
          <circle cx={isThinking ? 39 : 38} cy={isThinking ? 27 : 28.5} r={isListening ? 3.2 : 3} />
        </g>
      )}

      {/* Eyebrow details for thinking / executing */}
      {isThinking && (
        <path d="M22 23c2-2 5-2 7 0m6 0c2-2 5-2 7 0" stroke="#20C466" strokeWidth="1.4" strokeLinecap="round" />
      )}

      {/* Mouth animation & patterns */}
      {isSpeaking ? (
        <ellipse cx="32" cy="33" rx="2.8" ry="2" fill="#20C466" className="qb-nexus-mouth" />
      ) : isListening ? (
        /* Active soundwave in mouth */
        <g stroke="#20C466" strokeWidth="1.4" strokeLinecap="round">
          <path d="M27 33v-1.5" />
          <path d="M30 34v-3" />
          <path d="M32 35v-4" />
          <path d="M34 34v-3" />
          <path d="M37 33v-1.5" />
        </g>
      ) : (
        <path
          d={
            isSuccess
              ? 'M27 32c2 3.5 8 3.5 10 0'
              : isError
              ? 'M29 34c2-2 4-2 6 0'
              : 'M29 33c1.5 1.5 4.5 1.5 6 0'
          }
          stroke={isError ? '#FB923C' : '#20C466'}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}

      {/* Body base */}
      <path d="M18 43C18 43 20 54 32 54C44 54 46 43 46 43" fill="#FFF" stroke="#173D30" strokeWidth="2.5" />
      <path d="M32 46C30 46 29 48 30 50C32 51 34 49 34 47C34 46.5 33 46 32 46Z" fill="#20C466" />

      {/* Orbiting particles for processing */}
      {isThinking && (
        <g className="qb-nexus-particles" fill="#20C466">
          <circle cx="9" cy="17" r="1.3" />
          <circle cx="55" cy="14" r="1" />
          <circle cx="52" cy="44" r="1.2" />
        </g>
      )}

      {/* Wake detected sparkles */}
      {isWakeDetected && (
        <g className="qb-nexus-sparkles" stroke="#B9F8D2" strokeWidth="1.5" strokeLinecap="round">
          <path d="M7 24v5m-2.5-2.5h5M55 19v6m-3-3h6" />
        </g>
      )}
    </svg>
  );
}

export function QbNexusPet() {
  return <ConversationProvider><QbNexusPetInner /></ConversationProvider>;
}

function QbNexusPetInner() {
  const token = useAuthStore((state) => state.token);
  const pathname = usePathname();
  const prevPathnameRef = React.useRef(pathname);
  const voiceBindingIdRef = React.useRef('');
  const voiceSessionActiveRef = React.useRef(false);
  const voiceSessionStartingRef = React.useRef(false);

  const conversation = useConversation({
    onConnect: async (conversationId) => {
      try {
        await api.post('/admin/ai/nexus/voice/bind', { conversationId, bindingId: voiceBindingIdRef.current });
        voiceBindingIdRef.current = '';
        if (!openRef.current || !mountedRef.current) { conversation.endSession(); return; }
        voiceSessionActiveRef.current = true;
        voiceSessionEnabledRef.current = true;
        setVoiceSessionEnabled(true);
        setVoiceState('LISTENING');
        setVoiceError('');
      } catch (error) {
        voiceBindingIdRef.current = '';
        setVoiceError(error?.response?.data?.message || 'Could not securely connect the voice session.');
        setVoiceState('ERROR');
        conversation.endSession();
      }
    },
    onDisconnect: () => {
      voiceSessionActiveRef.current = false;
      voiceSessionEnabledRef.current = false;
      setVoiceSessionEnabled(false);
      releaseMicrophoneStreams();
      stopAudioPlayback();
      if (mountedRef.current) setVoiceState('IDLE');
    },
    onError: (error) => {
      voiceSessionActiveRef.current = false;
      voiceSessionEnabledRef.current = false;
      setVoiceSessionEnabled(false);
      releaseMicrophoneStreams();
      stopAudioPlayback();
      setVoiceState('ERROR');
      setVoiceError(error?.message || 'ElevenLabs voice connection failed. Text chat remains available.');
    },
    onModeChange: (mode) => {
      if (!openRef.current) return;
      setVoiceState(mode === 'speaking' ? 'SPEAKING' : 'LISTENING');
    },
    onStatusChange: (status) => {
      if (status === 'connecting') setVoiceState('PROCESSING');
      if (status === 'disconnected') {
        voiceSessionActiveRef.current = false;
        if (mountedRef.current) setVoiceState('IDLE');
      }
    },
    onMessage: (event) => {
      const source = event?.source || event?.role;
      const sender = source === 'user' ? 'user' : source === 'ai' || source === 'agent' ? 'bot' : '';
      const content = String(event?.message || event?.text || event?.content || '').trim();
      if (!sender || !content) return;
      if (sender === 'user') {
        setVoiceText(content);
        setIsTyping(true);
        setVoiceState('PROCESSING');
      } else {
        setVoiceText('');
        setIsTyping(false);
      }
      setMessages((previous) => [...previous, {
        id: `voice-${sender}-${Date.now()}`,
        sender,
        text: content,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    },
    onInterruption: () => { if (openRef.current) setVoiceState('LISTENING'); },
  });

  // UI state
  const [open, setOpen] = React.useState(false);
  const openRef = React.useRef(false);
  const [minimized, setMinimized] = React.useState(false);
  const [tooltipVisible, setTooltipVisible] = React.useState(false);
  const [messages, setMessages] = React.useState(INITIAL_MESSAGES);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  // Explicit voice-session state
  const [voiceSessionEnabled, setVoiceSessionEnabled] = React.useState(false);
  const voiceSessionEnabledRef = React.useRef(false);

  // Robot State: IDLE | STANDBY | WAKE_DETECTED | OPENING | GREETING | LISTENING | PROCESSING | SPEAKING | EXECUTING | SUCCESS | ERROR
  const [voiceState, setVoiceState] = React.useState('IDLE');
  const [voiceText, setVoiceText] = React.useState('');
  const [voiceError, setVoiceError] = React.useState('');

  // Audio / Speech settings
  const [speakReplies, setSpeakReplies] = React.useState(true);
  const [showVoiceSettings, setShowVoiceSettings] = React.useState(false);
  const [selectedLanguage, setSelectedLanguage] = React.useState('en-US');
  const [primaryProvider, setPrimaryProvider] = React.useState('OPENAI');
  const [fallbackProvider, setFallbackProvider] = React.useState('GEMINI');
  const [voiceURI, setVoiceURI] = React.useState('');
  const [voiceRate, setVoiceRate] = React.useState(1);
  const [availableVoices, setAvailableVoices] = React.useState([]);
  const [voicePreviewLoading, setVoicePreviewLoading] = React.useState(false);
  const [micPermission, setMicPermission] = React.useState('prompt');
  const [showMicHelp, setShowMicHelp] = React.useState(false);
  const [blinking, setBlinking] = React.useState(false);
  const [pageVisible, setPageVisible] = React.useState(true);
  const [audioLevel, setAudioLevel] = React.useState(0);

  // References
  const messagesEndRef = React.useRef(null);
  const mediaStreamRef = React.useRef(null);
  const audioContextRef = React.useRef(null);
  const analyserRef = React.useRef(null);
  const audioRef = React.useRef(null);
  const speechResolveRef = React.useRef(null);
  const playbackGenerationRef = React.useRef(0);
  const voiceTimersRef = React.useRef(new Set());
  const mountedRef = React.useRef(false);
  const animFrameRef = React.useRef(null);

  // Compute overall pet state
  const petState = React.useMemo(() => {
    if (voiceError || voiceState === 'ERROR' || voiceState === 'PERMISSION_DENIED') return 'ERROR';
    if (voiceState === 'WAKE_DETECTED') return 'WAKE_DETECTED';
    if (voiceState === 'OPENING') return 'OPENING';
    if (voiceState === 'GREETING') return 'GREETING';
    if (voiceState === 'LISTENING') return 'LISTENING';
    if (voiceState === 'SPEAKING') return 'SPEAKING';
    if (voiceState === 'EXECUTING') return 'EXECUTING';
    if (voiceState === 'PROCESSING' || isTyping) return 'PROCESSING';
    if (voiceState === 'SUCCESS') return 'SUCCESS';
    if (voiceSessionEnabled) return 'STANDBY';
    return 'IDLE';
  }, [voiceError, voiceState, isTyping, voiceSessionEnabled]);

  // Keep refs in sync
  React.useEffect(() => {
    openRef.current = open;
  }, [open]);

  React.useEffect(() => {
    voiceSessionEnabledRef.current = voiceSessionEnabled;
  }, [voiceSessionEnabled]);

  React.useEffect(() => {
    try { conversation.setVolume({ volume: speakReplies ? 1 : 0 }); } catch {}
  }, [conversation.setVolume, speakReplies]);

  React.useEffect(() => {
    if (conversation.status !== 'connected') { setAudioLevel(0); return undefined; }
    let frame;
    const sample = () => {
      setAudioLevel(Math.min(100, Math.round((conversation.getInputVolume?.() || 0) * 100)));
      frame = requestAnimationFrame(sample);
    };
    frame = requestAnimationFrame(sample);
    return () => cancelAnimationFrame(frame);
  }, [conversation.status, conversation.mode, conversation.getInputVolume]);

  // Periodic Blink schedule
  React.useEffect(() => {
    mountedRef.current = true;
    if (petState !== 'IDLE' && petState !== 'STANDBY') {
      setBlinking(false);
      return undefined;
    }
    let blinkTimer;
    let reopenTimer;
    const schedule = () => {
      if (document.visibilityState !== 'visible') return;
      blinkTimer = setTimeout(() => {
        setBlinking(true);
        reopenTimer = setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 140);
      }, 4000 + Math.random() * 3000);
    };
    schedule();
    return () => {
      clearTimeout(blinkTimer);
      clearTimeout(reopenTimer);
    };
  }, [petState]);

  // Restore messages & preferences from localStorage
  React.useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {}

    try {
      const prefs = JSON.parse(localStorage.getItem(VOICE_PREFS_KEY) || '{}');
      if (prefs.language && SUPPORTED_LANGUAGES.some((l) => l.code === prefs.language)) {
        setSelectedLanguage(prefs.language);
      }
      if (prefs.primaryProvider) setPrimaryProvider(prefs.primaryProvider);
      if (prefs.fallbackProvider) setFallbackProvider(prefs.fallbackProvider);
      if (prefs.voiceURI) setVoiceURI(prefs.voiceURI);
      if (prefs.voiceRate) setVoiceRate(prefs.voiceRate);
      if (typeof prefs.speakReplies === 'boolean') setSpeakReplies(prefs.speakReplies);

      localStorage.setItem(LEGACY_WAKE_ENABLED_KEY, 'false');
    } catch {}

    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' }).then((permission) => {
        setMicPermission(permission.state);
        permission.onchange = () => {
          setMicPermission(permission.state);
          if (permission.state === 'granted') {
            setVoiceError('');
            setShowMicHelp(false);
          }
        };
      }).catch(() => {});
    }

    api.get('/admin/ai/nexus/voice/voices').then((response) => {
      const data = response?.data?.data || {};
      const voices = Array.isArray(data.voices) ? data.voices : [];
      setAvailableVoices(voices.map((voice) => ({ voiceURI: voice.id, name: voice.name, lang: voice.labels?.language || voice.category || 'ElevenLabs' })));
      if (data.voiceId) setVoiceURI((current) => current || data.voiceId);
    }).catch(() => setAvailableVoices([]));

    return () => {
    };
  }, []);

  // Save messages to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Save voice preferences
  React.useEffect(() => {
    try {
      localStorage.setItem(
        VOICE_PREFS_KEY,
        JSON.stringify({
          language: selectedLanguage,
          primaryProvider,
          fallbackProvider,
          voiceURI,
          voiceRate,
          speakReplies,
        })
      );
    } catch {}
  }, [selectedLanguage, primaryProvider, fallbackProvider, voiceURI, voiceRate, speakReplies]);

  // Auto-scroll chat
  React.useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  function scheduleVoice(callback, delay) {
    if (!mountedRef.current) return null;
    const timer = setTimeout(() => {
      voiceTimersRef.current.delete(timer);
      if (mountedRef.current) callback();
    }, delay);
    voiceTimersRef.current.add(timer);
    return timer;
  }

  function clearVoiceTimers() {
    voiceTimersRef.current.forEach((t) => clearTimeout(t));
    voiceTimersRef.current.clear();
  }

  function stopAudioPlayback() {
    playbackGenerationRef.current += 1;
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch {}
      audioRef.current = null;
    }
    speechResolveRef.current?.();
    speechResolveRef.current = null;
  }

  // Release all audio tracks and AudioContext
  const releaseMicrophoneStreams = React.useCallback(() => {
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((track) => {
          try { track.stop(); } catch {}
        });
      } catch {}
      mediaStreamRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  const stopAllVoiceResources = React.useCallback((options = {}) => {
    const { resetVoiceEnabled = false, resetWakeEnabled = false, keepError = false } = options;
    clearVoiceTimers();
    stopAudioPlayback();
    releaseMicrophoneStreams();
    try { conversation.endSession(); } catch {}
    voiceBindingIdRef.current = '';
    voiceSessionActiveRef.current = false;
    voiceSessionStartingRef.current = false;
    setVoiceText('');
    if (!keepError) setVoiceError('');
    if (resetVoiceEnabled || resetWakeEnabled) {
      voiceSessionEnabledRef.current = false;
      setVoiceSessionEnabled(false);
      try { localStorage.setItem(LEGACY_WAKE_ENABLED_KEY, 'false'); } catch {}
    }
    setVoiceState('IDLE');
  }, [releaseMicrophoneStreams, conversation.endSession]);

  React.useEffect(() => () => stopAllVoiceResources({ resetVoiceEnabled: true }), [stopAllVoiceResources]);

  /**
   * Request microphone permission and setup AudioContext for Voice Activity Detection
   */
  async function ensureMicrophoneStream() {
    if (mediaStreamRef.current?.active) {
      return mediaStreamRef.current;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setVoiceError('Microphone requires a secure HTTPS or localhost origin.');
      setVoiceState('ERROR');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermission('granted');
      setVoiceError('');

      // Setup Web Audio Analyser for real-time VAD sound waves
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!analyserRef.current || !mountedRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(checkVolume);
          };
          animFrameRef.current = requestAnimationFrame(checkVolume);
        }
      } catch {}

      return stream;
    } catch (error) {
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setVoiceState('PERMISSION_DENIED');
        setVoiceError('Microphone access denied. You can continue using text chat.');
      } else if (error?.name === 'NotFoundError') {
        setVoiceState('ERROR');
        setVoiceError('No microphone detected on your device.');
      } else {
        setVoiceState('ERROR');
        setVoiceError('Microphone could not be started. Check browser permissions.');
      }
      return null;
    }
  }

  /** Speak only with ElevenLabs. A voice failure never falls back to browser TTS. */
  async function speakText(text) {
    if (!text || !speakReplies) return;
    stopAudioPlayback();
    const generation = playbackGenerationRef.current;
    try {
      const response = await api.post('/admin/ai/nexus/voice/speak', { text, voiceId: voiceURI || undefined, speed: voiceRate });
      const data = response?.data?.data || {};
      if (generation !== playbackGenerationRef.current || !openRef.current) return;
      if (!data.success || !data.audio) {
        setVoiceError(data.message || 'ElevenLabs voice is not configured.');
        return;
      }
      await new Promise((resolve) => {
        speechResolveRef.current = resolve;
        const audio = new Audio(data.audio);
        audioRef.current = audio;
        const finish = () => {
          audioRef.current = null;
          speechResolveRef.current = null;
          resolve();
        };
        audio.onended = finish;
        audio.onerror = () => { setVoiceError('ElevenLabs could not play the response audio.'); finish(); };
        audio.play().catch(() => { setVoiceError('ElevenLabs could not play the response audio.'); finish(); });
      });
    } catch (error) {
      setVoiceError(error?.response?.data?.message || 'ElevenLabs could not synthesize a response.');
    }
  }

  /**
   * Phase 4: Command Processing & Database Operations
   */
  async function handleProcessCommand(commandText) {
    const query = String(commandText || '').trim();
    if (!query) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: query,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setInput('');
    setVoiceError('');
    setIsTyping(true);
    setVoiceState('PROCESSING');

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome-msg' && !m.isGreeting && (m.sender === 'user' || m.sender === 'bot'))
        .slice(-12)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: String(m.text || '').slice(0, 1600),
        }));

      const response = await api.post('/admin/ai/nexus/chat', {
        message: query,
        history,
        primaryProvider,
        fallbackProvider,
      });

      const resData = response?.data?.data || {};
      const replyText = resData.answer || response?.data?.answer || 'I have completed your request.';

      // Add assistant response
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          provider: resData.provider,
          pendingAction: resData.pendingAction,
          executedAction: resData.executedAction,
          suggestions: resData.suggestions,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      // Speak response using ElevenLabs
      setVoiceState('SPEAKING');
      await speakText(replyText, selectedLanguage);

      // Transition to SUCCESS
      setVoiceState('SUCCESS');
      scheduleVoice(() => {
        // Keep the active voice session listening, or return to idle
        setVoiceState(voiceSessionActiveRef.current ? 'LISTENING' : 'IDLE');
        if (voiceSessionEnabledRef.current) {
        }
      }, 1000);
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Nexus could not answer right now. Please try again.';
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: errMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setVoiceError(errMsg);
      setVoiceState('ERROR');
      scheduleVoice(() => {
        setVoiceState(voiceSessionActiveRef.current ? 'LISTENING' : 'IDLE');
      }, 2000);
    } finally {
      setIsTyping(false);
    }
  }

  /**
   * Action Confirmation handler
   */
  async function handleConfirmAction(actionId, confirm) {
    setIsTyping(true);
    setVoiceError('');
    setVoiceState('EXECUTING');

    try {
      const response = await api.post('/admin/ai/nexus/chat', {
        message: confirm ? 'confirm' : 'cancel',
        actionId,
        confirm,
        primaryProvider,
        fallbackProvider,
      });
      const resData = response?.data?.data || {};
      const replyText = resData.answer || (confirm ? 'Action executed successfully.' : 'Action cancelled.');

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          provider: resData.provider,
          pendingAction: resData.pendingAction,
          executedAction: resData.executedAction,
          suggestions: resData.suggestions,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      setVoiceState('SPEAKING');
      await speakText(replyText, selectedLanguage);

      setVoiceState('SUCCESS');
      scheduleVoice(() => {
        setVoiceState(voiceSessionActiveRef.current ? 'LISTENING' : 'IDLE');
      }, 1000);
    } catch (error) {
      const errMsg = error?.response?.data?.message || 'Failed to process confirmation.';
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: errMsg,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setVoiceState('ERROR');
    } finally {
      setIsTyping(false);
    }
  }

  /** Start or stop the user-started ElevenLabs voice session. */
  async function startElevenLabsVoice() {
    if (voiceSessionStartingRef.current || voiceSessionActiveRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) {
      setVoiceState('ERROR');
      setVoiceError('This browser does not support live voice. Continue with text chat or use a current browser.');
      return;
    }
    voiceSessionStartingRef.current = true;
    setVoiceError('');
    setVoiceState('REQUESTING_PERMISSION');
    try {
      const permissionStream = await ensureMicrophoneStream();
      if (!permissionStream) return;
      releaseMicrophoneStreams();
      const response = await api.post('/admin/ai/nexus/voice/token');
      const data = response?.data?.data || {};
      if (!data.token || !data.bindingId) throw new Error('Could not start the ElevenLabs voice session.');
      if (!openRef.current || !mountedRef.current) return;
      voiceBindingIdRef.current = data.bindingId;
      setVoiceState('PROCESSING');
      conversation.startSession({
        conversationToken: data.token,
        connectionType: 'webrtc',
        overrides: {
          agent: { language: selectedLanguage.slice(0, 2) },
          tts: { voiceId: voiceURI || data.voiceId || undefined, speed: voiceRate },
          asr: { keywords: ['Nexus', 'QB Suite'] },
        },
      });
    } catch (error) {
      voiceBindingIdRef.current = '';
      setVoiceState('ERROR');
      setVoiceError(error?.response?.data?.message || error?.message || 'Could not start ElevenLabs voice. Text chat remains available.');
    } finally {
      voiceSessionStartingRef.current = false;
    }
  }

  async function testSelectedVoice() {
    if (!voiceURI || voicePreviewLoading) return;
    setVoicePreviewLoading(true);
    setVoiceError('');
    try {
      const response = await api.post('/admin/ai/nexus/voice/test', { voiceId: voiceURI, text: 'Hello, this is your QB Nexus voice preview.' });
      const data = response?.data?.data || {};
      if (!data.audio) throw new Error('ElevenLabs did not return a voice preview.');
      stopAudioPlayback();
      const generation = playbackGenerationRef.current;
      await new Promise((resolve, reject) => {
        const audio = new Audio(data.audio);
        audioRef.current = audio;
        const finish = () => { audioRef.current = null; speechResolveRef.current = null; resolve(); };
        const fail = () => { audioRef.current = null; speechResolveRef.current = null; reject(new Error('The voice preview could not be played.')); };
        speechResolveRef.current = finish;
        audio.onended = finish;
        audio.onerror = fail;
        if (generation !== playbackGenerationRef.current || !openRef.current) finish();
        else audio.play().catch(fail);
      });
    } catch (error) {
      setVoiceError(error?.response?.data?.message || error?.message || 'Could not test the selected voice.');
    } finally { setVoicePreviewLoading(false); }
  }

  /** Start or stop the user-started ElevenLabs voice session. */
  async function handleToggleVoiceSession() {
    if (voiceSessionActiveRef.current || voiceSessionStartingRef.current) {
      stopAllVoiceResources({ resetVoiceEnabled: true });
      return;
    }
    await startElevenLabsVoice();
  }

  async function handleManualMicClick() {
    if (voiceSessionActiveRef.current) {
      if (conversation.isMuted) {
        conversation.setMuted(false);
        setVoiceState('LISTENING');
      } else if (conversation.isSpeaking) {
        conversation.sendUserActivity();
        setVoiceState('LISTENING');
      } else {
        conversation.setMuted(true);
        setVoiceText('');
        setVoiceState('IDLE');
      }
      return;
    }
    await startElevenLabsVoice();
  }

  /** Closing the chat ends the session and releases all audio resources. */
  const handleCloseChat = React.useCallback(() => {
    stopAllVoiceResources({ resetVoiceEnabled: true });
    setOpen(false);
    openRef.current = false;
    setMinimized(false);
    setShowVoiceSettings(false);
  }, [stopAllVoiceResources]);

  // Handle Next.js route navigation
  React.useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (openRef.current) handleCloseChat();
    }
  }, [pathname, handleCloseChat]);

  // Handle logout: release all microphone resources
  React.useEffect(() => {
    if (!token) {
      stopAllVoiceResources({ resetVoiceEnabled: true });
      setOpen(false);
    }
  }, [token, stopAllVoiceResources]);

  // Handle browser tab suspension
  React.useEffect(() => {
    const onVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setPageVisible(isVisible);
      if (!isVisible) {
        stopAllVoiceResources({ resetVoiceEnabled: true });
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [stopAllVoiceResources]);

  const session = readSession();
  const userName = session?.user?.firstName || session?.user?.name || 'Administrator';

  if (!token) return null;

  return (
    <>
      <style>{`
        @keyframes qb-nexus-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -4px } }
        @keyframes qb-nexus-wake { 0%,100% { transform: translateY(0) scale(1) } 30% { transform: translateY(-9px) scale(1.08) } 65% { transform: translateY(2px) scale(.98) } }
        @keyframes qb-nexus-pulse { 0%,100% { opacity:.35; transform:scale(.94) } 50% { opacity:.85; transform:scale(1.08) } }
        @keyframes qb-nexus-speak { 0%,100% { transform:scaleY(.7) } 50% { transform:scaleY(1.3) } }
        @keyframes qb-nexus-particle { 0%,100% { opacity:.25; transform:translateY(1px) } 50% { opacity:1; transform:translateY(-3px) } }
        @keyframes qb-nexus-ring { 0% { transform:scale(.85); opacity:.8 } 100% { transform:scale(1.4); opacity:0 } }
        .qb-nexus-idle { animation:qb-nexus-float 3.6s ease-in-out infinite }
        .qb-nexus-waking { animation:qb-nexus-wake .7s ease-out 1 }
        .qb-nexus-listening-ring { animation:qb-nexus-ring 1.6s ease-out infinite }
        .qb-nexus-standby { box-shadow:0 0 20px rgba(32,196,102,.4),0 12px 34px rgba(23,61,48,.28) }
        .qb-nexus-thinking { box-shadow:0 0 0 2px #20c466,0 0 25px rgba(32,196,102,.55),0 16px 38px rgba(23,61,48,.28) }
        .qb-nexus-error { border-color:#fb923c!important; box-shadow:0 0 20px rgba(251,146,60,.28) }
        .qb-nexus-antenna { animation:qb-nexus-pulse 1.8s ease-in-out infinite; transform-origin:32px 7px }
        .qb-nexus-mouth { animation:qb-nexus-speak .22s ease-in-out infinite; transform-origin:center }
        .qb-nexus-particles circle { animation:qb-nexus-particle 1.8s ease-in-out infinite }
        .qb-nexus-particles circle:nth-child(2) { animation-delay:.35s }
        .qb-nexus-particles circle:nth-child(3) { animation-delay:.7s }
        .qb-nexus-sparkles { animation:qb-nexus-pulse .65s ease-in-out 3 }
        @media (prefers-reduced-motion: reduce) {
          .qb-nexus-idle, .qb-nexus-waking, .qb-nexus-listening-ring, .qb-nexus-antenna, .qb-nexus-mouth, .qb-nexus-particles circle, .qb-nexus-sparkles { animation:none!important }
        }
      `}</style>

      {/* Floating Robot Avatar & Voice Session Indicator */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)] z-40 flex flex-col items-end gap-2">
        {/* Voice never runs while chat is closed. */}
        {voiceSessionEnabled && !open && (
          <div className="flex items-center gap-1.5 rounded-full bg-[#173D30] text-white px-3 py-1 text-[11px] font-medium shadow-lg border border-[#20C466]/40 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20C466] opacity-75" />
              <span className="relative inline-flex rounded-full size-2 bg-[#20C466]" />
            </span>
            <span>ElevenLabs voice active</span>
            <span className="text-[9px] px-1 rounded bg-white/10 uppercase text-emerald-300">
              {selectedLanguage.slice(0, 2)}
            </span>
            <button
              type="button"
              onClick={handleToggleVoiceSession}
              title="End voice session"
              className="ml-1 rounded-full p-0.5 text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="End voice session"
            >
              <Pause className="size-3" />
            </button>
          </div>
        )}

        {/* Welcome Tooltip */}
        {tooltipVisible && !open && !voiceSessionEnabled && (
          <div className="relative max-w-[240px] rounded-2xl bg-white border border-emerald-200/90 p-3 shadow-lg text-xs text-slate-700 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
            <button
              onClick={() => setTooltipVisible(false)}
              className="absolute top-1.5 right-1.5 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss tooltip"
            >
              <X className="size-3" />
            </button>
            <div className="mb-0.5 flex items-center gap-1.5 font-semibold text-[#173D30]">
              <span className="size-2 rounded-full bg-[#20C466] motion-safe:animate-ping" />
              <span>Ask QB Nexus</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Hi {userName}! Click here to chat with QB Nexus.
            </p>
            <div className="absolute -bottom-1.5 right-6 size-3 rotate-45 border-r border-b border-emerald-200 bg-white" />
          </div>
        )}

        {/* Main Floating Robot Button */}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
            setTooltipVisible(false);
          }}
          aria-label="Open QB Nexus AI Assistant"
          className={cn(
            'qb-nexus-button group relative flex size-14 sm:size-[68px] lg:size-[76px] items-center justify-center rounded-[22px] border-2 border-[#20C466]/90 bg-gradient-to-br from-[#173D30] via-[#123026] to-[#0d221b] text-white shadow-[0_12px_34px_rgba(23,61,48,.28),0_0_20px_rgba(32,196,102,.28)] transition-all duration-300 hover:scale-[1.06] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50',
            pageVisible && ['IDLE', 'STANDBY'].includes(petState) && 'qb-nexus-idle',
            petState === 'STANDBY' && 'qb-nexus-standby',
            petState === 'WAKE_DETECTED' && 'qb-nexus-waking',
            petState === 'LISTENING' && 'ring-4 ring-[#20C466]/70 ring-offset-2 ring-offset-white',
            petState === 'PROCESSING' && 'qb-nexus-thinking',
            petState === 'ERROR' && 'qb-nexus-error'
          )}
        >
          {/* Subtle glow / wave ring */}
          <span className="pointer-events-none absolute -inset-1 rounded-[25px] bg-[#20C466]/20 blur-md transition-colors group-hover:bg-[#20C466]/40" />
          {petState === 'LISTENING' && (
            <span className="qb-nexus-listening-ring pointer-events-none absolute inset-1 rounded-full border-2 border-[#20C466]/80" />
          )}

          {/* Sparkles on Wake Detected */}
          {petState === 'WAKE_DETECTED' && (
            <Sparkles className="absolute -right-3 -top-3 size-5 text-[#B9F8D2] drop-shadow-[0_0_6px_#20C466]" />
          )}

          {/* Sound waves when speaking */}
          {petState === 'SPEAKING' && (
            <span className="absolute -bottom-1 flex h-2.5 items-center gap-1" aria-hidden="true">
              <i className="h-1 w-1 rounded-full bg-[#20C466] motion-safe:animate-pulse" />
              <i className="h-2.5 w-1 rounded-full bg-[#20C466] motion-safe:animate-pulse [animation-delay:120ms]" />
              <i className="h-1.5 w-1 rounded-full bg-[#20C466] motion-safe:animate-pulse [animation-delay:240ms]" />
            </span>
          )}

          <NexusFace
            state={petState}
            blinking={blinking}
            className="size-11 sm:size-[52px] lg:size-[58px] transition-transform group-hover:rotate-2"
          />

          {/* Online badge */}
          <span
            title={voiceSessionEnabled ? 'ElevenLabs voice active' : 'QB Nexus online'}
            className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-white"
          >
            <span
              className={cn(
                'relative size-3 rounded-full border border-white',
                voiceSessionEnabled
                  ? 'bg-[#20C466] shadow-[0_0_10px_#20C466]'
                  : token
                  ? 'bg-emerald-500'
                  : 'bg-slate-400'
              )}
            />
          </span>
        </button>
      </div>

      {/* Expandable QB Nexus Panel */}
      {open && !minimized && (
        <div
          role="dialog"
          aria-label="QB Nexus Assistant"
          className={cn(
            'fixed z-50 bg-white shadow-2xl transition-all duration-300 border border-slate-200/90 overflow-hidden flex flex-col',
            'bottom-0 right-0 w-full sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)] sm:w-[380px] md:w-[420px] sm:rounded-2xl',
            'top-0 h-[100dvh] sm:top-auto sm:h-[min(620px,calc(100dvh-3rem))]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#173D30] text-white shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-[#20C466] border border-emerald-400/30">
                <NexusFace state={petState} blinking={blinking} className="size-7" />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">QB Nexus AI</h3>
                  <span
                    aria-live="polite"
                    className="rounded-full bg-emerald-400/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300 border border-emerald-400/30"
                  >
                    {voiceState === 'PERMISSION_DENIED'
                      ? 'Mic Denied'
                      : petState === 'WAKE_DETECTED'
                      ? 'Waking up'
                      : petState === 'GREETING'
                      ? 'Greeting'
                      : petState === 'LISTENING'
                      ? 'Listening...'
                      : petState === 'PROCESSING'
                      ? 'Thinking'
                      : petState === 'EXECUTING'
                      ? 'Executing Action'
                      : petState === 'SPEAKING'
                      ? 'Speaking'
                      : petState === 'SUCCESS'
                      ? 'Ready'
                      : petState === 'ERROR'
                      ? 'Notice'
                      : voiceSessionEnabled
                      ? 'Voice Active'
                      : 'Online'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80">OpenAI + Gemini reasoning · ElevenLabs voice</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleVoiceSession}
                title={voiceSessionEnabled ? 'End ElevenLabs voice session' : 'Start ElevenLabs voice session'}
                className={cn(
                  'size-7 rounded-lg flex items-center justify-center transition-colors',
                  voiceSessionEnabled
                    ? 'bg-emerald-500/30 text-[#20C466] border border-emerald-400/40'
                    : 'text-emerald-200/80 hover:bg-white/10 hover:text-white'
                )}
                aria-label={voiceSessionEnabled ? 'End voice session' : 'Start voice session'}
              >
                <Radio className={cn('size-3.5', voiceSessionEnabled && 'animate-pulse')} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMessages(INITIAL_MESSAGES);
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                  } catch {}
                }}
                title="Clear chat context"
                className="size-7 rounded-lg text-emerald-200/80 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Clear chat"
              >
                <RotateCcw className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowVoiceSettings((prev) => !prev)}
                title="Voice, Language & Provider Settings"
                className={cn(
                  'size-7 rounded-lg text-emerald-200/80 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors',
                  showVoiceSettings && 'bg-white/10 text-white'
                )}
                aria-label="Settings"
              >
                <Settings2 className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setMinimized(true)}
                title="Minimize"
                className="size-7 rounded-lg text-emerald-200/80 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Minimize"
              >
                <Minimize2 className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCloseChat}
                title="Close"
                className="size-7 rounded-lg text-emerald-200/80 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* Active Voice Banner & Microphone Status */}
          <div className="shrink-0 border-b border-emerald-100 bg-[#F0FAF3] px-3 py-2">
            {voiceState === 'PERMISSION_DENIED' ? (
              <div role="alert" className="text-[11px] text-amber-800 bg-amber-50/90 rounded-lg p-2.5 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MicOff className="size-3.5 text-amber-600 shrink-0" />
                    <span className="font-medium truncate">{voiceError || 'Microphone access denied. You can continue using text chat.'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowMicHelp((prev) => !prev)}
                      className="text-[10px] font-semibold text-amber-700 underline hover:text-amber-900"
                    >
                      {showMicHelp ? 'Hide guide' : 'How to allow'}
                    </button>
                    <button
                      type="button"
                      onClick={handleToggleVoiceSession}
                      className="rounded bg-amber-600 px-2 py-0.5 text-[10px] font-semibold text-white hover:bg-amber-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
                {showMicHelp && (
                  <div className="pt-1.5 border-t border-amber-200 text-[10px] text-slate-700 space-y-1">
                    <p className="font-semibold text-amber-900">How to unblock the microphone in your browser:</p>
                    <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                      <li>Click the <strong>tune/lock icon 🔒</strong> on the left side of your address bar.</li>
                      <li>Find <strong>Microphone</strong> and switch it from <em>Block</em> to <strong>Allow</strong>.</li>
                      <li>On macOS: Open <strong>System Settings → Privacy & Security → Microphone</strong> and permit your browser.</li>
                      <li>Click <strong>Retry</strong> above.</li>
                    </ol>
                  </div>
                )}
              </div>
            ) : !voiceSessionEnabled ? (
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-[#173D30]">ElevenLabs voice session</p>
                  <p className="text-[10px] text-slate-500">Microphone access starts only after you choose to start voice.</p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleVoiceSession}
                  className="rounded-lg bg-[#173D30] hover:bg-[#123026] px-2.5 py-1 text-[10px] font-semibold text-white flex items-center gap-1"
                >
                  <Radio className="size-3 text-[#20C466]" />
                  Start Voice
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-[#173D30]">
                  <span className="size-2 shrink-0 rounded-full bg-[#20C466] animate-pulse" />
                  {voiceState === 'LISTENING'
                    ? "Listening to your instruction..."
                    : voiceState === 'WAKE_DETECTED'
                    ? 'Nexus is ready to listen...'
                    : voiceState === 'GREETING'
                    ? 'Acknowledging...'
                    : voiceState === 'PROCESSING'
                    ? 'Analyzing database records...'
                    : voiceState === 'EXECUTING'
                    ? 'Executing confirmed action...'
                    : voiceState === 'SPEAKING'
                    ? 'Nexus is speaking...'
                    : 'ElevenLabs session active — speak your question'}
                </span>

                {/* Live sound wave bars when active */}
                <div className="flex items-center gap-1">
                  {voiceState === 'LISTENING' && (
                    <span className="flex h-3.5 items-center gap-0.5" aria-label="Microphone active">
                      <i className="h-1.5 w-0.5 animate-pulse rounded bg-[#20C466]" />
                      <i className="h-3 w-0.5 animate-pulse rounded bg-[#20C466] [animation-delay:120ms]" />
                      <i className="h-2 w-0.5 animate-pulse rounded bg-[#20C466] [animation-delay:240ms]" />
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleVoiceSession}
                    className="text-[10px] text-slate-500 hover:text-rose-600 font-medium"
                  >
                    Pause
                  </button>
                </div>
              </div>
            )}

            {voiceText && voiceState === 'LISTENING' && (
              <p className="mt-1 truncate text-[10px] text-slate-600 bg-white/70 px-2 py-0.5 rounded border border-emerald-100">
                &ldquo;{voiceText}&rdquo;
              </p>
            )}
            {voiceError && voiceState !== 'PERMISSION_DENIED' && (
              <div role="alert" className="mt-1 flex items-start justify-between gap-2 text-[10px] text-rose-700">
                <span>{voiceError}</span>
                <button
                  type="button"
                  onClick={() => setVoiceError('')}
                  className="shrink-0 font-semibold"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Voice, Language & Provider Settings Drawer */}
          {showVoiceSettings && (
            <section
              aria-label="QB Nexus Voice and Engine Settings"
              className="max-h-[45vh] shrink-0 space-y-2.5 overflow-y-auto border-b border-emerald-100 bg-white px-3 py-2.5 text-[11px]"
            >
              {/* Language Selection */}
              <div className="space-y-1">
                <span className="block font-semibold text-slate-700">Preferred Language (ElevenLabs TTS & Ack)</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setSelectedLanguage(lang.code)}
                      className={cn(
                        'flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-colors',
                        selectedLanguage === lang.code
                          ? 'border-[#20C466] bg-emerald-50 text-[#173D30] font-semibold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <span>{lang.nativeLabel}</span>
                      <span className="text-[9px] text-slate-400">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Acknowledgement Preview */}
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-medium text-slate-500">Spoken Acknowledgement Phrase:</span>
                <p className="text-[11px] font-semibold text-[#173D30]">
                  &ldquo;{SUPPORTED_LANGUAGES.find((l) => l.code === selectedLanguage)?.ack}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                <label className="space-y-1">
                  <span className="block font-semibold text-slate-700">ElevenLabs voice</span>
                  <select value={voiceURI} onChange={(event) => setVoiceURI(event.target.value)} className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-slate-700">
                    <option value="">Default configured voice</option>
                    {availableVoices.map((voice) => <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} · {voice.lang}</option>)}
                  </select>
                </label>
                <button type="button" onClick={testSelectedVoice} disabled={!voiceURI || voicePreviewLoading} className="h-8 rounded-lg border border-emerald-200 px-2.5 font-semibold text-[#173D30] disabled:opacity-50">{voicePreviewLoading ? 'Testing…' : 'Test voice'}</button>
              </div>

              {/* AI Orchestration Providers */}
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="block font-medium text-slate-600">Primary AI Provider</span>
                  <select
                    value={primaryProvider}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrimaryProvider(val);
                      if (fallbackProvider === val) setFallbackProvider(val === 'OPENAI' ? 'GEMINI' : 'OPENAI');
                    }}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-slate-700"
                  >
                    <option value="OPENAI">OpenAI (Primary)</option>
                    <option value="GEMINI">Google Gemini</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block font-medium text-slate-600">Fallback Provider</span>
                  <select
                    value={fallbackProvider}
                    onChange={(e) => setFallbackProvider(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-slate-700"
                  >
                    <option value="GEMINI" disabled={primaryProvider === 'GEMINI'}>Google Gemini (Fallback)</option>
                    <option value="OPENAI" disabled={primaryProvider === 'OPENAI'}>OpenAI (Fallback)</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </label>
              </div>

              {/* Voice Speed */}
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="block font-medium text-slate-600">Speech Engine</span>
                  <input
                    value="ElevenLabs Multilingual v2"
                    readOnly
                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 text-slate-600"
                  />
                </label>
                <label className="space-y-1">
                  <span className="block font-medium text-slate-600">Speech Rate</span>
                  <select
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(Number(e.target.value))}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-slate-700"
                  >
                    <option value={0.85}>Relaxed (0.85x)</option>
                    <option value={1}>Natural (1.0x)</option>
                    <option value={1.15}>Fast (1.15x)</option>
                  </select>
                </label>
              </div>

              {/* Security & Lifecycle Notes */}
              <p className="text-[9px] leading-relaxed text-slate-400 pt-1 border-t border-slate-100">
                Voice is opt-in. Closing chat, logging out, or hiding this tab ends the ElevenLabs session and releases audio. The microphone does not reactivate when chat reopens.
              </p>
            </section>
          )}

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F9F8] text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex flex-col', msg.sender === 'user' ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed text-xs break-words',
                    msg.sender === 'user'
                      ? 'bg-[#173D30] text-white rounded-br-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  )}
                >
                  <div className="leading-relaxed whitespace-pre-wrap">{renderFormattedText(msg.text)}</div>
                </div>

                {/* Pending Action Confirmation Card */}
                {msg.pendingAction && (
                  <div className="mt-2.5 max-w-[90%] rounded-xl border border-amber-300 bg-amber-50/80 p-3 text-slate-800 shadow-xs motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-900 mb-1">
                      <AlertTriangle className="size-3.5 text-amber-600 shrink-0" />
                      <span>{msg.pendingAction.title || 'Action Confirmation Required'}</span>
                    </div>
                    {msg.pendingAction.summary && (
                      <div className="mt-1 space-y-1 text-[11px] text-slate-700 bg-white/70 p-2 rounded border border-amber-200">
                        {Object.entries(msg.pendingAction.summary).map(([key, val]) => (
                          <div key={key} className="flex justify-between gap-2">
                            <span className="capitalize text-slate-500">{key.replace(/([A-Z])/g, ' $1')}:</span>
                            <span className="font-medium text-slate-800 text-right">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="mt-2.5 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(msg.pendingAction.id, false)}
                        className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200/60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmAction(msg.pendingAction.id, true)}
                        className="rounded-lg bg-[#20C466] hover:bg-[#1BB35B] px-3 py-1 text-[11px] font-semibold text-white shadow-2xs flex items-center gap-1"
                      >
                        <Check className="size-3" /> Confirm & Execute
                      </button>
                    </div>
                  </div>
                )}

                {/* Executed Action Receipt */}
                {msg.executedAction && (
                  <div className="mt-2 max-w-[90%] rounded-lg border border-emerald-200 bg-emerald-50/80 p-2 text-emerald-900 text-[11px] flex items-center gap-1.5">
                    <CheckCircle className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Action executed and logged to audit trail ({msg.executedAction.type}).</span>
                  </div>
                )}

                {/* Suggestions Pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[95%]">
                    {msg.suggestions.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleProcessCommand(suggestion)}
                        className="rounded-full bg-white border border-emerald-200/80 px-2.5 py-1 text-[10px] text-[#173D30] hover:bg-emerald-50 transition-colors shadow-2xs text-left"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form & Speech Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessCommand(input);
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <button
              type="button"
              onClick={handleManualMicClick}
              className={cn(
                'size-9 rounded-xl border flex items-center justify-center shrink-0 transition-colors',
                voiceState === 'LISTENING'
                  ? 'border-emerald-400 bg-emerald-50 text-[#20C466]'
                  : ['SPEAKING', 'GREETING'].includes(voiceState)
                  ? 'border-amber-300 bg-amber-50 text-amber-700'
                  : voiceState === 'PERMISSION_DENIED'
                  ? 'border-amber-200 text-amber-600 hover:bg-amber-50'
                  : 'border-slate-200 text-[#173D30] hover:bg-emerald-50'
              )}
              aria-label="Microphone"
              title={
                voiceState === 'LISTENING'
                  ? 'Stop listening'
                  : ['SPEAKING', 'GREETING'].includes(voiceState)
                  ? 'Interrupt speech'
                  : 'Speak to Nexus'
              }
            >
              {voiceState === 'LISTENING' || ['SPEAKING', 'GREETING'].includes(voiceState) ? (
                <Square className="size-3.5" />
              ) : voiceState === 'PERMISSION_DENIED' ? (
                <MicOff className="size-4 text-amber-600" />
              ) : (
                <Mic className="size-4" />
              )}
            </button>

            <input
              type="text"
              placeholder="Ask Nexus anything about your business..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173D30]"
            />

            <button
              type="submit"
              disabled={!input.trim()}
              className="size-9 rounded-xl bg-[#20C466] hover:bg-[#1BB35B] disabled:opacity-40 text-white flex items-center justify-center transition-colors shadow-2xs shrink-0"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </form>

          {/* Bottom Bar: Voice Toggle & Speech Replies */}
          <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3 py-1.5 text-[10px] text-slate-500">
            <button
              type="button"
              onClick={() => {
                const next = !speakReplies;
                setSpeakReplies(next);
                if (!next) stopAudioPlayback();
              }}
              className="inline-flex items-center gap-1 hover:text-[#173D30]"
            >
              {speakReplies ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}
              <span>{speakReplies ? 'Voice response on' : 'Voice response off'}</span>
            </button>

            <div className="flex items-center gap-2">
              {['SPEAKING', 'GREETING'].includes(voiceState) && (
                <button type="button" onClick={() => { try { conversation.sendUserActivity(); } catch {} stopAudioPlayback(); setVoiceState('LISTENING'); }} className="text-rose-600 font-medium">
                  Interrupt
                </button>
              )}
              <button
                type="button"
                onClick={handleToggleVoiceSession}
                className={cn(
                  'inline-flex items-center gap-1 font-medium',
                  voiceSessionEnabled ? 'text-emerald-700 hover:text-emerald-900' : 'hover:text-[#173D30]'
                )}
              >
                <Radio className="size-3" />
                <span>{voiceSessionEnabled ? 'Voice session on' : 'Voice session off'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
