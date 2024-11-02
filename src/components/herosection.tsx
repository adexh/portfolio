import { Meteors } from "@/components/ui/meteors";
import ResumeButton from "@/components/ui/resumeButton";
import SocialConnects from "./socialConnects";
import AnimatedGridPattern from "./ui/animated-grid-pattern";
import { cn } from "@/utils/cn";

export default function Herosection() {
  const exp = () => {
    const inputDate = new Date('07-07-2021');
    const currentDate = new Date();
    const timeDiff = currentDate.getTime() - inputDate.getTime();
    const years = timeDiff / (1000 * 3600 * 24 * 365.25);
    const roundedYears = parseFloat(years.toFixed(1));
    return roundedYears;
  }

  return (
    <section className="relative overflow-hidden">
      <div className="mt-40 ml-16 md:mx-40 justify-center items-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white">
          Hi,<br />I am Adesh <span className="sm:inline hidden">Tamrakar</span>
        </h1>
        <h2 className="text-3xl mt-4 sm:flex sm:justify-start sm:items-center">
          <div>Full-Stack Developer<div className="my-2 text-lg sm:text-2xl">Experience - {exp()}+ years</div></div>
          <div className="sm:ml-16"><ResumeButton /></div>
          <SocialConnects/>
        </h2>
      </div>
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_top,white,transparent)]",
          "inset-x-0h-[200%]",
        )}
      />
    </section>
  )
}