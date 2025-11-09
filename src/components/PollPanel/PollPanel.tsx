import styles from "./pollpanel.module.scss";
import { useState } from "react";
import { Button } from "../Button/Button";

export interface IPollPanelProps {
    poll: {
        question: string;
        options: { id: string; label: string }[];
    };
}

export const PollPanel = (props: IPollPanelProps) => {
    const [selected, setSelected] = useState<string>("");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    const submitVote = async () => {
        if (!selected || submitting) return;
        setSubmitting(true);
        setError("");
        try {
            const resp = await fetch("/api/polls/vote", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ optionId: selected }),
            });
            if (!resp.ok) {
                const text = await resp.text();
                setError(text || "Failed to vote");
            } else {
                setSubmitted(true);
            }
        } catch {
            setError("Network error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`windowContent ${styles.pollFormContainer}`}>
            <p>{props.poll.question}</p>
            <form onSubmit={(e) => { e.preventDefault(); submitVote(); }}>
            <div className={styles.pollForm}>
                {props.poll.options.map((option) => (
                    <label key={option.id}><input type="radio" name="sanrio" value={option.id} checked={selected === option.id} onChange={() => setSelected(option.id)} disabled={submitting || submitted} /> {option.label}</label>
                ))}
            </div>
            <div className={styles.pollButtonContainer}>
                {!submitted ? (
                    <Button text={submitting ? "Submitting..." : "Vote"} onClick={submitVote} />
                ) : (
                    <span>ありがとう ♡</span>
                )}
                {!!error && <span style={{ marginLeft: "1rem" }}>{error}</span>}
            </div>
            </form>
        </div>
    );
};