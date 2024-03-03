"use client";
import React from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";
import { TracingBeam } from "@/components/ui/tracing-beam";

export function Experience() {
  return (
    <div className="mt-10 h-screen">
      <TracingBeam className="px-6">
        <div className="max-w-2xl mx-auto antialiased pt-4 relative">
          {dummyContent.map((item, index) => (
            <div key={`content-${index}`} className="mb-10">
              <h2 className="bg-black text-white rounded-full text-lg w-fit px-4 py-1 mb-4">
                {item.badge}
              </h2>
              <p className="text-2xl mb-4">
                {item.title}
              </p>

              <div className="text-lg  prose prose-sm prose-invert">
                {/* {item?.image && (
                  <Image
                    src={item.image}
                    alt="blog thumbnail"
                    height="1000"
                    width="1000"
                    className="rounded-lg mb-10 object-cover"
                  />
                )} */}
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </TracingBeam>
    </div>
  );
}

const dummyContent = [
  {
    title: "Infosys Ltd | Full Stack Developer",
    description: (
      <>
        <ul className="list-disc ml-4">
          <li>Utilized various AWS services with NodeJs, implementing serverless backend.</li>
          <li>Engineered and implemented a robust search system based on PostgreSQL full-text search with a ranking system, improving search efficiency and user experience.</li>
          <li>Worked in frontend development using React.js, enhancing user interfaces and overall user experience.</li>
          <li>Worked on development of three applications from inception to production.</li>
        </ul>
      </>
    ),
    badge: "November 2023 - Present",
    // image:
    //   "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=3540&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "Tata Consultancy Services (TCS BaNCS) | NodeJs Developer ",
    description: (
      <>
        <ul className="list-disc ml-4">
          <li>
            Developed and maintained a robust Node.js microservices backend, leveraging the power of PM2 for efficient management and scaling of backend services.
          </li>
          <li>
            Orchestrated seamless integration between microservices using Kafka, enhancing system efficiency, throughput, and overall performance. Significantly boosting throughput and ensuring high availability of the overall system.
          </li>
          <li>
            Achieved a remarkable 500% improvement in throughput by implementing strategic scaling measures and optimizing performance based on benchmark results.
          </li>
        </ul>
      </>
    ),
    badge: "July 2021 - November 2023",
    // image:
    //   "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=3540&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  }
];