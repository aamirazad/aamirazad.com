export default function Footer() {
	return (
		<footer className="mt-16 mb-16 border-neutral-200 border-t pt-8 dark:border-neutral-800">
			<div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
				<div className="flex flex-col items-center space-y-2 md:flex-row md:space-x-6 md:space-y-0">
					<p className="text-neutral-600 text-sm dark:text-neutral-400">
						© {new Date().getFullYear()} Aamir Azad
					</p>
					<div className="flex space-x-4 text-sm">
						<a
							href="https://github.com/aamirazad"
							className="text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
							target="_blank"
							rel="noopener noreferrer"
						>
							GitHub
						</a>
					</div>
				</div>
				<div className="text-neutral-600 text-sm dark:text-neutral-400"></div>
			</div>
		</footer>
	);
}
