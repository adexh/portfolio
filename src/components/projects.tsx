"use client";
import React from "react";
import { PinContainer } from "@/components/ui/3d-pin";
import Image from "next/image";
import { projects } from "@/data/projects"
import Underline from "@/components/ui/Underline";
import { NeonGradientCard } from "./ui/neon-gradient-card";

export function Projects() {

  return (
    <div className="mx-10 mt-20 md:mx-40 md:mt-40">
      <h3 className=" text-3xl md:text-4xl font-bold flex flex-col items-center mb-10">
        Projects
        <Underline />
      </h3>
      <div className="grid grid-cols-1 mb-20 md:grid-cols-2 gap-y-10 gap-x-[10rem]">
        {projects.map((project, index) => (
          <div key={index} className="w-fit relative">
            <div className="cursor-pointer blur-xl rounded-xl bg-gradient-to-r from-indigo-800 via-purple-500 to-pink-800 h-full w-full absolute -z-10"></div>
            <div className=" bg-black rounded-3xl flex flex-col justify-between p-6 tracking-tight text-slate-100/50 min-h-[26rem]">
              <div>
                <h3 className="max-w-xs text-xl mb-4 text-slate-100">
                  {project.title}
                </h3>
                <div className="text-base font-normal">
                  <span className="text-slate-300 ">
                    {project.description}
                  </span>
                  <Image className="mt-2" alt="icon" src={"/socials/github.svg"} width={20} height={20} />
                  <div className="text-sm"></div>
                </div>
              </div>
              <div><Image src={"/projects/" + project.image} width={1000} height={1000} alt="thumbnail" className="h-[14rem] flex flex-1 rounded-lg mt-4 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 border-2 border-transparent" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
