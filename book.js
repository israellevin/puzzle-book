// Divide the book into pages and keep the reading position.

const CLUE_TYPES = ['teaSpoon', 'tableSpoon', 'ladel', 'bucket', 'fork', 'trident'];
const SIDE_TYPES = ['quote', 'asideTitle', 'aside', 'asideSolution'];
const CHAPTER_TYPES = ['chapterName', 'chapterSubtitle', 'chapterPreface'];
const BOX_TYPES = ['boxName', 'boxPreface', 'boxSubtitle', 'box'];
const TITLE_TYPES = ['chapterName', 'puzzleName', 'boxName'];

export const isClue = (item) => CLUE_TYPES.includes(item.type) || item.type === 'puzzleSolution';

export const isSide = (item) => SIDE_TYPES.includes(item.type);

const kindOf = (item) => (
    CHAPTER_TYPES.includes(item.type) ? 'chapter'
        : BOX_TYPES.includes(item.type) ? 'box' : 'puzzle'
);

// A page starts before a new chapter, a new puzzle, or a box title.
export const build = (items) => {
    const pages = [];
    let page;
    let chapter;

    for(const item of items) {
        if(isSide(item)) {
            page && page.margins.push(item);
            continue;
        }
        const continues = page
            && item.chapterNumber === page.chapterNumber
            && item.puzzleNumber === page.puzzleNumber
            && item.type !== 'boxName';
        if(!continues) {
            page = {
                kind: kindOf(item),
                chapterNumber: item.chapterNumber,
                puzzleNumber: item.puzzleNumber,
                items: [],
                margins: [],
                footnotes: [],
                errors: [],
                chapter
            };
            pages.push(page);
            page.number = pages.length;
            if(page.kind === 'chapter') {
                chapter = page;
                page.chapter = page;
            }
        }
        page.items.push(item);
        if(!page.title && TITLE_TYPES.includes(item.type)) {
            page.title = item;
        }
        for(const paragraph of item.paragraphs) {
            if(paragraph.footnote) {
                page.footnotes.push({item, paragraph, footnote: paragraph.footnote});
            }
        }
    }

    for(const page of pages) {
        if(!page.title) {
            page.errors.push({
                row: page.items[0].rows[0],
                message: `a ${page.kind} page needs a title`
            });
        }
    }

    return pages;
};

// Attach each sheet error to the page of the item it belongs to.
export const attachErrors = (pages, items, errors) => {
    for(const error of errors) {
        const item = items.find((candidate) => candidate.rows.includes(error.row));
        const page = item && pages.find((candidate) => candidate.items.includes(item));
        (page || pages[pages.length - 1]).errors.push(error);
    }
};

// Reading position: which page, and which item of it is on top. Both 1 based in the hash.
export class Book {
    constructor(pages) {
        this.pages = pages;
        this.page = 0;
        this.item = 0;
    }
    current() {
        return this.pages[this.page];
    }
    next() {
        if(this.page + 1 < this.pages.length) {
            this.page++;
            this.item = 0;
            return true;
        }
        return false;
    }
    previous() {
        if(this.page > 0) {
            this.page--;
            this.item = 0;
            return true;
        }
        return false;
    }
    hash() {
        return `#${this.page + 1}@${this.item + 1}`;
    }
    moveTo(hash) {
        const match = (hash || '').match(/^#(\d+)@(\d+)$/);
        if(!match) {
            return;
        }
        this.page = Math.min(Math.max(Number(match[1]) - 1, 0), this.pages.length - 1);
        const count = this.pages[this.page].items.length;
        this.item = Math.min(Math.max(Number(match[2]) - 1, 0), Math.max(count - 1, 0));
    }
}
