import { SiGithub } from "@icons-pack/react-simple-icons";
import { ArrowUpRight, Code2, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { homelab, projects, useful } from "./links";

export default async function Page() {
	return (
		<div className="space-y-16">
			{/* Hero Section */}
			<section className="flex justify-center">
				<div className="w-full max-w-4xl">
					<div className="flex h-auto flex-col items-center space-y-8 lg:h-36 lg:flex-row lg:items-start lg:space-x-12 lg:space-y-0">
						{/* <Avatar className="size-24 ring-2 ring-neutral-200 lg:size-32 dark:ring-neutral-800">
							<AvatarImage
								src="https://files.aamirazad.com/inbox/headshot.webp"
								alt="Profile Picture"
								className="object-cover"
							/>
							<AvatarFallback>
								<div className="font-bold text-2xl">AA</div>
							</AvatarFallback>
						</Avatar> */}
						<div className="text-center lg:text-left">
							<h1 className="mb-4 scroll-m-20 font-bold text-4xl tracking-tight lg:text-5xl">
								Aamir Azad
							</h1>
							<p className="mb-4 text-neutral-600 text-xl dark:text-neutral-400">
								Student, Developer
							</p>
							<p className="max-w-2xl text-neutral-600 dark:text-neutral-400">
								High school senior who loves learning.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Useful Links */}
			<section className="flex justify-center">
				<div className="w-full max-w-4xl">
					<h2 className="mb-6 scroll-m-20 border-b pb-2 font-semibold text-3xl tracking-tight transition-colors first:mt-0">
						Useful Links
					</h2>
					<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
						{useful.map((link) => (
							<a
								key={link.href}
								className="flex items-center rounded-lg border border-neutral-200 p-3 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
								target="_blank"
								href={link.href}
							>
								<ArrowUpRight className="mr-2 h-4 w-4 opacity-60" />
								<span className="font-medium text-sm">
									{link.text}
								</span>
							</a>
						))}
					</div>
				</div>
			</section>

			{/* Projects */}
			<section className="flex justify-center">
				<div className="w-full max-w-4xl">
					<div className="mb-6 flex items-center space-x-2">
						<Code2 className="h-6 w-6 text-blue-500" />
						<h2 className="font-semibold text-3xl tracking-tight">
							Projects
						</h2>
					</div>
					<p className="mb-8 text-neutral-600 dark:text-neutral-400">
						Instead of wasting time on social media, I devote almost
						all of my free time to learning and building with what I
						have learned. I have built many projects, each more
						ambitious than the last in order to continue to push
						myself and prepare myself for the future.
					</p>
					<div className="grid gap-6">
						{projects.map((item) => (
							<div
								key={item.href}
								className="rounded-lg border border-neutral-200 p-6 transition-all hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
							>
								<div className="flex flex-col space-y-4">
									<div className="flex flex-wrap items-center gap-3">
										<a
											className="font-semibold text-lg transition-colors hover:text-orange-500"
											target="_blank"
											href={item.href}
										>
											{item.text}
										</a>
										{item.wip && (
											<Badge
												variant="outline"
												className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20"
											>
												Work in progress
											</Badge>
										)}
										{item.badge && (
											<Badge
												variant="outline"
												className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20"
											>
												{item.badge}
											</Badge>
										)}
										{item.github && (
											<a
												className="transition-colors hover:text-orange-500"
												target="_blank"
												href={`https://github.com/${item.github}`}
												title="View source code"
											>
												<SiGithub width={20} />
											</a>
										)}
									</div>
									<p className="text-neutral-600 dark:text-neutral-400">
										{item.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Homelab */}
			<section className="flex justify-center">
				<div className="w-full max-w-4xl">
					<div className="mb-6 flex items-center space-x-2">
						<Server className="h-6 w-6 text-green-500" />
						<h2 className="font-semibold text-3xl tracking-tight">
							Homelab
						</h2>
					</div>
					<p className="mb-8 text-neutral-600 dark:text-neutral-400">
						With the purpose of teaching myself networking as well
						as creating services I use every day, I have built a
						homelab setup. Run on a network of computers from an old
						machine I bought on eBay to a raspberry pi, my
						infrastructure hosts thousands of gigabytes of data and
						many intensive services with{" "}
						<a
							className="underline transition-colors hover:text-orange-500"
							href="https://status.aamirazad.com/"
							rel="noopener noreferrer"
							target="_blank"
						>
							relatively high uptime
						</a>
						. With zero open ports, I have built a secure and
						reliable system to support me and my family.
					</p>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
						{homelab.map((link) => (
							<a
								key={link.href}
								className="flex items-center rounded-lg border border-neutral-200 p-4 transition-all hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:border-neutral-700 dark:hover:bg-neutral-900"
								target="_blank"
								href={link.href}
							>
								<div className="mr-3 text-neutral-600 dark:text-neutral-400">
									{link.icon ? link.icon() : <ArrowUpRight />}
								</div>
								<span className="font-medium">{link.text}</span>
							</a>
						))}
					</div>
				</div>
			</section>
		</div>
	);
}
