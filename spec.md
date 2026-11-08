# Puzzle Book

The program interactively displays a puzzle book, currently read on load from a Google Sheet.

## Items

Each row in the sheet represents an item or a part of an item that is placed in the book. Each item has a type, either explicit in the row or implicit by context:

- `asideSolution`
- `asideTitle`
- `aside`
- `boxName`
- `boxPreface`
- `boxSubtitle`
- `box`
- `bucket`
- `chapterName`
- `chapterPreface`
- `chapterSubtitle`
- `fork`
- `illustration`
- `ladel`
- `puzzleName`
- `puzzlePreface`
- `puzzleSolution`
- `puzzle`
- `quote`
- `tableSpoon`
- `teaSpoon`
- `trident`

### Item Data

Each row has the following (optionally empty) fields:

- `itemType`: when empty, the entire row is assumed to be a new paragraph in the item described by the previous row
- `chapterNumber`: when empty, assumed to be the same as the previous row
- `puzzleNumber`: when empty, assumed to be the same as the previous row
- `text`: displayed as a paragraph when non-empty
- `file`: displayed as an image when non-empty (`illustration` only, error on any other
  type)
- `source`: displayed as a source when non-empty (`quote` only, error on any other type)
- `footnote`: displayed as a numbered footnote at the bottom of the page, and an asterisk in `text` is the
  placeholder for its calculated superscript number (error when there is no `text` or no asterisk)

Note that an empty `itemType` does not always behave the same as one that is identical to the type of the previous row, as the first case adds another paragraph to the previous row, while an explicit type creates a new item, so for `quote`, `aside`, `solution`, and all the clue types, an empty `itemType` is a multi-paragraph item while an explicit repetition indicates two separate items.

For this reason, a row with an empty `itemType` should not declare a conflicting `chapterNumber`, `puzzleNumber` or `source` and conflicting values will be ignored with an error and only the first value respected.

## Breaks and Pages

The items are dynamically divided into pages according to logical breaks:

- Before each new chapter (as indicated by a new `chapterNumber`)
- Before each new puzzle (as indicated by a new `puzzleNumber`)
- Before each new box (as indicated by a new `boxName`)

This means that each page contains either a chapter preface, a puzzle, or a box.

## Placements

Each page uses the following placements to display:

### `location`

The browser's location bar, keeping the page position within the book in the fragment hash in the format `#<page number>@<item index>`. Both numbers are 1 based. The index counts every item on `main`, including un-expanded ones. Updates on page change and on scroll, honored on load.

### `header`

- Book's title, extracted from the name of the spreadsheet
- Name of the current chapter, expanding on click to a list of links to all chapters
- Name of the current puzzle, box, or "intro", expanding on click to a list of links to all pages in the current chapter
- Search box for searching within the book (not implemented yet)

The `chapterName` item appears here.

### `main`

The main page, scrollable, used to display long texts. All items not mentioned elsewhere are displayed here.

#### Clues and solutions

When showing a puzzle, the page will usually have clues (`teaSpoon`, `tableSpoon`, `ladel`, `bucket`, `fork`, `trident`) and a solution (`puzzleSolution`). These are all initially displayed only as a disabled button with a matching icon and the text hidden.

After scrolling to the bottom of the page, the button of the first clue becomes active in a nice, eye-catching animation. Once it's clicked, the button fades out and the text of the clue or solution become visible. The remaining clue/solution buttons remain at the bottom. Once that bottom is reached (or instantly, if we are already at the bottom), the next button becomes active, and so on.

A single clue/solution may be comprised of several rows inheriting the same type, all of
them shown with a single button. Rows that are each explicitly typed are separate items
and get a button each.

Every time a puzzle page is displayed, all clues/solutions are hidden anew.

#### Footnotes

Displays the page's `footnote`s at the very bottom of `main`, numbered in order of
appearance. Each superscript number links to its note, shows that note as a tooltip, and each note links back. `footnotes` of un-expanded items should be redacted (only the number showing, no active link, text visibly redacted).

### `margin`

The spaces on the sides of `main`, used to display short texts, being either a `quote` (displaying `text` along with `source`) or `aside` (grouping `asideTitle` and `asideSolution` if they exist). An `asideSolution` is shown upside down and turns right side up when clicked.

The first margin item of a page is displayed on the right, the second on the left, the third again on the right (below the first) and so on.

## Paging

Clicking or tapping on the margins of the viewport pages forward or back. What a margin shows keeps its own clicks so selecting a `quote` or pressing an `asideSolution` button does not turn the page. A shaded indicator for "next page" appears over the right margin when `main` is scrolled to the bottom (when there is a next page), and a "previous page" indicator over the left margin when it is scrolled to the top.

Hitting `space` or `right-arrow` scrolls `main` down if possible and pages forward if not. `left-arrow` scrolls back up and turns a page back.

A new page starts scrolled to the top when paging forward, and scrolled to the bottom when paging back.
