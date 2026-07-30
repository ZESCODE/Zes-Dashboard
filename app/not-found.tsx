import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 p-8">
      <div className="text-6xl font-display">404</div>
      <h1 className="text-xl font-bold uppercase text-muted-foreground">Not found</h1>
      <p className="text-sm text-muted-foreground">This page does not exist yet.</p>
      <Link href="/" className="text-primary underline underline-offset-4 text-sm">
        Back to overview
      </Link>
    </main>
  );
}
