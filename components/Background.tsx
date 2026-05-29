export default function Background() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      {/* layered soft radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_-10%,rgba(14,165,233,0.10),transparent),radial-gradient(800px_500px_at_90%_30%,rgba(168,85,247,0.08),transparent),radial-gradient(700px_420px_at_10%_10%,rgba(34,197,94,0.06),transparent)]"></div>
      {/* noise mask for texture */}
      <div className="absolute inset-0 opacity-25 mix-blend-overlay [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
           style={{ backgroundImage: "url(/noise.svg)" }} />
    </div>
  );
}
