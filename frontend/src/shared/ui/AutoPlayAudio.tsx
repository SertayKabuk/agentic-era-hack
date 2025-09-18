import React, { useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";

export default function AutoPlayAudio() {
  const { volume } = useLiveAPIContext();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [blocked, setBlocked] = useState(false); // Tarayıcı autoplay engelledi mi?
  const [stopped, setStopped] = useState(false); // Volume spike ile tamamen durduruldu mu?
  const [playing, setPlaying] = useState(false); // Şu an çalıyor mu?

  // Try autoplay on mount
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.volume = 0.1;
    el.muted = false; // sesli dene (tarayıcı engelleyebilir)
    el.play()
      .then(() => {
        setPlaying(true);
        setBlocked(false);
      })
      .catch(() => {
        // Autoplay engellendiyse kullanıcıdan tıklama isteyeceğiz
        setBlocked(true);
        setPlaying(false);
      });
  }, []);

  // Stop once we detect any model speaking (volume spike)
  useEffect(() => {
    const el = audioRef.current;
    if (!el || stopped) return;
    if (volume > 0.02) {
      el.pause();
      el.currentTime = 0;
      setPlaying(false);
      setStopped(true);
      setBlocked(false);
    }
  }, [volume, stopped]);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;

    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => {
          setPlaying(true);
          setBlocked(false);
        })
        .catch(() => {
          setBlocked(true);
          setPlaying(false);
        });
    }
  };

  return (
    <>
      {!stopped && (
        <audio
          ref={audioRef}
          src="/synthesis.mp4"
          loop
          preload="auto"
          autoPlay
          playsInline
        />
      )}

      {/* Başlat/Durdur butonu (autoplay engelli değilse) */}
      {!stopped && !blocked && (
        <button
          onClick={togglePlay}
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 20,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 999,
            padding: "10px 14px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            cursor: "pointer",
          }}
        >
          {playing ? "Disable Sound" : "Enable Sound"}
        </button>
      )}

      {/* Autoplay engellendiyse kullanıcı etkileşimi isteyen buton */}
      {blocked && !stopped && (
        <button
          onClick={() => {
            const el = audioRef.current;
            if (!el) return;
            el.muted = false;
            el.play()
              .then(() => {
                setBlocked(false);
                setPlaying(true);
              })
              .catch(() => {
                el.muted = false;
              });
          }}
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            zIndex: 20,
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 999,
            padding: "10px 14px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
            cursor: "pointer",
          }}
        >
          Enable Sound
        </button>
      )}
    </>
  );
}
