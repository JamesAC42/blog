"use client";

import Link from "next/link";
import styles from "./admin.module.scss";

export default function AdminIndexPage() {
  return (
    <div className={styles.adminRoot}>
      <div className={styles.adminContainer}>
        <h1 className={styles.adminTitle}>Admin</h1>
        <ul style={{ lineHeight: 2 }}>
          <li><Link href="/admin/homepage">Edit homepage content</Link></li>
          <li><Link href="/admin/aboutme">Edit About Me</Link></li>
          <li><Link href="/admin/polls">Manage polls</Link></li>
          <li><Link href="/admin/quizzes">Manage quizzes</Link></li>
          <li><Link href="/admin/surveys">Manage surveys</Link></li>
          <li><Link href="/admin/results">View results</Link></li>
          <li><Link href="/admin/blog">Manage blog</Link></li>
          <li><Link href="/admin/diary">Manage diary</Link></li>
          <li><Link href="/admin/scrapbook">Manage scrapbook</Link></li>
        </ul>
      </div>
    </div>
  );
}
