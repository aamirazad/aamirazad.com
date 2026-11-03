-- Default homepage content and the legacy short links. Both inserts skip rows that already exist,
-- so applying this to a database imported from D1 keeps the imported values.
INSERT INTO aamirazad_site_items
  (id, kind, name, description, href, github, code_url, badge, is_wip, position, created_at, updated_at)
VALUES
  ('project-terranaut', 'project', 'Terranaut', 'A open source social fitness app designed to motivate users to get outside and accomplish their fitness goals.', 'https://terranaut.aamirazad.com', 'aamirazad/terranaut', NULL, 'Featured', 1, 0, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-nonstop', 'project', 'Nonstop', 'A simple time tracking website designed to help me keep track of how much time I spend on different activities.', 'https://nonstop.aamirazad.com', NULL, 'https://code.aamirazad.com/aamir/nonstop/', NULL, 0, 1, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-wwii-simulation', 'project', 'WWII Simulation', 'Learn history by playing it. Coordinate and strategize as nations in the Second World War. Wage war, forge alliances, and have fun.', 'https://sim.aamirazad.com', 'aamirazad/wwii-simulation', NULL, 'Featured', 0, 2, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-trackshelf', 'project', 'TrackShelf', 'TrackShelf is an app to manage all the books, movies, and tv shows you watch so that you never forget what about these experiences was special to you.', NULL, 'aamirazad/track', NULL, NULL, 0, 3, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-fbla-site', 'project', 'FBLA Site', 'A notion backed website to serve as a resource for finding information about FBLA specific activities. Namely, a list of events and their information is hosted on this site.', 'https://fbla.notion.site/', NULL, NULL, NULL, 0, 4, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-history-club', 'project', 'History Club Site', 'A content heavy application built with Astro to host information about the HASD History Club''s WW2 Simulation. This game, with very complex rules, will be available for others to reference on this pretty website.', 'https://historyclub.aamirazad.com/', 'aamirazad/history-club', NULL, NULL, 0, 5, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-job-journey', 'project', 'Job Journey', 'A full stack nextjs app in which students can easily search job postings and employers can easily submit them with secure authentication and ease of use. Project was awarded 3rd place in the Pennsylvania FBLA Competition.', 'https://jobs.aamirazad.com/', 'aamirazad/job-journey', NULL, 'Featured', 0, 6, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-tigertutoringtool', 'project', 'Tigertutoringtool', 'Written articles to help students in my class with their classes. Features charts and diagrams as well as linking between articles and a graph view.', 'https://tigertutoringtool.aamirazad.com/', 'aamirazad/tigertutoringtool', NULL, NULL, 0, 7, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-homelab-connector', 'project', 'Homelab Connector', 'A lightning fast full stack nextjs app connecting many self hosted services including paperless-ngx, immich, and whisper with authentication and support for many different use cases.', 'https://homelab-connector.aamirazad.com', 'aamirazad/homelab-connector', NULL, NULL, 0, 8, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-donation-tracker', 'project', 'Donation Tracker', 'A simple display of how much money has been raised', 'https://school.aamirazad.com/threegurlsrunnin', 'aamirazad/school/tree/main/src/app/threegurlsrunnin', NULL, NULL, 0, 9, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-delta-chem', 'project', 'Δ Chem', 'Delta math inspired chemistry quiz site. Walks the user though solving a problem to teach a concept efficiently.', 'https://school.aamirazad.com/%CE%94', 'aamirazad/school/tree/main/src/app/%25CE%2594', NULL, NULL, 0, 10, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-renaissance', 'project', 'Renaissance Image Collection', 'An interactive slideshow of images and information', 'https://school.aamirazad.com/renaissance-image-collection', 'aamirazad/school/tree/main/src/app/renaissance-image-collection', NULL, NULL, 0, 11, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-enlightenment', 'project', 'Enlightenment/French Revolution Timeline', 'An interactive timeline made with TimelineJS.', 'https://school.aamirazad.com/enlightenment-french-revolution-timeline', 'aamirazad/school/tree/main/src/app/enlightenment-french-revolution-timeline', NULL, NULL, 0, 12, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('project-open-source', 'project', 'Open Source Writeup', 'A simple html static site about open source', 'https://school.aamirazad.com/open-source', 'aamirazad/school/tree/main/src/app/open-source', NULL, NULL, 0, 13, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-github', 'link', 'github', '', '/github', NULL, NULL, NULL, 0, 0, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-code', 'link', 'code', '', '/code', NULL, NULL, NULL, 0, 1, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-resume', 'link', 'resume', '', '/resume', NULL, NULL, NULL, 0, 2, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-pgp', 'link', 'pgp', '', '/pgp', NULL, NULL, NULL, 0, 3, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-email', 'link', 'email', '', 'mailto:aamirmazad@gmail.com', NULL, NULL, NULL, 0, 4, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-signal', 'link', 'signal', '', '/signal', NULL, NULL, NULL, 0, 5, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-telegram', 'link', 'telegram', '', '/telegram', NULL, NULL, NULL, 0, 6, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-bluesky', 'link', 'bluesky', '', '/bluesky', NULL, NULL, NULL, 0, 7, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('link-mastodon', 'link', 'mastodon', '', '/mastodon', NULL, NULL, NULL, 0, 8, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-immich', 'homelab', 'Immich', '', 'https://photos.aamirazad.com/', NULL, NULL, NULL, 0, 0, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-paperless', 'homelab', 'Paperless-ngx', '', 'https://papers.aamirazad.com/', NULL, NULL, NULL, 0, 1, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-forgejo', 'homelab', 'Forgejo', '', 'https://code.aamirazad.com/', NULL, NULL, NULL, 0, 2, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-jellyfin', 'homelab', 'Jellyfin', '', NULL, NULL, NULL, NULL, 0, 3, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-rybbit', 'homelab', 'Rybbit', '', 'https://analytics.aamirazad.com/', NULL, NULL, NULL, 0, 4, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-pocket-id', 'homelab', 'Pocket ID', '', 'https://auth.aamirazad.com/', NULL, NULL, NULL, 0, 5, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-copyparty', 'homelab', 'Copyparty', '', 'https://files.aamirazad.com/', NULL, NULL, NULL, 0, 6, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-mealie', 'homelab', 'Mealie', '', NULL, NULL, NULL, NULL, 0, 7, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-rallly', 'homelab', 'Rallly', '', NULL, NULL, NULL, NULL, 0, 8, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-listmonk', 'homelab', 'Listmonk', '', NULL, NULL, NULL, NULL, 0, 9, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-languagetool', 'homelab', 'LanguageTool', '', NULL, NULL, NULL, NULL, 0, 10, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-linkding', 'homelab', 'Linkding', '', 'https://bookmarks.aamirazad.com/', NULL, NULL, NULL, 0, 11, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z'),
  ('homelab-actual', 'homelab', 'Actual', '', 'https://finance.aamirazad.com/', NULL, NULL, NULL, 0, 12, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO aamirazad_redirect_links (id, path, target_url, label, created_at, updated_at)
SELECT legacy.* FROM (VALUES
  ('legacy-american-citizenship-award', '/american-citizenship-award', 'https://papers.aamirazad.com/share/hWSsF4LSg5DJ4DaWQCoTi2a49X2pEodAeJSPqhHB5ER2NOA9qr', 'american-citizenship-award', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-aseprite', '/aseprite', 'https://files.aamirazad.com/inbox/aseprite-v1.3.14-beta1.zip', 'aseprite', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-backpack', '/backpack', 'https://www.change.org/p/end-the-backpack-ban-at-hasd-high-school?recruited_by_id=cee357a0-8114-11f0-9397-51d3dd62874f&utm_source=share_petition&utm_campaign=psf_combo_share_initial&utm_medium=copylink', 'backpack', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-bluesky', '/bluesky', 'https://bsky.app/profile/aamirazad.com', 'bluesky', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-bycda', '/bycda', 'https://hasd.dino.icu/category/5/bycda', 'bycda', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-chem-textbook', '/chem-textbook', 'https://cdn.aamirazad.com/Zumdahl%20Textbook.pdf', 'chem-textbook', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-code', '/code', 'https://code.aamirazad.com/aamir', 'code', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-codeberg', '/codeberg', 'https://codeberg.org/aamir', 'codeberg', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-cs50-cert', '/cs50-cert', 'https://courses.edx.org/certificates/0a9007180d26449b8593df3ef23a1400', 'cs50-cert', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-fbla-2024-gc-archive', '/fbla-2024-gc-archive', 'https://files.aamirazad.com/inbox/FBLA%202024-2025%20GC%20Stream.html', 'fbla-2024-gc-archive', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-fbla-game', '/fbla-game', 'https://connect.fbla.org/headquarters/files/High%20School%20Competitive%20Events%20Resources/Individual%20Guidelines/Presentation%20Events/Computer-Game-Simulation-Programming.pdf', 'fbla-game', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-fbla-zulip', '/fbla-zulip', 'https://hasd.zulipchat.com/join/ki2oh6q5q3mnr3td6r3fxplg/', 'fbla-zulip', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-github', '/github', 'https://github.com/aamirazad/', 'github', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-history-officer-zulip', '/history-officer-zulip', 'https://hasd.zulipchat.com/join/h3fovacw2avg7c52vrftxt4k/', 'history-officer-zulip', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-history-zulip', '/history-zulip', 'https://hasd.zulipchat.com/join/gk442fdoiubirhzpdytxvq5w/', 'history-zulip', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-mastodon', '/mastodon', 'https://mastodon.social/@aamira', 'mastodon', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-outstanding-academic', '/outstanding-academic', 'https://papers.aamirazad.com/share/wyABSOjNExeQi4nBVfS10rMH4LBkvc8ppvxZdoroEfNY7V9ECF', 'outstanding-academic', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-perfect-attendance-2023', '/perfect-attendance-2023', 'https://papers.aamirazad.com/share/PXPJTBMvauXaHVqwyqHtHhNF18n4ayakr8Uu0dUsOVmaArbyOd', 'perfect-attendance-2023', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-pgp', '/pgp', '/.well-known/openpgpkey', 'pgp', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-presidents-award', '/presidents-award', 'https://papers.aamirazad.com/share/hAZ5KImbXUlB3Ul03zV5YtSxY4Oo8XjGQNJk0b7SXvqLyt7yFj', 'presidents-award', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-principals-award', '/principals-award', 'https://papers.aamirazad.com/share/FFrlAJyx3DgTU7N3eFqW9mGKY1NukmXZNmQv4ztosV4Su7ZFhZ', 'principals-award', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-profile-picture', '/profile-picture', 'https://azadphotos.com/api/assets/83900471-95e1-4f33-a032-e41531e7455f/thumbnail?size=preview&key=6Cy6QJLTizf6dILKFfjfm9SJcfZjmR-Dzbk1yIHZFOQwSkAOYrk4QY7LKa0wxOSazU8&c=Y2WyiAHtxlI37LaS42gHmgXhpnI%3D', 'profile-picture', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-pronounce-godot', '/pronounce-godot', 'https://upload.wikimedia.org/wikipedia/commons/transcoded/e/ef/En-us-Godot.oga/En-us-Godot.oga.mp3', 'pronounce-godot', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-resume', '/resume', 'https://files.aamirazad.com/resume.pdf', 'resume', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-signal', '/signal', 'https://signal.me/#eu/gYSBVtWgFaykPtlA00TXJrO91sPmPjq_Si4wE8oYpd1E-llhxxVBtITfDB17DtDj', 'signal', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-telegram', '/telegram', 'https://t.me/aamirazad01', 'telegram', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-turkey-2025', '/turkey-2025', '/watch/AY4aAI7zzcaOE6Kd3202XudT7k4jIuglQSIBj3UoGu02U', 'turkey-2025', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z'),
  ('legacy-zulip', '/zulip', 'https://hasd.zulipchat.com/join/6rwf4ado2v2erh3rowedivlr/', 'zulip', '2026-10-07T00:00:00.000Z', '2026-10-07T00:00:00.000Z')
) AS legacy (id, path, target_url, label, created_at, updated_at)
WHERE NOT EXISTS (
  SELECT 1 FROM aamirazad_redirect_links r
  WHERE r.id = legacy.id OR (r.path = legacy.path AND r.deleted_at IS NULL)
);
