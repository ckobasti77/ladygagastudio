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

/** Reflektor je sada meki gradient — poluprečnik je veći jer je samo ~36% pun. */
const MAX_RADIUS = 320;

function RevealShot({ pair, index }: { pair: RevealPair; index: number }) {
  const shotRef = useRef<HTMLDivElement | null>(null);
  const afterRef = useRef<HTMLDivElement | null>(null);
  const quickRef = useRef<{
    x: (value: number) => void;
    y: (value: number) => void;
  } | null>(null);
  const radiusTweenRef = useRef<gsap.core.Tween | null>(null);
  const demoRef = useRef<gsap.core.Timeline | null>(null);
  const demoDoneRef = useRef(false);
  const isOpenRef = useRef(false);

  const isTouch = useIsTouchPointer();
  const reduced = usePrefersReducedMotion();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [forcedOpen, setForcedOpen] = useState(false);
  const [isDemoing, setIsDemoing] = useState(false);

  // quickTo drži reflektor da meko "kasni" za kursorom — to je ono što daje skup osećaj.
  useEffect(() => {
    const after = afterRef.current;
    if (!after || reduced) return;

    gsap.set(after, { "--rx": "50%", "--ry": "50%", "--rr": "0px" });

    quickRef.current = {
      x: gsap.quickTo(after, "--rx", { duration: 0.34, ease: "power3" }),
      y: gsap.quickTo(after, "--ry", { duration: 0.34, ease: "power3" }),
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
        gsap.set(afterRef.current, {
          "--rx": `${point.x}%`,
          "--ry": `${point.y}%`,
        });
        return;
      }

      const quick = quickRef.current;
      if (!quick) return;
      quick.x(point.x);
      quick.y(point.y);
    },
    [toPercent],
  );

  const setOpen = useCallback((open: boolean) => {
    const after = afterRef.current;
    if (!after) return;

    isOpenRef.current = open;
    radiusTweenRef.current?.kill();
    radiusTweenRef.current = gsap.to(after, {
      "--rr": open ? `${MAX_RADIUS}px` : "0px",
      duration: open ? 0.5 : 0.42,
      ease: open ? "power3.out" : "power2.inOut",
    });
  }, []);

  /**
   * "Forced" stanje = cela slika. Koristi ga dugme (tastatura/čitači) i dodir na telefonu,
   * gde klik naizmenično prebacuje posle → pre → posle.
   */
  useEffect(() => {
    const after = afterRef.current;
    const shot = shotRef.current;
    if (!after) return;

    isOpenRef.current = forcedOpen;
    radiusTweenRef.current?.kill();

    // Radijus veći od dijagonale znači da je puna "posle" slika bez ijedne meke ivice.
    const full = (shot ? Math.hypot(shot.offsetWidth, shot.offsetHeight) : 1400) * 2;

    if (reduced) {
      gsap.set(after, { "--rx": "50%", "--ry": "50%", "--rr": forcedOpen ? `${full}px` : "0px" });
      return;
    }

    if (forcedOpen) gsap.set(after, { "--rx": "50%", "--ry": "50%" });

    radiusTweenRef.current = gsap.to(after, {
      "--rr": forcedOpen ? `${full}px` : "0px",
      duration: forcedOpen ? 0.72 : 0.5,
      ease: forcedOpen ? "power3.out" : "power2.inOut",
    });
  }, [forcedOpen, reduced]);

  /** Čim korisnik sam nešto uradi, demo se gasi i više se ne ponavlja. */
  const killDemo = useCallback(() => {
    demoDoneRef.current = true;
    demoRef.current?.kill();
    demoRef.current = null;
    setIsDemoing(false);
  }, []);

  /**
   * Ključno za nekog ko ne zna šta da radi: kartica sama jednom odigra ono što se
   * očekuje od korisnika — na desktopu reflektor prelete preko slike, na telefonu
   * se cela "posle" slika pokaže pa vrati. Posle toga hint ostaje dok se ne dodirne.
   */
  const playDemo = useCallback(() => {
    const after = afterRef.current;
    const shot = shotRef.current;
    if (!after || demoDoneRef.current || reduced) return;
    demoDoneRef.current = true;

    radiusTweenRef.current?.kill();
    const full = (shot ? Math.hypot(shot.offsetWidth, shot.offsetHeight) : 1400) * 2;

    // Kartice kreću jedna za drugom da sekcija deluje kao jedan potez, ne kao tri odvojena treptaja.
    const tl = gsap.timeline({
      delay: 0.4 + index * 0.55,
      // "Posle" oznaka prati demo da korisnik poveže svetlo sa onim što gleda.
      onStart: () => setIsDemoing(true),
      onComplete: () => {
        demoRef.current = null;
        isOpenRef.current = false;
        setIsDemoing(false);
      },
    });
    demoRef.current = tl;

    if (isTouch) {
      gsap.set(after, { "--rx": "50%", "--ry": "50%", "--rr": "0px" });
      tl.to(after, { "--rr": `${full}px`, duration: 0.9, ease: "power3.out" }).to(
        after,
        { "--rr": "0px", duration: 0.75, ease: "power2.inOut" },
        "+=1.15",
      );
      return;
    }

    gsap.set(after, { "--rx": "30%", "--ry": "40%", "--rr": "0px" });
    tl.to(after, { "--rr": `${MAX_RADIUS}px`, duration: 0.6, ease: "power3.out" })
      .to(after, { "--rx": "72%", "--ry": "60%", duration: 1.45, ease: "sine.inOut" }, "<0.2")
      .to(after, { "--rr": "0px", duration: 0.55, ease: "power2.inOut" }, "-=0.15");
  }, [index, isTouch, reduced]);

  useEffect(() => {
    const shot = shotRef.current;
    if (!shot || reduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        playDemo();
      },
      { threshold: 0.5 },
    );

    observer.observe(shot);
    return () => observer.disconnect();
  }, [playDemo, reduced]);

  useEffect(() => () => killDemo(), [killDemo]);

  const onPointerEnter = (event: React.PointerEvent<HTMLDivElement>) => {
    killDemo();
    if (isTouch || reduced || forcedOpen) return;
    // Bez skoka: reflektor se prvo pozicionira, pa se tek onda otvara.
    moveTo(event.clientX, event.clientY, true);
    setHasInteracted(true);
    setOpen(true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isTouch || reduced || forcedOpen) return;
    moveTo(event.clientX, event.clientY);
  };

  const onPointerLeave = () => {
    if (isTouch || reduced || forcedOpen) return;
    setOpen(false);
  };

  // Na dodir nema reflektora: jedan tap otkriva celu "posle" sliku, sledeći vraća "pre".
  const onPointerDown = () => {
    killDemo();
    if (!isTouch) return;
    setHasInteracted(true);
    setForcedOpen((value) => !value);
  };

  const isRevealed = forcedOpen;

  return (
    <figure className="reveal-figure" style={{ "--reveal-i": index } as React.CSSProperties}>
      <div
        ref={shotRef}
        className={`reveal-shot ${isRevealed ? "is-forced" : ""} ${isDemoing ? "is-demo" : ""} ${
          reduced ? "is-reduced" : ""
        }`}
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

        <span className="reveal-tag reveal-tag-before">Pre</span>
        <span className="reveal-tag reveal-tag-after">Posle</span>

        {!hasInteracted ? (
          <span className="reveal-hint" aria-hidden>
            {isTouch ? <Pointer /> : <MousePointer2 />}
            <span>{isTouch ? "Dodirnite da vidite posle" : "Pređite mišem da vidite posle"}</span>
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
          onClick={() => {
            killDemo();
            setHasInteracted(true);
            setForcedOpen((value) => !value);
          }}
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
            Na svakoj fotografiji je ista osoba pre i posle tretmana. Pređite mišem preko slike — a na telefonu je samo
            dodirnite — da vidite rezultat.
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
