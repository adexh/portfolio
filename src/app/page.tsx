import Herosection from "@/app/_components/herosection";
import { Experience } from "./_components/experience";

export default function Home() {
  return (
    <div className="w-screen">
      <Herosection />
      <Experience />
    </div>
  );
}