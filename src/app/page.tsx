import Herosection from "@/app/_components/herosection";
import { Experience } from "./_components/experience";
import Skills from "./_components/skills";
import { Projects } from "./_components/projects";

export default function Home() {
  return (
    <div className="">
      <Herosection />
      <Skills />
      <Projects />
      <Experience />
    </div>
  );
}