"use client"
import { Herosection } from "@/components/herosection";
import { Experience } from "@/components/experience";
import Skills from "@/components/skills";
import { Projects } from "@/components/projects";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="">
      <Navbar />
      <Herosection />
      <Skills />
      <Experience />
      <Projects />
      <Footer />
    </div>
  );
}