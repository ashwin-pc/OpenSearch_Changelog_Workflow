import github from "@actions/github";
import {
  extractPullRequestData,
  updatePRLabel,
  handleSkipOption,
  getErrorComment,
  postPRComment,
  createOrUpdateFile,
  PullRequestDataExtractionError,
  GetGithubContentError,
  CreateChangesetFileError,
  UpdateChangesetFileError,
  UpdatePRLabelError,
  CategoryWithSkipOptionError,
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

    test.each([
      [null, "null response"],
      [undefined, "undefined response"],
      ["not-an-object", "non-object response"],
    ])("throws error for %s data", async (response, description) => {
      mockPullsGet.mockResolvedValueOnce({ data: response });
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

    test("successfully adds a label when it doesn't exist", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [] });
      await updatePRLabel(octokitMock, owner, repo, prNumber, label, true);

      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockAddLabels).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        labels: [label],
      });
      expect(mockAddLabels).toHaveBeenCalledTimes(1);
      expect(mockRemoveLabel).not.toHaveBeenCalled();
    });

    test("successfully removes an existing label", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: label }] });
      await updatePRLabel(octokitMock, owner, repo, prNumber, label, false);

      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockAddLabels).not.toHaveBeenCalled();
      expect(mockRemoveLabel).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        name: label,
      });
      expect(mockRemoveLabel).toHaveBeenCalledTimes(1);
    });

    test("tries to add a label that is present", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: label }] });
      await updatePRLabel(octokitMock, owner, repo, prNumber, label, true);

      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockAddLabels).not.toHaveBeenCalled();
      expect(mockRemoveLabel).not.toHaveBeenCalled();
    });
    test("tries to remove a label that isn't present", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [] });
      await updatePRLabel(octokitMock, owner, repo, prNumber, label, false);

      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockAddLabels).not.toHaveBeenCalled();
      expect(mockRemoveLabel).not.toHaveBeenCalled();
    });

    test("throws an error when adding a label fails", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [] });
      mockAddLabels.mockRejectedValueOnce(apiError);
      await expect(
        updatePRLabel(octokitMock, owner, repo, prNumber, label, true)
      ).rejects.toThrow(UpdatePRLabelError);

      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockAddLabels).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        labels: [label],
      });
      expect(mockAddLabels).toHaveBeenCalledTimes(1);
      expect(mockRemoveLabel).not.toHaveBeenCalled();
    });

    test("throws an error when checking labels fails", async () => {
      mockListLabelsOnIssue.mockRejectedValueOnce(apiError);
      await expect(
        updatePRLabel(octokitMock, owner, repo, prNumber, label, false)
      ).rejects.toThrow(UpdatePRLabelError);

      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockAddLabels).not.toHaveBeenCalled();
      expect(mockRemoveLabel).not.toHaveBeenCalled();
    });

    test("throws an error when removing a label fails", async () => {
      mockListLabelsOnIssue.mockResolvedValue({ data: [{ name: label }] });
      mockRemoveLabel.mockRejectedValueOnce(apiError);
      await expect(
        updatePRLabel(octokitMock, owner, repo, prNumber, label, false)
      ).rejects.toThrow(UpdatePRLabelError);

      expect(mockListLabelsOnIssue).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
      });
      expect(mockListLabelsOnIssue).toHaveBeenCalledTimes(1);
      expect(mockAddLabels).not.toHaveBeenCalled();
      expect(mockRemoveLabel).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        name: label,
      });
      expect(mockRemoveLabel).toHaveBeenCalledTimes(1);
    });
  });

  describe("handleSkipOption Tests", () => {
    const mockUpdateLabel = jest.fn();

    beforeEach(() => {
      mockUpdateLabel.mockClear();
    });

    test("calls updateLabel() with 'skip-changelog' label when 'skip' is the only entry in entryMap param", async () => {
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

    test.each([
      [null, "null entryMap"],
      [undefined, "undefined entryMap"],
      [{}, "empty entryMap"],
    ])(
      "calls updateLabel() with 'skip-changelog' label when entry is %s",
      async (entryMap, description) => {
        await handleSkipOption(
          entryMap,
          owner,
          repo,
          prNumber,
          mockUpdateLabel
        );

        expect(mockUpdateLabel).toHaveBeenCalledWith(
          owner,
          repo,
          prNumber,
          SKIP_LABEL,
          false
        );
        expect(mockUpdateLabel).toHaveBeenCalledTimes(1);
      }
    );
  });

  describe("getErrorComment", () => {
    test("returns a comment string for errors that should result in a PR comment", () => {
      // Mock error with shouldResultInPRComment set to true
      const mockError = {
        message: "Test error message",
        shouldResultInPRComment: true,
        messagePrefix: "Test Error",
      }
      const result = getErrorComment(mockError);
      expect(result).toBe("Test Error: Test error message");
    });

    test("returns null for errors that should not result in a PR comment", () => {
      // Mock error with shouldResultInPRComment set to false
      const mockError = {
        message: "Test error message",
        shouldResultInPRComment: false,
        messagePrefix: "Test Error",
      }
      const result = getErrorComment(mockError);
      expect(result).toBeNull();
    });

    test("returns null for errors without a shouldResultInPRComment property", () => {
      // Mock error with a missing shouldResultInPRComment property
      const mockError = {
        message: "Test error message",
        messagePrefix: "Test Error",
      }
      const result = getErrorComment(mockError);
      expect(result).toBeNull();
    });

    test.each([
      ["", "returns null for errors with an empty message"],
      [undefined, "returns null for errors with an undefined message"],
      [123, "returns null for errors with a non-string message"],
    ])("%s", (messageValue, description) => {
      const mockError = {
        message: messageValue,
        shouldResultInPRComment: true,
        messagePrefix: "Test Error",
      };
      const result = getErrorComment(mockError);
      expect(result).toBeNull();
    });

    test.each([
      ["", "returns null for errors with an empty messagePrefix"],
      [undefined, "returns null for errors with an undefined messagePrefix"],
      [123, "returns null for errors with a non-string messagePrefix"],
    ])("%s", (messageValue, description) => {
      const mockError = {
        message: "Test error message",
        shouldResultInPRComment: true,
        messagePrefix: messageValue,
      };
      const result = getErrorComment(mockError);
      expect(result).toBeNull();
    });
  });

  describe("postPRComment", () => {
    // Mock the Octokit createComment function
    const createCommentMock = jest.fn();
    const octokitMock = {
      rest: {
        issues: {
          createComment: createCommentMock,
        },
      },
    };
    
    const error = new Error("Test Error");
    const testComment = "This is a test comment";

    beforeEach(() => {
      jest.clearAllMocks();
    })

    test("successfully posts a comment", async () => {
      // Mock response from getErrorComment function
      const getErrorComment = jest.fn().mockReturnValue(testComment);
      await postPRComment(octokitMock, owner, repo, prNumber, error, getErrorComment);

      expect(getErrorComment).toHaveBeenCalledWith(error);
      expect(getErrorComment).toHaveBeenCalledTimes(1);
      expect(createCommentMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: testComment,
      });
      expect(createCommentMock).toHaveBeenCalledTimes(1);
    });

    test("does not post a comment when getErrorComment returns null", async () => {
      // Mock null response from getErrorComment function. This will be the return value of the function if the error has been defined as not requiring a PR comment.
      const getErrorComment = jest.fn().mockReturnValue(null);
      await postPRComment(octokitMock, owner, repo, prNumber, error, getErrorComment);
      expect(getErrorComment).toHaveBeenCalledWith(error);
      expect(getErrorComment).toHaveBeenCalledTimes(1);
      expect(createCommentMock).not.toHaveBeenCalled();
    });

    test("handles errors when posting a comment", async () => {
      const getErrorComment = jest.fn().mockReturnValue(testComment);
      const errorDuringPosting = new Error("Error posting comment");
      createCommentMock.mockRejectedValueOnce(errorDuringPosting);
      const errorSpy = jest.spyOn(console, "error");

      await postPRComment(octokitMock, owner, repo, prNumber, error, getErrorComment);
      expect(getErrorComment).toHaveBeenCalledWith(error);
      expect(getErrorComment).toHaveBeenCalledTimes(1);
      expect(createCommentMock).toHaveBeenCalledWith({
        owner,
        repo,
        issue_number: prNumber,
        body: testComment,
      });
      expect(createCommentMock).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        `Error posting comment to PR #${prNumber}: ${errorDuringPosting.message}`
      );
      errorSpy.mockRestore();
    });
  });

  describe("createOrUpdateFile", () => {
    const changesetFilePath = "test/path/changesets/directory";
    const changesetFileContent = "Changeset test content";
    const changesetCommitMessage = "Changeset commit message";
    const mockGetContent = jest.fn();
    const mockCreateOrUpdateFileContents = jest.fn();

    const octokitMock = {
      rest: {
        repos: {
          getContent: mockGetContent,
          createOrUpdateFileContents: mockCreateOrUpdateFileContents,
        },
      },
    };

    beforeAll(() => {
      github.getOctokit.mockImplementation(() => octokitMock);
    });
    beforeEach(() => {
      github.getOctokit.mockClear();
    });

    test("creates a new changeset file when it does not exist", async () => {
      mockGetContent.mockRejectedValueOnce({ status: 404 });
      mockCreateOrUpdateFileContents.mockResolvedValueOnce({ status: 200 });
      await createOrUpdateFile(
        octokitMock,
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
      mockCreateOrUpdateFileContents.mockResolvedValueOnce({ status: 200 });

      await createOrUpdateFile(
        octokitMock,
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
      const error = new Error("API Failure with non-404 Error");
      error.status = 500;
      mockGetContent.mockRejectedValueOnce(error);

      await expect(
        createOrUpdateFile(
          octokitMock,
          owner,
          repo,
          changesetFilePath,
          changesetFileContent,
          changesetCommitMessage,
          branchRef
        )
      ).rejects.toThrow(GetGithubContentError);
      expect(mockGetContent).toHaveBeenCalledWith({
        owner,
        repo,
        path: changesetFilePath,
        ref: branchRef,
      });
      expect(mockGetContent).toHaveBeenCalledTimes(1);
      expect(mockCreateOrUpdateFileContents).not.toHaveBeenCalled();
    });

    test("throws CreateChangesetFileError when creating a new file fails", async () => {
      mockGetContent.mockRejectedValueOnce({ status: 404 });
      mockCreateOrUpdateFileContents.mockRejectedValueOnce(apiError);

      await expect(
        createOrUpdateFile(
          octokitMock,
          owner,
          repo,
          changesetFilePath,
          changesetFileContent,
          changesetCommitMessage,
          branchRef
        )
      ).rejects.toThrow(CreateChangesetFileError);
    });

    test("throws UpdateChangesetFileError when updating an existing file fails", async () => {
      const sha = "existing-file-sha";
      mockGetContent.mockResolvedValueOnce({ data: { sha } });
      const updateError = new Error("Update failed");
      mockCreateOrUpdateFileContents.mockRejectedValueOnce(updateError);

      await expect(
        createOrUpdateFile(
          octokitMock,
          owner,
          repo,
          changesetFilePath,
          changesetFileContent,
          changesetCommitMessage,
          branchRef
        )
      ).rejects.toThrow(UpdateChangesetFileError);
    });
  });
});
