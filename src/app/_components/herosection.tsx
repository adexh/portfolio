import { Meteors } from "@/components/ui/meteors";
import ResumeButton from "./resumeButton";

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
    <div className="relative overflow-hidden">
      <Meteors className="" number={40} />
      <div className="mt-40 ml-5 sm:ml-10">
        <h1 className="text-6xl md:text-6xl font-bold text-white">
          Hi,<br />I am Adesh <span className="sm:inline hidden">Tamrakar</span>
        </h1>
        <h2 className="text-4xl mt-4 sm:flex sm:justify-start sm:items-center">
          <div>Full-Stack Developer<div className="my-2 text-2xl">Experience - {exp()}+ years</div></div>
          <div className="sm:ml-8"><ResumeButton /></div>
        </h2>
      </div>
    </div>
  )
}