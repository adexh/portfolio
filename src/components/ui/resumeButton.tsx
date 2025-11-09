"use client"
import { BackgroundGradient } from "@/components/ui/background-gradient";

export default function ResumeButton() {
    return (
        <div>
            <button className="my-8 sm:my-10 w-32 sm:w-auto sm:mr-5" onClick={() => window.open('mailto:adesh.t@outlook.com')}>
                <BackgroundGradient className="text-2xl font-mono h-auto rounded-[22px] px-4 py-2 bg-transparent bg-zinc-900">Contact</BackgroundGradient>
            </button>
        </div>
    )
}