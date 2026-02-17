"use client";

import { ChevronLeft, ChevronRight, Download, Trash2, X } from "lucide-react";
import { PointerEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export type GalleryLightboxMedia = {
  url: string;
  originalName: string;
  contentType?: string;
  kind: "image" | "video";
};

type GalleryLightboxProps = {
  media: GalleryLightboxMedia;
  index: number;
  total: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hideMeta?: boolean;
  onDownload?: () => void;
  onDelete?: () => void;
};

export function GalleryLightbox({
  media,
  index,
  total,
  onClose,
  onNext,
  onPrevious,
  hideMeta = false,
  onDownload,
  onDelete,
}: GalleryLightboxProps) {
  const swipeStartX = useRef<number | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const top = topRef.current;
    if (!stage || !top) return;

    const setTopHeight = () => {
      const topHeight = Math.ceil(top.getBoundingClientRect().height);
      stage.style.setProperty("--lightbox-top-height", `${topHeight}px`);
    };

    setTopHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(setTopHeight);
      resizeObserver.observe(top);
    }

    window.addEventListener("resize", setTopHeight);
    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", setTopHeight);
    };
  }, [hideMeta, index, media.url]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    swipeStartX.current = event.clientX;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const start = swipeStartX.current;
    swipeStartX.current = null;
    if (start === null) return;

    const delta = event.clientX - start;
    if (Math.abs(delta) < 60) return;

    if (delta < 0) {
      onNext();
      return;
    }

    onPrevious();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="gallery-lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <div
        ref={stageRef}
        className="gallery-lightbox-stage"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div ref={topRef} className={`gallery-lightbox-top ${hideMeta ? "compact" : ""}`}>
          {!hideMeta ? (
            <div className="gallery-lightbox-meta">
              <span className="gallery-lightbox-count">
                {media.kind === "video" ? "Snimak" : "Slika"} {index + 1} / {total}
              </span>
            </div>
          ) : null}

          <div className="gallery-lightbox-actions">
            {typeof onDownload === "function" ? (
              <button type="button" className="icon-btn icon-btn-circle gallery-action-btn" onClick={onDownload} aria-label="Preuzmi" title="Preuzmi">
                <Download aria-hidden />
              </button>
            ) : null}
            {typeof onDelete === "function" ? (
              <button type="button" className="icon-btn icon-btn-circle danger gallery-action-btn" onClick={onDelete} aria-label="Obriši" title="Obriši">
                <Trash2 aria-hidden />
              </button>
            ) : null}

            <button type="button" className="icon-btn icon-btn-circle gallery-action-btn" onClick={onClose} aria-label="Zatvori" title="Zatvori">
              <X aria-hidden />
            </button>
          </div>
        </div>

        <div className="gallery-lightbox-media" key={`${media.kind}:${media.url}`}>
          {media.kind === "image" ? (
            <img
              src={media.url}
              alt={media.originalName ? `Frizura: ${media.originalName}` : "Frizura iz galerije"}
              className="gallery-lightbox-img"
              loading="eager"
              draggable={false}
            />
          ) : (
            <video className="gallery-lightbox-video" controls autoPlay playsInline preload="metadata" key={media.url}>
              <source src={media.url} type={media.contentType || "video/mp4"} />
            </video>
          )}
        </div>

        {total > 1 ? (
          <>
            <button type="button" className="gallery-lightbox-nav prev" onClick={onPrevious} aria-label="Prethodni fajl">
              <ChevronLeft aria-hidden />
            </button>
            <button type="button" className="gallery-lightbox-nav next" onClick={onNext} aria-label="Sledeći fajl">
              <ChevronRight aria-hidden />
            </button>
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
