import Image from "next/image";
import { BackgroundGradient } from "@/components/ui/background-gradient";

export default function SocialConnects() {
  const socialConnectsData = [
    {
      metaTitle: "github",
      icon: "github.svg",
      link: "https://github.com/adexh"
    },
    {
      metaTitle: "linkedin",
      icon: "linkedin.svg",
      link: "https://www.linkedin.com/in/adesht"
    },
    {
      metaTitle: "leetcode",
      icon: "leetcode.svg",
      link: "https://leetcode.com/u/adexh"
    },
    {
      metaTitle: "twitter",
      icon: "twitter.svg",
      link: "https://x.com/tamrakar_adesh"
    }
  ]

  return (
    <div className="flex sm:ml-16 space-x-6">
      {socialConnectsData.map(conn => {
        return (
          <a key={conn.metaTitle} href={conn.link} target="_blank">
            <div className="bg-transparent">
              <Image
                src={"/socials/" + conn.icon}
                height="1000"
                width="1000"
                className="h-10 w-10 group-hover/card:shadow-xl"
                alt="thumbnail"
              />
            </div>
          </a>)
      })}
    </div>
  )
}