import styles from "./todopanel.module.scss";
import Image from "next/image";
import checkboxCompleted from "@/assets/images/homepage/_checkbox_complete.png";
import checkbox from "@/assets/images/homepage/_checkbox.png";

export interface ITodoPanelProps {
    todos: {
        id: string;
        title: string;
        completed: boolean;
    }[];
}

export const TodoPanel = (props: ITodoPanelProps) => {
    return (
        <div className={`windowContent`}>
            <div className={styles.toDoList}>
                <ul>
                    {props.todos.map((todo) => (
                        <li className={todo.completed ? styles.completed : ""} key={todo.id}><Image src={todo.completed ? checkboxCompleted : checkbox} alt="checkbox" width={20} height={20} /> {todo.title}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};