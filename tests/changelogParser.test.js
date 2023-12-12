import {
  processLine,
  extractChangelogEntries,
  EmptyChangelogSectionError,
  InvalidChangelogHeadingError,
} from "../utils";

describe("Changelog Parser Tests", () => {
  describe("processLine", () => {
    test("handles the start of a comment block", () => {
      const state = { inComment: false };
      const line = "<!-- Start of comment";
      const expected = { state: { inComment: true }, line: null };
      expect(processLine(line, state)).toEqual(expected);
    });

    test("handles the end of a comment block", () => {
      const state = { inComment: true };
      const line = "End of comment -->";
      const expected = { state: { inComment: false }, line: null };
      expect(processLine(line, state)).toEqual(expected);
    });

    test("ignores lines within comment blocks", () => {
      const state = { inComment: true };
      const line = "This line should be ignored";
      const expected = { state: { inComment: true }, line: null };
      expect(processLine(line, state)).toEqual(expected);
    });

    test("processes changelog lines outside of comments trimming it", () => {
      const state = { inComment: false };
      const line = " a test changelog entry line ";
      const expected = {
        state: { inComment: false },
        line: "a test changelog entry line",
      };
      expect(processLine(line, state)).toEqual(expected);
    });

    test("ignores empty or whitespace-only lines", () => {
      const state = { inComment: false };
      const line = "     "; // whitespace only
      const expected = { state: { inComment: false }, line: null };
      expect(processLine(line, state)).toEqual(expected);
    });
  });

  describe("extractChangelogEntries", () => {
    const mockProcessLine = jest.fn();

    beforeEach(() => {
      mockProcessLine.mockClear();
    });
    test("should throw InvalidChangelogHeadingError if `## Changelog` header is missing", () => {
      const noChangelogPRHeader = `
        A test changelog entry line
        - Another test changelog entry line
        * Yet another test changelog entry line
        `;
      expect(() =>
        extractChangelogEntries(noChangelogPRHeader, mockProcessLine)
      ).toThrow(InvalidChangelogHeadingError);
    });

    test("should throw InvalidChangelogHeadingError if `## Changelog` header is malformed", () => {
      const malformedChangelogPRHeader = `
        ## Change log

        A test changelog entry line
        - Another test changelog entry line
        * Yet another test changelog entry line
          Once again, another test changelog entry line
        `;
      expect(() =>
        extractChangelogEntries(malformedChangelogPRHeader, mockProcessLine)
      ).toThrow(InvalidChangelogHeadingError);
    });

    test("should throw EmptyChangelogSectionError if `## Changelog` section is missing changelog entries", () => {
      const emptyChangelogSectionFollowedByAHeading = `
        ## Changelog

        ## Next Heading
        `;
      const emptyChangelogSectionFollowedByNoHeading = `
        ## Changelog
        `;
      expect(() =>
        extractChangelogEntries(
          emptyChangelogSectionFollowedByAHeading,
          mockProcessLine
        )
      ).toThrow(EmptyChangelogSectionError);
      expect(() =>
        extractChangelogEntries(
          emptyChangelogSectionFollowedByNoHeading,
          mockProcessLine
        )
      ).toThrow(EmptyChangelogSectionError);
    });

    test("should convert a valid changelog section into an array of changelog entries", () => {
      const validChangelogSection =
        "## Changelog\n" +
        "\n" +
        "A test changelog entry line\n" +
        "Another test changelog entry line\n" +
        "Yet another test changelog entry line\n" +
        "\n" +
        "## Next Heading\n";

      // Simulate processLine returns for each line
      mockProcessLine
        .mockReturnValueOnce({ state: { inComment: false }, line: null })
        .mockReturnValueOnce({ state: { inComment: false }, line: null })
        .mockReturnValueOnce({
          state: { inComment: false },
          line: "A test changelog entry line",
        })
        .mockReturnValueOnce({
          state: { inComment: false },
          line: "Another test changelog entry line",
        })
        .mockReturnValueOnce({
          state: { inComment: false },
          line: "Yet another test changelog entry line",
        })
        .mockReturnValueOnce({ state: { inComment: false }, line: null })
        .mockReturnValueOnce({ state: { inComment: false }, line: null })
        .mockReturnValueOnce({ state: { inComment: false }, line: null });

      const expectedChangelogEntryArray = [
        "A test changelog entry line",
        "Another test changelog entry line",
        "Yet another test changelog entry line",
      ];
      const actualChangelogEntryArray = extractChangelogEntries(
        validChangelogSection,
        mockProcessLine
      );
      expect(actualChangelogEntryArray).toEqual(expectedChangelogEntryArray);
    });

    test("should ignore text within a comment block in the changelog section", () => {
      const validChangelogSectionWithComment = `
        ## Changelog
        <!-- This is a comment
        feat: Adds new feature
        -->

        - fix: Fixes bug

        ## Next Heading
        `;
      const expectedChangelogEntryArray = ["- fix: Fixes bug"];
      const actualChangelogEntryArray = extractChangelogEntries(
        validChangelogSectionWithComment
      );
      expect(actualChangelogEntryArray).toEqual(expectedChangelogEntryArray);
    });
  });
});
