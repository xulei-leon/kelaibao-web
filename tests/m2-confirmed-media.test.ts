import {
  assertConfirmedMediaReferences,
  confirmedMediaObjectKeys,
} from "@/server/content/confirmed-media";
import type { DatabaseConnection } from "@/server/db/pool";
import { describe, expect, it, vi } from "vitest";

const base = "https://assets.example.cn";
const objectKey = "media/1/item-a-0123456789abcdef.png";
const url = `${base}/${objectKey}`;

function connection(rows: Array<{ object_key: string }>) {
  const query = vi.fn(async () => [rows, []] as [unknown, unknown]);
  return {
    query,
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
    release: vi.fn(),
  } satisfies DatabaseConnection;
}

describe("M2-03 confirmed media references", () => {
  it("extracts only immutable media object URLs on the configured assets origin", () => {
    expect(
      confirmedMediaObjectKeys(
        `<p>正文</p><img src="${url}" alt="图">`,
        base,
      ),
    ).toEqual([objectKey]);
    expect(() =>
      confirmedMediaObjectKeys(
        '<img src="https://evil.example/media/1/a.png">',
        base,
      ),
    ).toThrow(/outside/i);
    expect(() =>
      confirmedMediaObjectKeys(
        `<img src="${base}/pending/1/a.png">`,
        base,
      ),
    ).toThrow(/unconfirmed/i);
  });

  it("requires every referenced object to have a confirmed media_assets row", async () => {
    const confirmed = connection([{ object_key: objectKey }]);
    await expect(
      assertConfirmedMediaReferences(
        confirmed,
        `<img src="${url}">`,
        base,
      ),
    ).resolves.toBeUndefined();
    expect(confirmed.query).toHaveBeenCalledWith(
      expect.stringContaining("FROM media_assets"),
      [objectKey],
    );

    await expect(
      assertConfirmedMediaReferences(
        connection([]),
        `<img src="${url}">`,
        base,
      ),
    ).rejects.toThrow(/unconfirmed/i);
  });
});
