// Get the data from the Google Sheet.
const SHEET_ID = '1dBa9n4e4lalgaLHgemz9O6eQ3mkDIJQ_iKDmLGfdN0U';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}`;

const ROW_HEADER_NAMES = {
    itemType: 'סוג דבר',
    chapterNumber: 'מספר פרק',
    puzzleNumber: 'מספר חידה',
    text: 'טקסט',
    footnote: 'הערת שוליים',
    source: 'מקור',
    file: 'קובץ'
};

const ITEM_TYPE_NAMES = {
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

const ITEM_TYPE_MAP = Object.fromEntries(Object.entries(ITEM_TYPE_NAMES).map(([key, value]) => [value, key]));

// The spreadsheet's own name, taken from the title of its page.
const readTitle = (page) => {
    const match = page.match(/<title>([^<]*)<\/title>/);
    return match ? match[1].replace(/\s*-\s*Google (Sheets|Drive)\s*$/, '').trim() : '';
};

// A csv record per line, except that a quoted cell may hold commas and line breaks.
const parseCsv = (text) => {
    const records = [];
    let record = [];
    let value = '';
    let quoted = false;
    for(let index = 0; index < text.length; index++) {
        const character = text[index];
        if(quoted) {
            if(character !== '"') {
                value += character;
            } else if(text[index + 1] === '"') {
                value += '"';
                index++;
            } else {
                quoted = false;
            }
        } else if(character === '"') {
            quoted = true;
        } else if(character === ',') {
            record.push(value);
            value = '';
        } else if(character === '\n') {
            record.push(value.replace(/\r$/, ''));
            records.push(record);
            record = [];
            value = '';
        } else {
            value += character;
        }
    }
    record.push(value.replace(/\r$/, ''));
    return records.concat(record.some((cell) => cell !== '') ? [record] : []);
};

// One object per row, with the Hebrew headers mapped to the field names.
const readRows = (csv) => {
    const [header, ...records] = parseCsv(csv);
    const fields = header.map((name) => ROW_HEADER_MAP[name.trim()]);
    return records
        .map((cells, index) => ({cells, row: index + 2}))
        .filter(({cells}) => cells.some((cell) => cell.trim() !== ''))
        .map(({cells, row}) => {
            const values = {row};
            fields.forEach((field, column) => {
                const value = cells[column];
                if(field && value !== undefined && value.trim() !== '') {
                    values[field] = value;
                }
            });
            return values;
        });
};

// An explicit itemType starts an item; an empty one adds a paragraph to the item above.
const readItems = (rows) => {
    const items = [];
    const errors = [];
    const fail = (row, message) => errors.push({row, message});
    let chapterNumber;
    let puzzleNumber;

    for(const row of rows) {
        chapterNumber = row.chapterNumber ?? chapterNumber;
        puzzleNumber = row.puzzleNumber ?? puzzleNumber;
        if(!row.itemType && !items.length) {
            fail(row.row, 'a continuation row needs an item above it');
            continue;
        }

        let item = items[items.length - 1];
        if(row.itemType) {
            item = {
                type: ITEM_TYPE_MAP[row.itemType],
                chapterNumber: undefined,
                puzzleNumber: undefined,
                rows: [],
                paragraphs: [],
                source: undefined,
                files: []
            };
            items.push(item);
            if(!item.type) {
                fail(row.row, `unknown item type: ${row.itemType}`);
            }
        }
        item.rows.push(row.row);

        // Only chapterNumber, puzzleNumber and source have to agree inside an item.
        const declare = (field, value) => {
            if(value === undefined || item[field] === value) {
                return;
            }
            if(item[field] === undefined) {
                item[field] = value;
            } else {
                fail(row.row, `${field} is already set in this item; keeping the first value`);
            }
        };
        declare('chapterNumber', chapterNumber);
        declare('puzzleNumber', puzzleNumber);
        declare('source', row.source);

        if(row.text) {
            item.paragraphs.push({text: row.text, row: row.row});
        }
        if(row.file !== undefined) {
            item.files.push(row.file);
        }
        if(row.footnote !== undefined) {
            const note = String(row.footnote).replace(/^\s*\*/, '').trim();
            const paragraph = row.text ? item.paragraphs[item.paragraphs.length - 1] : undefined;
            if(note && !paragraph) {
                fail(row.row, 'a footnote needs text in its own row');
            } else if(note && !paragraph.text.includes('*')) {
                fail(row.row, 'a footnote needs an asterisk in the text of its row');
            } else if(note) {
                paragraph.footnote = note;
            }
        }
    }

    for(const item of items) {
        if(item.type === 'quote' && !item.source) {
            fail(item.rows[0], 'a quote needs a source');
        }
        if(item.type !== 'quote' && item.source !== undefined) {
            fail(item.rows[0], 'source is only allowed on a quote');
        }
        if(item.type !== 'illustration' && item.files.length) {
            fail(item.rows[0], 'file is only allowed on an illustration');
        }
    }

    return {items, errors};
};

export const get = async() => {
    // The csv export is current, while the gviz snapshot of the same sheet can lag behind.
    const [csv, page] = await Promise.all([
        fetch(`${SHEET_URL}/export?format=csv&gid=0`).then((response) => response.text()),
        fetch(`${SHEET_URL}/edit`).then((response) => response.text()).catch(() => '')
    ]);
    const {items, errors} = readItems(readRows(csv));
    return {title: readTitle(page), items, errors};
};
