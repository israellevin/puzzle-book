// Puzzle book display.
const template = document.getElementById('template');
const templates = {
    'שם פרק': template.querySelector('._chapter-name'),
    'משנה פרק': template.querySelector('._chapter-header'),
    'הקדמת פרק': template.querySelector('._chapter-intro'),
    'צידי': template.querySelector('._aside')
};
template.innerHTML = '';
let section, sectionType, chapter, chapterNumber, puzzleNumber;
for(const row of JSON.parse((await (await fetch(
    'https://docs.google.com/spreadsheets/d/1dBa9n4e4lalgaLHgemz9O6eQ3mkDIJQ_iKDmLGfdN0U/gviz/tq?tqx=out:json&tq&gid=0'
)).text()).substr(47).slice(0, -2)).table.rows) {
    sectionType = row.c[0] ? row.c[0].v : sectionType;
    chapterNumber = row.c[1] ? row.c[1].v : chapterNumber;
    puzzleNumber = row.c[2] ? row.c[2].v : puzzleNumber;
    if(sectionType === 'שם פרק') {
        chapter = template.cloneNode(true);
        chapter.id = `chapter-${chapterNumber}`;
        chapter.style.display = 'flex';
        document.body.appendChild(chapter);
    }
    if(sectionType in templates) {
        section = templates[sectionType].cloneNode(true);
        delete section.id;
        section.textContent = row.c[3].v;
        section.style.display = 'flex';
        chapter.appendChild(section);
    }
}
