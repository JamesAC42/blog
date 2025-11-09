import styles from "./faqpanel.module.scss";

export interface IFAQPanelProps {
    faqs: {
        question: string;
        answer: string;
    }[];
}

export const FAQPanel = (props: IFAQPanelProps) => {
  return (
        <div className={`windowContent`}>
            {
                props.faqs.map((faq) => (
                    <div className={styles.faqItem} key={faq.question}>
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                    </div>
                ))
            }
        </div>
  );
};