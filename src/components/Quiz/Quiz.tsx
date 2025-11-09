"use client";

import styles from "./quiz.module.scss";
import { useState } from "react";
import { Button } from "../Button/Button";

export type QuizOption = {
    id: string;
    label: string;
};

// Options and correct answer are provided by props

export interface IQuizProps {
    question: string;
    options: QuizOption[];
    correctAnswerId: string;
}

export const Quiz = (props: IQuizProps) => {
    const [selectedOptionId, setSelectedOptionId] = useState<string>("");
    const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const handleSubmit = () => {
        if (!selectedOptionId || submitting) return;
        setSubmitting(true);
        setError("");
        fetch("/api/quizzes/vote", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ optionId: selectedOptionId }),
        })
        .then(async (resp) => {
            if (!resp.ok) {
                const text = await resp.text();
                setError(text || "Failed to submit");
                return;
            }
            setHasSubmitted(true);
        })
        .catch(() => setError("Network error"))
        .finally(() => setSubmitting(false));
    };

    const handleReset = () => {
        setSelectedOptionId("");
        setHasSubmitted(false);
    };

    const isCorrect = hasSubmitted && !!props.correctAnswerId && selectedOptionId === props.correctAnswerId;
    const isIncorrect = hasSubmitted && !!selectedOptionId && !!props.correctAnswerId && selectedOptionId !== props.correctAnswerId;

    return (
        <div className={styles.quizRoot}>
            <div className={styles.quizHeader}>sanrio trivia</div>
            <p className={styles.quizQuestion}>
                {props.question}
            </p>

            <div className={styles.quizOptions}>
                {props.options.map((opt) => (
                    <label key={opt.id} className={`${styles.quizOption} windowStyle`}>
                        <input
                            type="radio"
                            name="sanrio-quiz"
                            value={opt.id}
                            checked={selectedOptionId === opt.id}
                            onChange={() => setSelectedOptionId(opt.id)}
                            disabled={hasSubmitted}
                        />
                        <span>{opt.label}</span>
                    </label>
                ))}
            </div>

            <div className={styles.quizActions}>
                {!hasSubmitted ? (
                    <Button text={submitting ? "Submitting..." : "Submit"} onClick={handleSubmit} />
                ) : (
                    <>
                        {isCorrect && <span className={`${styles.quizResult} ${styles.correct}`}>Correct! ♡</span>}
                        {isIncorrect && <span className={`${styles.quizResult} ${styles.incorrect}`}>Not quite — try again!</span>}
                        <Button text="Try again" onClick={handleReset} />
                    </>
                )}
                {!!error && <span style={{ marginLeft: "1rem" }}>{error}</span>}
            </div>
        </div>
    );
};

export default Quiz;


