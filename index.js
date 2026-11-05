// Puzzle book display.
import * as book from './book.js';
import * as sheet from './sheet.js';

const CONTAINER_TYPES = {
    root: {parentId: null},
    chapter: {parentId: 'root'},
    current: {parentId: 'chapter'},
    asideRight: {parentId: 'chapter'},
    asideLeft: {parentId: 'chapter'}
};
const LOAD_ERROR_MESSAGE = 'טעינת הספר נכשלה';

// group: a row column whose change starts a fresh page in the container.
// side: runs of the same kind share one panel; a change of kind uses the other panel.
// field: build an image from that sheet column instead of rendering text.
const SECTION_TYPES = {
    chapterName: {tagName: 'h1', containerId: 'chapter', group: 'chapterNumber', pauseBefore: true},
    chapterSubtitle: {tagName: 'h2', containerId: 'chapter', group: 'chapterNumber'},
    chapterPreface: {tagName: 'p', containerId: 'current', group: 'chapterNumber'},
    puzzlePreface: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    puzzleName: {tagName: 'h2', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    puzzle: {tagName: 'p', containerId: 'current', group: 'puzzleNumber'},
    puzzleSolution: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    illustration: {tagName: 'figure', field: 'file', containerId: 'current', group: 'puzzleNumber'},
    teaSpoon: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    tableSpoon: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    ladel: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    bucket: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    fork: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    trident: {tagName: 'p', containerId: 'current', group: 'puzzleNumber', pauseBefore: true},
    boxName: {tagName: 'h3', containerId: 'current'},
    boxSubtitle: {tagName: 'h4', containerId: 'current'},
    boxPreface: {tagName: 'p', containerId: 'current'},
    box: {tagName: 'p', containerId: 'current'},
    asideTitle: {tagName: 'h3', side: 'aside'},
    aside: {tagName: 'p', side: 'aside'},
    asideSolution: {tagName: 'p', side: 'aside'},
    quote: {tagName: 'blockquote', side: 'quote'}
};

const puzzleBook = book.get(CONTAINER_TYPES, SECTION_TYPES);
const hash = window.location.hash;
const page = parseInt(hash.slice(1), 10) || 1;
sheet.get().then((rows) => {
    puzzleBook.start(rows, page);
}).catch((error) => {
    console.error(error);
    document.body.textContent = LOAD_ERROR_MESSAGE;
});
