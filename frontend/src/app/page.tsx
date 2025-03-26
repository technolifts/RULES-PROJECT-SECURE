import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to DocSecure
        </h1>
        <p className="text-xl mb-8 text-center">
          A secure document management system
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login" className="btn-primary">
            Login
          </Link>
          <Link href="/register" className="btn-secondary">
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
