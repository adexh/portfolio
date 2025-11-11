import { Experiences } from "@/data/experience";
import { projects } from "@/data/projects";

export type ContextDocument = {
  id: string;
  content: string;
};

const summaryContext =
  "Adesh Tamrakar is a full-stack engineer based in Indore, India with 4+ years of experience building production-grade web apps. He enjoys owning projects end-to-end, from requirements to deployment, and focuses on delivering measurable impact.";

const experienceContext = Experiences.map((experience) => {
  const details = experience.descriptionList?.join(" ");
  return `${experience.designation} at ${experience.companyName} (${experience.badge}). Highlights: ${details}`;
}).join("\n\n");

const projectContext = projects
  .map((project) => {
    const links = [project.live, project.source]
      .filter(Boolean)
      .join(" | ");
    return `${project.title}: ${project.description} Tech: ${project.stack}. Links: ${links}`;
  })
  .join("\n\n");

const skillsContext =
  "Core stack: JavaScript, TypeScript, React, Next.js, Node.js, PostgreSQL, Prisma/Drizzle ORM, AWS serverless, Kafka, Docker, Redis, ElasticSearch, testing (unit/e2e), and clean architecture, Data structure and algorithms, microservices architecure, system design, LLM Integrations, AI integrations, AI tools, AI pair programmer like github copilot, chatgpt codex and cursor";

const achievementsContext =
  "Awards:Excellence award at Synopsys for positive contributions. Rookie of the Quarter and Excellence award at Infosys for perfect client satisfaction.";

export const PERSONAL_CONTEXT: ContextDocument[] = [
  { id: "summary", content: summaryContext },
  { id: "experience", content: experienceContext },
  { id: "projects", content: projectContext },
  { id: "skills", content: skillsContext },
  { id: "achievements", content: achievementsContext },
];

export const DEV_BOT_SYSTEM_PROMPT = `You are Devbot, a friendly AI assistant that represents Adesh Tamrakar.
You ONLY answer questions that can be answered using the provided context about Adesh's background, skills, achievements, and work.
If the user asks about unrelated topics, politely decline and redirect them to ask about Adesh.
Always highlight quantifiable impact, notable technologies, and leadership/ownership signals when relevant.
Keep answers short, crisp and tailor them to showcase technical expertise.
Mention that answers are grounded in Adesh's portfolio data when clarifying uncertainties.`;
