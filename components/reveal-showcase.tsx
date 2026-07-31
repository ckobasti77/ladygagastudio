"use client";

import gsap from "gsap";
import Image from "next/image";
import { Eye, MousePointer2, Pointer, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useIsTouchPointer, usePrefersReducedMotion } from "@/lib/use-media-query";

type RevealPair = {
  before: string;
  after: string;
  label: string;
  caption: string;
};

const REVEAL_PAIRS: RevealPair[] = [
  {
    before: "/slike/pre-1.avif",
    after: "/slike/posle-1.avif",
    label: "Obnova strukture",
    caption: "Dubinska nega i rekonstrukcija vlakna",
  },
  {
    before: "/slike/pre-2.avif",
    after: "/slike/posle-2.avif",
    label: "Boja i sjaj",
    caption: "Koloracija sa zaštitom pigmenta",
  },
  {
    before: "/slike/pre-3.avif",
    after: "/slike/posle-3.avif",
    label: "Oblik i volumen",
    caption: "Precizno šišanje i finalno stilizovanje",
  },
];

const MAX_RADIUS = 240;

function RevealShot({ pair, index }: { pair: RevealPair; index: number }) {
  const shotRef = useRef<HTMLDivElement | null>(null);
  const afterRef = useRef<HTMLDivElement | null>(null);
  const lensRef = useRef<HTMLSpanElement | null>(null);
  const quickRef = useRef<{
    x: (value: number) => void;
    y: (value: number) => void;
    lensX: (value: number) => void;
    lensY: (value: number) => void;
  } | null>(null);
  const radiusTweenRef = useRef<gsap.core.Tween | null>(null);
  const isOpenRef = useRef(false);

  const isTouch = useIsTouchPointer();
  const reduced = usePrefersReducedMotion();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [forcedOpen, setForcedOpen] = useState(false);

  // quickTo drži reflektor da meko "kasni" za kursorom — to je ono što daje skup osećaj.
  useEffect(() => {
    const after = afterRef.current;
    const lens = lensRef.current;
    if (!after || !lens || reduced) return;

    gsap.set([after, lens], { "--rx": "50%", "--ry": "50%" });
    gsap.set(after, { "--rr": "0px" });

    quickRef.current = {
      x: gsap.quickTo(after, "--rx", { duration: 0.34, ease: "power3" }),
      y: gsap.quickTo(after, "--ry", { duration: 0.34, ease: "power3" }),
      lensX: gsap.quickTo(lens, "--rx", { duration: 0.28, ease: "power3" }),
      lensY: gsap.quickTo(lens, "--ry", { duration: 0.28, ease: "power3" }),
    };

    return () => {
      quickRef.current = null;
      radiusTweenRef.current?.kill();
      radiusTweenRef.current = null;
    };
  }, [reduced]);

  const toPercent = useCallback((clientX: number, clientY: number) => {
    const rect = shotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  /** `instant` se koristi pri ulasku/dodiru da reflektor ne "doleti" sa sredine. */
  const moveTo = useCallback(
    (clientX: number, clientY: number, instant = false) => {
      const point = toPercent(clientX, clientY);
      if (!point) return;

      if (instant) {
        gsap.set([afterRef.current, lensRef.current].filter(Boolean), {
          "--rx": `${point.x}%`,
          "--ry": `${point.y}%`,
        });
        return;
      }

      const quick = quickRef.current;
      if (!quick) return;
      quick.x(point.x);
      quick.y(point.y);
      quick.lensX(point.x);
      quick.lensY(point.y);
    },
    [toPercent],
  );

  const setOpen = useCallback((open: boolean) => {
    const after = afterRef.current;
    const lens = lensRef.current;
    if (!after || !lens) return;

    isOpenRef.current = open;
    radiusTweenRef.current?.kill();
    radiusTweenRef.current = gsap.to(after, {
      "--rr": open ? `${MAX_RADIUS}px` : "0px",
      duration: open ? 0.58 : 0.42,
      ease: open ? "back.out(1.5)" : "power2.inOut",
    });

    gsap.to(lens, {
      autoAlpha: open ? 1 : 0,
      scale: open ? 1 : 0.55,
      duration: open ? 0.5 : 0.32,
      ease: open ? "back.out(1.7)" : "power2.in",
    });
  }, []);

  const onPointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isTouch || reduced) return;
    // Bez skoka: reflektor se prvo pozicionira, pa se tek onda otvara.
    moveTo(event.clientX, event.clientY, true);
    setHasInteracted(true);
    setOpen(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    if (isTouch && !isOpenRef.current) return;
    moveTo(event.clientX, event.clientY);
  };

  const onPointerLeave = () => {
    if (isTouch || reduced) return;
    setOpen(false);
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouch || reduced) return;
    setHasInteracted(true);
    if (isOpenRef.current) {
      setOpen(false);
      return;
    }
    moveTo(event.clientX, event.clientY, true);
    setOpen(true);
  };

  const isRevealed = forcedOpen;

  return (
    <figure className="reveal-figure" style={{ "--reveal-i": index } as React.CSSProperties}>
      <div
        ref={shotRef}
        className={`reveal-shot ${isRevealed ? "is-forced" : ""} ${reduced ? "is-reduced" : ""}`}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
      >
        <Image
          className="reveal-layer reveal-layer-before"
          src={pair.before}
          alt={`${pair.label} — pre tretmana`}
          width={900}
          height={1120}
          quality={90}
          sizes="(max-width: 760px) 92vw, (max-width: 1200px) 44vw, 30vw"
          loading="lazy"
        />

        <div ref={afterRef} className="reveal-after" aria-hidden={!isRevealed}>
          <Image
            className="reveal-layer reveal-layer-after"
            src={pair.after}
            alt={`${pair.label} — posle tretmana`}
            width={900}
            height={1120}
            quality={90}
            sizes="(max-width: 760px) 92vw, (max-width: 1200px) 44vw, 30vw"
            loading="lazy"
          />
        </div>

        <span ref={lensRef} className="reveal-lens" aria-hidden />

        <span className="reveal-tag reveal-tag-before">Pre</span>
        <span className="reveal-tag reveal-tag-after">Posle</span>

        {!hasInteracted && !reduced ? (
          <span className="reveal-hint" aria-hidden>
            {isTouch ? <Pointer /> : <MousePointer2 />}
            <span>{isTouch ? "Dodirnite fotografiju" : "Pređite mišem preko fotografije"}</span>
          </span>
        ) : null}
      </div>

      <figcaption className="reveal-caption">
        <div>
          <strong>{pair.label}</strong>
          <span>{pair.caption}</span>
        </div>
        <button
          type="button"
          className="reveal-toggle"
          aria-pressed={isRevealed}
          onClick={() => setForcedOpen((value) => !value)}
        >
          <Eye aria-hidden />
          {isRevealed ? "Prikaži pre" : "Prikaži posle"}
        </button>
      </figcaption>
    </figure>
  );
}

