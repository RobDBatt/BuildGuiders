// components/ProductCard.tsx
import Image from "next/image";

type Props = {
  title: string;
  href: string;
  img: string;           // /images/...
  bullets?: string[];
  note?: string;
};

export default function ProductCard({ title, href, img, bullets = [], note }: Props) {
  const isExternal = /^https?:\/\//.test(href); // Amazon & other externals

  return (
    <a
      href={href}
      {...(isExternal ? { rel: "sponsored nofollow noopener", target: "_blank" } : {})}
      className="block rounded-2xl border border-white/10 bg-white/70 dark:bg-white/[0.03] p-4 hover:bg-white/80 dark:hover:bg-white/10 transition"
    >
      <div className="flex items-start gap-4">
        <Image
          src={img}
          alt={title}
          width={64}
          height={64}
          className="h-16 w-16 rounded-lg object-contain border border-white/10 bg-white/60 dark:bg-white/5"
        />
        <div>
          <div className="font-semibold leading-snug">{title}</div>
          {note ? <div className="text-xs mt-1 opacity-70">{note}</div> : null}
        </div>
      </div>

      {bullets.length > 0 && (
        <ul className="mt-3 list-disc pl-5 text-sm opacity-90">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      )}
    </a>
  );
}
