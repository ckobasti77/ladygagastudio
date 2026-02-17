"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { GalleryLightbox } from "@/components/gallery-lightbox";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { Download, ImagePlus, Pause, Play, Trash2, X } from "lucide-react";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type MediaKind = "image" | "video";

type GalleryMedia = {
  _id: Id<"galleryImages">;
  storageId: Id<"_storage">;
  url: string;
  originalName: string;
  contentType?: string;
  size?: number;
  createdAt: number;
  kind: MediaKind;
};

type MutationReference = Parameters<typeof useMutation>[0];
type LightboxScope = MediaKind | "all";

const EMPTY_MEDIA: GalleryMedia[] = [];

export default function GalleryPage() {
  const { t } = useLanguage();
  const { session } = useAuth();
  const isAdmin = session?.isAdmin ?? false;

  const rawMedia = useQuery(api.gallery.list, {}) as GalleryMedia[] | undefined;
  const media = rawMedia ?? EMPTY_MEDIA;

  const images = useMemo(() => media.filter((item) => item.kind === "image"), [media]);
  const videos = useMemo(() => media.filter((item) => item.kind === "video"), [media]);

  const generateUploadUrl = useMutation(
    (
      api as unknown as {
        gallery: { generateUploadUrl: MutationReference };
      }
    ).gallery.generateUploadUrl,
  ) as () => Promise<string>;

  const addImage = useMutation(api.gallery.addImage);
  const deleteImage = useMutation(api.gallery.deleteImage);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryMedia | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [lightboxState, setLightboxState] = useState<{ scope: LightboxScope; index: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isGlobalFileDrag, setIsGlobalFileDrag] = useState(false);
  const dragDepthRef = useRef(0);
  const uploadFromDropRef = useRef<(files: FileList | null) => void>(() => {});

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 4200);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const onUploadMedia = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (!isAdmin) return;

      const acceptedFiles = Array.from(files).filter((file) => isAcceptedMediaFile(file));
      if (acceptedFiles.length === 0) {
        setFeedback({ type: "error", message: "Dozvoljeno je otpremanje samo slika i snimaka." });
        return;
      }

      setIsUploading(true);
      try {
        let uploadedImages = 0;
        let uploadedVideos = 0;
        let failed = 0;

        for (const file of acceptedFiles) {
          try {
            const uploadUrl = await generateUploadUrl();
            const response = await fetch(uploadUrl, {
              method: "POST",
              headers: { "Content-Type": file.type || "application/octet-stream" },
              body: file,
            });

            if (!response.ok) {
              failed += 1;
              continue;
            }

            const payload = (await response.json()) as { storageId?: string };
            if (!payload.storageId) {
              failed += 1;
              continue;
            }

            await addImage({
              storageId: payload.storageId as Id<"_storage">,
              originalName: file.name,
              contentType: file.type || undefined,
              size: Number.isFinite(file.size) ? file.size : undefined,
            });

            if (inferFileKind(file.type, file.name) === "video") {
              uploadedVideos += 1;
            } else {
              uploadedImages += 1;
            }
          } catch {
            failed += 1;
          }
        }

        const uploadedTotal = uploadedImages + uploadedVideos;
        if (uploadedTotal > 0 && failed === 0) {
          setFeedback({
            type: "success",
            message: `Dodato: ${formatMediaCounter(uploadedImages, uploadedVideos)}.`,
          });
        } else if (uploadedTotal > 0 && failed > 0) {
          setFeedback({
            type: "error",
            message: `Dodato: ${formatMediaCounter(uploadedImages, uploadedVideos)}. Neuspešnih otpremanja: ${failed}.`,
          });
        } else {
          setFeedback({ type: "error", message: "Otpremanje nije uspelo. Pokušajte ponovo." });
        }
      } finally {
        setIsUploading(false);
      }
    },
    [addImage, generateUploadUrl, isAdmin],
  );

  useEffect(() => {
    uploadFromDropRef.current = (files) => {
      void onUploadMedia(files);
    };
  }, [onUploadMedia]);

  useEffect(() => {
    if (!isAdmin) {
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
      return;
    }

    const isFileDrag = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes("Files");

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepthRef.current += 1;
      setIsGlobalFileDrag(true);
    };

    const onDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      setIsGlobalFileDrag(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsGlobalFileDrag(false);
      }
    };

    const onDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      event.stopPropagation();
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
      uploadFromDropRef.current(event.dataTransfer?.files ?? null);
    };

    const onDragEnd = () => {
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
    };

    window.addEventListener("dragenter", onDragEnter, true);
    window.addEventListener("dragover", onDragOver, true);
    window.addEventListener("dragleave", onDragLeave, true);
    window.addEventListener("drop", onDrop, true);
    window.addEventListener("dragend", onDragEnd, true);

    return () => {
      window.removeEventListener("dragenter", onDragEnter, true);
      window.removeEventListener("dragover", onDragOver, true);
      window.removeEventListener("dragleave", onDragLeave, true);
      window.removeEventListener("drop", onDrop, true);
      window.removeEventListener("dragend", onDragEnd, true);
      dragDepthRef.current = 0;
      setIsGlobalFileDrag(false);
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!lightboxState) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [lightboxState]);

  const listByScope = useCallback(
    (scope: LightboxScope) => {
      if (scope === "all") return media;
      return scope === "video" ? videos : images;
    },
    [images, media, videos],
  );

  useEffect(() => {
    if (!lightboxState) return;
    const scopedMedia = listByScope(lightboxState.scope);
    if (scopedMedia.length === 0) {
      setLightboxState(null);
      return;
    }
    if (lightboxState.index >= scopedMedia.length) {
      setLightboxState({ scope: lightboxState.scope, index: 0 });
    }
  }, [lightboxState, listByScope]);

  const openLightbox = (scope: LightboxScope, index: number) => {
    const list = listByScope(scope);
    if (index < 0 || index >= list.length) return;
    setLightboxState({ scope, index });
  };

  const closeLightbox = () => setLightboxState(null);

  const nextMedia = useCallback(() => {
    setLightboxState((current) => {
      if (!current) return null;
      const list = listByScope(current.scope);
      if (list.length === 0) return null;
      return { scope: current.scope, index: (current.index + 1) % list.length };
    });
  }, [listByScope]);

  const previousMedia = useCallback(() => {
    setLightboxState((current) => {
      if (!current) return null;
      const list = listByScope(current.scope);
      if (list.length === 0) return null;
      return { scope: current.scope, index: (current.index - 1 + list.length) % list.length };
    });
  }, [listByScope]);

  useEffect(() => {
    if (!lightboxState) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextMedia();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousMedia();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxState, nextMedia, previousMedia]);

  const activeList = useMemo(() => {
    if (!lightboxState) return EMPTY_MEDIA;
    return listByScope(lightboxState.scope);
  }, [lightboxState, listByScope]);

  const activeMedia = useMemo(() => {
    if (!lightboxState) return null;
    return activeList[lightboxState.index] ?? null;
  }, [activeList, lightboxState]);

  const pickFiles = () => fileInputRef.current?.click();

  const onPickFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    await onUploadMedia(input.files);
    input.value = "";
  };

  const onCardKeyDown = (event: ReactKeyboardEvent<HTMLElement>, scope: LightboxScope, index: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openLightbox(scope, index);
  };

  const download = async (item: GalleryMedia) => {
    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        setFeedback({ type: "error", message: "Preuzimanje nije uspelo. Pokušajte ponovo." });
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = buildDownloadName(item);
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setFeedback({ type: "error", message: "Preuzimanje nije uspelo. Pokušajte ponovo." });
    }
  };

  const requestDelete = (item: GalleryMedia) => {
    if (!isAdmin) return;
    setDeleteTarget(item);
  };

  const confirmDelete = async (event: FormEvent) => {
    event.preventDefault();
    if (!deleteTarget) return;
    if (!isAdmin) return;

    setIsDeleting(true);
    try {
      if (activeMedia?._id === deleteTarget._id) {
        closeLightbox();
      }
      await deleteImage({ imageId: deleteTarget._id });
      setDeleteTarget(null);
      setFeedback({ type: "success", message: "Fajl je obrisan." });
    } catch {
      setFeedback({ type: "error", message: "Brisanje nije uspelo. Pokušajte ponovo." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="page-grid orbit-page gallery-orbit">
      <article className={`orbit-hero gallery-hero ${isAdmin ? "" : "gallery-hero-user"} orbit-reveal`}>
        <div className="orbit-hud" aria-hidden>
          <span>Transformacije</span>
          <strong>{isAdmin ? "Galerija radova | Studio Lady Gaga" : "Galerija inspiracije | Studio Lady Gaga"}</strong>
        </div>

        <p className="orbit-eyebrow">{t.nav.gallery}</p>
        <h1>{isAdmin ? "Slike i snimci koji prikazuju realne rezultate iz studija." : "Galerija transformacija iz studija Lady Gaga."}</h1>
        <p className="orbit-lead">
          {isAdmin
            ? "Klikni na karticu za uvećanje i listanje. Admin može da doda fajlove prevlačenjem i puštanjem bilo gde."
            : "Sav medijski sadržaj je prikazan zajedno kao jedinstvena galerija. Dugme za reprodukciju pušta snimak na licu mesta, a klik na kadar otvara uvećani prikaz."}
        </p>

        {!isAdmin ? (
          <div className="orbit-actions gallery-hero-actions">
            <Link href="/kontakt" className="primary-btn orbit-main-action">
              Kontakt / upit
            </Link>
            <Link href="/proizvodi" className="ghost-btn orbit-second-action">
              Pogledaj proizvode
            </Link>
          </div>
        ) : null}

        <div className="gallery-hero-metrics">
          {isAdmin ? (
            <>
              <article className="orbit-metric">
                <strong>{rawMedia === undefined ? "..." : media.length}</strong>
                <span>ukupno medija</span>
              </article>
              <article className="orbit-metric">
                <strong>{rawMedia === undefined ? "..." : images.length}</strong>
                <span>fotografija</span>
              </article>
              <article className="orbit-metric">
                <strong>{rawMedia === undefined ? "..." : videos.length}</strong>
                <span>snimaka</span>
              </article>
            </>
          ) : (
            <>
              <article className="orbit-metric">
                <strong>{rawMedia === undefined ? "..." : media.length}</strong>
                <span>ukupno kadrova</span>
              </article>
              <article className="orbit-metric">
                <strong>Uživo</strong>
                <span>osvežava se automatski</span>
              </article>
              <article className="orbit-metric">
                <strong>Ceo ekran</strong>
                <span>klik na kadar za uvećanje</span>
              </article>
            </>
          )}
        </div>
      </article>

      {isAdmin ? (
        <section className="orbit-panel gallery-upload-panel orbit-reveal">
          <p className="orbit-panel-tag">Admin dodatak</p>
          <h2>Dodavanje slika i snimaka</h2>
          <p className="gallery-upload-sub">
            Prevuci i spusti fajlove bilo gde na stranici ili dodaj preko dugmeta. Podržane su slike i snimci.
          </p>

          <div className="gallery-upload-actions">
            <button type="button" className="primary-btn gallery-upload-btn" onClick={pickFiles} disabled={isUploading}>
              <ImagePlus aria-hidden />
              {isUploading ? "Otpremanje..." : "Dodaj slike i snimke"}
            </button>

            <input ref={fileInputRef} type="file" accept="image/*,video/*" multiple onChange={onPickFiles} hidden />

            <span className="gallery-upload-hint">Tip: Prevuci i pusti preko celog ekrana.</span>
          </div>

          {feedback ? (
            <p className={`status-msg gallery-feedback ${feedback.type === "success" ? "gallery-feedback-success" : "gallery-feedback-error"}`}>
              {feedback.message}
            </p>
          ) : null}
        </section>
      ) : feedback ? (
        <section className="orbit-panel orbit-reveal">
          <p className={`status-msg gallery-feedback ${feedback.type === "success" ? "gallery-feedback-success" : "gallery-feedback-error"}`}>
            {feedback.message}
          </p>
        </section>
      ) : null}

      <section className="orbit-panel gallery-board orbit-reveal">
        <div className="gallery-board-head">
          <p className="orbit-panel-tag">{isAdmin ? "Mediji" : "Galerija"}</p>
          <h2>{isAdmin ? "Galerija radova" : "Galerija transformacija"}</h2>
          <p className="gallery-board-sub">
            {isAdmin
              ? "Slike i snimci su odvojeni po tipu. Tasteri: "
              : "Sav sadržaj je objedinjen u jednom nizu. Dugme za reprodukciju pušta snimak u kartici, a klik na karticu ga otvara preko celog ekrana. Tasteri: "}
            <kbd>Left</kbd> <kbd>Right</kbd> i <kbd>Esc</kbd>.
          </p>
        </div>

        {rawMedia === undefined ? (
          <div className="loading-card gallery-loading">Učitavanje galerije...</div>
        ) : media.length === 0 ? (
          <div className="empty-state gallery-empty">
            <h3>Galerija je trenutno prazna.</h3>
            <p>{isAdmin ? "Dodajte fajlove na vrhu ili prevucite medije na stranicu." : "Pogledajte ponovo uskoro."}</p>
          </div>
        ) : isAdmin ? (
          <div className="gallery-media-sections">
            <GalleryMediaSection
              title="Fotografije"
              description="Klik za uvećanje fotografije."
              kind="image"
              items={images}
              isAdmin={isAdmin}
              onOpen={openLightbox}
              onCardKeyDown={onCardKeyDown}
              onDownload={download}
              onDelete={requestDelete}
            />

            <GalleryMediaSection
              title="Snimci"
              description="Klik za reprodukciju u lightbox prikazu."
              kind="video"
              items={videos}
              isAdmin={isAdmin}
              onOpen={openLightbox}
              onCardKeyDown={onCardKeyDown}
              onDownload={download}
              onDelete={requestDelete}
            />
          </div>
        ) : (
          <GalleryLookbookGrid items={media} onOpen={openLightbox} />
        )}
      </section>

      {activeMedia && lightboxState ? (
        <GalleryLightbox
          key={`${activeMedia._id}:${lightboxState.index}`}
          media={activeMedia}
          index={lightboxState.index}
          total={activeList.length}
          onClose={closeLightbox}
          onNext={nextMedia}
          onPrevious={previousMedia}
          hideMeta={!isAdmin}
          onDownload={isAdmin ? () => void download(activeMedia) : undefined}
          onDelete={
            isAdmin
              ? () => {
                  closeLightbox();
                  requestDelete(activeMedia);
                }
              : undefined
          }
        />
      ) : null}

      {deleteTarget ? (
        <div className="modal-backdrop gallery-delete-backdrop" onClick={() => (isDeleting ? null : setDeleteTarget(null))}>
          <div className="modal-card gallery-delete-card" onClick={(event) => event.stopPropagation()}>
            <div className="gallery-delete-head">
              <h3>Obriši fajl?</h3>
              <button
                type="button"
                className="icon-btn icon-btn-circle"
                onClick={() => setDeleteTarget(null)}
                aria-label="Zatvori"
                disabled={isDeleting}
              >
                <X aria-hidden />
              </button>
            </div>
            <p className="gallery-delete-copy">Ova akcija briše fajl iz galerije i iz Convex skladišta.</p>

            <form className="gallery-delete-actions" onSubmit={confirmDelete}>
              <button type="button" className="ghost-btn" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                Odustani
              </button>
              <button type="submit" className="primary-btn danger" disabled={isDeleting}>
                {isDeleting ? "Brisanje..." : "Potvrdi brisanje"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {isAdmin && isGlobalFileDrag ? (
        <div className="admin-drop-overlay" aria-hidden="true">
          <div className="admin-drop-overlay-card">
            <strong>Spusti slike ili snimke bilo gde</strong>
            <p>Otpustite fajlove i otpremanje će krenuti odmah.</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function GalleryMediaSection({
  title,
  description,
  kind,
  items,
  isAdmin,
  onOpen,
  onCardKeyDown,
  onDownload,
  onDelete,
}: {
  title: string;
  description: string;
  kind: MediaKind;
  items: GalleryMedia[];
  isAdmin: boolean;
  onOpen: (kind: MediaKind, index: number) => void;
  onCardKeyDown: (event: ReactKeyboardEvent<HTMLElement>, kind: MediaKind, index: number) => void;
  onDownload: (item: GalleryMedia) => Promise<void>;
  onDelete: (item: GalleryMedia) => void;
}) {
  return (
    <article className="gallery-media-section">
      <div className="gallery-media-section-head">
        <p className="orbit-panel-tag">{title}</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="empty-state gallery-empty-subsection">
          <h4>{kind === "image" ? "Nema dodatih slika." : "Nema dodatih snimaka."}</h4>
          <p>{kind === "image" ? "Dodajte fotografije da se prikazuju ovde." : "Dodajte video snimke da se prikazuju ovde."}</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {items.map((item, index) => (
            <figure
              key={item._id}
              className="gallery-card"
              role="button"
              tabIndex={0}
              onClick={() => onOpen(kind, index)}
              onKeyDown={(event) => onCardKeyDown(event, kind, index)}
              aria-label={`Otvori ${kind === "image" ? "sliku" : "snimak"} ${index + 1} od ${items.length}`}
            >
              <div className="gallery-card-media">
                {kind === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.originalName ? `Frizura: ${item.originalName}` : "Frizura iz galerije"}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 980px) 33vw, 25vw"
                    className="gallery-card-img"
                  />
                ) : (
                  <video className="gallery-card-video" preload="metadata" playsInline muted>
                    <source src={item.url} type={item.contentType || "video/mp4"} />
                  </video>
                )}
              </div>

              <span className={`gallery-card-kind ${kind}`}>{kind === "image" ? "Slika" : "Snimak"}</span>

              <figcaption className="gallery-card-caption">
                <span>{formatShortDate(item.createdAt)}</span>
              </figcaption>

              {isAdmin ? (
                <div className="gallery-card-actions" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="icon-btn icon-btn-circle gallery-action-btn"
                    onClick={() => void onDownload(item)}
                    aria-label="Preuzmi"
                    title="Preuzmi"
                  >
                    <Download aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn-circle danger gallery-action-btn"
                    onClick={() => onDelete(item)}
                    aria-label="Obriši"
                    title="Obriši"
                  >
                    <Trash2 aria-hidden />
                  </button>
                </div>
              ) : null}
            </figure>
          ))}
        </div>
      )}
    </article>
  );
}

function GalleryLookbookGrid({
  items,
  onOpen,
}: {
  items: GalleryMedia[];
  onOpen: (scope: LightboxScope, index: number) => void;
}) {
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videoRefs = useRef(new Map<string, HTMLVideoElement>());

  const setVideoRef = useCallback((id: string, node: HTMLVideoElement | null) => {
    if (node) {
      videoRefs.current.set(id, node);
      return;
    }
    videoRefs.current.delete(id);
  }, []);

  const pauseInlineVideos = useCallback((skipId?: string) => {
    videoRefs.current.forEach((video, id) => {
      if (skipId && id === skipId) return;
      video.pause();
    });
  }, []);

  const openCard = (index: number) => {
    pauseInlineVideos();
    setPlayingVideoId(null);
    onOpen("all", index);
  };

  const onCardKeyDown = (event: ReactKeyboardEvent<HTMLElement>, index: number) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openCard(index);
  };

  const toggleInlineVideo = async (event: ReactMouseEvent<HTMLButtonElement>, itemId: string) => {
    event.preventDefault();
    event.stopPropagation();

    const activeVideo = videoRefs.current.get(itemId);
    if (!activeVideo) return;

    if (!activeVideo.paused && !activeVideo.ended) {
      activeVideo.pause();
      setPlayingVideoId((current) => (current === itemId ? null : current));
      return;
    }

    pauseInlineVideos(itemId);
    try {
      await activeVideo.play();
      setPlayingVideoId(itemId);
    } catch {
      setPlayingVideoId(null);
    }
  };

  return (
    <div className="gallery-lookbook-grid">
      {items.map((item, index) => {
        const itemId = String(item._id);
        const isVideo = item.kind === "video";
        const isPlaying = playingVideoId === itemId;

        return (
          <figure
            key={item._id}
            className={`gallery-lookbook-item ${lookbookAspectClass(index, item.kind)}`}
            role="button"
            tabIndex={0}
            onClick={() => openCard(index)}
            onKeyDown={(event) => onCardKeyDown(event, index)}
            aria-label={`Otvori kadar ${index + 1} od ${items.length}`}
          >
            <div className={`gallery-card gallery-lookbook-card ${isVideo ? "is-video" : ""}`}>
              <div className="gallery-card-media">
                {isVideo ? (
                  <video
                    ref={(node) => setVideoRef(itemId, node)}
                    className="gallery-card-video"
                    preload="metadata"
                    playsInline
                    onPause={() => setPlayingVideoId((current) => (current === itemId ? null : current))}
                    onEnded={() => setPlayingVideoId((current) => (current === itemId ? null : current))}
                  >
                    <source src={item.url} type={item.contentType || "video/mp4"} />
                  </video>
                ) : (
                  <Image
                    src={item.url}
                    alt={item.originalName ? `Frizura: ${item.originalName}` : "Frizura iz galerije"}
                    fill
                    sizes="(max-width: 760px) 100vw, (max-width: 1180px) 50vw, 25vw"
                    className="gallery-card-img"
                  />
                )}
              </div>

              {isVideo ? (
                <button
                  type="button"
                  className={`gallery-lookbook-play ${isPlaying ? "is-playing" : ""}`}
                  onClick={(event) => void toggleInlineVideo(event, itemId)}
                  aria-label={isPlaying ? "Pauziraj snimak" : "Pusti snimak"}
                  title={isPlaying ? "Pauziraj snimak" : "Pusti snimak"}
                >
                  {isPlaying ? <Pause aria-hidden /> : <Play aria-hidden />}
                </button>
              ) : null}
            </div>
          </figure>
        );
      })}
    </div>
  );
}

function lookbookAspectClass(index: number, kind: MediaKind) {
  const imagePattern = ["portrait", "tall", "square", "wide", "portrait", "square", "wide", "tall"];
  const videoPattern = ["tall", "portrait", "wide", "portrait"];
  const pattern = kind === "video" ? videoPattern : imagePattern;
  const token = pattern[index % pattern.length];
  return `is-${token}`;
}

function formatShortDate(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function isAcceptedMediaType(contentType: string) {
  const type = (contentType || "").toLowerCase();
  return type.startsWith("image/") || type.startsWith("video/");
}

function isAcceptedMediaFile(file: Pick<File, "type" | "name">) {
  if (isAcceptedMediaType(file.type)) return true;
  const lowerName = (file.name || "").toLowerCase();
  return /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp|mp4|webm|mov|m4v|avi|mkv)$/.test(lowerName);
}

function inferFileKind(contentType: string, fileName: string): MediaKind {
  const type = (contentType || "").toLowerCase();
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("image/")) return "image";

  const lowerName = (fileName || "").toLowerCase();
  if (/\.(mp4|webm|mov|m4v|avi|mkv)$/.test(lowerName)) return "video";
  return "image";
}

function formatMediaCounter(images: number, videos: number) {
  const chunks: string[] = [];
  if (images > 0) chunks.push(`${images} slika`);
  if (videos > 0) chunks.push(`${videos} snimaka`);
  return chunks.join(", ");
}

function buildDownloadName(media: Pick<GalleryMedia, "originalName" | "contentType" | "createdAt" | "kind">) {
  const raw = (media.originalName || "").trim();
  const base = raw.length > 0 ? raw : `galerija-${new Date(media.createdAt).toISOString().replaceAll(":", "-")}`;
  const safe = base.replace(/[\\/:*?"<>|]+/g, "-").trim().slice(0, 120) || "galerija";
  if (/\.[a-z0-9]{1,5}$/i.test(safe)) return safe;

  const ext = extensionFromContentType(media.contentType) ?? (media.kind === "video" ? "mp4" : "jpg");
  return `${safe}.${ext}`;
}

function extensionFromContentType(contentType: string | undefined) {
  const type = (contentType || "").toLowerCase();

  if (type.startsWith("image/")) {
    const ext = type.slice("image/".length).trim();
    if (ext === "jpeg") return "jpg";
    if (ext === "svg+xml") return "svg";
    if (ext === "x-icon") return "ico";
    return ext.length > 0 ? ext : null;
  }

  if (type.startsWith("video/")) {
    const ext = type.slice("video/".length).trim();
    if (ext === "quicktime") return "mov";
    if (ext === "x-msvideo") return "avi";
    return ext.length > 0 ? ext : null;
  }

  return null;
}
