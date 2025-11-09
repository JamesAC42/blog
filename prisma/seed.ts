import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // settings
  await prisma.settingsKV.upsert({
    where: { key: "profile" },
    update: {},
    create: {
      key: "profile",
      value: {
        headerText: "Hey, I'm James ⚡",
        subHeaderText: "I build luminous software and immersive digital experiences.",
      },
    },
  });
  await prisma.settingsKV.upsert({
    where: { key: "status" },
    update: {},
    create: {
      key: "status",
      value: {
        mood: "Shipping",
        watching: "Severance",
        playing: "Factorio",
      },
    },
  });
  await prisma.settingsKV.upsert({
    where: { key: "faq" },
    update: {},
    create: {
      key: "faq",
      value: {
        faqs: [
          {
            question: "What is this space?",
            answer: "A digital lab for my experiments—part dev log, part design journal, all drenched in neon. Expect retro hardware love and modern tooling.",
          },
          {
            question: "What do you work on?",
            answer: "Full-stack product engineering, creative tooling, and real-time systems. I gravitate toward TypeScript, Rust, and novel interfaces.",
          },
          {
            question: "Can we collaborate?",
            answer: "Absolutely. I’m excited to build thoughtful products with curious teams. Reach me anytime at hello@jamescrovo.com.",
          },
        ],
      },
    },
  });
  await prisma.settingsKV.upsert({
    where: { key: "favorites" },
    update: {},
    create: {
      key: "favorites",
      value: {
        favorites: [
          { type: "Stack", emoji: "🛠️", value: "Next.js + Edge Functions" },
          { type: "Editor", emoji: "⌨️", value: "Neovim + VS Code" },
          { type: "Inspiration", emoji: "📺", value: "80s CRT glow" },
          { type: "Tool", emoji: "🧪", value: "Playdate SDK" },
          { type: "Coffee", emoji: "☕", value: "Single-origin pour over" },
          { type: "Track", emoji: "🎧", value: "Tycho – Awake" },
          { type: "Game", emoji: "🕹️", value: "Outer Wilds" },
          { type: "Hardware", emoji: "🖥️", value: "Sony PVM CRT" },
        ],
      },
    },
  });
  await prisma.settingsKV.upsert({
    where: { key: "todo" },
    update: {},
    create: {
      key: "todo",
      value: {
        todos: [
          { id: "1", title: "Ship portfolio refresh", completed: true },
          { id: "2", title: "Record neon CRT footage", completed: false },
          { id: "3", title: "Write about edge rendering strategies", completed: false },
          { id: "4", title: "Prototype MIDI visualizer", completed: true },
          { id: "5", title: "Push OSS maintenance updates", completed: false },
          { id: "6", title: "Add project case studies", completed: true },
        ],
      },
    },
  });
  await prisma.settingsKV.upsert({
    where: { key: "portfolio" },
    update: {},
    create: {
      key: "portfolio",
      value: {
        intro: "A rotating feed of products, installations, and experiments. Each project blends tactile interfaces with atmospheric storytelling.",
        projects: [
          {
            id: "jamescrovo-com",
            title: "JamesCrovo.com",
            summary: "Personal site engineered as a CRT-inspired single-page OS with real-time publishing workflows.",
            year: "2025",
            role: "Lead developer",
            tags: ["Next.js", "TypeScript", "Prisma", "Design Systems"],
            links: [{ label: "Live Site", url: "https://jamescrovo.com" }],
          },
          {
            id: "halo-lab",
            title: "Halo Lab",
            summary: "Audio-reactive installation mapping halos across cascading displays and volumetric light.",
            year: "2024",
            role: "Creative technologist",
            tags: ["WebGL", "Three.js", "TouchDesigner"],
            links: [{ label: "Case Study", url: "https://jamescrovo.com/projects/halo-lab" }],
          },
          {
            id: "signal-kit",
            title: "Signal Kit",
            summary: "Open-source toolkit for streaming telemetry dashboards wrapped in neon UI components.",
            year: "2023",
            role: "Product engineer",
            tags: ["React", "Remix", "WebSockets", "D3.js"],
            links: [{ label: "GitHub", url: "https://github.com/jamescrovo/signal-kit" }],
          },
        ],
      },
    },
  });

  // poll
  const poll = await prisma.poll.create({ data: { question: "Which retro tech keeps you inspired lately?", activeFrom: new Date() } });
  const pollOptions = [
    "CRT monitors",
    "Synthwave soundtracks",
    "Analog film cameras",
    "Arcade cabinets",
    "Mechanical keyboards",
    "Modular synths",
  ];
  for (let i = 0; i < pollOptions.length; i++) {
    await prisma.pollOption.create({ data: { pollId: poll.id, label: pollOptions[i], sort: i } });
  }

  // quiz
  const quiz = await prisma.quiz.create({ data: { question: "Which color temperature do classic Trinitron CRTs famously emit?", active: true } });
  const quizOptionData = [
    { id: "cool-white", label: "Cool white ~9300K" },
    { id: "warm-white", label: "Warm white ~6500K" },
    { id: "neutral", label: "Neutral 7500K" },
    { id: "plasma-purple", label: "Deep plasma purple" },
  ];
  for (let i = 0; i < quizOptionData.length; i++) {
    await prisma.quizOption.create({ data: { id: quizOptionData[i].id, quizId: quiz.id, label: quizOptionData[i].label, sort: i } });
  }
  await prisma.quiz.update({ where: { id: quiz.id }, data: { correctOptionId: quizOptionData[0].id } });

  // survey
  const survey = await prisma.survey.create({ data: { question: "What should I document next?", active: true } });
  const surveyChoices = [
    { id: "playdate", label: "Building Playdate games" },
    { id: "crt-mods", label: "Restoring CRT displays" },
    { id: "edge-rendering", label: "Edge rendering pipelines" },
    { id: "synth", label: "Generative audio / visuals" },
    { id: "process", label: "Daily dev process" },
  ];
  for (let i = 0; i < surveyChoices.length; i++) {
    await prisma.surveyOption.create({ data: { id: surveyChoices[i].id, surveyId: survey.id, label: surveyChoices[i].label, sort: i } });
  }

  // scrapbook minimal seed
  await prisma.scrapbookItem.createMany({
    data: [
      { imageUrl: "/images/gallery/cookies.jpg", caption: "cookies" },
      { imageUrl: "/images/gallery/japan.jpg", caption: "japan" },
      { imageUrl: "/images/gallery/kon.jpg", caption: "kon" },
      { imageUrl: "/images/gallery/nichijou.jpg", caption: "nichijou" },
      { imageUrl: "/images/gallery/popteen.jpg", caption: "popteen" },
    ],
    skipDuplicates: true,
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


