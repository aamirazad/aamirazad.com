// @ts-check

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
	async redirects() {
		return [
			{
				source: "/cs50-cert",
				destination:
					"https://courses.edx.org/certificates/0a9007180d26449b8593df3ef23a1400",
				permanent: false,
			},
			{
				source: "/github",
				destination: "https://github.com/aamirazad/",
				permanent: false,
			},
			{
				source: "/resume",
				destination: "https://files.aamirazad.com/resume.pdf",
				permanent: false,
			},
			{
				source: "/signal",
				destination:
					"https://signal.me/#eu/gYSBVtWgFaykPtlA00TXJrO91sPmPjq_Si4wE8oYpd1E-llhxxVBtITfDB17DtDj",
				permanent: false,
			},
			{
				source: "/telegram",
				destination: "https://t.me/aamirazad01",
				permanent: false,
			},
			{
				source: "/pgp",
				destination: "/.well-known/openpgpkey",
				permanent: false,
			},
			{
				source: "/bycda",
				destination: "https://hasd.dino.icu/category/5/bycda",
				permanent: false,
			},
			{
				source: "/.well-known/openpgpkey",
				destination: "/api/.well-known/openpgpkey",
				permanent: false,
			},
			{
				source: "/.well-known/openid-configuration",
				destination: "/api/.well-known/openid-configuration",
				permanent: false,
			},
			{
				source: "/outstanding-academic",
				destination:
					"https://papers.aamirazad.com/share/wyABSOjNExeQi4nBVfS10rMH4LBkvc8ppvxZdoroEfNY7V9ECF",
				permanent: false,
			},
			{
				source: "/principals-award",
				destination:
					"https://papers.aamirazad.com/share/FFrlAJyx3DgTU7N3eFqW9mGKY1NukmXZNmQv4ztosV4Su7ZFhZ",
				permanent: false,
			},
			{
				source: "/perfect-attendance-2023",
				destination:
					"https://papers.aamirazad.com/share/PXPJTBMvauXaHVqwyqHtHhNF18n4ayakr8Uu0dUsOVmaArbyOd",
				permanent: false,
			},
			{
				source: "/presidents-award",
				destination:
					"https://papers.aamirazad.com/share/hAZ5KImbXUlB3Ul03zV5YtSxY4Oo8XjGQNJk0b7SXvqLyt7yFj",
				permanent: false,
			},
			{
				source: "/american-citizenship-award",
				destination:
					"https://papers.aamirazad.com/share/hWSsF4LSg5DJ4DaWQCoTi2a49X2pEodAeJSPqhHB5ER2NOA9qr",
				permanent: false,
			},
			{
				source: "/profile-picture",
				destination:
					"https://azadphotos.com/api/assets/83900471-95e1-4f33-a032-e41531e7455f/thumbnail?size=preview&key=6Cy6QJLTizf6dILKFfjfm9SJcfZjmR-Dzbk1yIHZFOQwSkAOYrk4QY7LKa0wxOSazU8&c=Y2WyiAHtxlI37LaS42gHmgXhpnI%3D",
				permanent: false,
			},
			{
				source: "/fbla-game",
				destination:
					"https://connect.fbla.org/headquarters/files/High%20School%20Competitive%20Events%20Resources/Individual%20Guidelines/Presentation%20Events/Computer-Game-Simulation-Programming.pdf",
				permanent: false,
			},
			{
				source: "/aseprite",
				destination:
					"https://files.aamirazad.com/inbox/aseprite-v1.3.14-beta1.zip",
				permanent: false,
			},
			{
				source: "/pronounce-godot",
				destination:
					"https://upload.wikimedia.org/wikipedia/commons/transcoded/e/ef/En-us-Godot.oga/En-us-Godot.oga.mp3",
				permanent: false,
			},
			{
				source: "/zulip",
				destination:
					// Default channels. Members group
					"https://hasd.zulipchat.com/join/6rwf4ado2v2erh3rowedivlr/",
				permanent: false,
			},
			{
				source: "/fbla-zulip",
				destination:
					// FBLA-bulletin, chat, general. FBLA, members group
					"https://hasd.zulipchat.com/join/ki2oh6q5q3mnr3td6r3fxplg/",
				permanent: false,
			},
			{
				source: "/history-zulip",
				destination:
					// History-bulletin, chat, sim, general. History club, members group
					"https://hasd.zulipchat.com/join/gk442fdoiubirhzpdytxvq5w/",
				permanent: false,
			},
			{
				source: "/history-officer-zulip",
				destination:
					// History-bulletin, chat, sim, officers, general, announcements. History club, officers, members group
					"https://hasd.zulipchat.com/join/h3fovacw2avg7c52vrftxt4k/",
				permanent: false,
			},
			{
				source: "/chem-textbook",
				destination: "https://cdn.aamirazad.com/Zumdahl%20Textbook.pdf",
				permanent: false,
			},
			{
				source: "/fbla-2024-gc-archive",
				destination:
					"https://files.aamirazad.com/inbox/FBLA%202024-2025%20GC%20Stream.html",
				permanent: false,
			},
			{
				source: "/turkey-2025",
				destination:
					"/watch/AY4aAI7zzcaOE6Kd3202XudT7k4jIuglQSIBj3UoGu02U",
				permanent: false,
			},
			{
				source: "/fbla-help",
				destination:
					"mailto:amazad15@hasdtigers.com, jawatt83@hasdtigers.com, lindsay.detwiler@hasdtigers.com?subject=FBLA%20Question",
				permanent: false,
			},
			{
				source: "/backpack",
				destination:
					"https://www.change.org/p/end-the-backpack-ban-at-hasd-high-school?recruited_by_id=cee357a0-8114-11f0-9397-51d3dd62874f&utm_source=share_petition&utm_campaign=psf_combo_share_initial&utm_medium=copylink",
				permanent: false,
			},
		];
	},
	async rewrites() {
		return [
			{
				source: "/api/script.js",
				destination: `https://analytics.aamirazad.com/api/script.js`,
			},
			{
				source: "/api/track",
				destination: `https://analytics.aamirazad.com/api/track`,
			},
		];
	},
	pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

// Merge MDX config with Next.js config
export default nextConfig;
