import github from "@actions/github";
import {
  extractPullRequestData,
  updatePRLabel,
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
  postPRComment,
} from "../utils";
import { GITHUB_TOKEN } from "../config/constants";

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
  const owner = "testOwner";
  const repo = "testRepo";
  const prNumber = 123;
  const prDescription = "Test PR body";
  const prLink = "http://example.com/pr";
  const branchRef = "testBranch";

  const apiError = new Error("API Failure");

  describe("extractPullRequestData", () => {
    const mockPullsGet = jest.fn();
    beforeAll(() => {
      github.getOctokit.mockImplementation(() => ({
        rest: {
          pulls: {
            get: mockPullsGet,
          },
        },
      }));
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("successfully extracts pull request data", async () => {
      const mockPRData = {
        data: {
          body: "Test PR body",
          html_url: "http://example.com/pr",
        },
      };
      mockPullsGet.mockResolvedValue(mockPRData);

      const expectedData = {
        owner,
        repo,
        prNumber,
        prDescription,
        prLink,
        branchRef,
      };
      const actualData = await extractPullRequestData();

      expect(actualData).toEqual(expectedData);
      expect(mockPullsGet).toHaveBeenCalledTimes(1);
    });

    test("throws PullRequestDataExtractionError on failure", async () => {
      mockPullsGet.mockRejectedValueOnce(apiError);
      await expect(extractPullRequestData()).rejects.toThrow(
        PullRequestDataExtractionError
      );
      expect(mockPullsGet).toHaveBeenCalledTimes(1);
    });
  });

  describe("updatePRLabel", () => {
    const label = "test-label";
    const mockAddLabels = jest.fn();
    const mockListLabelsOnIssue = jest.fn();
    const mockRemoveLabel = jest.fn();

    beforeAll(() => {
      github.getOctokit.mockImplementation(() => ({
        rest: {
          issues: {
            addLabels: mockAddLabels,
            listLabelsOnIssue: mockListLabelsOnIssue,
            removeLabel: mockRemoveLabel,
          },
        },
      }));
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("successfully adds a label", async () => {
      await updatePRLabel(owner, repo, prNumber, label, true);
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
      await updatePRLabel(owner, repo, prNumber, label, false);
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
      await updatePRLabel(owner, repo, prNumber, label, false);
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
        updatePRLabel(owner, repo, prNumber, label, true)
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
        updatePRLabel(owner, repo, prNumber, label, false)
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
        updatePRLabel(owner, repo, prNumber, label, false)
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
          }
        }
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
        body: `Invalid Changelog Heading Error: ${error.message}`
      });
    });

    test("generates the correct comment for EmptyChangelogSectionError", async () => {
      const error = new EmptyChangelogSectionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Empty Changelog Section Error: ${error.message}`
      });
    });

    test("generates the correct comment for EntryTooLongError", async () => {
      const error = new EntryTooLongError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Entry Too Long Error: ${error.message}`
      });
    });

    test("generates the correct comment for InvalidPrefixError", async () => {
      const error = new InvalidPrefixError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Invalid Prefix Error: ${error.message}`
      });
    });

    test("generates the correct comment for CategoryWithSkipOptionError", async () => {
      const error = new CategoryWithSkipOptionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Category With Skip Option Error: ${error.message}`
      });
    });

    test("generates the correct comment for ChangelogEntryMissingHyphenError", async () => {
      const error = new ChangelogEntryMissingHyphenError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Changelog Entry Missing Hyphen Error: ${error.message}`
      });
    });
    
    test("generates the correct comment for EmptyEntryDescriptionError", async () => {
      const error = new EmptyEntryDescriptionError();
      await postPRComment(owner, repo, prNumber, error);
      expect(mockCreateComment).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: `Empty Entry Description Error: ${error.message}`
      });
    });

    test("logs success message after posting comment to PR", async () => {
      const error = new InvalidChangelogHeadingError();
      jest.spyOn(console, "log");
      await postPRComment(owner, repo, prNumber, error);
      expect(console.log).toHaveBeenCalledWith(`Comment posted to PR #${prNumber}: "Invalid Changelog Heading Error: ${error.message}"`);
    });

    test("logs error message if posting comment to PR fails", async () => {
      const error = new InvalidChangelogHeadingError();
      jest.spyOn(console, "error");
      mockCreateComment.mockRejectedValueOnce(apiError);
      await postPRComment(owner, repo, prNumber, error);
      expect(console.error).toHaveBeenCalledWith(`Error posting comment to PR #${prNumber}: ${apiError.message}`);
    });

    test("logs messsage if no comment is posted to the PR because of the error type", async () => {
      const error = new PullRequestDataExtractionError();
      jest.spyOn(console, "log");
      await postPRComment(owner, repo, prNumber, error);
      expect(console.log).toHaveBeenCalledWith(`No comment posted to PR #${prNumber} due to error type: ${error.constructor.name}`);
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
      expect(console.error).toHaveBeenCalledWith(`Error posting comment to PR #${prNumber}: ${unexpectedError.message}`)
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
});
