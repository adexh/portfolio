"use client";
import React from "react";
import { PinContainer } from "@/components/ui/3d-pin";
import Image from "next/image";

export function Projects() {
  const projects = [
    {
      title: "NextERP",
      description: "This application helps any small enterprise manage their projects, clients and employee details.",
      hrefTitle: "github.com/NextERP",
      href: "https://github.com/adexh/NextERP",
      image:"nexterp.png"
    },
    {
      title: "Course website",
      description: "Course selling website, with home page, course view page and checkout.",
      hrefTitle: "github.com/simple-course-app",
      href: "https://github.com/adexh/simple-course-app",
      image:"course.png"
    },
    {
      title: "Portfolio",
      description: "Portfolio website built using NextJs and Aceternity UI",
      hrefTitle: "github.com/portfolio",
      href: "https://github.com/adexh/portfolio",
      image:"portfolio.png"
    }
  ]

  return (
    <div className="mt-20">
      <h3 className="text-4xl font-bold flex flex-col items-center mb-10">
        <span className="">Projects</span>
        <div className="w-full sm:w-1/2 h-5 relative">
          <div className="absolute inset-x-10 sm:inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
          <div className="absolute inset-x-10 sm:inset-x-20  top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
          <div className="absolute inset-x-40 sm:inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
          <div className="absolute inset-x-40 sm:inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
        </div>
      </h3>

      <div className="grid grid-cols-1 mb-20 md:grid-cols-4 sm:grid-cols-2 gap-y-6">
        {projects.map((project, index) => (
          <div key={index} className="">
            <PinContainer
              title={project.hrefTitle}
              href={project.href}
            >
              <div className="flex flex-col justify-between p-4 tracking-tight text-slate-100/50 min-w-[20rem] h-[20rem] border rounded-xl">
                <h3 className="max-w-xs font-bold  text-base text-slate-100">
                  {project.title}
                </h3>
                <div className="text-base !m-0 !p-0 font-normal">
                  <span className="text-slate-500 ">
                    {project.description}
                  </span>
                </div>
                <div>
                  <Image src={"/projects/"+project.image} width={1000} height={1000} alt="thumbnail" className="flex flex-1 rounded-lg mt-4 bg-gradient-to-br from-violet-500 via-purple-500 to-blue-500 border-2 border-transparent" />
                </div>
              </div>
            </PinContainer>
            {/* <div className="mt-10">Hi</div> */}
          </div>
        ))}
      </div>
    </div>
  );
}
