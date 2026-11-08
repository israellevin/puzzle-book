// Display the puzzle book.
import * as book from './book.js';
import * as sheet from './sheet.js';

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

const CHIP_LABELS = {
    quote: 'ציטוט',
    aside: 'אגב-אורחא',
    solution: 'חידונת'
};

// How far past the end of the text a pull has to travel before the page turns.
const PULL_FORWARD = 90;
const PULL_BACK = 140;

// How long a page ignores paging in the direction it just turned.
const FREEZE = 400;

const NARROW = '(max-width: 80rem)';

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

const state = {
    title: '',
    pages: [],
    book: undefined,
    expanded: new Set(),
    itemElement: new Map(),
    notes: []
};

const root = make('div', '_book');
const header = make('header', '_header');
const headerStart = make('div', '_headerSide _headerStart');
const headerEnd = make('div', '_headerSide _headerEnd');
const bookTitle = make('span', '_bookTitle');
const chapterButton = make('button', '_selector _chapterSelector');
const pageButton = make('button', '_selector _pageSelector');
const backButton = make('button', '_pager _pagerBack', '‹');
const forwardButton = make('button', '_pager _pagerForward', '›');
const search = make('input', '_search');
const chapterList = make('div', '_dropdown');
const pageList = make('div', '_dropdown');
const stage = make('div', '_stage');
const main = make('div', '_main');
const pageBody = make('div', '_page');
const shadeBack = make('div', '_shade _shadeBack');
const shadeForward = make('div', '_shade _shadeForward');
const modal = make('dialog', '_modal');
const modalBody = make('div', '_modalBody');

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

// --- text, clues and footnotes -------------------------------------------

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

const renderParagraph = (paragraph, tagName='p') => {
    const element = make(tagName, '_paragraph');
    if(paragraph.footnote) {
        fillText(element, paragraph.text, footnoteMark(paragraph));
    } else {
        element.textContent = paragraph.text;
    }
    return element;
};

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
    const paragraphs = item.paragraphs.map((paragraph, index) => (
        renderParagraph(paragraph, index === 0 && HEADING_TAGS[item.type] ? HEADING_TAGS[item.type] : 'p')
    ));
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
    button.animate([{opacity: 1}, {opacity: 0}], {duration: 400, easing: 'ease'})
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
        body.append(renderParagraph(paragraph));
    }
    button.addEventListener('click', () => expand(entry, item));
    entry.append(button, body);
    return entry;
};

const renderFootnotes = () => {
    const current = page();
    pageBody.querySelector('._footnotes')?.remove();
    if(!current.footnotes.length) {
        return;
    }
    const list = make('div', '_footnotes');
    current.footnotes.forEach(({item, footnote}, index) => {
        const entry = make('p', '_footnote');
        const number = index + 1;
        entry.id = `fn-${number}`;
        entry.append(make('span', '_footnoteNumber', `${number}. `));
        entry.append(make('span', '_footnoteText', footnote));
        if(isCollapsed(item)) {
            entry.classList.add('_redacted');
        } else {
            const back = make('a', '_footnoteBack', '↩');
            back.href = `#fnref-${number}`;
            entry.append(back);
        }
        list.append(entry);
    });
    pageBody.append(list);
};

// --- margins as sidenotes -------------------------------------------------

