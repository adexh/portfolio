import Herosection from "@/app/_components/herosection";
import { Experience } from "./_components/experience";
import Skills from "./_components/skills";

export default function Home() {
  return (
    <div className="">
      <Herosection />
      <Skills />
      <Experience />
    </div>
  );
}