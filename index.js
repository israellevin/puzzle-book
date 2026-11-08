// Display the puzzle book.
import * as book from './book.js';
import * as sheet from './sheet.js';

// The margin arrangement, see index.css: '_layout-sides', '_layout-below' or '_layout-overlay'.
const LAYOUT = '_layout-sides';

const CLUE_LABELS = {
    teaSpoon: 'כפית',
    tableSpoon: 'כף',
    ladel: 'מצקת',
    bucket: 'דלי',
    fork: 'מזלג',
    trident: 'קלשון',
    puzzleSolution: 'פתרון'
};

const HEADING_TAGS = {
    puzzleName: 'h2',
    boxName: 'h3',
    chapterSubtitle: 'h2'
};

const make = (tagName, className, text) => {
    const element = document.createElement(tagName);
    if(className) {
        element.className = className;
    }
    if(text !== undefined) {
        element.textContent = text;
    }
    return element;
};

const LAYOUTS = ['_layout-sides', '_layout-below', '_layout-overlay'];

const state = {
    title: '',
    pages: [],
    book: undefined,
    expanded: new Set()
};

const root = make('div', `_book ${LAYOUT}`);
const header = make('header', '_header');
const bookTitle = make('span', '_bookTitle');
const chapterButton = make('button', '_selector _chapterSelector');
const pageButton = make('button', '_selector _pageSelector');
const search = make('input', '_search');
// Temporary: cycles the margin arrangement so all three can be tried in the browser.
const layoutButton = make('button', '_selector _layoutSelector');
const chapterList = make('div', '_dropdown');
const pageList = make('div', '_dropdown');
const main = make('div', '_main');
const marginRight = make('aside', '_margin _marginRight');
const marginLeft = make('aside', '_margin _marginLeft');

const page = () => state.book.current();

const chapterOf = (current) => current.chapter && current.chapter.title
    ? current.chapter.title.paragraphs[0].text
    : '';

const pageLabel = (current) => {
    if(current.kind === 'chapter') {
        return 'הקדמה';
    }
    return current.title ? current.title.paragraphs[0].text : '';
};

// --- feet, clues and footnotes -------------------------------------------

const footnoteMark = (paragraph) => {
    const number = footnoteNumber(paragraph);
    const marker = make('sup', '_footnoteMark');
    const link = make('a', undefined, String(number));
    link.href = `#fn-${number}`;
    link.id = `fnref-${number}`;
    link.title = paragraph.footnote;
    marker.append(link);
    return marker;
};

const fillText = (element, text, marker) => {
    if(!marker || !text.includes('*')) {
        element.textContent = text;
        return;
    }
    const [before, ...rest] = text.split('*');
    element.textContent = before;
    element.append(marker, rest.join('*'));
};

const isCollapsed = (item) => Boolean(CLUE_LABELS[item.type]) && !state.expanded.has(item);

const footnoteNumber = (paragraph) => page().footnotes.findIndex((entry) => entry.paragraph === paragraph) + 1;

const renderFile = (file) => {
    const figure = make('figure', '_illustration');
    if(file) {
        const image = make('img');
        image.src = file;
        image.alt = file;
        figure.append(image);
    } else {
        figure.append(make('span', '_illustrationMissing', 'חסר איור'));
    }
    return figure;
};

const renderItem = (item) => {
    const paragraphs = item.paragraphs.map((paragraph, index) => {
        const tagName = index === 0 && HEADING_TAGS[item.type] ? HEADING_TAGS[item.type] : 'p';
        const element = make(tagName, '_paragraph');
        if(paragraph.footnote) {
            fillText(element, paragraph.text, footnoteMark(paragraph));
        } else {
            element.textContent = paragraph.text;
        }
        return element;
    });
    if(item.type === 'illustration') {
        return [...(item.files.length ? item.files : [undefined]).map(renderFile), ...paragraphs];
    }
    return paragraphs;
};

const expand = (entry, item) => {
    const button = entry.querySelector('._clueButton');
    entry.classList.add('_expanded');
    entry.querySelector('._clueBody').hidden = false;
    state.expanded.add(item);
    button.animate([{opacity: 1}, {opacity: 0}], {duration: 250, easing: 'ease'})
        .finished.then(() => {
            button.hidden = true;
            updateChrome();
        })
        .catch(() => {});
    renderFootnotes();
    updateChrome();
};

const renderClue = (item) => {
    const entry = make('div', `_clue _clue-${item.type}`);
    const button = make('button', '_clueButton');
    const label = CLUE_LABELS[item.type];
    button.type = 'button';
    button.disabled = true;
    button.setAttribute('aria-label', label);
    button.append(make('span', `_clueIcon _icon-${item.type}`), make('span', '_clueLabel', label));
    const body = make('div', '_clueBody');
    body.hidden = true;
    for(const paragraph of item.paragraphs) {
        const element = make('p', '_paragraph');
        if(paragraph.footnote) {
            fillText(element, paragraph.text, footnoteMark(paragraph));
        } else {
            element.textContent = paragraph.text;
        }
        body.append(element);
    }
    button.addEventListener('click', () => expand(entry, item));
    entry.append(button, body);
    return entry;
};

