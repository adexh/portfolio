"use client";
import Image from "next/image";
import React from "react";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function Skills() {

  const data = [
    {
      title: "NextJs",
      icon: "nextjs-icon-dark-background.svg",
    },
    {
      title: "ReactJs",
      icon: "reactjs.svg",
    },
    {
      title: "NodeJs",
      icon: "nodejs.svg",
    },
    {
      title: "AWS",
      icon: "aws.svg",
    },
    {
      title: "Git",
      icon: "git.svg",
    },
    {
      title: "PostgreSql",
      icon: "postgresql.svg",
    }
  ];
  return (
    <>
      <div className="mt-10">
        <WavyBackground waveWidth={30}>
          <div className="text-4xl text-white font-bold inter-var text-center" >Primary Skills</div>
        </WavyBackground>
      </div>
      <div className="grid grid-cols-3 gap-y-6 mt-10 md:mx-40 md:grid-cols-6">
        {data.map(skill => (
          <CardContainer key={skill.title} className="h-28 w-20 mx-5">
            <CardBody className="flex flex-col items-center h-48 w-48 justify-center">
              <CardItem translateZ="100" className="">
                <Image
                  src={"/skills/dark/" + skill.icon}
                  height="1000"
                  width="1000"
                  className="h-20 w-20  rounded-xl group-hover/card:shadow-xl"
                  alt="thumbnail"
                />
              </CardItem>
              <CardItem
                translateZ="50"
                className="text-xl text-white dark:text-white"
              >
                <span className="mx-2">{skill.title}</span>
              </CardItem>
            </CardBody>
          </CardContainer>
        ))
        }</div>
    </>

  )
}