import { describe, expect, it } from "vitest";
import {
  parsePitchforkScore,
  parsePitchforkSearchResults,
  pickPitchforkResult,
} from "./pitchfork-parse";

const searchHtml = `
  <a class="SummaryItemHedLink-chBZvf dlIsNj" href="/reviews/albums/10988-in-rainbows-cd-2/">
    <h3 class="SummaryItemHedBase"><em>In Rainbows [CD 2]</em></h3>
  </a>
  <div class="SummaryItemSubHedBase-hdQvQq dyebLH">Radiohead</div>
  <a class="SummaryItemHedLink-chBZvf dlIsNj" href="/reviews/albums/10785-in-rainbows/">
    <h3 class="SummaryItemHedBase"><em>In Rainbows</em></h3>
  </a>
  <div class="SummaryItemSubHedBase-hdQvQq dyebLH">Radiohead</div>
`;

describe("parsePitchforkSearchResults", () => {
  it("reads review urls, titles and artists", () => {
    expect(parsePitchforkSearchResults(searchHtml)).toEqual([
      { url: "/reviews/albums/10988-in-rainbows-cd-2/", title: "In Rainbows [CD 2]", artist: "Radiohead" },
      { url: "/reviews/albums/10785-in-rainbows/", title: "In Rainbows", artist: "Radiohead" },
    ]);
  });

  it("decodes HTML entities in titles", () => {
    const html = `
      <a class="SummaryItemHedLink" href="/reviews/albums/1-test/"><h3>Rock &amp; Roll</h3></a>
      <div class="SummaryItemSubHedBase">Artist</div>
    `;
    expect(parsePitchforkSearchResults(html)[0]?.title).toBe("Rock & Roll");
  });
});

describe("pickPitchforkResult", () => {
  it("prefers the exact album over an edition", () => {
    const results = parsePitchforkSearchResults(searchHtml);
    expect(pickPitchforkResult(results, "Radiohead", "In Rainbows")?.url).toBe(
      "/reviews/albums/10785-in-rainbows/",
    );
  });

  it("accepts an edition when that is the release", () => {
    const results = parsePitchforkSearchResults(searchHtml);
    expect(pickPitchforkResult(results, "Radiohead", "In Rainbows [CD 2]")?.url).toBe(
      "/reviews/albums/10988-in-rainbows-cd-2/",
    );
  });

  it("rejects the same title by another artist", () => {
    const results = parsePitchforkSearchResults(searchHtml);
    expect(pickPitchforkResult(results, "Vitamin String Quartet", "In Rainbows")).toBeNull();
  });

  it("matches a combined review", () => {
    const results = [
      { url: "/reviews/albums/22295-blonde-endless/", title: "Blonde / Endless", artist: "Frank Ocean" },
    ];
    expect(pickPitchforkResult(results, "Frank Ocean", "Blonde")?.url).toBe(
      "/reviews/albums/22295-blonde-endless/",
    );
  });
});

describe("parsePitchforkScore", () => {
  it("reads the editorial score from the preloaded state", () => {
    const html = `"musicRating":{"isBestNewMusic":true,"isBestNewReissue":false,"score":9.3}`;
    expect(parsePitchforkScore(html)).toBe(9.3);
  });

  it("keeps a whole-number score", () => {
    expect(parsePitchforkScore(`"musicRating":{"score":10}`)).toBe(10);
  });

  it("returns null without a score", () => {
    expect(parsePitchforkScore("<html>No review here</html>")).toBeNull();
  });
});
