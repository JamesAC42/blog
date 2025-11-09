import styles from "./kaomojiinput.module.scss";

import kaomojis from "@/lib/kaomojis.json";

import { useState } from "react";

export const KaomojiInput = ({ onInsert }: { onInsert: (kaomoji: string) => void }) => {
    
    const [activeCategory, setActiveCategory] = useState<string | null>("Joy");

    const kaomojiList: { [category: string]: string[] } = kaomojis;

    if (!kaomojiList[activeCategory as keyof typeof kaomojiList]) {
        return null;
    }
    
    return (
        <div className={`${styles.kaomojiInput} windowStyle`}>
            <div className={styles.header}>Insert Kaomoji:</div>
            <div className={`${styles.kaomojiCategories} scrollArea`}>
                {Object.keys(kaomojiList).map((category) => (
                    <div className={`${styles.kaomojiCategory} ${activeCategory === category ? styles.active : ""}`} key={category} onClick={() => setActiveCategory(category)}>
                        {category}
                    </div>
                ))}
            </div>
            <div className={`${styles.kaomojiList} scrollArea`}>
                {activeCategory && kaomojiList[activeCategory].map((kaomoji: string) => (
                    <div className={styles.kaomoji} key={kaomoji} onClick={() => onInsert(kaomoji)}>
                        {kaomoji}
                    </div>
                ))}
            </div>
        </div>
    );
};