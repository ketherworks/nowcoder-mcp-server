import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, test } from "vitest";
import { createNodeHttpsSocketOpener, NowCoderPageClient } from "../src/client.js";
import { CompetitiveCompanionImporter } from "../src/companion.js";
import { NowCoderJudgeService, type NowCoderJudgeGateway } from "../src/judge.js";
import { NowCoderProvider } from "../src/provider.js";
import { createNowCoderMcpServer, NOWCODER_MCP_TOOL_NAMES } from "../src/server.js";

describe("NowCoder standalone polish & hardening", () => {
  test("returns actionable per-field schema validation microcopy across tools without leaking raw values", async () => {
    const provider = new NowCoderProvider();
    const server = createNowCoderMcpServer({ provider });
    const client = new Client({ name: "nowcoder-validation-test", version: "0.2.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      const badSearch = await client.callTool({
        name: "oj_search_problems",
        arguments: {
          schemaVersion: "oj.search-request/v1",
          requestId: "req-1",
          platform: "nowcoder",
          query: "dp",
          limit: 999,
          extraSecretField: "never-echo-me"
        }
      });
      const badSearchError = badSearch.structuredContent as { code: string; message: string };
      expect(badSearch.isError).toBe(true);
      expect(badSearchError.code).toBe("request.invalid");
      expect(badSearchError.message).toContain("oj_search_problems");
      expect(badSearchError.message).toContain("limit");
      expect(badSearchError.message).toContain("extraSecretField");
      expect(badSearchError.message).not.toContain("never-echo-me");

      const badFetch = await client.callTool({ name: "oj_fetch_problem", arguments: {} });
      const badFetchError = badFetch.structuredContent as { code: string; message: string };
      expect(badFetchError.code).toBe("request.invalid");
      expect(badFetchError.message).toContain("NC218144");

      const unknown = await client.callTool({ name: "does_not_exist", arguments: {} });
      const unknownError = unknown.structuredContent as { code: string; message: string };
      expect(unknownError.code).toBe("request.invalid");
      for (const name of NOWCODER_MCP_TOOL_NAMES.slice(0, 5)) {
        expect(unknownError.message).toContain(name);
      }
    } finally {
      await provider.dispose();
      await client.close();
      await server.close();
    }
  });

  test("returns actionable language and account mismatch microcopy in NowCoderJudgeService", async () => {
    const source = "int main() { return 0; }\n";
    const sha256 = createHash("sha256").update(source).digest("hex");
    const capturedAt = "2026-07-14T17:00:00.000Z";
    const problemUrl = "https://ac.nowcoder.com/acm/problem/218144";
    const gateway: NowCoderJudgeGateway = {
      prepareContext: async () => ({
        accountId: "987654321",
        displayName: "signed-in-user",
        questionId: "1338275",
        problem: {
          schemaVersion: "oj.problem-ref/v1",
          platform: "nowcoder",
          nativeId: "NC218144",
          canonicalId: "nowcoder:NC218144",
          url: problemUrl,
          source: {
            kind: "page_adapter",
            adapterId: "nowcoder-public-page",
            adapterVersion: "0.2.0",
            fetchedAt: capturedAt,
            sourceUrl: problemUrl,
            confidence: "derived"
          }
        },
        userId: "987654321",
        tagId: 4,
        samples: [{ ordinal: 1, input: "1\n", output: "1\n" }],
        supportedLanguageIds: ["2", "11"]
      }),
      obtainAccessToken: async () => "token",
      submit: async () => ({ id: "1" }),
      poll: async () => ({ status: 5 })
    };
    const judge = new NowCoderJudgeService({
      gateway,
      verifyArtifact: async () => ({ filePath: "C:\\workspace\\main.cpp", fileName: "main.cpp" })
    });
    const baseRequest = {
      schemaVersion: "oj.prepare-submission/v1" as const,
      requestId: "req-judge-1",
      attemptId: "att-1",
      providerId: "nowcoder-public-page",
      problem: {
        schemaVersion: "oj.problem-ref/v1" as const,
        platform: "nowcoder" as const,
        nativeId: "NC218144",
        canonicalId: "nowcoder:NC218144",
        url: problemUrl,
        source: {
          kind: "page_adapter" as const,
          adapterId: "nowcoder-public-page",
          adapterVersion: "0.2.0",
          fetchedAt: capturedAt,
          sourceUrl: problemUrl,
          confidence: "derived" as const
        }
      },
      accountId: "111222333",
      languageKey: "cpp",
      platformLanguageId: "2",
      code: {
        languageKey: "cpp",
        platformLanguageId: "2",
        source,
        sha256,
        bytes: Buffer.byteLength(source),
        fileName: "main.cpp",
        capturedAt,
        sourceWasDirty: false as const
      }
    };

    await expect(
      judge.prepareSubmission({ ...baseRequest, platformLanguageId: "999" })
    ).rejects.toMatchObject({
      code: "language.unsupported",
      message: expect.stringContaining("oj_capabilities")
    });

    await expect(judge.prepareSubmission(baseRequest)).rejects.toMatchObject({
      code: "auth.forbidden",
      message: expect.stringContaining("oj_fetch_profile({})")
    });
  });

  test("unblocks oj_complete_import immediately when caller AbortSignal cancels", async () => {
    const importer = new CompetitiveCompanionImporter({ port: 0 });
    const provider = new NowCoderProvider({ importer });
    const server = createNowCoderMcpServer({ provider });
    const client = new Client({ name: "nowcoder-import-cancel-test", version: "0.2.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      const opened = await client.callTool({
        name: "oj_open_import_window",
        arguments: {
          schemaVersion: "oj.import-window-request/v1",
          requestId: "cancel-import-1",
          allowedPlatforms: ["nowcoder"],
          expiresInMs: 30_000
        }
      });
      const { windowId } = opened.structuredContent as { windowId: string };
      const controller = new AbortController();
      const pending = client.callTool(
        { name: "oj_complete_import", arguments: { windowId } },
        undefined,
        { signal: controller.signal }
      );
      setTimeout(() => controller.abort(new DOMException("User cancelled import wait", "AbortError")), 20);
      await expect(pending).rejects.toThrow();
    } finally {
      await provider.dispose();
      await client.close();
      await server.close();
    }
  });

  test("validates NowCoderPageClient bounds and rejects pre-aborted socket requests immediately", async () => {
    expect(() => new NowCoderPageClient({ timeoutMs: 0 })).toThrow(RangeError);
    expect(() => new NowCoderPageClient({ maxBytes: -10 })).toThrow(RangeError);
    expect(() => new NowCoderPageClient({ maxRedirects: -1 })).toThrow(RangeError);

    let invoked = false;
    const opener = createNodeHttpsSocketOpener({
      requestImpl: (() => {
        invoked = true;
        throw new Error("should not be called");
      }) as never
    });
    const controller = new AbortController();
    controller.abort(new DOMException("Pre-aborted", "AbortError"));
    await expect(
      opener({
        url: new URL("https://ac.nowcoder.com/acm/problem/218144"),
        serverName: "ac.nowcoder.com",
        addresses: [{ address: "93.184.216.34", family: 4 }],
        signal: controller.signal
      })
    ).rejects.toThrow(/Pre-aborted/);
    expect(invoked).toBe(false);
  });
});
