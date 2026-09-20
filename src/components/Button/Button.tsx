"use client";

import styles from "./button.module.scss";

import {useState} from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";

export const Button = ({
    text, 
    small = false,
    onClick,
    children,
    icon,
    active = false,
    disabled = false,
    "aria-label": ariaLabel,
    title
}: {text?: string, small?: boolean, onClick?: () => void, children?: React.ReactNode, active?: boolean, disabled?: boolean, icon?: StaticImageData, "aria-label"?: string, title?: string}) => {
    const [isPressed, setIsPressed] = useState(false);

    return (
        <button 
            className={`${styles.button} ${isPressed ? styles.pressed : ""} ${small ? styles.small : ""} windowStyle ${active ? styles.active : ""} ${disabled ? styles.disabled : ""}`} 
            disabled={disabled}
            onClick={() => { if (!disabled) onClick?.(); }} 
            onMouseDown={() => setIsPressed(true)} 
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            aria-label={ariaLabel}
            title={title}
        >
            <div className={`${styles.buttonInner}`}>
                {
                    children ?
                    children
                    :
                    <span className={styles.buttonText}>
                        {icon && <Image src={icon} alt={text ?? ""} />}
                        {text}
                    </span>
                }
            </div>
        </button>
    )
}