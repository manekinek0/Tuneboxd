import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReleaseGroupSummary } from "./musicbrainz";

vi.mock("server-only", () => ({}));
import { rankByPopularity } from "./popularity";

const base = {
  primaryType: "Album",
  secondaryTypes: [] as string[],
  releaseDate: "2000-01-01",
};

function release(mbid: string, title: string, relevance: number): ReleaseGroupSummary {
  return { ...base, mbid, title, artist: "Radiohead", relevance };
}

const albums = [
  { id: 1, title: "OK Computer", artist: { name: "Radiohead" } },
  { id: 2, title: "In Rainbows", artist: { name: "Radiohead" } },
  { id: 3, title: "The Bends", artist: { name: "Radiohead" } },
  { id: 4, title: "Creep", artist: { name: "Radiohead" } },
];

const listeners: Record<number, number> = { 1: 186_000, 2: 135_000, 3: 115_000, 4: 23_000 };

function mockDeezer() {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/search/album")) {
      return new Response(JSON.stringify({ data: albums }), { status: 200 });
    }
    const id = Number(url.match(/\/album\/(\d+)/)?.[1]);
    return new Response(JSON.stringify({ fans: listeners[id] }), { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rankByPopularity", () => {
  it("sorts MusicBrainz results by Deezer album fans", async () => {
    mockDeezer();
    const ranked = await rankByPopularity("radiohead", [
      release("creep", "Creep", 99),
      release("bends", "The Bends", 90),
      release("rainbows", "In Rainbows", 80),
      release("ok", "OK Computer", 70),
    ]);

    expect(ranked.map((item) => item.title)).toEqual([
      "OK Computer",
      "In Rainbows",
      "The Bends",
      "Creep",
    ]);
    expect(ranked[0]?.popularity).toBe(186_000);
  });

  it("matches deluxe titles to the base album", async () => {
    mockDeezer();
    const ranked = await rankByPopularity("radiohead", [
      release("rainbows", "In Rainbows (Deluxe Edition)", 100),
    ]);

    expect(ranked[0]?.popularity).toBe(135_000);
  });

  it("keeps relevance order when Deezer fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const ranked = await rankByPopularity("radiohead", [
      release("bends", "The Bends", 80),
      release("ok", "OK Computer", 100),
    ]);

    expect(ranked.map((item) => item.title)).toEqual(["OK Computer", "The Bends"]);
    expect(ranked.every((item) => item.popularity === null)).toBe(true);
  });
});
