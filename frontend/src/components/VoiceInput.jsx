import { Mic, MicOff } from "lucide-react";
import { useState } from "react";

export default function VoiceInput({ onText, onError }) {
  const [listening, setListening] = useState(false);

  function startVoice() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      onError?.("Speech recognition is not supported in this browser.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      onError?.("Voice input could not be started. Check your microphone permission and try again.");
    };
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) onText(transcript);
    };
    recognition.start();
  }

  return (
    <button
      className={`ww-button ww-button-outline${listening ? " is-listening" : ""}`}
      type="button"
      onClick={startVoice}
      aria-pressed={listening}
    >
      {listening ? <MicOff size={16} /> : <Mic size={16} />}
      {listening ? "Listening…" : "Voice input"}
    </button>
  );
}