const marginEntries = (margins) => {
    const entries = [];
    for(const {item, anchor} of margins) {
        const last = entries[entries.length - 1];
        if(item.type === 'quote') {
            entries.push({kind: 'quote', quote: item, anchor});
        } else if(last && last.kind === 'aside' && last.anchor === anchor) {
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
                anchor,
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

const renderNoteBody = (entry) => {
    const body = make('div', '_noteBody');
    if(entry.kind === 'quote') {
        body.append(make('blockquote', '_quote', entry.quote.paragraphs.map((paragraph) => paragraph.text).join(' ')));
        if(entry.quote.source) {
            body.append(make('cite', '_source', entry.quote.source));
        }
        return body;
    }
    if(entry.title) {
        body.append(make('h3', '_asideTitle', entry.title.paragraphs[0].text));
    }
    for(const item of entry.bodies) {
        for(const paragraph of item.paragraphs) {
            body.append(make('p', '_asideBody', paragraph.text));
        }
    }
    if(entry.solution) {
        body.append(renderAsideSolution(entry.solution));
    }
    return body;
};

const openNote = (body) => {
    state.openBody = body;
    state.openParent = body.parentElement;
    modalBody.append(body);
    modal.showModal();
};

// Let the slip slide away before the dialog actually closes.
const closeNote = () => {
    if(!modal.open || modal.classList.contains('_closing')) {
        return;
    }
    modal.classList.add('_closing');
    window.setTimeout(() => {
        if(modal.open) {
            modal.classList.remove('_closing');
            modal.close();
        }
    }, 340);
};

const renderNotes = () => {
    const entries = marginEntries(page().margins);
    entries.forEach((entry, index) => {
        const side = index % 2 === 0 ? 'Right' : 'Left';
        const element = make('aside', `_note _note-${entry.kind} _note${side}`);
        const body = renderNoteBody(entry);
        const chip = make('button', '_chip', entry.solution ? CHIP_LABELS.solution : CHIP_LABELS[entry.kind]);
        chip.type = 'button';
        chip.addEventListener('click', () => openNote(body));
        element.append(chip, body);
        const anchor = anchorElement(entry.anchor);
        if(anchor) {
            anchor.after(element);
        } else {
            pageBody.append(element);
        }
        state.notes.push({element, anchor: entry.anchor, side});
    });
};

const anchorElement = (anchorIndex) => {
    const items = page().items;
    for(let index = anchorIndex; index < items.length; index++) {
        const element = state.itemElement.get(items[index]);
        if(element) {
            return element;
        }
    }
    const rendered = [...state.itemElement.values()];
    return rendered[rendered.length - 1];
};

const layoutNotes = () => {
    if(window.matchMedia(NARROW).matches) {
        return;
    }
    const bottoms = new Map();
    for(const note of state.notes) {
        const anchor = anchorElement(note.anchor);
        const top = anchor ? anchor.offsetTop : 0;
        const previous = bottoms.get(note.side);
        const y = previous === undefined ? top : Math.max(top, previous + 16);
        note.element.style.top = `${y}px`;
        bottoms.set(note.side, y + note.element.offsetHeight);
    }
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
    pageBody.replaceChildren();
    state.itemElement = new Map();
    state.notes = [];

    if(current.errors.length) {
        pageBody.append(renderErrors(current.errors));
    }
    for(const item of current.items) {
        if(item.type === 'chapterName' || CLUE_LABELS[item.type]) {
            continue;
        }
        const elements = renderItem(item);
        state.itemElement.set(item, elements[0]);
        pageBody.append(...elements);
    }
    const clues = current.items.filter((item) => CLUE_LABELS[item.type]);
    if(clues.length) {
        const wrapper = make('div', '_clues');
        for(const item of clues) {
            wrapper.append(renderClue(item));
        }
        pageBody.append(wrapper);
    }
    renderNotes();
    renderFootnotes();
    layoutNotes();
};

// --- header ---------------------------------------------------------------

const closeLists = () => {
    chapterList.hidden = true;
    pageList.hidden = true;
};

const openList = (list, items, selected) => {
    list.replaceChildren();
    for(const item of items) {
        const link = make('a', '_dropdownItem', item.label);
        link.href = `#${item.page + 1}@1`;
        if(item.page === selected) {
            link.classList.add('_selected');
        }
        link.addEventListener('click', closeLists);
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

const hasNext = () => state.book.page + 1 < state.pages.length;

const hasPrevious = () => state.book.page > 0;

const atBottom = () => main.scrollHeight - main.clientHeight - main.scrollTop <= 2;

const atTop = () => main.scrollTop <= 2;

let frozenUntil = 0;
let freezeDirection = 0;
let touchStart;

const frozen = (forward) => (
    performance.now() < frozenUntil && freezeDirection === (forward ? 1 : -1)
);

const freeze = (forward) => {
    frozenUntil = performance.now() + FREEZE;
    freezeDirection = forward ? 1 : -1;
    resetPull();
};

const writeHash = () => {
    history.replaceState(null, '', state.book.hash());
};

const updateItemIndex = () => {
    let top = 0;
    [...state.itemElement.values()].forEach((element, index) => {
        if(element.offsetTop <= main.scrollTop + 8) {
            top = index;
        }
    });
    state.book.item = top;
};

const activateNextClue = () => {
    const button = main.querySelector('._clue:not(._expanded) ._clueButton');
    if(button && button.disabled) {
        button.disabled = false;
        button.classList.add('_active');
    }
};

const updateChrome = () => {
    if(atBottom()) {
        activateNextClue();
    }
    updateItemIndex();
};

const showPage = (edge='start') => {
    state.expanded = new Set();
    renderHeader();
    renderMain();
    main.scrollTop = edge === 'end' ? main.scrollHeight : 0;
    updateChrome();
    writeHash();
};

const goForward = () => {
    if(state.book.next()) {
        showPage('start');
        freeze(true);
    }
};

const goBack = (edge='start') => {
    if(state.book.previous()) {
        showPage(edge);
        freeze(false);
    }
};

let pull = 0;
let pullTimer;

const resetPull = () => {
    pull = 0;
    shadeForward.style.opacity = '0';
    shadeBack.style.opacity = '0';
};

const applyPull = (amount, forward) => {
    const limit = forward ? PULL_FORWARD : PULL_BACK;
    const shade = forward ? shadeForward : shadeBack;
    pull = Math.max(0, amount);
    shade.style.opacity = String(Math.min(1, pull / limit));
    window.clearTimeout(pullTimer);
    pullTimer = window.setTimeout(resetPull, 260);
    if(pull >= limit) {
        resetPull();
        if(forward) {
            goForward();
        } else {
            goBack('end');
        }
    }
};

// --- wiring ---------------------------------------------------------------

root.append(header, stage, modal);
header.append(headerStart, headerEnd, chapterList, pageList);
headerStart.append(bookTitle, chapterButton, pageButton);
headerEnd.append(backButton, forwardButton, search);
stage.append(main, shadeBack, shadeForward);
main.append(pageBody);
modal.append(modalBody);

chapterButton.type = 'button';
pageButton.type = 'button';
backButton.type = 'button';
forwardButton.type = 'button';
search.type = 'search';
search.placeholder = 'חיפש (לא פעיל)';
search.disabled = true;

chapterButton.addEventListener('click', () => {
    openList(chapterList, state.pages
        .map((candidate, index) => ({label: chapterOf(candidate), page: index}))
        .filter((entry) => state.pages[entry.page].kind === 'chapter'), state.book.page);
});
pageButton.addEventListener('click', () => {
    const chapter = page().chapter;
    openList(pageList, state.pages
        .map((candidate, index) => ({label: pageLabel(candidate), page: index}))
        .filter((entry) => state.pages[entry.page].chapter === chapter), state.book.page);
});
document.addEventListener('click', (event) => {
    if(!header.contains(event.target)) {
        closeLists();
    }
});

backButton.addEventListener('click', () => goBack('start'));
forwardButton.addEventListener('click', () => goForward());

modal.addEventListener('click', (event) => {
    if(event.target === modal) {
        closeNote();
    }
});
modal.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeNote();
});
modal.addEventListener('close', () => {
    if(state.openBody && state.openParent) {
        state.openParent.append(state.openBody);
    }
    state.openBody = undefined;
    state.openParent = undefined;
});

main.addEventListener('scroll', () => {
    updateChrome();
    writeHash();
});

main.addEventListener('wheel', (event) => {
    const forward = event.deltaY > 0;
    const backward = event.deltaY < 0;
    if(forward && atBottom() && hasNext()) {
        event.preventDefault();
        if(!frozen(true)) {
            applyPull(pull + event.deltaY, true);
        }
    } else if(backward && atTop() && hasPrevious()) {
        event.preventDefault();
        if(!frozen(false)) {
            applyPull(pull - event.deltaY, false);
        }
    } else if(pull) {
        resetPull();
    }
}, {passive: false});

main.addEventListener('touchstart', (event) => {
    touchStart = event.touches[0].clientY;
}, {passive: true});

main.addEventListener('touchmove', (event) => {
    if(touchStart === undefined) {
        return;
    }
    const distance = touchStart - event.touches[0].clientY;
    if(distance > 0 && atBottom() && hasNext()) {
        event.preventDefault();
        if(frozen(true)) {
            touchStart = event.touches[0].clientY;
        } else {
            applyPull(distance, true);
        }
    } else if(distance < 0 && atTop() && hasPrevious()) {
        event.preventDefault();
        if(frozen(false)) {
            touchStart = event.touches[0].clientY;
        } else {
            applyPull(-distance, false);
        }
    }
}, {passive: false});

const scrollBehavior = () => (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
);

document.addEventListener('keydown', (event) => {
    if(event.key === 'ArrowDown' || event.key === ' ' || event.key === 'Space') {
        event.preventDefault();
        if(atBottom()) {
            goForward();
        } else {
            main.scrollBy({top: main.clientHeight * 0.75, behavior: scrollBehavior()});
        }
    } else if(event.key === 'ArrowUp') {
        event.preventDefault();
        if(atTop()) {
            goBack('end');
        } else {
            main.scrollBy({top: -main.clientHeight * 0.75, behavior: scrollBehavior()});
        }
    } else if(event.key === 'Escape') {
        closeLists();
    }
});

window.addEventListener('hashchange', () => {
    if(/^#\d+@\d+$/.test(location.hash)) {
        state.book.moveTo(location.hash);
        showPage('start');
    }
});

window.addEventListener('resize', layoutNotes);

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
    pageBody.replaceChildren(make('div', '_errors', `טעינת הספר נכשלה: ${error.message}`));
    main.append(pageBody);
});
