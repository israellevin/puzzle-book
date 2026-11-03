// Puzzle book display.
import * as book from './book.js';
import * as sheet from './sheet.js';

const CONTAINER_TYPES = {
    root: {parentId: null},
    chapter: {parentId: 'root'},
    current: {parentId: 'chapter'},
    aside: {parentId: 'chapter'}
};

const SECTION_TYPES = {
    chapterName: {tagName: 'h1', containerId: 'chapter', pauseBefore: true, clearBefore: true},
    chapterSubtitle: {tagName: 'h2', containerId: 'chapter'},
    chapterPreface: {tagName: 'p', containerId: 'current'},
    puzzlePreface: {tagName: 'p', containerId: 'current', pauseBefore: true, clearBefore: true},
    puzzleName: {tagName: 'h2', containerId: 'current', pauseBefore: true, clearBefore: true},
    puzzle: {tagName: 'p', containerId: 'current'},
    asideTitle: {tagName: 'h3', containerId: 'aside', clearBefore: true},
    aside: {tagName: 'p', containerId: 'aside'},
    quote: {tagName: 'blockquote', containerId: 'aside'}
};

const puzzleBook = book.get(CONTAINER_TYPES, SECTION_TYPES);
const hash = window.location.hash;
const page = hash && hash.endsWith('!') ? parseInt(hash.slice(1, -1), 10) : 1;
sheet.get().then((rows) => {
    puzzleBook.start(rows, page);
}).catch(console.error);
