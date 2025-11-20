import {
	BadgeCent,
	Bookmark,
	Camera,
	ChartArea,
	Code,
	File,
	GitPullRequestArrow,
	Kanban,
	Mails,
	NotebookText,
	MessagesSquare,
	Video,
	FilePen,
} from "lucide-react";

export const useful = [
	{
		href: "/github",
		text: "github",
	},
	{
		href: "/resume",
		text: "resume",
	},
	{
		href: "/pgp",
		text: "pgp",
	},
	{
		href: "mailto:aamirmazad@gmail.com",
		text: "email",
	},
	{
		href: "/signal",
		text: "signal",
	},
	{
		href: "/telegram",
		text: "telegram",
	},
	{
		href: "https://bsky.app/profile/aamirazad.com",
		text: "bluesky",
	},
	{
		href: "https://mastodon.social/@aamira",
		text: "mastodon",
	},
];

export const projects = [
	{
		href: "https://sim.aamirazad.com",
		text: "WW2 Simulation",
		description:
			"Learn history by playing it. Coordinate and strategize as nations in the Second World War. Wage war, forge alliances, and have fun.",
		wip: true,
		badge: "Featured",
	},
	{
		href: "https://track.aamirazad.com",
		text: "TrackShelf",
		description:
			"Track shelf is an app to manage all the books, movies, and tv shows you watch so that you never forget what about these experiences was special to you.",
		github: "aamirazad/track",
	},
	{
		href: "https://fbla.notion.site/",
		text: "FBLA Site",
		description:
			"A notion backed website to serve as a resource for finding information about FBLA specific activities. Namely, a list of events and their information is hosted on this site.",
	},
	{
		href: "https://historyclub.aamirazad.com/",
		text: "History Club Site",
		description:
			"A content heavy application build with astro to host information about the HASD History Club's WW2 Simulation simulation. This game, with very complex rules, will be available for others to reference on this pretty website.",
		github: "aamirazad/history-club",
	},
	{
		href: "https://jobs.aamirazad.com/",
		text: "Job Journey",
		description:
			"A full stack nextjs app in which students can easily search job postings and employers can easily submit them with secure authentication and ease of use. Project was awarded 3rd place in the Pennsylvania FBLA Competition.",
		badge: "Featured",
		github: "aamirazad/job-journey",
	},
	{
		href: "https://tigertutoringtool.aamirazad.com/",
		text: "Tigertutoringtool",
		description:
			"Written articles to help students in my class with their classes. Features charts and diagrams as well as linking between articles and a graph view.",
		github: "aamirazad/tigertutoringtool",
	},
	{
		href: "https://homelab-connector.aamirazad.com",
		text: "Homelab Connector",
		description:
			"A lighting fast full stack nextjs app connecting many self hosted services including paperless-ngx, immich, and whishper with authentication and support for many different use cases.",
		github: "aamirazad/homelab-connector",
	},
	{
		href: "https://school.aamirazad.com/threegurlsrunnin",
		text: "Donation Tracker",
		description: "A simple display of how much money has been raised",
		github: "aamirazad/school/tree/main/src/app/threegurlsrunnin",
	},
	{
		href: "https://school.aamirazad.com/%CE%94",
		text: "Δ Chem",
		description:
			"Delta math inspired chemistry quiz site. Walks the user though solving a problem to teach a concept efficiently.",
		github: "aamirazad/school/tree/main/src/app/%25CE%2594",
	},
	{
		href: "https://school.aamirazad.com/renaissance-image-collection",
		text: "Renaissance Image Collection",
		description: "An interactive slideshow of images and information",
		github: "aamirazad/school/tree/main/src/app/renaissance-image-collection",
	},
	{
		href: "https://school.aamirazad.com/enlightenment-french-revolution-timeline",
		text: "Enlightenentment/French Revolution Timeline",
		description: "An interactive timeline made with Timeline JS",
		github: "aamirazad/school/tree/main/src/app/enlightenment-french-revolution-timeline",
	},
	{
		href: "https://school.aamirazad.com/open-source",
		text: "Open Source Writeup",
		description: "A simple html static site about open source",
		github: "aamirazad/school/tree/main/src/app/open-source",
	},
];

export const homelab = [
	{
		text: "Paperless-ngx",
		href: "https://papers.aamirazad.com/",
		icon: () => <NotebookText />,
	},
	{
		text: "Rybbit",
		href: "https://analytics.aamirazad.com/",
		icon: () => <ChartArea />,
	},
	{
		text: "Immich",
		href: "https://photos.aamirazad.com/",
		icon: () => <Camera />,
	},
	{
		text: "Forgejo",
		href: "https://code.aamirazad.com/",
		icon: () => <GitPullRequestArrow />,
	},
	{
		text: "Jellyfin",
		href: "https://jellyfin.aamirazad.com/",
		icon: () => <Video />,
	},
	{
		text: "Linkding",
		href: "https://bookmarks.aamirazad.com/",
		icon: () => <Bookmark />,
	},
	{
		text: "Copyparty",
		href: "https://files.aamirazad.com/",
		icon: () => <File />,
	},
	{
		text: "Discourse",
		href: "https://community.aamirazad.com/",
		icon: () => <MessagesSquare />,
	},
	{
		text: "Writefreely",
		href: "https://docs.aamirazad.com/",
		icon: () => <FilePen />,
	},
	{
		text: "Actual",
		href: "https://finance.aamirazad.com/",
		icon: () => <BadgeCent />,
	},
	{
		text: "Listmonk",
		href: "https://list.aamirazad.com/",
		icon: () => <Mails />,
	},
	{
		text: "Code Server",
		href: "https://dev.aamirazad.com/",
		icon: () => <Code />,
	},
	{
		text: "Wakapi",
		href: "https://waka.aamirazad.com/",
		icon: () => <Kanban />,
	},
];