export function RevealShowcase() {
  return (
    <section className="home-panel home-reveal reveal-showcase">
      <div className="xeno-section-head">
        <div className="home-section-head">
          <p className="home-kicker home-kicker-row">
            <Sparkles className="home-kicker-glyph" aria-hidden="true" />
            <span>Transformacije</span>
          </p>
          <h2>Ista osoba. Otkrijte razliku pokretom.</h2>
          <p className="reveal-showcase-lead">
            Svaka fotografija krije rezultat tretmana. Prevucite mišem — ili dodirnite ekran — i otkrijte ga tačno tamo
            gde gledate.
          </p>
        </div>
      </div>

      <div className="reveal-grid">
        {REVEAL_PAIRS.map((pair, index) => (
          <RevealShot key={pair.before} pair={pair} index={index} />
        ))}
      </div>

      <article className="reveal-studio">
        <div className="reveal-studio-media">
          <Image
            src="/slike/o-nama-slika.avif"
            alt="Fotografija iz studija Lady Gaga"
            width={1200}
            height={900}
            quality={90}
            sizes="(max-width: 760px) 92vw, 40vw"
            loading="lazy"
          />
        </div>
        <div className="reveal-studio-copy">
          <p className="reveal-studio-tag">Ambijent</p>
          <h3>Rezultat počinje od mesta na kom se radi.</h3>
          <p>
            Svaki tretman u studiju radimo uz analizu kose, profesionalne preparate i finalno stilizovanje — zato je
            razlika vidljiva i posle nedelja, ne samo na fotografiji.
          </p>
        </div>
      </article>
    </section>
  );
}

export default RevealShowcase;
