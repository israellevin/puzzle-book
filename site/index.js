// Puzzle book display.
import * as book from './book.js';
import * as sheet from './sheet.js';

const FULL_SCREEN = ['fixed', 'left-0', 'top-0', 'w-full', 'h-full', 'bg-white', 'p-4', 'z-100'];
const CONTAINER_TYPES = {
    root: [null, FULL_SCREEN],
    chapter: ['root', ['p-4', 'bg-gray-100', 'text-center']],
    chapterPreface: ['chapter', ['p-1', 'bg-gray-200', 'text-right']],
    aside: ['chapter', ['fixed', 'left-0', 'top-0', 'w-1/4', 'p-1', 'bg-pink-200']]

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
        containerId: 'chapterPreface'
    },
    asideTitle: {
        tagName: 'h3',
        classes: ['text-2xl'],
        containerId: 'aside'
    },
    aside: {
        tagName: 'p',
        containerId: 'aside'
    }
};

const puzzleBook = book.get(CONTAINER_TYPES, SECTION_TYPES);
const page = (window.location.hash || '#1').slice(1);
sheet.get().then((rows) => {
    puzzleBook.start(rows, page);
}).catch(console.error);
