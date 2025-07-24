"use client";
import React from "react";
import Image from "next/image";
import { projects } from "@/data/projects"
import Underline from "@/components/ui/Underline";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { ExternalLink } from "lucide-react";

export function Projects() {

  return (
    <section id="projectsection" className="mx-10 mt-20 md:mx-40 md:mt-40">
      <h3 className=" text-3xl md:text-4xl font-bold flex flex-col items-center mb-10">
        Projects
        <Underline />
      </h3>
      <div className="grid grid-cols-1 mb-20 md:grid-cols-2 gap-y-10 gap-x-[10rem]">
        {projects.map((project, index) => (
          <CardContainer key={index}>
            <CardBody>
              <div className="w-fit relative">
                <div className="cursor-pointer blur-xl rounded-xl bg-gradient-to-r from-indigo-800 via-purple-500 to-pink-800 h-full w-full absolute -z-10"></div>
                <div className=" bg-black rounded-3xl flex flex-col justify-between p-6 tracking-tight text-slate-100/50 md:min-h-[26rem]">
                  <div>
                    <h3 className="max-w-xs text-xl mb-4 text-slate-100">
                      {project.title}
                    </h3>
                    <p className="text-base text-slate-300 font-normal flex flex-col gap-6">
                      <span>
                        {project.description}
                      </span>
                      <span className="font-mono ">
                        {project.stack}
                      </span>
                    </p>
                    <div className="flex justify-start items-end gap-4">
                      <a href={project.source} target="_blank" className="transition-transform hover:scale-125 shadow-lg shadow-fuchsia-500 rounded-full"><Image className="mt-2" alt="icon" src={"/socials/github.svg"} width={34} height={34} /></a>
                      {project.live && <a href={project.live} target="_blank" className="text-lg text-violet-300 hover:underline transition-transform hover:scale-110">Hosted <ExternalLink className="inline" size={16} /></a>}
                    </div>
                    <div className="text-sm"></div>
                  </div>
                  <div className="mt-6"><Image src={"/projects/" + project.image} width={1000} height={1000} alt="thumbnail" className="flex flex-1 rounded-lg mt-4 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 border-2 border-transparent" /></div>
                </div>
              </div>
            </CardBody>
          </ CardContainer>
        ))}
      </div>
    </section>
  );
}
