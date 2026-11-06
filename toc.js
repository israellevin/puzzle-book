// Table of contents: chapters with the puzzles under them.

const ENTRY_ROLES = {
    chapterName: 'chapter',
    puzzleName: 'puzzle',
    boxName: 'box'
};

export const entries = (rows) => rows
    .map((row, rowIndex) => ({row, rowIndex}))
    .filter(({row}) => row.sectionType in ENTRY_ROLES)
    .map(({row, rowIndex}) => ({
        rowIndex,
        role: ENTRY_ROLES[row.sectionType],
        text: row.text ?? ''
    }));

export const menu = (entries, pick) => {
    const menu = document.createElement('div');
    menu.className = '_toc';
    for(const entry of entries) {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = `_toc-${entry.role}`;
        item.textContent = entry.text;
        item.addEventListener('click', () => pick(entry.rowIndex));
        menu.appendChild(item);
    }
    return menu;
};
