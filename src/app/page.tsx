import Herosection from "@/components/herosection";
import { Experience } from "@/components/experience";
import Skills from "@/components/skills";
import { Projects } from "@/components/projects";

export default function Home() {
  return (
    <div className="">
      <Herosection />
      <Skills />
      <Experience />
      <Projects />
    </div>
  );
}