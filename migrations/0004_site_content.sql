CREATE TABLE site_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('project', 'link', 'homelab')),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  href TEXT,
  github TEXT,
  code_url TEXT,
  badge TEXT,
  is_wip INTEGER NOT NULL DEFAULT 0 CHECK (is_wip IN (0, 1)),
  position INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX site_items_kind_position_idx
  ON site_items(kind, position, created_at)
  WHERE deleted_at IS NULL;

INSERT INTO site_items
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
  ('homelab-actual', 'homelab', 'Actual', '', 'https://finance.aamirazad.com/', NULL, NULL, NULL, 0, 12, '2026-07-24T00:00:00.000Z', '2026-07-24T00:00:00.000Z');
