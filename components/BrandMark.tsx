import Link from "next/link";
import Image from "next/image";

type Props = { size?: number; showWordmark?: boolean };

export default function BrandMark({ size = 28, showWordmark = true }: Props) {
  return (
    <Link href="/" aria-label="BuildGuiders home" className="flex items-center gap-3">
      <Image src="/brand/gg-mark-light.svg" alt="BuildGuiders logo" width={size} height={size} priority />
      {showWordmark && <span className="text-2xl font-extrabold tracking-tight">BuildGuiders</span>}
    </Link>
  );
}
