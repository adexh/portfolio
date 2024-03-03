import { Meteors } from "@/components/ui/meteors";

const exp = () => {
  var inputDate = new Date('07-07-2021');
  var currentDate = new Date();
  var timeDiff = currentDate.getTime() - inputDate.getTime();
  var years = timeDiff / (1000 * 3600 * 24 * 365.25);
  var roundedYears = parseFloat(years.toFixed(1));
  return roundedYears;
}

export default function Herosection() {
  return (
    <div className="relative overflow-hidden">
      <Meteors className="" number={40} />
      <div className="mt-40 ml-5 sm:ml-10">
        <h1 className="text-6xl md:text-7xl font-bold dark:text-white ">
          Hi,<br />I am Adesh <span className="sm:inline hidden">Tamrakar</span>
        </h1>
        <h2 className="text-4xl mt-14">
          Full-Stack Developer
        </h2>
        <h3 className="my-2 text-lg">Experience - {exp()}+ years</h3>
      </div>
    </div>
  )
}