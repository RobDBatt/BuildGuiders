export default function SimplePage({ title, children }: { title: string, children: React.ReactNode }){
  return (
    <main className="hero-gradient">
      <div className="mx-auto max-w-4xl px-5 py-16">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">{title}</h1>
        <div className="mt-6 prose prose-invert">{children}</div>
      </div>
    </main>
  );
}
