import Link from "next/link";

export default function Home() {
	return (
		<div className="h-screen overflow-hidden bg-gradient-to-r from-pink-50 via-pink-100 to-yellow-50">
			{/* Top header with logo and red CTA strip */}
			<header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<img
						src="/fagaFarm.png"
						alt="FAGA logo"
						className="w-12 h-12 rounded-md shadow-sm"
					/>
					<div>
						<div className="text-sm font-semibold text-red-600">
							FAGA POULTRY FARM
						</div>
						<div className="text-xs text-gray-500">
							Production Inventory Management System
						</div>
					</div>
				</div>

				<div className="hidden md:block">
					<Link
						href="/login"
						className="bg-red-600 text-white px-6 py-3 rounded-full shadow hover:bg-red-700 transition"
					>
						Get Started
					</Link>
				</div>
			</header>

			{/* Hero */}
			<main className="max-w-7xl mx-auto px-6 py-12">
				<div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
					{/* Left content */}
					<div className="md:col-span-7">
						<div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-3 py-1 shadow-sm text-xs text-gray-700 mb-6">
							<span className="text-green-600">
								{/* tractor-like SVG (replaces 🚜) */}
								<svg
									className="w-4 h-4"
									viewBox="0 0 24 24"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden
								>
									<rect
										x="2"
										y="10"
										width="12"
										height="6"
										rx="1.5"
										fill="currentColor"
									/>
									<circle cx="18" cy="17" r="3" fill="currentColor" />
									<circle cx="7" cy="17" r="2" fill="currentColor" />
								</svg>
							</span>
							<span>Modern Farm Management</span>
						</div>

						<h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-6">
							Streamline Your
							<br />
							<span className="text-red-600">Poultry Operations</span>
						</h1>

						<p className="text-gray-600 max-w-xl mb-8">
							Complete production inventory management system designed
							specifically for poultry farms. Track your entire production cycle
							from egg collection to sales with real-time data synchronization.
						</p>

						<div className="flex flex-wrap items-center gap-3 mb-8">
							<Link
								href="/login"
								className="bg-red-600 text-white px-5 py-3 rounded-lg shadow hover:bg-red-700 transition"
							>
								Get Started
							</Link>

							{/* role buttons now link to /login */}
							<Link
								href="/login"
								className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm shadow-sm"
							>
								Farm Worker
							</Link>
							<Link
								href="/login"
								className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm shadow-sm"
							>
								Sales
							</Link>
							<Link
								href="/login"
								className="bg-white border border-gray-200 px-4 py-2 rounded-full text-sm shadow-sm"
							>
								Manager
							</Link>
						</div>

						{/* Stats */}
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl">
							<div className="text-center">
								<div className="text-red-600 font-extrabold text-2xl">8+</div>
								<div className="text-xs text-gray-500 mt-1">Breeds Managed</div>
							</div>
							<div className="text-center">
								<div className="text-red-600 font-extrabold text-2xl">7</div>
								<div className="text-xs text-gray-500 mt-1">Production Stages</div>
							</div>
							<div className="text-center">
								<div className="text-red-600 font-extrabold text-2xl">24/7</div>
								<div className="text-xs text-gray-500 mt-1">Real-time Updates</div>
							</div>
							<div className="text-center">
								<div className="text-red-600 font-extrabold text-2xl">99.9%</div>
								<div className="text-xs text-gray-500 mt-1">System Uptime</div>
							</div>
						</div>
					</div>

					{/* Right visual card */}
					<div className="md:col-span-5">
						<div className="relative">
							<div className="bg-white rounded-2xl p-10 shadow-2xl border border-white/30 transform hover:scale-[1.01] transition">
								<div className="bg-gradient-to-br from-pink-50 to-pink-200 rounded-2xl p-8 flex items-center justify-center">
									<img
										src="/fagaFarm.png"
										alt="FAGA Poultry Farm"
										className="w-64 h-64 object-contain"
									/>
								</div>
							</div>

							{/* Floating info pills */}
							<div className="absolute -top-4 right-6">
								<div className="bg-white rounded-xl px-4 py-3 shadow-md flex items-start gap-3 w-56">
									<div className="bg-green-100 text-green-600 rounded-full p-1.5">
										{/* checkmark SVG (replaces ✔️) */}
										<svg
											className="w-4 h-4"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											aria-hidden
										>
											<path
												d="M20 6L9 17l-5-5"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</div>
									<div>
										<div className="text-sm font-medium">Real-time Tracking</div>
										<div className="text-xs text-gray-500">
											Live inventory updates
										</div>
									</div>
								</div>
							</div>

							<div className="absolute -bottom-4 left-6">
								<div className="bg-white rounded-xl px-4 py-3 shadow-md flex items-start gap-3 w-48">
									<div className="bg-blue-100 text-blue-600 rounded-full p-1.5">
										{/* analytics bars SVG (replaces 📈) */}
										<svg
											className="w-4 h-4"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											aria-hidden
										>
											<rect
												x="3"
												y="14"
												width="3"
												height="7"
												rx="0.5"
												fill="currentColor"
											/>
											<rect
												x="9"
												y="10"
												width="3"
												height="11"
												rx="0.5"
												fill="currentColor"
											/>
											<rect
												x="15"
												y="6"
												width="3"
												height="15"
												rx="0.5"
												fill="currentColor"
											/>
										</svg>
									</div>
									<div>
										<div className="text-sm font-medium">Analytics</div>
										<div className="text-xs text-gray-500">
											Performance insights
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
