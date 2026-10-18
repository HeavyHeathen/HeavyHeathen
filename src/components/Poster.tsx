/* eslint-disable @next/next/no-img-element */
export function Poster({ path, title, className = "h-24 w-16" }: { path: string | null; title: string; className?: string }) {
  return path ? (
    <img src={`https://image.tmdb.org/t/p/w185${path}`} alt={title} className={`${className} rounded object-cover`} />
  ) : (
    <div className={`${className} flex items-center justify-center rounded bg-zinc-800 text-xs text-zinc-500`}>?</div>
  );
}
