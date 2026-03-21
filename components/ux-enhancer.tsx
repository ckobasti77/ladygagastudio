"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SECTION_SELECTOR = "main section";

const PART_SELECTOR = [
  ":scope > *",
  ".xeno-hero-header > h1",
  ".xeno-hero-header > .xeno-hero-subtitle",
  ".xeno-hero-feature-card",
  ".xeno-hero-service-card",
  ".xeno-pillar-card",
  ".xeno-gallery-card",
  ".xeno-video-card",
  ".xeno-treatment-card",
  ".xeno-slider-card",
  ".xeno-sidebar-product",
  ".gallery-card",
  ".gallery-stat-card",
  ".gallery-media-section",
  ".orbit-metric",
  ".cart-item-card",
  ".checkout-summary-item",
  ".metric-card",
  ".toolbar-card",
  ".legal-overview-card",
  ".legal-signal-card",
  ".legal-doc-section > *",
  ".about-highlight-card",
  ".about-glass-card",
  ".about-gallery-figure",
  ".contact-card",
  ".contact-services-group",
  ".contact-map-card",
  ".contact-form-card",
  ".boutique-card",
  ".product-detail-shell > *",
  ".product-detail-related-card",
  ".auth-luxe-info",
  ".auth-luxe-card",
].join(",");

const HERO_PART_ORDER = [
  ".xeno-hero-bg",
  ".xeno-hero-portrait",
  ".xeno-hero-portrait-mobile",
  ".xeno-hero-header h1",
  ".xeno-hero-header .xeno-hero-subtitle",
  ".xeno-hero-card-grid .xeno-hero-feature-card",
];

const SKIP_SELECTOR = [
  "script",
  "style",
  "noscript",
  ".modal-backdrop",
  ".gallery-delete-backdrop",
  ".gallery-lightbox",
  ".admin-drop-overlay-card",
].join(",");

const SECTION_REVEAL_ATTR = "data-gsap-section-reveal";
const PART_REVEAL_ATTR = "data-gsap-part-reveal";
const REDUCED_MOTION_CLEAR_PROPS = "opacity,visibility,transform,filter,clipPath,willChange,force3D";

type RevealDirection = "left" | "right" | "up" | "down";

let gsapRegistered = false;

function ensureGsapPlugins() {
  if (gsapRegistered) return;
  gsap.registerPlugin(ScrollTrigger);
  gsapRegistered = true;
}

function isRenderable(node: HTMLElement) {
  return node.getClientRects().length > 0;
}

function shouldSkip(node: HTMLElement) {
  return node.matches(SKIP_SELECTOR) || Boolean(node.closest(SKIP_SELECTOR));
}

function uniqueNodes(nodes: HTMLElement[]) {
  const seen = new Set<HTMLElement>();
  return nodes.filter((node) => {
    if (seen.has(node)) return false;
    seen.add(node);
    return true;
  });
}

function sortByViewport(nodes: HTMLElement[]) {
  return [...nodes].sort((a, b) => {
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    if (Math.abs(ar.top - br.top) > 2) return ar.top - br.top;
    return ar.left - br.left;
  });
}

function resolveDirection(node: HTMLElement, index: number): RevealDirection {
  if (node.classList.contains("xeno-hero")) return "up";
  const rect = node.getBoundingClientRect();
  const viewportWidth = Math.max(window.innerWidth, 1);
  const centerX = (rect.left + rect.width / 2) / viewportWidth;

  if (centerX < 0.34) return "left";
  if (centerX > 0.66) return "right";
  return index % 2 === 0 ? "up" : "down";
}

function getSectionFromState(direction: RevealDirection) {
  if (direction === "left") {
    return {
      x: -112,
      y: 20,
      rotateY: -8,
      rotateX: 0,
      clipPath: "inset(0% 100% 0% 0%)",
      transformOrigin: "0% 50%",
    };
  }
  if (direction === "right") {
    return {
      x: 112,
      y: 20,
      rotateY: 8,
      rotateX: 0,
      clipPath: "inset(0% 0% 0% 100%)",
      transformOrigin: "100% 50%",
    };
  }
  if (direction === "down") {
    return {
      x: 0,
      y: -86,
      rotateY: 0,
      rotateX: -8,
      clipPath: "inset(100% 0% 0% 0%)",
      transformOrigin: "50% 0%",
    };
  }

  return {
    x: 0,
    y: 86,
    rotateY: 0,
    rotateX: 8,
    clipPath: "inset(0% 0% 100% 0%)",
    transformOrigin: "50% 100%",
  };
}

