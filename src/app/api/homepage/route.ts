import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
type BlogPost = { id: string; title: string; content: string; date: string; tags?: string[] };
type DiaryEntry = { id: string; slug: string; title: string; date: string; preview: string };

function normalizeDiaryPreview(content: string, limit = 160): string {
  const trimmed = content.trim();
  if (trimmed.length <= limit) {
    return trimmed;
  }
  return trimmed.slice(0, limit).trimEnd() + "...";
}

export async function GET() {
  const nowIso = new Date().toISOString().slice(0, 10);

  const keys = ["profile", "status", "faq", "favorites", "todo", "portfolio"] as const;
  const settingsP = prisma.settingsKV.findMany({ where: { key: { in: keys as unknown as string[] } } });
  const galleryItemsP = prisma.scrapbookItem.findMany({ orderBy: { createdAt: "desc" }, take: 12 });
  const now = new Date();
  const pollP = prisma.poll.findFirst({
    where: {
      OR: [
        { AND: [{ activeFrom: { lte: now } }, { activeTo: null }] },
        { AND: [{ activeFrom: { lte: now } }, { activeTo: { gte: now } }] },
      ],
    },
    orderBy: { activeFrom: "desc" },
    include: { options: { orderBy: { sort: "asc" } } },
  });
  const quizP = prisma.quiz.findFirst({ where: { active: true }, include: { options: { orderBy: { sort: "asc" } } } });
  const surveyP = prisma.survey.findFirst({ where: { active: true }, include: { options: { orderBy: { sort: "asc" } } } });

  const recentPostsP = (async () => {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 4,
      select: { slug: true, title: true, excerpt: true, tags: true, publishedAt: true },
    });
    return posts.map((p) => ({
      id: p.slug,
      title: p.title,
      content: p.excerpt ?? "",
      date: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : "",
      tags: (p.tags ?? []).map((t) => t),
    } satisfies BlogPost));
  })();

  const diaryEntriesP = (async () => {
    const entries = await prisma.diaryEntry.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 3,
    });
    return entries.map((entry) => {
      const published = entry.publishedAt ?? entry.createdAt;
      return {
        id: entry.id,
        slug: entry.slug,
        title: entry.title,
        date: published ? new Date(published).toISOString().slice(0, 10) : "",
        preview: normalizeDiaryPreview(entry.content),
      } satisfies DiaryEntry;
    });
  })();

  const popularPostsP = (async () => {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ views: "desc" }, { isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 4,
      select: { slug: true, title: true, excerpt: true, tags: true, publishedAt: true },
    });
    return posts.map((p) => ({
      id: p.slug,
      title: p.title,
      content: p.excerpt ?? "",
      date: p.publishedAt ? new Date(p.publishedAt).toISOString().slice(0, 10) : "",
      tags: (p.tags ?? []).map((t) => t),
    } satisfies BlogPost));
  })();

  const [settings, galleryItems, poll, quiz, survey, recentPosts, diaryEntries, popularPosts] = await Promise.all([
    settingsP,
    galleryItemsP,
    pollP,
    quizP,
    surveyP,
    recentPostsP,
    diaryEntriesP,
    popularPostsP,
  ]);

  const kv: Record<(typeof keys)[number], unknown> = {
    profile: undefined,
    status: undefined,
    faq: undefined,
    favorites: undefined,
    todo: undefined,
    portfolio: undefined,
  };
  for (const s of settings) {
    const key = s.key as (typeof keys)[number];
    kv[key] = s.value as unknown;
  }

  const gallery = {
    images: galleryItems.map((g: { imageUrl: string; caption: string }) => ({ src: g.imageUrl, alt: g.caption, caption: g.caption })),
  };

  const pollPayload = poll
    ? { poll: { question: poll.question, options: poll.options.map((o: { id: string; label: string }) => ({ id: o.id, label: o.label })) } }
    : { poll: null };

  const quizPayload = quiz
    ? (() => {
        const opts = quiz.options.map((o: { id: string; label: string }) => ({ id: o.id, label: o.label }));
        const exists = quiz.correctOptionId && quiz.options.some((o: { id: string }) => o.id === quiz.correctOptionId);
        const correctId = exists ? (quiz.correctOptionId as string) : (opts[0]?.id ?? "");
        return {
          question: quiz.question,
          options: opts,
          correctAnswerId: correctId,
        };
      })()
    : null;

  const surveyPayload = survey
    ? { question: survey.question, choices: survey.options.map((o: { id: string; label: string }) => ({ id: o.id, label: o.label })) }
    : null;

  const payload = {
    lastUpdated: nowIso,
    profile: kv["profile"] ?? {},
    status: kv["status"] ?? {},
    faq: kv["faq"] ?? { faqs: [] },
    gallery,
    favorites: kv["favorites"] ?? { favorites: [] },
    poll: pollPayload,
    todo: kv["todo"] ?? { todos: [] },
    blog: { recentPosts, popularPosts },
    diary: { entries: diaryEntries },
    quiz: quizPayload,
    survey: surveyPayload,
    portfolio: kv["portfolio"] ?? { intro: "", projects: [] },
  };

  return NextResponse.json(payload);
}
