// Puzzle book display.

// These are the types of sections specified in the Google Sheets document.
const ROW_HEADER_NAMES = {
    sectionType: 'סוג דבר',
    chapterNumber: 'מספר פרק',
    puzzleNumber: 'מספר חידה',
    text: 'טקסט',
    remark: 'הערת שוליים',
    source: 'מקור',
    file: 'קובץ'
};
const SECTION_TYPE_NAMES = {
    illustration: 'איור',
    box: 'בוקסה',
    bucket: 'דלי',
    boxPreface: 'הקדמת בוקסה',
    puzzlePreface: 'הקדמת חידה',
    chapterPreface: 'הקדמת פרק',
    puzzle: 'חידה',
    boxSubtitle: 'כותרת משנה בוקסה',
    asideTitle: 'כותרת צידי',
    tableSpoon: 'כף',
    teaSpoon: 'כפית',
    fork: 'מזלג',
    ladel: 'מצקת',
    chapterSubtitle: 'משנה פרק',
    asideSolution: 'פתרון לצידי',
    puzzleSolution: 'פתרון',
    aside: 'צידי',
    quote: 'ציטוט',
    trident: 'קלשון',
    boxName: 'שם בוקסה',
    puzzleName: 'שם חידה',
    chapterName: 'שם פרק'
};
const ROW_HEADER_MAP = Object.fromEntries(Object.entries(ROW_HEADER_NAMES).map(([key, value]) => [value, key]));
const SECTION_TYPE_MAP = Object.fromEntries(Object.entries(SECTION_TYPE_NAMES).map(([key, value]) => [value, key]));
const SECTION_TYPES = Object.entries(SECTION_TYPE_NAMES).reduce((types, [key]) => ({...types, [key]: key}), {});

const getGoogleSheet = async(sheetId, gid=0) => {
    const table = JSON.parse((await (await fetch(
        `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&tq&gid=${gid}`
    )).text()).substr(47).slice(0, -2)).table;
    const headersMap = table.cols.map((col) => col.label);
    const rows = [];
    for(let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
        const previousRow = rows[rowIndex - 1] || {};
        rows.push(table.rows[rowIndex].c.reduce((rowObject, cell, index) => ({
            ...rowObject, [ROW_HEADER_MAP[headersMap[index]]]: cell && (
                index === 0 ? SECTION_TYPE_MAP[cell.v] : cell.v ? cell.v : previousRow[headersMap[index]]
            )
        }), {}));
    }
    return rows;
};

class Render {
    constructor(element, sheetId, callback=() => {}) {
        getGoogleSheet(sheetId).then((rows) => {
            this.element = element;
            this.rows = rows;
            this.index = 0;
            this.currentChapter = 1;
            this.element.addEventListener('click', () => this.nextPage());
            document.addEventListener('keydown', (event) => {
                if(['ArrowRight', 'Enter', 'Space', ' '].includes(event.key)) {
                    this.nextPage();
                }
            });
            this.element.classList.remove('hidden');
            callback.call(this);
        });
    }
    chapterName() {
        const title = document.createElement('h1');
        title.textContent = `פרק ${this.row.chapterNumber}: ${this.row.text}`;
        title.classList.add('text-4xl', 'text-center');
        return {element: title, clear: true};
    }
    chapterSubtitle() {
        const subtitle = document.createElement('h2');
        subtitle.textContent = this.row.text;
        subtitle.classList.add('text-3xl', 'text-center');
        return {element: subtitle, pause: true};
    }
    nextPage() {
        while((this.row = this.rows[this.index]) !== undefined) {
            this.index++;
            if(!(this.row.sectionType in this)) {
                console.warn(`Unknown section type: ${this.row.sectionType}`);
                continue;
            }
            const {element, pause, clear} = this[this.row.sectionType]();
            if(clear) {
                this.element.innerHTML = '';
            }
            this.element.appendChild(element);
            if(pause) {
                break;
            }
        }
    }
}

new Render(document.getElementById('book'), '1dBa9n4e4lalgaLHgemz9O6eQ3mkDIJQ_iKDmLGfdN0U', function() {
    console.log(SECTION_TYPES);
    console.debug(this);
});
