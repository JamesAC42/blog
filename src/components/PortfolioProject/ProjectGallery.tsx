"use client";

import { useState } from "react";
import Image from "next/image";
import type { PortfolioImage } from "@/types/portfolio";
import styles from "@/app/projects/projects.module.scss";

interface ProjectGalleryProps {
  heroImage?: PortfolioImage;
  galleryImages: PortfolioImage[];
  projectTitle: string;
}

export function ProjectGallery({ heroImage, galleryImages, projectTitle }: ProjectGalleryProps) {
  const [activeImage, setActiveImage] = useState<PortfolioImage | null>(null);
  const hasHero = Boolean(heroImage);
  const hasGallery = galleryImages.length > 0;

  if (!hasHero && !hasGallery) return null;

  const handleOpen = (image: PortfolioImage) => setActiveImage(image);
  const handleClose = () => setActiveImage(null);

  return (
    <>
      <div className={styles.projectGallery}>
        {heroImage ? (
          <figure className={styles.heroFigure} key={heroImage.id ?? `${projectTitle}-hero`}>
            <button
              type="button"
              className={styles.galleryButton}
              onClick={() => handleOpen(heroImage)}
              aria-label="Expand hero image"
            >
              <Image
                src={heroImage.url}
                alt={heroImage.caption ?? `${projectTitle} hero image`}
                width={1600}
                height={900}
                sizes="(min-width: 1024px) 1000px, 100vw"
                className={styles.heroImage}
              />
            </button>
            {heroImage.caption ? <figcaption>{heroImage.caption}</figcaption> : null}
          </figure>
        ) : null}
        {galleryImages.length ? (
          <details className={styles.galleryDetails}>
            <summary>
              View gallery ({galleryImages.length})<span aria-hidden>＋</span>
            </summary>
            <div className={styles.galleryGrid}>
              {galleryImages.map((image, idx) => (
                <figure key={image.id ?? `${projectTitle}-gallery-${idx}`}>
                  <button
                    type="button"
                    className={styles.galleryButton}
                    onClick={() => handleOpen(image)}
                    aria-label="Expand gallery image"
                  >
                    <Image
                      src={image.url}
                      alt={image.caption ?? `${projectTitle} gallery image`}
                      width={800}
                      height={600}
                      sizes="(min-width: 1024px) 400px, 100vw"
                      className={styles.galleryImage}
                    />
                  </button>
                  {image.caption ? <figcaption>{image.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          </details>
        ) : null}
      </div>
      {activeImage ? (
        <div className={styles.lightbox} role="dialog" aria-modal="true" onClick={handleClose}>
          <div className={styles.lightboxInner} onClick={(evt) => evt.stopPropagation()}>
            <button type="button" className={styles.lightboxClose} onClick={handleClose}>
              Close
            </button>
            <div className={styles.lightboxMedia}>
              <Image
                src={activeImage.url}
                alt={activeImage.caption ?? `${projectTitle} lightbox image`}
                width={1600}
                height={900}
                sizes="100vw"
                className={styles.lightboxImage}
              />
            </div>
            {activeImage.caption ? <p>{activeImage.caption}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
