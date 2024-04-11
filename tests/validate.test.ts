import { writeFile } from "node:fs/promises";
import unknownError from "./__mocks__/unknownError.json";
import validEINNoIssues from "./__mocks__/validEIN-noIssues.json";
import validEINIssuesFound from "./__mocks__/validEIN-issuesFound.json";
import { describe, expect, afterEach, vi, test } from "vitest";
import TinCheck from "../src/tincheck.js";
import type { ValidateResponse } from "../src/types/ValidateResponse.js";

/**
 * Utility function to ensure that the snapshot matches.
 * This function also writes the response to the mockResponses folder.
 * This mockResponses folder is included in the published package
 * so that consumers can see the actual response from the server, if they
 * need to test/mock specific use cases.
 *
 * The mockResponses folder is not updated unless the snapshot is updated.
 */
async function toMatchMockResponse(
  fileName: string,
  response: ValidateResponse,
) {
  expect(response).toMatchSnapshot();
  // sync the mock response with the actual response
  // this should not yield any changes if the snapshot is correct
  // unless the snapshot is changing with `-u`
  await writeFile(
    `./public/mockResponses/${fileName}.json`,
    JSON.stringify(response),
  );
}

describe("TinCheck Validate Method Tests", () => {
  const tinCheck = new TinCheck({
    username: "username",
    password: "password",
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("Should send a proper request to the server", async () => {
    const mock = vi
      .spyOn(tinCheck, "send")
      .mockReturnValue(Promise.resolve(unknownError));
    await tinCheck.validate("111-111-111", "222");
    expect(mock).toBeCalledTimes(1);
    expect(mock).toBeCalledWith("ValidateTinNameAddressListMatch", {
      TinName: {
        LName: "222",
        // note that the TIN is stripped of the dashes
        TIN: "111111111",
      },
    });
  });

  test("Should report when tin lookup failed", async () => {
    vi.spyOn(tinCheck, "send").mockReturnValue(Promise.resolve(unknownError));
    const response = await tinCheck.validate("111-111-111", "222");
    expect(response.success).toBe(true);
    expect(response.data.didPerformTinCheck).toBe(false);
    expect(response.data.isTinCheckIssuesFound).toBe(false);
    expect(response.data.errorSummary).toEqual([
      "No TIN provided. TIN lookup skipped.",
    ]);
    await toMatchMockResponse("UnknownError", response);
  });

  test("should report successfully when lookup is successful", async () => {
    vi.spyOn(tinCheck, "send").mockReturnValue(
      Promise.resolve(validEINNoIssues),
    );
    const response = await tinCheck.validate("111-111-111", "222");
    expect(response.data.didPerformTinCheck).toBe(true);
    expect(response.data.isTinCheckIssuesFound).toBe(false);
    expect(response.data.errorSummary).toEqual([]);
    await toMatchMockResponse("ValidEIN-NoIssues", response);
  });

  test("should report successfully when lookup is successful but issues found", async () => {
    vi.spyOn(tinCheck, "send").mockReturnValue(
      Promise.resolve(validEINIssuesFound),
    );
    const response = await tinCheck.validate("111-111-111", "222");
    expect(response.data.didPerformTinCheck).toBe(true);
    expect(response.data.isTinCheckIssuesFound).toBe(true);
    expect(response.data.errorSummary).toEqual([
      "Department of Treasury, Office of Foreign Assets Control (OFAC SDN/PLC): Found a possible match",
    ]);
    await toMatchMockResponse("ValidEIN-WithIssues", response);
  });
});
