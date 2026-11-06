// Puzzle book display.

const KEYS_FORWARDS = ['ArrowRight', 'Enter', 'Space', ' '];
const KEYS_BACKWARDS = ['ArrowLeft'];
const SWIPE_DISTANCE = 40;
const TAP_DISTANCE = 10;
const FADE_DURATION = 180;

// Styled div container for a section.
class Container {
    constructor(parentNode, classes, append) {
        this.children = [];
        this.parentNode = parentNode;
        if(this.parentNode instanceof Container) {
            this.parentNode.children.push(this);
        }
        this.element = document.createElement('div');
        this.element.classList.add(...classes);
        append && this.appendSelf();
    }
    appendSelf() {
        if(this.parentNode !== document.body && !this.parentNode.appended) {
            this.parentNode.appendSelf();
        }
        this.parentNode.appendChild(this.element);
        this.appended = true;
    }
    removeSelf() {
        this.element.remove();
        this.appended = false;
    }
    appendChild(element) {
        return this.element.appendChild(element);
    }
    empty() {
        this.removeSelf();
        for(const child of this.children) {
            child.empty();
        }
        for(let nodeIndex = this.element.childNodes.length - 1; nodeIndex >= 0; nodeIndex--) {
            const childNode = this.element.childNodes[nodeIndex];
            if(childNode.classList && childNode.classList.contains('_container')) {
                continue;
            }
            childNode.remove();
        }
    }
}

// Styled section element. A src makes it a figure holding that image instead of text.
class Section {
    constructor(tagName, text, classes, container, src, cite, footnoteId) {
        this.element = document.createElement(tagName);
        if(src === undefined) {
            this.setMarkedText(text, footnoteId);
        } else {
            const image = document.createElement('img');
            image.src = src;
            image.alt = src;
            this.element.appendChild(image);
        }
        if(cite) {
            const citation = document.createElement('cite');
            citation.textContent = cite;
            this.element.appendChild(citation);
        }
        this.element.classList.add(...classes);
        this.container = container;
        if(!this.container.appended) {
            this.container.appendSelf();
        }
        this.container.appendChild(this.element);
    }
    // The first asterisk in the text links to the note at the bottom of the page.
    setMarkedText(text, footnoteId) {
        if(!footnoteId || !text.includes('*')) {
            this.element.textContent = text;
            return;
        }
        const [before, ...rest] = text.split('*');
        this.element.textContent = before;
        const marker = document.createElement('a');
        marker.id = `${footnoteId}ref`;
        marker.href = `#${footnoteId}`;
        marker.textContent = '*';
        const sup = document.createElement('sup');
        sup.appendChild(marker);
        this.element.append(sup, rest.join('*'));
    }
}

