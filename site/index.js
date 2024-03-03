// Puzzle book display.
import * as book from './book.js';
import * as sheet from './sheet.js';

const CONTAINER_TYPES = {
    root: {parentId: null, classes: [
        'fixed', 'left-0', 'top-0', 'w-full', 'h-full', 'p-0', 'bg-red-100',
        'flex', 'flex-col', 'items-center', 'justify-center', 'overflow-auto'
    ]},
    chapter: {parentId: 'root', classes: [
        'w-1/2', 'h-3/4', 'bg-gray-100', 'text-center'
    ]},
    current: {parentId: 'chapter', classes: [
        'p-1', 'bg-gray-200', 'text-right'
    ]},
    aside: {parentId: 'chapter', classes: [
        'fixed', 'left-0', 'top-0', 'w-1/4', 'p-1', 'bg-pink-200'
    ]}
};

const SECTION_TYPES = {
    chapterName: {
        tagName: 'h1',
        classes: ['text-4xl'],
        containerId: 'chapter',
        pauseBefore: true,
        clearBefore: true
    },
    chapterSubtitle: {
        tagName: 'h2',
        classes: ['text-3xl'],
        containerId: 'chapter'
    },
    chapterPreface: {
        tagName: 'p',
        classes: ['text-lg'],
        containerId: 'current'
    },
    puzzlePreface: {
        tagName: 'p',
        classes: ['text-lg'],
        containerId: 'current',
        pauseBefore: true,
        clearBefore: true
    },
    puzzleName: {
        tagName: 'h2',
        classes: ['text-3xl'],
        containerId: 'current',
        pauseBefore: true,
        clearBefore: true
    },
    puzzle: {
        tagName: 'p',
        containerId: 'current'
    },
    asideTitle: {
        tagName: 'h3',
        classes: ['text-2xl'],
        containerId: 'aside',
        clearBefore: true
    },
    aside: {
        tagName: 'p',
        containerId: 'aside'
    },
    quote: {
        tagName: 'blockquote',
        containerId: 'aside'
    }
};

const puzzleBook = book.get(CONTAINER_TYPES, SECTION_TYPES);
const hash = window.location.hash;
const page = hash && hash.endsWith('!') ? parseInt(hash.slice(1, -1), 10) : 1;
sheet.get().then((rows) => {
    puzzleBook.start(rows, page);
}).catch(console.error);
