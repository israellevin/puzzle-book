// Puzzle book display.
import * as book from './book.js';
import * as sheet from './sheet.js';
import * as toc from './toc.js';

const CONTAINER_TYPES = {
    root: {parentId: null},
    chapter: {parentId: 'root'},
    headers: {parentId: 'chapter'},
    chunks: {parentId: 'chapter'}
};
const LOAD_ERROR_MESSAGE = 'טעינת הספר נכשלה';

// group: rows of one chapter/puzzle/box clear the main frame when it changes.
// breakBefore/breakAfter: where a page stops. Clears and breaks are independent.
// header: render into the chapter header. side: runs of a kind share one panel.
// field: build an image from that sheet column. cite: append that column as a citation.
const SECTION_TYPES = {
    chapterName: {tagName: 'h1', group: 'chapter', header: true},
    chapterSubtitle: {tagName: 'h2', header: true},
    chapterPreface: {tagName: 'p'},
    puzzlePreface: {tagName: 'p', group: 'puzzle'},
    puzzleName: {tagName: 'h2', group: 'puzzle', breakAfter: true},
    puzzle: {tagName: 'p', group: 'puzzle'},
    puzzleSolution: {
        tagName: 'button',
        label: 'הצג פתרון',
        modal: true,
        group: 'puzzle',
        breakAfter: true
    },
    illustration: {tagName: 'figure', field: 'file', group: 'puzzle'},
    teaSpoon: {tagName: 'p', group: 'puzzle', breakBefore: true},
    tableSpoon: {tagName: 'p', group: 'puzzle', breakBefore: true},
    ladel: {tagName: 'p', group: 'puzzle', breakBefore: true},
    bucket: {tagName: 'p', group: 'puzzle', breakBefore: true},
    fork: {tagName: 'p', group: 'puzzle', breakBefore: true},
    trident: {tagName: 'p', group: 'puzzle', breakBefore: true},
    boxName: {tagName: 'h3', group: 'box', namesBox: true, breakAfter: true},
    boxSubtitle: {tagName: 'h4', group: 'box'},
    boxPreface: {tagName: 'p', group: 'box'},
    box: {tagName: 'p', group: 'box'},
    asideTitle: {tagName: 'h3', side: 'aside'},
    aside: {tagName: 'p', side: 'aside'},
    asideSolution: {tagName: 'p', side: 'aside'},
    quote: {tagName: 'blockquote', side: 'quote', cite: 'source'}
};

const puzzleBook = book.get(CONTAINER_TYPES, SECTION_TYPES);
const hash = window.location.hash;
const page = parseInt(hash.slice(1), 10) || 1;
const position = parseFloat(hash.split('@')[1]) || 0;

const addToc = (entries) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = '_toc-button';
    button.textContent = 'תוכן';
    button.addEventListener('click', () => {
        puzzleBook.openModal(toc.menu(entries, (rowIndex) => {
            puzzleBook.closeModal();
            puzzleBook.jumpTo(rowIndex);
        }));
    });
    document.body.appendChild(button);
};

sheet.get().then((rows) => {
    puzzleBook.start(rows, page, position);
    addToc(toc.entries(rows));
}).catch((error) => {
    console.error(error);
    document.body.textContent = LOAD_ERROR_MESSAGE;
});
