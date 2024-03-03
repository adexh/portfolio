import { Meteors } from "@/components/ui/meteors";

export default function Herosection() {
  return (
    <div className="relative overflow-hidden">
      <Meteors number={40} />
      <div className="mt-20 ml-5">
        <h1 className="text-6xl md:text-7xl font-bold dark:text-white ">
          Hi,<br />I am Adesh
        </h1>
        <h2 className="text-2xl my-2">
          Full-Stack Developer
        </h2>
        <p className="max-w-2xl text-base md:text-xl mt-8 dark:text-neutral-200">
          We build beautiful products with the latest technologies and frameworks.
          We are a team of passionate developers and designers that love to build
          amazing products.
        </p>
      </div>
    </div>
  )
}