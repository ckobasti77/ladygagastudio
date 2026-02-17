"use client";

import Image from "next/image";
import { MouseEvent, ReactNode, useEffect, useMemo, useState } from "react";

type ProductCardImageSliderProps = {
  images: string[];
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  loading?: "eager" | "lazy";
  children?: ReactNode;
};

export function ProductCardImageSlider({
  images,
  alt,
  width,
  height,
  sizes,
  loading = "lazy",
  children,
}: ProductCardImageSliderProps) {
  const safeImages = useMemo(() => {
    const filtered = images.filter((image) => image.trim().length > 0);
    return filtered.length > 0 ? filtered : ["/logo.png"];
  }, [images]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const totalImages = safeImages.length;
  const hasMultipleImages = totalImages > 1;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [safeImages]);

  const moveImage = (direction: 1 | -1) => {
    setActiveImageIndex((current) => {
      const next = current + direction;
      if (next < 0) return totalImages - 1;
      if (next >= totalImages) return 0;
      return next;
    });
  };

  const onArrowClick =
    (direction: 1 | -1) =>
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      moveImage(direction);
    };

  return (
    <div className="card-media-wrap product-card-slider">
      <Image src={safeImages[activeImageIndex]} alt={alt} width={width} height={height} sizes={sizes} loading={loading} />
      {children}
      {hasMultipleImages ? (
        <div className="product-card-slider-controls" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            className="product-card-slider-arrow"
            aria-label="Prethodna slika"
            onClick={onArrowClick(-1)}
          >
            <ChevronLeft />
          </button>
          <span className="product-card-slider-counter">
            {activeImageIndex + 1}/{totalImages}
          </span>
          <button type="button" className="product-card-slider-arrow" aria-label="Sledeća slika" onClick={onArrowClick(1)}>
            <ChevronRight />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
