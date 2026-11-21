'use client';

import * as React from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { readSession } from '@/lib/auth/admin-session';
import { useAuthStore } from '../../../lib/store';
import api from '../../../lib/api';

const STORAGE_KEY = 'qb_nexus_chat_history_v1';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-msg',
    sender: 'bot',
    text: "Hello! I'm QB Nexus, your intelligent business assistant. How can I help you analyze your operations today?",
    time: 'Just now',
    suggestions: [
      "How many pending leads do we have today?",
      'Summarize my pending leads',
      'How many leads are assigned to me?',
    ],
  },
];

function NexusFace({ state = 'IDLE', blinking = false, className }) {
  const isThinking = state === 'THINKING';
  const isSpeaking = state === 'SPEAKING';
  const isError = state === 'ERROR';
  const isSuccess = state === 'SUCCESS';
  return (
    <svg className={cn('relative z-10', className)} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 16V8" stroke="#20C466" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="7" r="4" fill="#20C466" className="qb-nexus-antenna" />
      <rect x="14" y="16" width="36" height="26" rx="8" fill="#FFF" stroke="#173D30" strokeWidth="2.5" />
      <rect x="10" y="24" width="4" height="10" rx="2" fill="#20C466" />
      <rect x="50" y="24" width="4" height="10" rx="2" fill="#20C466" />
      <rect x="18" y="21" width="28" height="15" rx="5" fill="#173D30" />
      {isError ? (
        <g stroke="#FB923C" strokeWidth="2" strokeLinecap="round">
          <path d="m23 26 5 2" /><path d="m41 26-5 2" />
          <circle cx="26" cy="30" r="1.3" fill="#FB923C" /><circle cx="38" cy="30" r="1.3" fill="#FB923C" />
        </g>
      ) : isSuccess ? (
        <g stroke="#20C466" strokeWidth="2.2" strokeLinecap="round"><path d="m23 29 3 2 3-2" /><path d="m35 29 3 2 3-2" /></g>
      ) : blinking ? (
        <g stroke="#20C466" strokeWidth="2.2" strokeLinecap="round"><path d="M23 29h6" /><path d="M35 29h6" /></g>
      ) : (
        <g fill="#20C466">
          <circle cx={isThinking ? 27 : 26} cy={isThinking ? 27 : 28.5} r="3" />
          <circle cx={isThinking ? 39 : 38} cy={isThinking ? 27 : 28.5} r="3" />
        </g>
      )}
      {isThinking && <path d="M22 23c2-2 5-2 7 0m6 0c2-2 5-2 7 0" stroke="#20C466" strokeWidth="1.4" strokeLinecap="round" />}
      {isSpeaking ? <ellipse cx="32" cy="33" rx="2.6" ry="1.8" fill="#20C466" className="qb-nexus-mouth" /> : <path d={isSuccess ? 'M28 32c2 3 6 3 8 0' : isError ? 'M29 34c2-2 4-2 6 0' : 'M29 33c1.5 1.5 4.5 1.5 6 0'} stroke={isError ? '#FB923C' : '#20C466'} strokeWidth="1.5" strokeLinecap="round" />}
      <path d="M18 43C18 43 20 54 32 54C44 54 46 43 46 43" fill="#FFF" stroke="#173D30" strokeWidth="2.5" />
      <path d="M32 46C30 46 29 48 30 50C32 51 34 49 34 47C34 46.5 33 46 32 46Z" fill="#20C466" />
      {isThinking && <g className="qb-nexus-particles" fill="#20C466"><circle cx="9" cy="17" r="1.3"/><circle cx="55" cy="14" r="1"/><circle cx="52" cy="44" r="1.2"/></g>}
      {state === 'WAKE_DETECTED' && <g className="qb-nexus-sparkles" stroke="#B9F8D2" strokeWidth="1.5" strokeLinecap="round"><path d="M7 24v5m-2.5-2.5h5M55 19v6m-3-3h6"/></g>}
    </svg>
  );
}

