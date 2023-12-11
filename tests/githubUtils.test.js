import github from "@actions/github";
import {
  extractPullRequestData,
  updatePRLabel,
  handleSkipOption,
  postPRComment,
  createOrUpdateFile,
  PullRequestDataExtractionError,
  ChangesetFileAccessError,
  InvalidChangelogHeadingError,
  EmptyChangelogSectionError,
  EntryTooLongError,
  InvalidPrefixError,
  CategoryWithSkipOptionError,
  ChangelogEntryMissingHyphenError,
  EmptyEntryDescriptionError,
} from "../utils";
import { SKIP_LABEL } from "../config/constants";

// Mock the @actions/github module
jest.mock("@actions/github", () => ({
  getOctokit: jest.fn(),
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

describe("Github Utils Tests", () => {
  const owner = github.context.repo.owner;
  const repo = github.context.repo.repo;
  const prNumber = github.context.payload.pull_request.number;

  const branchRef = github.context.payload.pull_request.head.ref;

  const apiError = new Error("API Failure");

  describe("extractPullRequestData", () => {
    const mockPullsGet = jest.fn();
    const octokitMock = {
      rest: {
        pulls: {
          get: mockPullsGet,
        },
      },
    };

    beforeAll(() => {
      github.getOctokit.mockImplementation(() => octokitMock);
    });
    beforeEach(() => {
      github.getOctokit.mockClear();
    });

    test("successfully extracts pull request data", async () => {
      const mockPRData = {
        data: {
          body: "Test PR body",
          html_url: "http://example.com/pr/123",
        },
      };
      mockPullsGet.mockResolvedValueOnce(mockPRData);
      const expectedData = {
        owner: "testOwner",
        repo: "testRepo",
        prNumber: 123,
        prDescription: mockPRData.data.body,
        prLink: mockPRData.data.html_url,
        branchRef: "testBranch",
      };
      const actualData = await extractPullRequestData(octokitMock);
      expect(actualData).toEqual(expectedData);
      expect(mockPullsGet).toHaveBeenCalledWith({
        owner: expectedData.owner,
        repo: expectedData.repo,
        pull_number: expectedData.prNumber,
      });
      expect(mockPullsGet).toHaveBeenCalledTimes(1);
    });

    test("throws PullRequestDataExtractionError on API failure", async () => {
      mockPullsGet.mockRejectedValueOnce(apiError);
      await expect(extractPullRequestData(octokitMock)).rejects.toThrow(
        PullRequestDataExtractionError
      );
      expect(mockPullsGet).toHaveBeenCalledTimes(1);
    });

    test("throws error for invalid response data", async () => {
      mockPullsGet.mockResolvedValueOnce(null); // or use undefined, or a non-object value
      await expect(extractPullRequestData(octokitMock)).rejects.toThrow(
        PullRequestDataExtractionError
      );
    });

    test.each([
      [undefined, "undefined response"],
      [null, "null response"],
      [{ data: {} }, "empty data field"],
    ])(
      "throws error for %s response from API",
      async (resolvedValue, description) => {
        mockPullsGet.mockResolvedValueOnce(resolvedValue);
        await expect(extractPullRequestData(octokitMock)).rejects.toThrow(
          PullRequestDataExtractionError
        );
      }
    );

    test("throws error for incomplete response data", async () => {
      // Simulating missing 'body' in the response
      const incompleteData = {
        data: {
          html_url: "http://example.com/pr",
        },
      };
      mockPullsGet.mockResolvedValueOnce(incompleteData);
      await expect(extractPullRequestData(octokitMock)).rejects.toThrow(
        PullRequestDataExtractionError
      );
    });
  });

  describe("updatePRLabel", () => {
    const label = "test-label";
    const mockAddLabels = jest.fn();
    const mockListLabelsOnIssue = jest.fn();
    const mockRemoveLabel = jest.fn();

    const octokitMock = {
      rest: {
        issues: {
          addLabels: mockAddLabels,
          listLabelsOnIssue: mockListLabelsOnIssue,
          removeLabel: mockRemoveLabel,
        },
      },
    };

    beforeAll(() => {
      github.getOctokit.mockImplementation(() => octokitMock);
    });
    beforeEach(() => {
      github.getOctokit.mockClear();
    });

    test("successfully adds a label", async () => {
      await updatePRLabel(octokitMock,owner, repo, prNumber, label, true);
      expect(mockAddLabels).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        labels: [label],
      });
      expect(mockAddLabels).toHaveBeenCalledTimes(1);
    });

    test("successfully removes an existing label", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: label }] });
      await updatePRLabel(octokitMock,owner, repo, prNumber, label, false);
      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockRemoveLabel).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        name: label,
      });
      expect(mockRemoveLabel).toHaveBeenCalledTimes(1);
    });

    test("tries to remove a label that isn't present", async () => {
      mockListLabelsOnIssue.mockResolvedValue({
        data: [{ name: "unexistent-label" }],
      });
      await updatePRLabel(octokitMock, owner, repo, prNumber, label, false);
      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockRemoveLabel).not.toHaveBeenCalled();
    });

    test("throws an error when adding a label fails", async () => {
      mockAddLabels.mockRejectedValueOnce(apiError);
      await expect(
        updatePRLabel(octokitMock,owner, repo, prNumber, label, true)
      ).rejects.toThrow(apiError);
      expect(mockAddLabels).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        labels: [label],
      });
      expect(mockAddLabels).toHaveBeenCalledTimes(1);
    });

    test("throws an error when checking labels fails", async () => {
      mockListLabelsOnIssue.mockRejectedValueOnce(apiError);
      await expect(
        updatePRLabel(octokitMock, owner, repo, prNumber, label, false)
      ).rejects.toThrow(apiError);
      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockRemoveLabel).not.toHaveBeenCalled();
    });

    test("throws an error when removing a label fails", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: label }] });
      mockRemoveLabel.mockRejectedValueOnce(apiError);
      await expect(
        updatePRLabel(octokitMock,owner, repo, prNumber, label, false)
      ).rejects.toThrow(apiError);
      expect(mockRemoveLabel).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        name: label,
      });
      expect(mockRemoveLabel).toHaveBeenCalledTimes(1);
    });
  });

  describe("postPRComment", () => {
    // Mock the createComment method
    const mockCreateComment = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      github.getOctokit.mockImplementation(() => ({
        rest: {
          issues: {
            createComment: mockCreateComment,
          },
        },
      }));
    });

    test("calls getOctokit with the correct token", async () => {
      const error = new PullRequestDataExtractionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(github.getOctokit).toHaveBeenCalledWith(GITHUB_TOKEN);
    });

    test("does not generate a comment for a PullRequestDataExtractionError", async () => {
      const error = new PullRequestDataExtractionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).not.toHaveBeenCalled();
    });

    test("does not generate a comment for a ChangesetFileAccessError", async () => {
      const error = new ChangesetFileAccessError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).not.toHaveBeenCalled();
    });

    test("generates the correct comment for InvalidChangelogHeadingError", async () => {
      const error = new InvalidChangelogHeadingError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Invalid Changelog Heading Error: ${error.message}`,
      });
    });

    test("generates the correct comment for EmptyChangelogSectionError", async () => {
      const error = new EmptyChangelogSectionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Empty Changelog Section Error: ${error.message}`,
      });
    });

    test("generates the correct comment for EntryTooLongError", async () => {
      const error = new EntryTooLongError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Entry Too Long Error: ${error.message}`,
      });
    });

    test("generates the correct comment for InvalidPrefixError", async () => {
      const error = new InvalidPrefixError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Invalid Prefix Error: ${error.message}`,
      });
    });

    test("generates the correct comment for CategoryWithSkipOptionError", async () => {
      const error = new CategoryWithSkipOptionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Category With Skip Option Error: ${error.message}`,
      });
    });

    test("generates the correct comment for ChangelogEntryMissingHyphenError", async () => {
      const error = new ChangelogEntryMissingHyphenError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Changelog Entry Missing Hyphen Error: ${error.message}`,
      });
    });

    test("generates the correct comment for EmptyEntryDescriptionError", async () => {
      const error = new EmptyEntryDescriptionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Empty Entry Description Error: ${error.message}`,
      });
    });

    test("logs success message after posting comment to PR", async () => {
      const error = new InvalidChangelogHeadingError();
      jest.spyOn(console, "log");
      await postPRComment(owner, repo, prNumber, error);
      expect(console.log).toHaveBeenCalledWith(
        `Comment posted to PR #${prNumber}: "Invalid Changelog Heading Error: ${error.message}"`
      );
    });

    test("logs error message if posting comment to PR fails", async () => {
      const error = new InvalidChangelogHeadingError();
      jest.spyOn(console, "error");
      mockCreateComment.mockRejectedValueOnce(apiError);
      await postPRComment(owner, repo, prNumber, error);
      expect(console.error).toHaveBeenCalledWith(
        `Error posting comment to PR #${prNumber}: ${apiError.message}`
      );
    });

    test("logs messsage if no comment is posted to the PR because of the error type", async () => {
      const error = new PullRequestDataExtractionError();
      jest.spyOn(console, "log");
      await postPRComment(owner, repo, prNumber, error);
      expect(console.log).toHaveBeenCalledWith(
        `No comment posted to PR #${prNumber} due to error type: ${error.constructor.name}`
      );
    });

    test("handles unexpected errors gracefully", async () => {
      const error = new InvalidChangelogHeadingError();
      const unexpectedError = new Error("Unexpected error");

      // Override the mock implementation for this test
      mockCreateComment.mockImplementationOnce(() => {
        throw unexpectedError;
      });
      jest.spyOn(console, "error");
      await postPRComment(owner, repo, prNumber, error);
      expect(console.error).toHaveBeenCalledWith(
        `Error posting comment to PR #${prNumber}: ${unexpectedError.message}`
      );
    });
  });

  describe("createOrUpdateFile", () => {
    const changesetFilePath = "test/path/changesets/directory";
    const changesetFileContent = "Changeset test content";
    const changesetCommitMessage = "Changeset commit message";
    const mockGetContent = jest.fn();
    const mockCreateOrUpdateFileContents = jest.fn();

    beforeAll(() => {
      github.getOctokit.mockImplementation(() => ({
        rest: {
          repos: {
            getContent: mockGetContent,
            createOrUpdateFileContents: mockCreateOrUpdateFileContents,
          },
        },
      }));
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("creates a new file when it does not exist", async () => {
      mockGetContent.mockRejectedValueOnce({ status: 404 });
      await createOrUpdateFile(
        owner,
        repo,
        changesetFilePath,
        changesetFileContent,
        changesetCommitMessage,
        branchRef
      );

      expect(mockGetContent).toHaveBeenCalledWith({
        owner,
        repo,
        path: changesetFilePath,
        ref: branchRef,
      });
      expect(mockGetContent).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
        owner,
        repo,
        path: changesetFilePath,
        message: changesetCommitMessage,
        content: changesetFileContent,
        sha: undefined,
        branch: branchRef,
      });
      expect(mockCreateOrUpdateFileContents).toHaveBeenCalledTimes(1);
    });

    test("updates an existing file", async () => {
      const sha = "existing-file-sha";
      mockGetContent.mockResolvedValueOnce({ data: { sha } });
      await createOrUpdateFile(
        owner,
        repo,
        changesetFilePath,
        changesetFileContent,
        changesetCommitMessage,
        branchRef
      );

      expect(mockGetContent).toHaveBeenCalledWith({
        owner,
        repo,
        path: changesetFilePath,
        ref: branchRef,
      });
      expect(mockGetContent).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateFileContents).toHaveBeenCalledWith({
        owner,
        repo,
        path: changesetFilePath,
        message: changesetCommitMessage,
        content: changesetFileContent,
        sha,
        branch: branchRef,
      });
      expect(mockCreateOrUpdateFileContents).toHaveBeenCalledTimes(1);
    });

    test("throws an error when file access fails with a non-404 error", async () => {
      const error = new Error("API Failure");
      error.status = 500;
      mockGetContent.mockRejectedValueOnce(error);

      await expect(
        createOrUpdateFile(
          owner,
          repo,
          changesetFilePath,
          changesetFileContent,
          changesetCommitMessage,
          branchRef
        )
      ).rejects.toThrow(ChangesetFileAccessError);
      expect(mockGetContent).toHaveBeenCalledWith({
        owner,
        repo,
        path: changesetFilePath,
        ref: branchRef,
      });
      expect(mockGetContent).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleSkipOption Tests", () => {
    const mockUpdateLabel = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("adds 'skip-changelog' label when 'skip' is the only entry", async () => {
      const entryMap = { skip: "" };
      await handleSkipOption(entryMap, owner, repo, prNumber, mockUpdateLabel);
      expect(mockUpdateLabel).toHaveBeenCalledWith(
        owner,
        repo,
        prNumber,
        SKIP_LABEL,
        true
      );
      expect(mockUpdateLabel).toHaveBeenCalledTimes(1);
    });

    test("throws CategoryWithSkipOptionError when 'skip' and other entries are present", async () => {
      const entryMap = { skip: "", other: "data" };

      await expect(
        handleSkipOption(entryMap, owner, repo, prNumber, mockUpdateLabel)
      ).rejects.toThrow(CategoryWithSkipOptionError);
      expect(mockUpdateLabel).not.toHaveBeenCalled();
    });

    test("removes 'skip-changelog' label when 'skip' is not present", async () => {
      const entryMap = {};
      await handleSkipOption(entryMap, owner, repo, prNumber, mockUpdateLabel);

      expect(mockUpdateLabel).toHaveBeenCalledWith(
        owner,
        repo,
        prNumber,
        SKIP_LABEL,
        false
      );
      expect(mockUpdateLabel).toHaveBeenCalledTimes(1);
    });
  });
});
