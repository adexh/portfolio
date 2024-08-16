"use client"
import { BackgroundGradient } from "@/components/ui/background-gradient";

export default function ResumeButton() {
    return (
        <div>
            <button className="my-10 w-32 sm:w-auto sm:mr-5" onClick={() => window.open('https://docs.google.com/document/d/1uvy0ucEqqrBF_8RC4JVTRA-oOrPUxJ4JJ1s3Z3sOpYA/export?format=pdf')}>
                <BackgroundGradient className="text-2xl font-mono h-auto rounded-[22px] px-4 py-2 bg-transparent bg-zinc-900">Resume</BackgroundGradient>
            </button>
        </div>

    )
}