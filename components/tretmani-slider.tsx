"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";
import Link from "next/link";

const TRETMANI = [
  { src: "/tretmani/tretman-01.webm", label: "Koloracija & Korekcija" },
  { src: "/tretmani/tretman-02.webm", label: "Keratin Tretman" },
  { src: "/tretmani/tretman-03.webm", label: "Balayage Tehnika" },
  { src: "/tretmani/tretman-04.webm", label: "Feniranje & Styling" },
  { src: "/tretmani/tretman-05.webm", label: "Dubinska Regeneracija" },
  { src: "/tretmani/tretman-06.webm", label: "Šišanje & Oblikovanje" },
  { src: "/tretmani/tretman-07.webm", label: "Ombre Preliv" },
  { src: "/tretmani/tretman-08.webm", label: "Tretman za Sjaj" },
  { src: "/tretmani/tretman-09.webm", label: "Blajhanje Kose" },
  { src: "/tretmani/tretman-10.webm", label: "Svečana Frizura" },
  { src: "/tretmani/tretman-11.webm", label: "Hair Botox" },
  { src: "/tretmani/tretman-12.webm", label: "Oporavak Vlasi" },
  { src: "/tretmani/tretman-13.webm", label: "Kreativna Koloracija" },
];

export function TretmaniSlider() {
  const railRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const dragState = useRef({
    active: false,
    startX: 0,
    scrollX: 0,
    hasMoved: false,
    pointerId: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    rafId: null as number | null,
  });

  /* ── Progressive video loading ── */
  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    TRETMANI.forEach((item, i) => {
      ids.push(
        setTimeout(() => {
          const v = videoRefs.current[i];
          if (v) {
            v.src = item.src;
            v.preload = "metadata";
            v.load();
          }
        }, i * 600),
      );
    });
    return () => ids.forEach(clearTimeout);
  }, []);

  /* ── Scroll arrow state ── */
  const syncArrows = useCallback(() => {
    const r = railRef.current;
    if (!r) return;
    setCanScrollPrev(r.scrollLeft > 4);
    setCanScrollNext(r.scrollLeft < r.scrollWidth - r.clientWidth - 4);
  }, []);

  useEffect(() => {
    const r = railRef.current;
    if (!r) return;
    r.addEventListener("scroll", syncArrows, { passive: true });
    window.addEventListener("resize", syncArrows);
    requestAnimationFrame(syncArrows);
    return () => {
      r.removeEventListener("scroll", syncArrows);
      window.removeEventListener("resize", syncArrows);
    };
  }, [syncArrows]);

  /* ── Arrow click ── */
  const scrollBy = useCallback((dir: -1 | 1) => {
    const r = railRef.current;
    if (!r) return;
    const card = r.querySelector<HTMLElement>(".tretmani-card");
    if (!card) return;
    const gap = parseFloat(getComputedStyle(r).gap) || 0;
    r.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
  }, []);

  /* ── Drag-to-scroll (deferred capture so clicks still work) ── */
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const r = railRef.current;
    if (!r) return;
    if (dragState.current.rafId) cancelAnimationFrame(dragState.current.rafId);
    Object.assign(dragState.current, {
      active: true,
      startX: e.clientX,
      scrollX: r.scrollLeft,
      hasMoved: false,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastTime: Date.now(),
      velocity: 0,
    });
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragState.current;
    if (!d.active) return;
    const r = railRef.current;
    if (!r) return;
    const dx = e.clientX - d.startX;

    if (!d.hasMoved && Math.abs(dx) > 5) {
      d.hasMoved = true;
      try { r.setPointerCapture(d.pointerId); } catch {}
      r.classList.add("is-dragging");
    }

    if (d.hasMoved) {
      const now = Date.now();
      const dt = now - d.lastTime;
      if (dt > 0) d.velocity = (e.clientX - d.lastX) / dt;
      d.lastX = e.clientX;
      d.lastTime = now;
      r.scrollLeft = d.scrollX - dx;
    }
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragState.current;
    if (!d.active) return;
    d.active = false;
    const r = railRef.current;
    if (!r) return;

    if (d.hasMoved) {
      try { r.releasePointerCapture(e.pointerId); } catch {}
      r.classList.remove("is-dragging");
      let v = d.velocity * 16;
      const decay = 0.94;
      const step = () => {
        if (Math.abs(v) < 0.5) return;
        r.scrollLeft -= v;
        v *= decay;
        d.rafId = requestAnimationFrame(step);
      };
      if (Math.abs(v) > 2) d.rafId = requestAnimationFrame(step);
    }
  }, []);

  /* ── Play / pause ── */
  const togglePlay = useCallback(
    (i: number) => {
      if (dragState.current.hasMoved) return;
      const v = videoRefs.current[i];
      if (!v || !v.src) return;

      if (!v.paused) {
        v.pause();
        return;
      }

      if (playingIndex !== null && playingIndex !== i) {
        const prev = videoRefs.current[playingIndex];
        if (prev) {
          prev.pause();
          prev.currentTime = 0;
        }
      }

      v.play().catch(() => setPlayingIndex(null));
      setPlayingIndex(i);
    },
    [playingIndex],
  );

  return (
    <section className="tretmani-section home-reveal" aria-labelledby="tretmani-heading">
      <div className="tretmani-inner">
        <div className="tretmani-header">
          <h2 id="tretmani-heading" className="tretmani-heading">
            Tretmani
          </h2>
        </div>
      </div>

      <div className="tretmani-viewport">
        <button
          type="button"
          className="tretmani-arrow tretmani-arrow--prev"
          disabled={!canScrollPrev}
          onClick={() => scrollBy(-1)}
          aria-label="Prethodni tretmani"
        >
          <ChevronLeft strokeWidth={1.5} />
        </button>

        <div
          ref={railRef}
          className="tretmani-rail"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {TRETMANI.map((item, i) => {
            const isPlaying = playingIndex === i;
            return (
              <article key={item.src} className="tretmani-card">
                <div className={`tretmani-card__media${isPlaying ? " tretmani-card__media--playing" : ""}`}>
                  <video
                    ref={(el) => {
                      videoRefs.current[i] = el;
                    }}
                    playsInline
                    muted
                    loop
                    preload="none"
                    controls={isPlaying}
                    onPointerDown={(e) => {
                      if (isPlaying) e.stopPropagation();
                    }}
                    onPause={() =>
                      setPlayingIndex((prev) => (prev === i ? null : prev))
                    }
                  />
                  <button
                    type="button"
                    className={`tretmani-play${isPlaying ? " tretmani-play--active" : ""}`}
                    onClick={() => togglePlay(i)}
                    aria-label={`${isPlaying ? "Pauziraj" : "Pokreni"}: ${item.label}`}
                  >
                    <span className="tretmani-play__circle">
                      {isPlaying
                        ? <Pause size={24} fill="currentColor" strokeWidth={0} />
                        : <Play size={26} fill="currentColor" strokeWidth={0} />
                      }
                    </span>
                  </button>
                </div>
                <p className="tretmani-card__label">{item.label}</p>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          className="tretmani-arrow tretmani-arrow--next"
          disabled={!canScrollNext}
          onClick={() => scrollBy(1)}
          aria-label="Sledeći tretmani"
        >
          <ChevronRight strokeWidth={1.5} />
        </button>
      </div>

      <div className="tretmani-inner">
        <div className="tretmani-actions">
          <Link href="/galerija" className="ghost-btn home-second-action">
            Galerija radova
          </Link>
          <Link href="/kontakt" className="primary-btn tretmani-cta">
            Zakaži termin
          </Link>
        </div>
      </div>
    </section>
  );
}
