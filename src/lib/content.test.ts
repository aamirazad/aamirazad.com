import { describe, expect, it } from "vitest";

import { FORMATS, slugify, titlePrefix, validateDraft } from "./content";

const baseDraft = {
  series: "on" as const,
  format: "article" as const,
  title: "On dependable publishing",
  slug: "dependable-publishing",
  summary: "",
  bodyMarkdown: "A body.",
  sourceUrl: "",
  sourceTitle: "",
  sourceDescription: "",
  quoteText: "",
  quoteAttribution: "",
};

describe("content model", () => {
  it("provides stable series title conventions and slugs", () => {
    expect(titlePrefix("built")).toBe("I Built ");
    expect(slugify("Café & Dependable Publishing!")).toBe("cafe-dependable-publishing");
  });

  it("validates format-specific publication requirements", () => {
    expect(validateDraft(baseDraft, { forPublication: true })).toEqual([]);
    expect(
      validateDraft(
        { ...baseDraft, format: "link", sourceUrl: "http://127.0.0.1/admin" },
        { forPublication: true },
      ),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ field: "sourceUrl" })]));
    expect(
      validateDraft({ ...baseDraft, format: "photo" }, { forPublication: true, assets: [] }),
    ).toEqual(expect.arrayContaining([expect.objectContaining({ field: "assets" })]));
  });

  it("accepts a complete draft for every presentation format", () => {
    const complete = {
      article: baseDraft,
      note: { ...baseDraft, format: "note" as const },
      link: {
        ...baseDraft,
        format: "link" as const,
        sourceUrl: "https://example.com/story",
      },
      quote: {
        ...baseDraft,
        format: "quote" as const,
        quoteText: "A useful quotation.",
        quoteAttribution: "Someone",
      },
      photo: { ...baseDraft, format: "photo" as const },
    };
    for (const format of FORMATS) {
      const assets =
        format === "photo"
          ? [
              {
                id: "asset",
                originalFilename: "photo.jpg",
                mimeType: "image/jpeg",
                byteSize: 1,
                width: 1,
                height: 1,
                altText: "A described photo",
                role: "gallery" as const,
                position: 0,
                caption: "",
              },
            ]
          : [];
      expect(validateDraft(complete[format], { forPublication: true, assets })).toEqual([]);
    }
  });
});