const renderFootnotes = () => {
    const current = page();
    main.querySelector('._footnotes')?.remove();
    if(!current.footnotes.length) {
        return;
    }
    const list = make('div', '_footnotes');
    current.footnotes.forEach(({item, footnote}, index) => {
        const entry = make('p', '_footnote');
        const number = index + 1;
        entry.id = `fn-${number}`;
        entry.append(make('span', '_footnoteNumber', `${number}. `));
        const text = make('span', '_footnoteText', footnote);
        entry.append(text);
        if(isCollapsed(item)) {
            entry.classList.add('_redacted');
        } else {
            const back = make('a', '_footnoteBack', '↩');
            back.href = `#fnref-${number}`;
            entry.append(back);
        }
        list.append(entry);
    });
    main.append(list);
};

// --- margins --------------------------------------------------------------

const marginEntries = (items) => {
    const entries = [];
    for(const item of items) {
        const last = entries[entries.length - 1];
        if(item.type === 'quote') {
            entries.push({kind: 'quote', quote: item});
        } else if(last && last.kind === 'aside') {
            if(item.type === 'asideTitle') {
                last.title = item;
            } else if(item.type === 'asideSolution') {
                last.solution = item;
            } else {
                last.bodies.push(item);
            }
        } else {
            entries.push({
                kind: 'aside',
                title: item.type === 'asideTitle' ? item : undefined,
                bodies: item.type === 'aside' ? [item] : [],
                solution: item.type === 'asideSolution' ? item : undefined
            });
        }
    }
    return entries;
};

// An aside solution shows its text upside down and turns right side up when clicked.
const renderAsideSolution = (item) => {
    const element = make('p', '_asideSolution', item.paragraphs.map((paragraph) => paragraph.text).join(' '));
    element.addEventListener('click', () => element.classList.add('_turned'), {once: true});
    return element;
};

const renderMarginEntry = (entry) => {
    const element = make('div', `_marginItem _margin-${entry.kind}`);
    if(entry.kind === 'quote') {
        const text = make('blockquote', '_quote');
        text.textContent = entry.quote.paragraphs.map((paragraph) => paragraph.text).join(' ');
        element.append(text);
        if(entry.quote.source) {
            element.append(make('cite', '_source', entry.quote.source));
        }
        return element;
    }
    if(entry.title) {
        element.append(make('h3', '_asideTitle', entry.title.paragraphs[0].text));
    }
    for(const body of entry.bodies) {
        for(const paragraph of body.paragraphs) {
            element.append(make('p', '_asideBody', paragraph.text));
        }
    }
    if(entry.solution) {
        element.append(renderAsideSolution(entry.solution));
    }
    return element;
};

const renderMargins = () => {
    marginRight.replaceChildren();
    marginLeft.replaceChildren();
    const entries = marginEntries(page().margins);
    entries.forEach((entry, index) => {
        const side = index % 2 === 0 ? marginRight : marginLeft;
        side.append(renderMarginEntry(entry));
    });
};

// --- main -----------------------------------------------------------------

const renderErrors = (errors) => {
    const banner = make('div', '_errors');
    banner.append(make('strong', '_errorsTitle', 'שגיאות בקובץ הנתונים'));
    for(const error of errors) {
        banner.append(make('p', '_error', `שורה ${error.row}: ${error.message}`));
    }
    return banner;
};

const renderMain = () => {
    const current = page();
    main.replaceChildren();
    if(current.errors.length) {
        main.append(renderErrors(current.errors));
    }
    for(const item of current.items) {
        if(item.type === 'chapterName' || CLUE_LABELS[item.type]) {
            continue;
        }
        main.append(...renderItem(item));
    }
    const clues = current.items.filter((item) => CLUE_LABELS[item.type]);
    if(clues.length) {
        const wrapper = make('div', '_clues');
        for(const item of clues) {
            wrapper.append(renderClue(item));
        }
        main.append(wrapper);
    }
    renderFootnotes();
};

// --- header ---------------------------------------------------------------

const closeLists = () => {
    chapterList.hidden = true;
    pageList.hidden = true;
};

const openList = (list, items, selected, pick) => {
    list.replaceChildren();
    for(const item of items) {
        const link = make('button', '_dropdownItem');
        link.type = 'button';
        link.textContent = item.label;
        if(item.page === selected) {
            link.classList.add('_selected');
        }
        link.addEventListener('click', () => {
            closeLists();
            pick(item.page);
        });
        list.append(link);
    }
    closeLists();
    list.hidden = false;
};

