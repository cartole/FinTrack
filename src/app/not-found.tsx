import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <p className="text-4xl font-bold">404</p>
      <p className="text-muted-foreground">Página no encontrada</p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