function getPartFromState(direction: RevealDirection, isHeroPart: boolean) {
  const distance = isHeroPart ? 76 : 54;
  const depth = isHeroPart ? 8 : 5;
  if (direction === "left") return { x: -distance, y: 16, rotateX: 0, rotateY: -depth };
  if (direction === "right") return { x: distance, y: 16, rotateX: 0, rotateY: depth };
  if (direction === "down") return { x: 0, y: -distance, rotateX: -depth, rotateY: 0 };
  return { x: 0, y: distance, rotateX: depth, rotateY: 0 };
}

function collectSections() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>(SECTION_SELECTOR));
  return sortByViewport(
    uniqueNodes(sections).filter((node) => !shouldSkip(node) && isRenderable(node)),
  );
}

function collectHeroParts(section: HTMLElement) {
  const nodes: HTMLElement[] = [];
  for (const selector of HERO_PART_ORDER) {
    nodes.push(...Array.from(section.querySelectorAll<HTMLElement>(selector)));
  }
  return uniqueNodes(nodes);
}

function collectSectionParts(section: HTMLElement) {
  const rawCandidates = section.classList.contains("xeno-hero")
    ? collectHeroParts(section)
    : Array.from(section.querySelectorAll<HTMLElement>(PART_SELECTOR));

  const filtered = rawCandidates.filter((node) => {
    if (node === section) return false;
    if (node.tagName === "SECTION") return false;
    if (shouldSkip(node) || !isRenderable(node)) return false;
    if (node.hasAttribute(PART_REVEAL_ATTR)) return false;

    const ownerSection = node.closest("section");
    if (ownerSection !== section) return false;

    return true;
  });

  return sortByViewport(uniqueNodes(filtered));
}

function animateSection(section: HTMLElement, index: number) {
  if (section.hasAttribute(SECTION_REVEAL_ATTR)) return;
  section.setAttribute(SECTION_REVEAL_ATTR, "1");

  const direction = resolveDirection(section, index);
  const fromState = getSectionFromState(direction);

  gsap.set(section, {
    autoAlpha: 0,
    x: fromState.x,
    y: fromState.y,
    rotateX: fromState.rotateX,
    rotateY: fromState.rotateY,
    scale: 0.985,
    clipPath: fromState.clipPath,
    transformOrigin: fromState.transformOrigin,
    filter: "blur(10px)",
    willChange: "transform, opacity, filter, clip-path",
    force3D: true,
  });

  gsap.to(section, {
    autoAlpha: 1,
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    filter: "blur(0px)",
    duration: 1.05,
    ease: "power4.out",
    clearProps: "x,y,rotateX,rotateY,scale,clipPath,filter,transformOrigin,willChange,force3D",
    scrollTrigger: {
      trigger: section,
      start: "top 88%",
      end: "bottom 15%",
      toggleActions: "play none none none",
      once: true,
    },
  });
}

function animatePart(part: HTMLElement, section: HTMLElement, index: number) {
  if (part.hasAttribute(PART_REVEAL_ATTR)) return;
  part.setAttribute(PART_REVEAL_ATTR, "1");

  const isHeroPart = section.classList.contains("xeno-hero");
  let direction = resolveDirection(part, index + 1);

  if (isHeroPart) {
    if (part.matches(".xeno-hero-bg")) direction = "down";
    else if (part.matches(".xeno-hero-portrait, .xeno-hero-portrait-mobile")) direction = "left";
    else if (part.matches(".xeno-hero-header h1")) direction = "up";
    else direction = index % 2 === 0 ? "left" : "right";
  }

  const fromState = getPartFromState(direction, isHeroPart);

  gsap.set(part, {
    autoAlpha: 0,
    x: fromState.x,
    y: fromState.y,
    rotateX: fromState.rotateX,
    rotateY: fromState.rotateY,
    filter: isHeroPart ? "blur(11px)" : "blur(8px)",
    willChange: "transform, opacity, filter",
    force3D: true,
  });

  gsap.to(part, {
    autoAlpha: 1,
    x: 0,
    y: 0,
    rotateX: 0,
    rotateY: 0,
    filter: "blur(0px)",
    duration: isHeroPart ? 0.92 : 0.74,
    ease: isHeroPart ? "power4.out" : "power3.out",
    delay: isHeroPart ? Math.min(index * 0.055, 0.38) : 0,
    clearProps: "x,y,rotateX,rotateY,filter,willChange,force3D",
    scrollTrigger: {
      trigger: part,
      start: "top 90%",
      end: "bottom 12%",
      toggleActions: "play none none none",
      once: true,
    },
  });
}

