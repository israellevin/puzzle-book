// Get the data from the Google Sheet.
const SHEET_ID = '1dBa9n4e4lalgaLHgemz9O6eQ3mkDIJQ_iKDmLGfdN0U';

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

export const get = async() => {
    const text = await (await fetch(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&tq&gid=0`
    )).text();
    const table = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)).table;
    const headersMap = table.cols.map((col) => col.label);
    const rows = [];
    for(let rowIndex = 0; rowIndex < table.rows.length; rowIndex++) {
        const previousRow = rows[rowIndex - 1] || {};
        const sectionType = (
            table.rows[rowIndex].c[0] && SECTION_TYPE_MAP[table.rows[rowIndex].c[0].v] || previousRow.sectionType
        );
        delete table.rows[rowIndex].c[0];
        rows.push(table.rows[rowIndex].c.reduce((rowObject, cell, index) => {
            const key = ROW_HEADER_MAP[headersMap[index]];
            return {...rowObject, [key]: cell?.v ?? previousRow[key]};
        }, {sectionType}));
    }
    return rows;
};