// Book rendering class.
class Book {
    constructor(containerTypes, sectionTypes) {
        this.containers = {};
        for(const [containerId, {parentId, classes}] of Object.entries(containerTypes)) {
            this.containers[containerId] = new Container(
                this.containers[parentId] || document.body,
                ['_container', `_${containerId}-container`, ...(classes || [])]
            );
        }
        this.sectionTypes = {};
        for(const [sectionType, sectionProperties] of Object.entries(sectionTypes)) {
            this.sectionTypes[sectionType] = {
                ...sectionProperties,
                classes: ['_section', `_${sectionType}-section`, ...(sectionProperties.classes || [])]
            };
        }
    }
    * pageGenerator() {
        let showPageTimeout;
        let row;
        while((row = this.rows[this.index]) !== undefined) {
            this.index++;
            showPageTimeout && clearTimeout(showPageTimeout);
            showPageTimeout = setTimeout(() => this.writeHash(), 1);

            if(!(row.sectionType in this.sectionTypes)) {
                console.warn(`Unknown section type: ${row.sectionType}`);
                continue;
            }
            const sectionType = this.sectionTypes[row.sectionType];
            const group = sectionType.group && this.groupOf(row, sectionType);
            // A side row goes to its panel and must not consume a pending break.
            const startsPage = !sectionType.side && ((group && group !== this.currentGroup)
                || sectionType.breakBefore || this.afterBreak);

            if(startsPage && this.currentChunk) {
                this.afterBreak = false;
                this.breakSerial++;
                yield;
            }
            if(startsPage || !this.currentChunk) {
                this.startChunk(group || this.currentGroup);
            }
            if(group) {
                this.currentGroup = group;
            }

            const container = sectionType.header ? this.currentChunk.chapter.header
                : sectionType.side ? this.sidePanel(sectionType) : this.currentChunk.element;

            const text = row.text ?? '';
            const note = String(row.remark ?? '').replace(/^\s*\*/, '').trim();
            const footnoteId = note && `fn${this.index}`;

            if(sectionType.modal) {
                this.addSolutionStep(sectionType, text, container);
            } else if(!sectionType.side) {
                new Section(
                    sectionType.tagName,
                    sectionType.label ?? text,
                    sectionType.classes,
                    container,
                    sectionType.field && row[sectionType.field],
                    sectionType.cite && row[sectionType.cite],
                    footnoteId
                );
            } else {
                new Section(
                    sectionType.tagName,
                    text,
                    sectionType.classes,
                    container,
                    undefined,
                    sectionType.cite && row[sectionType.cite]
                );
            }
            if(note) {
                this.addFootnote(note, footnoteId, text.includes('*'));
            }
            // Notes stay at the bottom of the page, however much text follows them.
            if(this.currentChunk.footnotes.appended) {
                this.currentChunk.element.appendChild(this.currentChunk.footnotes.element);
            }
            console.log('rendered', row.sectionType);

            if(sectionType.breakAfter) {
                this.afterBreak = true;
                this.breakSerial++;
                yield;
            }
        }
    }
    // Which chapter, puzzle or box a row belongs to. A change of group clears the main frame.
    groupOf(row, sectionType) {
        if(sectionType.group === 'chapter') {
            this.chapterSerial++;
            this.boxOpen = false;
            return `chapter:${this.chapterSerial}`;
        }
        if(sectionType.group === 'puzzle') {
            this.boxOpen = false;
            return `puzzle:${this.chapterSerial}:${row.puzzleNumber ?? ''}`;
        }
        if(sectionType.namesBox) {
            if(this.boxOpen && this.boxNamed && this.boxFilled) {
                this.boxSerial++;
                this.boxNamed = false;
            }
            this.boxNamed = true;
        } else if(!this.boxOpen) {
            this.boxSerial++;
            this.boxNamed = false;
        }
        this.boxOpen = true;
        this.boxFilled = true;
        return `box:${this.chapterSerial}:${this.boxSerial}`;
    }
    startChunk(group) {
        if(group && group.startsWith('chapter:')) {
            const chapter = {
                key: group,
                header: new Container(this.containers.headers, ['_chapterHead'], false),
                right: new Container(this.containers.root, ['_container', '_asideRight-container'], false),
                left: new Container(this.containers.root, ['_container', '_asideLeft-container'], false)
            };
            for(const container of [chapter.header, chapter.right, chapter.left]) {
                container.element.hidden = true;
                container.appendSelf();
            }
            this.chapters.push(chapter);
            this.currentChapter = chapter;
        }
        const element = new Container(this.containers.chunks, ['_chunk'], false);
        element.element.hidden = true;
        element.appendSelf();
        const chunk = {
            index: this.chunks.length,
            row: this.index - 1,
            group,
            chapter: this.currentChapter,
            element,
            footnotes: new Container(element, ['_footnotes-container'], false)
        };
        this.chunks.push(chunk);
        this.currentChunk = chunk;
        this.setPage(this.chunks.length - 1);
    }
    // Only one group's pages are on screen: the chapters before this one stay hidden.
    setPage(chunkIndex, edge='start') {
        const chunk = this.chunks[chunkIndex];
        for(const other of this.chunks) {
            this.setVisible(other.element, other.group === chunk.group && other.index <= chunkIndex);
        }
        for(const chapter of this.chapters) {
            this.setVisible(chapter.header, chapter === chunk.chapter);
            this.setVisible(chapter.right, chapter === chunk.chapter);
            this.setVisible(chapter.left, chapter === chunk.chapter);
        }
        this.chunkIndex = chunkIndex;
        if(edge === 'start' && chunk.index === this.firstChunkOf(chunk).index) {
            this.scroller().scrollTop = 0;
        } else {
            chunk.element.element.scrollIntoView({block: edge === 'end' ? 'end' : 'start'});
        }
        this.writeHash();
    }
    firstChunkOf(chunk) {
        return this.chunks.find((other) => other.group === chunk.group) || chunk;
    }
    setVisible(container, visible) {
        if(!container || container.element.hidden === !visible) {
            return;
        }
        container.element.hidden = !visible;
        if(visible && !this.reducedMotion()) {
            container.element.animate(
                [{opacity: 0}, {opacity: 1}],
                {duration: FADE_DURATION, easing: 'ease-out'}
            );
        }
    }
    reducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    // The reading card is the frame that scrolls.
    scroller() {
        return this.containers.chapter.element;
    }
    // Scrolls one screenful; false when already at that edge. Fractional layout leaves a
    // sub-pixel remainder, so the edge is a couple of pixels wide.
    scrollPage(direction) {
        const scroller = this.scroller();
        const before = scroller.scrollTop;
        const edge = direction > 0
            ? scroller.scrollHeight - scroller.clientHeight - before
            : before;
        if(edge <= 2) {
            return false;
        }
        scroller.scrollTop = before + Math.max(scroller.clientHeight * 0.9, 1) * direction;
        this.writeHash();
        return true;
    }
    // User paging: scroll what is left of this page before turning it.
    next() {
        if(this.scrollPage(1)) {
            return;
        }
        if(this.chunkIndex + 1 < this.chunks.length) {
            this.setPage(this.chunkIndex + 1);
            return;
        }
        this.advance();
    }
    // And in reverse: scroll back up, then reveal the previous page.
    back() {
        if(this.scrollPage(-1)) {
            return;
        }
        if(this.chunkIndex > 0) {
            this.setPage(this.chunkIndex - 1, 'end');
        }
    }
    // One page forward in the generator.
    advance() {
        return !this.pages.next().done;
    }
    // Show the chunk that holds a row: the last one that starts at or before it.
    showRow(rowIndex) {
        this.reset();
        while(this.chunks[this.chunkIndex].row < rowIndex) {
            if(!this.advance()) {
                break;
            }
        }
        if(this.chunkIndex > 0 && this.chunks[this.chunkIndex].row > rowIndex) {
            this.setPage(this.chunkIndex - 1);
        }
    }
    // Start the book over and show its first page.
    reset() {
        this.containers.root.empty();
        this.index = 0;
        this.chunks = [];
        this.chapters = [];
        this.chunkIndex = -1;
        this.currentChunk = undefined;
        this.currentChapter = undefined;
        this.currentGroup = undefined;
        this.chapterSerial = 0;
        this.boxSerial = 0;
        this.boxOpen = false;
        this.boxNamed = false;
        this.boxFilled = false;
        this.breakSerial = 0;
        this.afterBreak = false;
        this.previousSide = undefined;
        this.sideSlot = 1;
        this.pages = this.pageGenerator();
        this.advance();
    }
    // Notes gather at the bottom of the page that references them.
    addFootnote(text, id, linked) {
        const footnotes = this.currentChunk.footnotes;
        const note = document.createElement('p');
        note.className = '_footnote';
        note.id = id;
        note.textContent = `${text} `;
        if(linked) {
            const back = document.createElement('a');
            back.href = `#${id}ref`;
            back.textContent = '↩';
            note.appendChild(back);
        }
        if(!footnotes.appended) {
            footnotes.appendSelf();
        }
        footnotes.appendChild(note);
    }
    // Asides pile up within a page; one that arrives after a break replaces what is there.
    sidePanel(sectionType) {
        const chapter = this.currentChunk.chapter;
        const panels = [chapter.right, chapter.left];
        if(sectionType.side !== this.previousSide) {
            this.sideSlot = (this.sideSlot + 1) % 2;
            this.previousSide = sectionType.side;
        }
        const panel = panels[this.sideSlot];
        if(panel.filledAt !== undefined && panel.filledAt < this.breakSerial) {
            panel.empty();
        }
        panel.filledAt = this.breakSerial;
        return panel;
    }
    // Footnotes, the table of contents and solutions share one dialog.
    openModal(content) {
        this.closeModal();
        const overlay = document.createElement('div');
        overlay.className = '_modal-overlay';
        const dialog = document.createElement('div');
        dialog.className = '_modal';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        const body = document.createElement('div');
        body.className = '_modal-body';
        if(typeof content === 'string') {
            body.textContent = content;
        } else {
            body.appendChild(content);
        }
        const close = document.createElement('button');
        close.type = 'button';
        close.className = '_modal-close';
        close.textContent = '×';
        close.addEventListener('click', () => this.closeModal());
        dialog.append(close, body);
        overlay.appendChild(dialog);
        overlay.addEventListener('click', (event) => {
            event.target === overlay && this.closeModal();
        });
        document.body.appendChild(overlay);
        this.modal = overlay;
        this.modalOpen = true;
        close.focus();
    }
    closeModal() {
        this.modal && this.modal.remove();
        this.modal = undefined;
        this.modalOpen = false;
    }
    // A puzzle's solution can span several rows; it still gets one button.
    addSolutionStep(sectionType, text, container) {
        const chunk = this.currentChunk;
        if(!chunk.solution) {
            const button = new Section(sectionType.tagName, sectionType.label, sectionType.classes, container);
            chunk.solution = {texts: [], element: button.element};
            button.element.addEventListener('click', () => this.openModal(chunk.solution.texts.join('\n\n')));
        }
        chunk.solution.texts.push(text);
    }
    // Jump to the page that holds a row, e.g. from the table of contents.
    jumpTo(rowIndex) {
        this.showRow(rowIndex);
        this.scroller().scrollTop = 0;
        this.writeHash();
    }
    // The hash carries the page and how far into it we are, so a reload resumes there.
    writeHash() {
        const chunk = this.chunks[this.chunkIndex];
        if(!chunk) {
            return;
        }
        const scroller = this.scroller();
        const span = scroller.scrollHeight - scroller.clientHeight;
        const position = span > 0 ? (scroller.scrollTop / span).toFixed(3) : '0';
        history.replaceState(null, '', `#${chunk.row}@${position}`);
    }
    restore(position) {
        const scroller = this.scroller();
        scroller.scrollTop = position * (scroller.scrollHeight - scroller.clientHeight);
        this.writeHash();
    }
    turnPage(event) {
        // A link or a button inside the page (a footnote, a solution) is not a page turn.
        if(!this.pointerStart || this.modalOpen || event.target.closest('a, button')) {
            return;
        }
        const dx = event.clientX - this.pointerStart.x;
        const dy = event.clientY - this.pointerStart.y;
        if(Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
            dx > 0 ? this.next() : this.back();
        } else if(Math.abs(dx) < TAP_DISTANCE && Math.abs(dy) < TAP_DISTANCE) {
            const {left, width} = this.containers.root.element.getBoundingClientRect();
            event.clientX - left < width / 3 ? this.back() : this.next();
        }
    }
    // Footnote links move the reading frame without taking over the URL, which keeps
    // carrying the reading position.
    followLink(event) {
        const link = event.target.closest('a[href^="#"]');
        if(!link) {
            return;
        }
        event.preventDefault();
        const target = this.containers.root.element.querySelector(link.getAttribute('href'));
        target && target.scrollIntoView({block: 'nearest'});
        this.writeHash();
    }
    start(rows, pageTo=0, position=0) {
        this.rows = rows;
        this.showRow(pageTo);
        this.restore(position);
        const root = this.containers.root.element;
        root.addEventListener('pointerdown', (event) => {
            this.pointerStart = {x: event.clientX, y: event.clientY};
        });
        root.addEventListener('pointerup', (event) => this.turnPage(event));
        root.addEventListener('click', (event) => this.followLink(event));
        this.scroller().addEventListener('scroll', () => {
            clearTimeout(this.hashTimeout);
            this.hashTimeout = setTimeout(() => this.writeHash(), 100);
        });
        document.addEventListener('keydown', (event) => {
            if(this.modalOpen) {
                event.key === 'Escape' && this.closeModal();
                return;
            }
            if(KEYS_FORWARDS.includes(event.key)) {
                this.next();
            } else if(KEYS_BACKWARDS.includes(event.key)) {
                this.back();
            }
        });
    }
}

export const get = (containerTypes, sectionTypes) => new Book(containerTypes, sectionTypes);
