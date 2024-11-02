"use client";
import React from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { TracingBeam } from "@/components/ui/tracing-beam";
import Underline from "./ui/Underline";
import { Experiences } from "@/data/experience";

export function Experience() {
  return (
    <div className="mt-36">
      <h3 className="text-2xl md:text-4xl font-bold flex flex-col items-center mb-10">
        Professional Experience
        <Underline />
      </h3>
      <TracingBeam className="px-6">
        <div className="max-w-2xl antialiased pt-4 relative">
          {Experiences.map((item, index) => (
            <div key={`content-${index}`} className="mb-10">
              <p className="ml-4 text-xl md:text-2xl flex justify-between items-start mb-2">
                {item.companyName} <span className="text-sm md:text-base">{item.badge}</span>
              </p>
              <p className="mb-4 text-blue-300">{item.designation}</p>
              <div className="text-md text-gray-400  prose prose-sm prose-invert">
                <ul className="list-disc ml-4">
                  {item.descriptionList.map(items => {
                    return (
                      <li key={items}>{items}</li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </TracingBeam>
    </div>
  );
}