import Link from "next/link";

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <img
          src="/fagaFarm.jpeg"
          alt="FAGA Poultry Farm"
          className="mx-auto w-48 h-48 mb-6 rounded-full shadow-lg"
        />

        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Poultry Farm Management System
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Efficiently manage your poultry farm operations
        </p>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Login to Continue
        </Link>
      </div>
    </div>
  );
}
