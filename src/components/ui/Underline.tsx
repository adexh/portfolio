export default function Underline() {
  return <div className="w-full sm:w-1/2 h-5 relative">
    <div className="absolute inset-x-10 sm:inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
    <div className="absolute inset-x-10 sm:inset-x-20  top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
    <div className="absolute inset-x-40 sm:inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
    <div className="absolute inset-x-40 sm:inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />
  </div>;
}