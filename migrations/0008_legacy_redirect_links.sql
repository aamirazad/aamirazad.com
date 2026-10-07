-- Move the hard-coded legacy redirects into the editable redirect links table. Paths that
-- already have a live redirect link keep it. The /api/script.js and /api/track analytics proxies
-- are dropped: /api is private, and pages load analytics from analytics.aamirazad.com directly.
INSERT INTO redirect_links (id, path, target_url, label, created_at, updated_at)
SELECT id, path, target_url, label, created_at, updated_at FROM (
  SELECT column1 AS id, column2 AS path, column3 AS target_url, column4 AS label,
    column5 AS created_at, column6 AS updated_at
  FROM (VALUES
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
  )
) AS legacy
WHERE NOT EXISTS (
  SELECT 1 FROM redirect_links r WHERE r.path = legacy.path AND r.deleted_at IS NULL
);
