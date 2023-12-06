// import github from "@actions/github"; // importing mock object (not real module)
import { extractPullRequestData, createOrUpdateFile } from "../utils";

// Mock the @actions/github module
jest.mock("@actions/github", () => ({
  getOctokit: jest.fn().mockImplementation(() => ({
    rest: {
      pulls: {
        get: jest.fn().mockResolvedValue({
          data: {
            body: "Test PR body",
            html_url: "http://example.com/pr",
            // ...other PR data
          },
        }),
      },
      repos: {
        getContent: jest.fn().mockResolvedValue({
          data: {
            sha: "mockSha",
            // ...other file data
          },
        }),
        createOrUpdateFileContents: jest.fn().mockResolvedValue(/* ... */),
      },
    },
  })),
  context: {
    repo: {
      owner: "testOwner",
      repo: "testRepo",
    },
    payload: {
      pull_request: {
        number: 123,
        head: {
          ref: "testBranch",
        },
      },
    },
  },
}));



describe("extractPullRequestData", () => {
  beforeEach(() => {
    // github.getOctokit.mockClear();
  });

  test("successfully extracts pull request data", async () => {

    const expectedData = {
      owner: "testOwner",
      repo: "testRepo",
      prNumber: 123,
      prDescription: "Test PR body",
      prLink: "http://example.com/pr",
      branchRef: "testBranch",
    };

    await expect(extractPullRequestData()).resolves.toEqual(expectedData);
  });

  test("throws PullRequestDataExtractionError on failure", async () => {
    const github = require("@actions/github");
    github
      .getOctokit()
      .rest.pulls.get.mockRejectedValueOnce(new Error("API Failure"));
    await expect(extractPullRequestData()).rejects.toThrow(
      "PullRequestDataExtractionError"
    );
  });
});

describe("createOrUpdateFile", () => {
  beforeEach(() => {
    github.getOctokit.mockClear();
  });

  test("creates a new file if it does not exist", async () => {
    github
      .getOctokit()
      .rest.repos.getContent.mockRejectedValueOnce({ status: 404 });

    await createOrUpdateFile(
      "testOwner",
      "testRepo",
      "testPath",
      "testContent",
      "testMessage",
      "testBranch"
    );

    expect(
      github.getOctokit().rest.repos.createOrUpdateFileContents
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "testOwner",
        repo: "testRepo",
        path: "testPath",
        content: "testContent",
        message: "testMessage",
        branch: "testBranch",
      })
    );
  });

  test("updates an existing file", async () => {
    github.getOctokit().rest.repos.getContent.mockResolvedValueOnce({
      data: { sha: "existingSha" },
    });

    await createOrUpdateFile(
      "testOwner",
      "testRepo",
      "testPath",
      "testContent",
      "testMessage",
      "testBranch"
    );

    expect(
      github.getOctokit().rest.repos.createOrUpdateFileContents
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        sha: "existingSha",
      })
    );
  });

  test("throws ChangesetFileAccessError on getContent failure", async () => {
    github
      .getOctokit()
      .rest.repos.getContent.mockRejectedValueOnce(new Error("API Failure"));

    await expect(
      createOrUpdateFile(
        "testOwner",
        "testRepo",
        "testPath",
        "testContent",
        "testMessage",
        "testBranch"
      )
    ).rejects.toThrow("ChangesetFileAccessError");
  });
});