export function QbNexusPet() {
  const token = useAuthStore((state) => state.token);
  const [open, setOpen] = React.useState(false);
  const [minimized, setMinimized] = React.useState(false);
  const [tooltipVisible, setTooltipVisible] = React.useState(true);
  const [messages, setMessages] = React.useState(INITIAL_MESSAGES);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [voiceEnabled, setVoiceEnabled] = React.useState(false);
  const [voiceState, setVoiceState] = React.useState('IDLE');
  const [voiceText, setVoiceText] = React.useState('');
  const [voiceError, setVoiceError] = React.useState('');
  const [recognitionSupported, setRecognitionSupported] = React.useState(false);
  const [speakReplies, setSpeakReplies] = React.useState(true);
  const [fallbackRecording, setFallbackRecording] = React.useState(false);
  const [blinking, setBlinking] = React.useState(false);
  const [pageVisible, setPageVisible] = React.useState(true);
  const messagesEndRef = React.useRef(null);
  const recognitionRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const mediaStreamRef = React.useRef(null);
  const mediaChunksRef = React.useRef([]);
  const fallbackTimerRef = React.useRef(null);
  const activityTimerRef = React.useRef(null);
  const voiceTimersRef = React.useRef(new Set());
  const mountedRef = React.useRef(false);
  const speechRef = React.useRef(null);
  const enabledRef = React.useRef(false);
  const modeRef = React.useRef('wake');
  const commandRef = React.useRef('');
  const petState = voiceError || voiceState === 'ERROR' ? 'ERROR' : voiceState === 'WAKE_DETECTED' ? 'WAKE_DETECTED' : voiceState === 'LISTENING' ? 'LISTENING' : voiceState === 'SPEAKING' ? 'SPEAKING' : voiceState === 'SUCCESS' ? 'SUCCESS' : voiceState === 'PROCESSING' || isTyping ? 'THINKING' : 'IDLE';

  React.useEffect(() => {
    mountedRef.current = true;
    if (petState !== 'IDLE') { setBlinking(false); return undefined; }
    let blinkTimer;
    let reopenTimer;
    const schedule = () => {
      if (document.visibilityState !== 'visible') return;
      blinkTimer = setTimeout(() => {
        setBlinking(true);
        reopenTimer = setTimeout(() => { setBlinking(false); schedule(); }, 140);
      }, 4200 + Math.random() * 3000);
    };
    const onVisibility = () => {
      clearTimeout(blinkTimer); clearTimeout(reopenTimer);
      if (document.visibilityState === 'visible') schedule();
    };
    schedule();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(blinkTimer); clearTimeout(reopenTimer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [petState]);

  // Restore messages from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Persist messages to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages]);

  // Auto-scroll chat
  React.useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, isTyping]);

  // Auto-hide tooltip after 10 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTooltipVisible(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setPageVisible(document.visibilityState === 'visible');
    setRecognitionSupported(Boolean(Recognition));
    setVoiceEnabled(localStorage.getItem('qb-nexus-voice-enabled') === 'true');
    setSpeakReplies(localStorage.getItem('qb-nexus-speak-replies') !== 'false');
    const onVisibility = () => {
      setPageVisible(document.visibilityState === 'visible');
      if (document.visibilityState !== 'visible') {
        stopRecognition();
        stopFallbackRecorder(false);
        setVoiceState((state) => state === 'LISTENING' ? 'IDLE' : state);
      }
      else if (enabledRef.current) startRecognition('wake');
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopRecognition();
      stopFallbackRecorder(false, false);
      clearTimeout(fallbackTimerRef.current);
      clearTimeout(activityTimerRef.current);
      clearVoiceTimers();
      stopSpeech();
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    enabledRef.current = voiceEnabled && Boolean(token);
    if (!enabledRef.current) {
      clearVoiceTimers(); stopRecognition(); stopFallbackRecorder(false); stopSpeech(); setVoiceState('IDLE');
    } else if (recognitionSupported && document.visibilityState === 'visible') startRecognition('wake');
  }, [voiceEnabled, token, recognitionSupported]);

  function stopRecognition() {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onresult = null; recognition.onend = null; recognition.onerror = null;
      try { recognition.stop(); } catch {}
    }
  }

  function startRecognition(mode = 'wake') {
    if (!enabledRef.current || document.visibilityState !== 'visible') return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setRecognitionSupported(false); setVoiceError('Wake-word recognition is unavailable in this browser. Use the microphone button to speak.'); return; }
    stopRecognition();
    const recognition = new Recognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.continuous = mode === 'wake';
    recognition.interimResults = true;
    modeRef.current = mode; commandRef.current = '';
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) transcript += event.results[i][0]?.transcript || '';
      setVoiceText(transcript.trim());
      if (modeRef.current === 'wake' && /\b(?:(?:hey|hello|okay)\s+)?nexus\b/i.test(transcript)) {
        setOpen(true); setVoiceError(''); setVoiceState('WAKE_DETECTED');
        modeRef.current = 'command';
        stopRecognition();
        scheduleVoice(() => { setVoiceState('LISTENING'); startRecognition('command'); }, 250);
      } else if (modeRef.current === 'command' && event.results[event.results.length - 1]?.isFinal) {
        const command = transcript.trim();
        if (command) { commandRef.current = command; stopRecognition(); void handleSendMessage(command, true); }
      }
    };
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setVoiceError('Microphone access was denied. Allow it in browser settings, then try again.');
        setVoiceEnabled(false); localStorage.setItem('qb-nexus-voice-enabled', 'false');
      } else if (event.error === 'audio-capture') { setVoiceError('No microphone was found.'); setVoiceState('ERROR'); }
      else if (event.error !== 'no-speech' && event.error !== 'aborted') { setVoiceError('Voice recognition stopped. Try the microphone button.'); setVoiceState('ERROR'); }
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) recognitionRef.current = null;
      if (!enabledRef.current || document.visibilityState !== 'visible') return;
      if (modeRef.current === 'wake') scheduleVoice(() => startRecognition('wake'), 300);
      else if (!commandRef.current) scheduleVoice(() => startRecognition('command'), 300);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); } catch {
      recognitionRef.current = null;
      if (mode === 'command') { setVoiceState('ERROR'); setVoiceError('Could not start voice recognition. Check microphone permission and try again.'); }
    }
  }

  function scheduleVoice(callback, delay) {
    if (!mountedRef.current) return null;
    const timer = setTimeout(() => { voiceTimersRef.current.delete(timer); if (mountedRef.current) callback(); }, delay);
    voiceTimersRef.current.add(timer);
    return timer;
  }

  function clearVoiceTimers() {
    voiceTimersRef.current.forEach((timer) => clearTimeout(timer));
    voiceTimersRef.current.clear();
  }

  function cancelVoiceTimer(timer) {
    if (timer) { clearTimeout(timer); voiceTimersRef.current.delete(timer); }
  }

  function stopSpeech() {
    if (speechRef.current) { speechRef.current.onstart = null; speechRef.current.onend = null; speechRef.current.onerror = null; speechRef.current = null; }
    window.speechSynthesis?.cancel();
  }

  async function enableVoice() {
    setVoiceError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('secure-context');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      enabledRef.current = true;
      localStorage.setItem('qb-nexus-voice-enabled', 'true');
      setVoiceEnabled(true); setOpen(true);
      return true;
    } catch (error) {
      setVoiceError(error?.name === 'NotFoundError' ? 'No microphone was found.' : error?.message === 'secure-context' ? 'Microphone permission requires a secure browser connection.' : 'Microphone permission was denied. Chat remains available.');
      setVoiceState('ERROR');
      return false;
    }
  }

  function startManualMic() {
    if (!recognitionSupported) { void startFallbackRecording(); return; }
    if (!voiceEnabled) { void enableVoice().then((granted) => { if (granted) scheduleVoice(() => { setVoiceState('LISTENING'); startRecognition('command'); }, 180); }); return; }
    setVoiceError(''); setVoiceState('LISTENING'); startRecognition('command');
  }

  async function startFallbackRecording() {
    setVoiceError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('unsupported');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data?.size) mediaChunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const chunks = mediaChunksRef.current;
        const type = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        const blob = new Blob(chunks, { type });
        mediaChunksRef.current = [];
        mediaRecorderRef.current = null;
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        setFallbackRecording(false);
        if (!blob.size) { setVoiceState('ERROR'); setVoiceError('No audio was captured. Try again.'); return; }
        setVoiceState('PROCESSING');
        try {
          const form = new FormData();
          form.append('audio', blob, 'nexus-voice.webm');
          const response = await api.post('/admin/ai/nexus/transcribe', form, { headers: { 'Content-Type': 'multipart/form-data' } });
          const transcript = String(response?.data?.data?.text || '').trim();
          if (!transcript) throw new Error('Nexus could not recognize speech in that clip. Try again.');
          setVoiceText(transcript);
          await handleSendMessage(transcript, true);
        } catch (error) {
          setVoiceState('ERROR');
          setVoiceError(error?.response?.data?.message || error?.message || 'Nexus could not transcribe that clip.');
        }
      };
      recorder.start();
      fallbackTimerRef.current = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 30_000);
      setFallbackRecording(true); setVoiceState('LISTENING'); setOpen(true);
    } catch (error) {
      stopFallbackRecorder(false);
      setVoiceState('ERROR');
      setVoiceError(error?.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in browser settings, then try again.' : error?.name === 'NotFoundError' ? 'No microphone was found.' : error?.message === 'unsupported' ? 'Manual recording is unavailable here. Type your question instead.' : 'Could not start the microphone. Check browser permissions and try again.');
    }
  }

  function stopFallbackRecorder(upload = true, updateUi = true) {
    clearTimeout(fallbackTimerRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      if (!upload) {
        recorder.onstop = null;
        mediaChunksRef.current = [];
        mediaRecorderRef.current = null;
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        if (updateUi) setFallbackRecording(false);
      }
      try { recorder.stop(); } catch {}
    } else {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      if (updateUi) setFallbackRecording(false);
    }
  }

  function stopCommandListening() {
    if (fallbackRecording) { stopFallbackRecorder(true); return; }
    clearVoiceTimers();
    stopRecognition(); commandRef.current = ''; modeRef.current = 'wake'; setVoiceText(''); setVoiceState('IDLE');
    if (enabledRef.current) scheduleVoice(() => startRecognition('wake'), 200);
  }

  function cancelVoice() {
    clearVoiceTimers();
    stopFallbackRecorder(false);
    stopRecognition(); stopSpeech(); commandRef.current = ''; setVoiceText(''); setVoiceState('IDLE');
    if (enabledRef.current) scheduleVoice(() => startRecognition('wake'), 200);
  }

  const handleSendMessage = async (textToSend, fromVoice = false) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setVoiceError('');
    stopRecognition();
    clearVoiceTimers();
    setIsTyping(true);
    cancelVoiceTimer(activityTimerRef.current);
    setVoiceState('PROCESSING');
    try {
      const response = await api.post('/admin/ai/nexus/chat', { message: query });
      const replyText = response?.data?.data?.answer || response?.data?.answer || 'I could not find an answer for that request.';
      const botReply = { id: `bot-${Date.now()}`, sender: 'bot', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      setMessages((prev) => [...prev, botReply]);
      if (fromVoice && speakReplies && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(replyText);
        speechRef.current = utterance;
        utterance.onstart = () => { if (mountedRef.current) setVoiceState('SPEAKING'); };
        utterance.onend = () => { speechRef.current = null; setVoiceState('SUCCESS'); activityTimerRef.current = scheduleVoice(() => { setVoiceState('IDLE'); if (enabledRef.current) startRecognition('wake'); }, 1000); };
        utterance.onerror = () => { speechRef.current = null; setVoiceState('SUCCESS'); activityTimerRef.current = scheduleVoice(() => { setVoiceState('IDLE'); if (enabledRef.current) startRecognition('wake'); }, 1000); };
        window.speechSynthesis.speak(utterance);
      } else {
        setVoiceState('SUCCESS'); activityTimerRef.current = scheduleVoice(() => { setVoiceState('IDLE'); if (enabledRef.current) startRecognition('wake'); }, 1000);
      }
    } catch (error) {
      const replyText = error?.response?.data?.message || 'Nexus could not answer right now. Please try again.';
      setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setVoiceError(replyText); setVoiceState('ERROR');
      if (enabledRef.current) scheduleVoice(() => { setVoiceState('IDLE'); startRecognition('wake'); }, 1500);
    } finally { setIsTyping(false); }
  };

  function disableVoice() {
    clearVoiceTimers();
    enabledRef.current = false; setVoiceEnabled(false); localStorage.setItem('qb-nexus-voice-enabled', 'false');
    stopRecognition(); stopFallbackRecorder(false); stopSpeech(); setVoiceState('IDLE'); setVoiceText('');
  }

  const handleResetChat = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const session = readSession();
  const userName = session?.user?.firstName || session?.user?.name || 'Super Admin';

  if (!token) return null;

  return (
    <>
      <style>{`
        @keyframes qb-nexus-float { 0%,100% { translate: 0 0 } 50% { translate: 0 -3px } }
        @keyframes qb-nexus-wake { 0%,100% { transform: translateY(0) scale(1) } 35% { transform: translateY(-7px) scale(1.04) } 70% { transform: translateY(1px) scale(.99) } }
        @keyframes qb-nexus-pulse { 0%,100% { opacity:.28; transform:scale(.94) } 50% { opacity:.8; transform:scale(1.08) } }
        @keyframes qb-nexus-speak { 0%,100% { transform:scaleY(.75) } 50% { transform:scaleY(1.15) } }
        @keyframes qb-nexus-particle { 0%,100% { opacity:.25; transform:translateY(1px) } 50% { opacity:1; transform:translateY(-2px) } }
        .qb-nexus-idle { animation:qb-nexus-float 3.6s ease-in-out infinite }
        .qb-nexus-waking { animation:qb-nexus-wake .7s ease-out 1 }
        .qb-nexus-listening-ring { animation:qb-nexus-pulse 1.6s ease-in-out infinite }
        .qb-nexus-thinking { box-shadow:0 0 0 2px #20c466,0 0 25px rgba(32,196,102,.55),0 16px 38px rgba(23,61,48,.28) }
        .qb-nexus-error { border-color:#fb923c!important; box-shadow:0 0 20px rgba(251,146,60,.28) }
        .qb-nexus-antenna { animation:qb-nexus-pulse 2s ease-in-out infinite; transform-origin:32px 7px }
        .qb-nexus-mouth { animation:qb-nexus-speak .24s ease-in-out infinite; transform-origin:center }
        .qb-nexus-particles circle { animation:qb-nexus-particle 1.8s ease-in-out infinite }
        .qb-nexus-particles circle:nth-child(2) { animation-delay:.35s }
        .qb-nexus-particles circle:nth-child(3) { animation-delay:.7s }
        .qb-nexus-sparkles { animation:qb-nexus-pulse .65s ease-in-out 3 }
        .qb-nexus-sparkle-icon { animation:qb-nexus-pulse .55s ease-in-out 3 }
        .qb-nexus-paused .qb-nexus-listening-ring,.qb-nexus-paused .qb-nexus-antenna,.qb-nexus-paused .qb-nexus-mouth,.qb-nexus-paused .qb-nexus-particles circle,.qb-nexus-paused .qb-nexus-sparkles,.qb-nexus-paused .qb-nexus-voicewave i,.qb-nexus-paused .qb-nexus-online-ping { animation:none!important }
        .qb-nexus-paused .qb-nexus-sparkle-icon { animation:none!important }
        @media (prefers-reduced-motion: reduce) { .qb-nexus-idle,.qb-nexus-waking,.qb-nexus-listening-ring,.qb-nexus-antenna,.qb-nexus-mouth,.qb-nexus-particles circle,.qb-nexus-sparkles,.qb-nexus-sparkle-icon,.qb-nexus-online-ping { animation:none!important } .qb-nexus-button { transition:none!important } }
      `}</style>
      {/* Floating Robot Avatar Button */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)] z-40 flex flex-col items-end">
        {/* Welcome Tooltip */}
        {tooltipVisible && !open && (
          <div className="mb-2 relative max-w-[240px] rounded-2xl bg-white border border-emerald-200/90 p-3 shadow-lg text-xs text-slate-700 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
            <button
              onClick={() => setTooltipVisible(false)}
              className="absolute top-1.5 right-1.5 text-slate-400 hover:text-slate-600"
              aria-label="Dismiss tooltip"
            >
              <X className="size-3" />
            </button>
            <div className="mb-0.5 flex items-center gap-1.5 font-semibold text-[#173D30]"><span className="size-2 rounded-full bg-[#20C466] motion-safe:animate-ping" /><span>Ask QB Nexus</span></div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Hi {userName}! Need instant insights or data analysis? Click to chat.
            </p>
            {/* Tooltip caret */}
            <div className="absolute -bottom-1.5 right-6 size-3 rotate-45 border-r border-b border-emerald-200 bg-white" />
          </div>
        )}

        {/* Pet Avatar Icon */}
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setMinimized(false);
            setTooltipVisible(false);
          }}
          onMouseEnter={() => setTooltipVisible(true)}
          aria-label="Open QB Nexus AI Assistant"
          className={cn('qb-nexus-button group relative flex size-14 sm:size-[68px] lg:size-[76px] items-center justify-center rounded-[22px] border-2 border-[#20C466]/90 bg-gradient-to-br from-[#173D30] via-[#123026] to-[#0d221b] text-white shadow-[0_12px_34px_rgba(23,61,48,.28),0_0_20px_rgba(32,196,102,.28)] transition-all duration-300 hover:scale-[1.06] hover:shadow-[0_14px_40px_rgba(23,61,48,.36),0_0_28px_rgba(32,196,102,.52)] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 focus-visible:ring-offset-2', !pageVisible && 'qb-nexus-paused', pageVisible && petState === 'IDLE' && 'qb-nexus-idle', pageVisible && petState === 'WAKE_DETECTED' && 'qb-nexus-waking', petState === 'LISTENING' && 'ring-4 ring-[#20C466]/70 ring-offset-2 ring-offset-white', petState === 'THINKING' && 'qb-nexus-thinking', petState === 'ERROR' && 'qb-nexus-error')}
        >
          <span className="pointer-events-none absolute -inset-1 rounded-[25px] bg-[#20C466]/20 blur-md transition-colors group-hover:bg-[#20C466]/40" />
          {petState === 'LISTENING' && <span className="qb-nexus-listening-ring pointer-events-none absolute inset-1 rounded-full border-2 border-[#20C466]/80" />}
          {petState === 'WAKE_DETECTED' && <Sparkles className="qb-nexus-sparkle-icon absolute -right-3 -top-3 size-5 text-[#B9F8D2] drop-shadow-[0_0_6px_#20C466]" aria-hidden="true" />}
          {petState === 'SPEAKING' && <span className="qb-nexus-voicewave absolute -bottom-1 flex h-2.5 items-center gap-1" aria-hidden="true"><i className="h-1 w-1 rounded-full bg-[#20C466] motion-safe:animate-pulse"/><i className="h-2.5 w-1 rounded-full bg-[#20C466] motion-safe:animate-pulse [animation-delay:120ms]"/><i className="h-1.5 w-1 rounded-full bg-[#20C466] motion-safe:animate-pulse [animation-delay:240ms]"/></span>}
          {petState === 'SUCCESS' && <Sparkles className="absolute -right-2 -top-2 size-4 text-[#B9F8D2] motion-safe:animate-pulse" aria-hidden="true" />}
          <NexusFace state={petState} blinking={blinking} className={cn('size-11 sm:size-[52px] lg:size-[58px] transition-transform group-hover:rotate-2', !pageVisible && 'qb-nexus-paused')} />

          {/* Online badge */}
          <span title={token ? 'QB Nexus online' : 'QB Nexus offline'} className="absolute -right-1 -top-1 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-white"><span className={cn('relative size-3 rounded-full border border-white', token ? 'bg-[#20C466] shadow-[0_0_10px_#20C466]' : 'bg-slate-400')} />{token && <span className="qb-nexus-online-ping motion-safe:animate-ping absolute size-3 rounded-full bg-[#20C466]/70" />}</span>
        </button>
      </div>

      {/* Expandable Assistant Panel */}
      {open && !minimized && (
        <div
          role="dialog"
          aria-label="QB Nexus Assistant"
          className={cn(
            'fixed z-50 bg-white shadow-2xl transition-all duration-300 border border-slate-200/90 overflow-hidden flex flex-col',
            'bottom-0 right-0 w-full sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)] sm:w-[380px] md:w-[400px] sm:rounded-2xl',
            'top-0 h-[100dvh] sm:top-auto sm:h-[min(600px,calc(100dvh-3rem))]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#173D30] text-white shrink-0 select-none">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-[#20C466] border border-emerald-400/30">
                <NexusFace state={petState} blinking={blinking} className={cn('size-7', !pageVisible && 'qb-nexus-paused')} />
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-tight">QB Nexus AI</h3>
                  <span aria-live="polite" className="rounded-full bg-emerald-400/20 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-300 border border-emerald-400/30">
                    {petState === 'LISTENING' ? 'Listening' : petState === 'PROCESSING' || petState === 'THINKING' ? 'Thinking' : petState === 'SPEAKING' ? 'Speaking' : petState === 'SUCCESS' ? 'Ready' : petState === 'ERROR' ? 'Needs attention' : voiceEnabled ? 'Voice on' : 'Online'}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-200/80">Executive AI Copilot</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Clear chat context"
                className="size-7 rounded-lg text-emerald-200/80 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Clear chat"
              >
                <RotateCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMinimized((prev) => !prev)}
                title={minimized ? 'Expand' : 'Minimize'}
                className="size-7 rounded-lg text-emerald-200/80 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                aria-label={minimized ? 'Expand' : 'Minimize'}
              >
                {minimized ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Close"
                className="size-7 rounded-lg text-emerald-200/80 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-emerald-100 bg-[#F0FAF3] px-3 py-2">
            {!voiceEnabled ? <div className="space-y-1.5"><p className="text-[10px] leading-relaxed text-slate-600">Voice wake-up is optional. While enabled, this active tab listens for “Hey Nexus.” Browser speech recognition may process audio; QB Suite does not store recordings.</p><div className="flex items-center justify-between gap-2"><span className="text-[10px] text-slate-500">{recognitionSupported ? 'Wake word available in this browser' : 'Wake word unavailable; manual clips are sent to OpenAI only after you stop.'}</span><button type="button" onClick={enableVoice} className="rounded-lg bg-[#173D30] px-2.5 py-1.5 text-[10px] font-semibold text-white">Enable voice</button></div></div> : <div className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2 text-[11px] font-medium text-[#173D30]"><span className="size-2 shrink-0 rounded-full bg-[#20C466]" />{voiceState === 'LISTENING' ? "Yes, I'm listening..." : voiceState === 'WAKE_DETECTED' ? 'Nexus is waking up...' : voiceState === 'PROCESSING' ? 'Nexus is thinking...' : voiceState === 'SPEAKING' ? 'Nexus is speaking...' : voiceState === 'SUCCESS' ? 'Done!' : recognitionSupported ? 'Say “Hey Nexus” to wake me' : 'Tap the mic to speak'}</span>{voiceState === 'LISTENING' && <span className="flex h-4 items-center gap-0.5" aria-label="Microphone active"><i className="h-2 w-0.5 animate-pulse rounded bg-[#20C466]" /><i className="h-4 w-0.5 animate-pulse rounded bg-[#20C466] [animation-delay:120ms]" /><i className="h-3 w-0.5 animate-pulse rounded bg-[#20C466] [animation-delay:240ms]" /><i className="h-2 w-0.5 animate-pulse rounded bg-[#20C466] [animation-delay:80ms]" /></span>}</div>}
            {voiceText && voiceState === 'LISTENING' && <p className="mt-1 truncate text-[10px] text-slate-500">{voiceText}</p>}
            {voiceError && <div role="alert" className="mt-1 flex items-start justify-between gap-2 text-[10px] text-rose-700"><span>{voiceError}</span><button type="button" onClick={() => { setVoiceError(''); setVoiceState('IDLE'); }} className="shrink-0 font-semibold" aria-label="Dismiss voice error">Dismiss</button></div>}
          </div>

          {/* Body when not minimized */}
          <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F9F8] text-xs">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex flex-col',
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs leading-relaxed text-xs break-words',
                        msg.sender === 'user'
                          ? 'bg-[#173D30] text-white rounded-br-xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                      )}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>

                    {/* Suggestions Chips */}
                    {msg.suggestions && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 w-full">
                        {msg.suggestions.map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => handleSendMessage(sug)}
                            className="rounded-full border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 px-2.5 py-1 text-[11px] font-medium text-[#173D30] transition-colors flex items-center gap-1 shadow-2xs text-left"
                          >
                            <Sparkles className="size-3 text-[#20C466]" />
                            <span>{sug}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs py-1">
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="size-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] ml-1">Nexus is analyzing...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Box */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
              >
                <button type="button" onClick={voiceState === 'LISTENING' ? stopCommandListening : startManualMic} className="size-9 rounded-xl border border-slate-200 text-[#173D30] hover:bg-emerald-50 flex items-center justify-center shrink-0" aria-label={voiceState === 'LISTENING' ? 'Stop listening' : 'Speak to Nexus'} title={voiceState === 'LISTENING' ? 'Stop listening' : 'Speak to Nexus'}>
                  {voiceState === 'LISTENING' ? <Square className="size-3.5" /> : <Mic className="size-4" />}
                </button>
                <input
                  type="text"
                  placeholder="Ask Nexus anything about your CRM..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 h-9 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#173D30]"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="size-9 rounded-xl bg-[#20C466] hover:bg-[#1BB35B] disabled:opacity-40 disabled:hover:bg-[#20C466] text-white flex items-center justify-center transition-colors shadow-2xs shrink-0"
                  aria-label="Send message"
                >
                  <Send className="size-4" />
                </button>
              </form>
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-3 py-1.5">
                <div className="flex items-center gap-2"><button type="button" onClick={() => { const next = !speakReplies; setSpeakReplies(next); localStorage.setItem('qb-nexus-speak-replies', String(next)); if (!next) { stopSpeech(); setVoiceState('IDLE'); if (enabledRef.current) scheduleVoice(() => startRecognition('wake'), 200); } }} className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-[#173D30]" aria-label={speakReplies ? 'Mute voice responses' : 'Enable voice responses'}>{speakReplies ? <Volume2 className="size-3.5" /> : <VolumeX className="size-3.5" />}{speakReplies ? 'Voice response on' : 'Voice response off'}</button>{voiceState === 'SPEAKING' && <button type="button" onClick={cancelVoice} className="text-[10px] font-medium text-rose-600">Interrupt</button>}</div>
                <div className="flex items-center gap-2">{voiceState !== 'IDLE' && <button type="button" onClick={cancelVoice} className="text-[10px] text-slate-500">Cancel</button>}{voiceEnabled && <button type="button" onClick={disableVoice} className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-rose-600"><MicOff className="size-3" />Turn voice off</button>}</div>
              </div>
          </>
        </div>
      )}
    </>
  );
}