function runRevealPass() {
  const sections = collectSections();

  sections.forEach((section, sectionIndex) => {
    animateSection(section, sectionIndex);
    const parts = collectSectionParts(section);
    parts.forEach((part, partIndex) => animatePart(part, section, partIndex));
  });

  ScrollTrigger.refresh();
}

function setReducedMotionState() {
  const sections = collectSections();
  const parts = sections.flatMap((section) => collectSectionParts(section));
  const targets = uniqueNodes([...sections, ...parts]);
  gsap.set(targets, { clearProps: REDUCED_MOTION_CLEAR_PROPS, autoAlpha: 1 });
}

function clearRevealAttributes() {
  for (const node of document.querySelectorAll<HTMLElement>(`[${SECTION_REVEAL_ATTR}]`)) {
    node.removeAttribute(SECTION_REVEAL_ATTR);
  }
  for (const node of document.querySelectorAll<HTMLElement>(`[${PART_REVEAL_ATTR}]`)) {
    node.removeAttribute(PART_REVEAL_ATTR);
  }
}

export function UxEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    ensureGsapPlugins();

    const root = document.documentElement;
    const body = document.body;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    body.classList.add("ux-enhanced");

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX / Math.max(window.innerWidth, 1);
      const y = event.clientY / Math.max(window.innerHeight, 1);
      root.style.setProperty("--ux-pointer-x", x.toFixed(3));
      root.style.setProperty("--ux-pointer-y", y.toFixed(3));
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    if (mediaQuery.matches) {
      setReducedMotionState();
      return () => {
        window.removeEventListener("pointermove", onPointerMove);
      };
    }

    clearRevealAttributes();
    runRevealPass();

    let mutationTimer: number | null = null;
    const scheduleRevealPass = () => {
      if (mutationTimer) window.clearTimeout(mutationTimer);
      mutationTimer = window.setTimeout(() => {
        runRevealPass();
      }, 180);
    };

    const observerTarget = document.querySelector("main") ?? document.body;
    const observer = new MutationObserver((entries) => {
      const hasRelevantChanges = entries.some((entry) => entry.addedNodes.length > 0 || entry.removedNodes.length > 0);
      if (!hasRelevantChanges) return;
      scheduleRevealPass();
    });

    observer.observe(observerTarget, { childList: true, subtree: true });

    const secondPass = window.setTimeout(() => runRevealPass(), 520);
    const thirdPass = window.setTimeout(() => runRevealPass(), 1450);
    const onLoad = () => runRevealPass();

    window.addEventListener("load", onLoad, { once: true });

    const onReduceMotionChange = () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      clearRevealAttributes();
      if (mediaQuery.matches) {
        setReducedMotionState();
        return;
      }
      runRevealPass();
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", onReduceMotionChange);
    } else {
      mediaQuery.addListener(onReduceMotionChange);
    }

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      observer.disconnect();
      window.removeEventListener("load", onLoad);
      window.clearTimeout(secondPass);
      window.clearTimeout(thirdPass);
      if (mutationTimer) window.clearTimeout(mutationTimer);

      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", onReduceMotionChange);
      } else {
        mediaQuery.removeListener(onReduceMotionChange);
      }

      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      ScrollTrigger.clearScrollMemory();
      clearRevealAttributes();
    };
  }, [pathname]);

  return null;
}
