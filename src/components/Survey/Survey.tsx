"use client";

import styles from "./survey.module.scss";
import { useState } from "react";
import { Button } from "../Button/Button";

type SurveyChoice = {
    id: string;
    label: string;
};

export interface ISurveyProps {
    question: string;
    choices: SurveyChoice[];
}

export const Survey = (props: ISurveyProps) => {
    const [selections, setSelections] = useState<Record<string, boolean>>({});
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const toggle = (id: string) => {
        setSelections((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSubmit = async () => {
        if (submitting) return;
        const chosen = Object.keys(selections).filter((k) => selections[k]);
        if (chosen.length === 0) return;
        setSubmitting(true);
        setError("");
        try {
            // Submit one by one (simple); could be optimized server-side for batch
            for (const optionId of chosen) {
                const resp = await fetch("/api/surveys/vote", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ optionId }),
                });
                if (!resp.ok) {
                    const text = await resp.text();
                    setError(text || "Failed to submit");
                    setSubmitting(false);
                    return;
                }
            }
            setSubmitted(true);
        } catch {
            setError("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        setSelections({});
        setSubmitted(false);
    };

    return (
        <div className={styles.surveyRoot}>
            <div className={styles.surveyHeader}>mini survey</div>
            <p className={styles.surveyQuestion}>
                {props.question}
            </p>
            <div className={styles.surveyOptions}>
                {props.choices.map((choice) => (
                    <label key={choice.id} className={`${styles.surveyOption} windowStyle`}>
                        <input
                            type="checkbox"
                            checked={!!selections[choice.id]}
                            onChange={() => toggle(choice.id)}
                        />
                        <span>{choice.label}</span>
                    </label>
                ))}
            </div>
            <div className={styles.surveyActions}>
                {!submitted ? (
                    <Button text={submitting ? "Submitting..." : "Submit"} onClick={handleSubmit} />
                ) : (
                    <>
                        <span className={styles.surveyThanks}>ありがとう ♡ your preferences are noted!</span>
                        <Button text="Reset" onClick={handleReset} />
                    </>
                )}
                {!!error && <span style={{ marginLeft: "1rem" }}>{error}</span>}
            </div>
        </div>
    );
};

export default Survey;