const renderHeader = () => {
    const current = page();
    bookTitle.textContent = state.title;
    chapterButton.textContent = chapterOf(current);
    pageButton.textContent = pageLabel(current);
};

// --- paging ---------------------------------------------------------------

const scrollPosition = (edge) => {
    main.scrollTop = edge === 'end' ? main.scrollHeight : 0;
};

const showPage = (edge='start') => {
    state.expanded = new Set();
    renderHeader();
    renderMain();
    renderMargins();
    scrollPosition(edge);
    updateChrome();
    writeHash();
};

const goForward = () => {
    if(state.book.next()) {
        showPage('start');
    }
};

const goBack = () => {
    if(state.book.previous()) {
        showPage('end');
    }
};

const goToPage = (index) => {
    state.book.page = index;
    state.book.item = 0;
    showPage('start');
};

const hasNext = () => state.book.page + 1 < state.pages.length;

const hasPrevious = () => state.book.page > 0;

const atBottom = () => main.scrollHeight - main.clientHeight - main.scrollTop <= 2;

const atTop = () => main.scrollTop <= 2;

const activateNextClue = () => {
    const button = main.querySelector('._clue:not(._expanded) ._clueButton');
    if(button && button.disabled) {
        button.disabled = false;
        button.classList.add('_active');
    }
};

const updateItemIndex = () => {
    const items = [...main.children].filter((element) => element.dataset.item !== undefined);
    let top = 0;
    items.forEach((element, index) => {
        if(element.offsetTop <= main.scrollTop + 8) {
            top = index;
        }
    });
    state.book.item = top;
};

const writeHash = () => {
    history.replaceState(null, '', state.book.hash());
};

const updateChrome = () => {
    marginRight.classList.toggle('_shown', atBottom() && hasNext());
    marginLeft.classList.toggle('_shown', atTop() && hasPrevious());
    if(atBottom()) {
        activateNextClue();
    }
    updateItemIndex();
};

// --- wiring ---------------------------------------------------------------

root.append(header, main, marginLeft, marginRight);
header.append(bookTitle, chapterButton, pageButton, search, layoutButton, chapterList, pageList);
search.type = 'search';
search.placeholder = 'חיפש (לא פעיל)';
search.disabled = true;

let layout = LAYOUT;
layoutButton.type = 'button';
layoutButton.textContent = layout.replace('_layout-', '');
layoutButton.addEventListener('click', () => {
    layout = LAYOUTS[(LAYOUTS.indexOf(layout) + 1) % LAYOUTS.length];
    root.className = `_book ${layout}`;
    layoutButton.textContent = layout.replace('_layout-', '');
    updateChrome();
});

chapterButton.type = 'button';
pageButton.type = 'button';
chapterButton.addEventListener('click', () => {
    openList(chapterList, state.pages
        .map((candidate, index) => ({label: chapterOf(candidate), page: index}))
        .filter((entry) => state.pages[entry.page].kind === 'chapter'), state.book.page, goToPage);
});
pageButton.addEventListener('click', () => {
    const chapter = page().chapter;
    openList(pageList, state.pages
        .map((candidate, index) => ({label: pageLabel(candidate), page: index}))
        .filter((entry) => state.pages[entry.page].chapter === chapter), state.book.page, goToPage);
});
document.addEventListener('click', (event) => {
    if(!header.contains(event.target)) {
        closeLists();
    }
});

// Content in a margin keeps its own clicks, so text can be selected and buttons pressed.
const marginTurn = (turn) => (event) => {
    if(!event.target.closest('._marginItem')) {
        turn();
    }
};
marginRight.addEventListener('click', marginTurn(goForward));
marginLeft.addEventListener('click', marginTurn(goBack));

main.addEventListener('scroll', () => {
    updateChrome();
    writeHash();
});

document.addEventListener('keydown', (event) => {
    if(event.key === 'ArrowRight' || event.key === ' ' || event.key === 'Space' || event.key === 'Enter') {
        event.preventDefault();
        if(atBottom()) {
            goForward();
        } else {
            main.scrollTop += main.clientHeight * 0.9;
        }
    } else if(event.key === 'ArrowLeft') {
        event.preventDefault();
        if(atTop()) {
            goBack();
        } else {
            main.scrollTop -= main.clientHeight * 0.9;
        }
    } else if(event.key === 'Escape') {
        closeLists();
    }
});

document.body.append(root);

sheet.get().then(({title, items, errors}) => {
    state.title = title;
    state.pages = book.build(items);
    book.attachErrors(state.pages, items, errors);
    state.book = new book.Book(state.pages);
    state.book.moveTo(window.location.hash);
    showPage('start');
}).catch((error) => {
    console.error(error);
    main.replaceChildren(make('div', '_errors', `טעינת הספר נכשלה: ${error.message}`));
});
