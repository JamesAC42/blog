
import milk from "@/assets/images/stickers/_milk.png";
import swirl from "@/assets/images/stickers/_swirl.png";
import korilakuma from "@/assets/images/stickers/_korilakuma.png";
import flower from "@/assets/images/stickers/_flower.png";
import star from "@/assets/images/stickers/_star.png";

import styles from "./stickercontainer.module.scss";
import { useMemo } from "react";
import Image, { StaticImageData } from "next/image";

interface StickerData {
    stickerImage: StaticImageData,
    rotation: number,
    translation: number
}
export const StickerContainer = ({ blogId }: { blogId: string }) => {

    const stickers: StaticImageData[] = useMemo(() => [milk, swirl, korilakuma, flower, star], []);
    const randomStickers: StickerData[] = useMemo((): StickerData[] => {
        // Create a seeded random number generator
        const mulberry32 = (a: number) => {
            return function() {
                let t = a += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
        };

        const seed = blogId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seededRandom = mulberry32(seed);

        const numStickers = Math.floor(seededRandom() * 5) + 1;

        const randomStickers: StickerData[] = [];
        for (let i = 0; i < numStickers; i++) {
            const randomIndex = Math.floor(seededRandom() * stickers.length);
            const randomRotation = Math.floor(seededRandom() * 90) - 45; // Random number between -45 and 45
            const randomTranslation = Math.floor(seededRandom() * 30) - 15; // Random number between -15 and 15
            const stickerData: StickerData = {
                stickerImage: stickers[randomIndex],
                rotation: randomRotation,
                translation: randomTranslation
            };
            randomStickers.push(stickerData);
        }

        return randomStickers;
    }, [blogId, stickers]);

    return (
        <div className={styles.stickerContainer}>
            {randomStickers.map((sticker, index) => (
                <Image 
                    src={sticker.stickerImage} 
                    alt="sticker"
                    key={index} 
                    style={{ transform: `rotate(${sticker.rotation}deg) translateY(${sticker.translation}px)` }} 
                    className={styles.sticker}
                />
            ))}
        </div>
    );
};
