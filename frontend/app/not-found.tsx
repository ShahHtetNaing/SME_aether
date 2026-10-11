import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-muted">Could not find the requested resource.</p>
      <Link href="/dashboard" className="btn-primary">
        Return to Dashboard
      </Link>
    </div>
  );
}
