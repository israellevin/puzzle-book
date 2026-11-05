// Puzzle book display.

const KEYS_FORWARDS = ['ArrowRight', 'Enter', 'Space', ' '];
const KEYS_BACKWARDS = ['ArrowLeft'];
const SWIPE_DISTANCE = 40;
const TAP_DISTANCE = 10;

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
    constructor(tagName, text, classes, container, src) {
        this.element = document.createElement(tagName);
        if(src === undefined) {
            this.element.textContent = text;
        } else {
            const image = document.createElement('img');
            image.src = src;
            image.alt = src;
            this.element.appendChild(image);
        }
        this.element.classList.add(...classes);
        this.container = container;
        if(!this.container.appended) {
            this.container.appendSelf();
        }
        this.container.appendChild(this.element);
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
                container: this.containers[sectionProperties.containerId],
                classes: ['_section', `_${sectionType}-section`, ...(sectionProperties.classes || [])]
            };
        }
        // Side sections alternate between these, right first.
        this.panels = [this.containers.asideRight, this.containers.asideLeft];
    }
    * pageGenerator() {
        let showPageTimeout;
        let row;
        while((row = this.rows[this.index]) !== undefined) {
            this.index++;
            showPageTimeout && clearTimeout(showPageTimeout);
            showPageTimeout = setTimeout(() => window.location.hash = `#${this.index}`, 1);

            if(!(row.sectionType in this.sectionTypes)) {
                console.warn(`Unknown section type: ${row.sectionType}`);
                continue;
            }
            const sectionType = this.sectionTypes[row.sectionType];

            if(this.index > 1 && sectionType.pauseBefore) {
                yield;
            }

            const container = sectionType.side ? this.sidePanel(sectionType) : sectionType.container;
            if(sectionType.group && (row[sectionType.group] ?? '') !== this.group) {
                this.group = row[sectionType.group] ?? '';
                container.empty();
            }
            this.previousSide = sectionType.side;

            new Section(
                sectionType.tagName,
                row.text ?? '',
                sectionType.classes,
                container,
                sectionType.field && row[sectionType.field]
            );
            console.log('rendered', row.sectionType);

            if(sectionType.pauseAfter) {
                yield;
            }
        }
    }
    next() {
        const advanced = !this.pages.next().done;
        if(advanced) {
            this.screen++;
            this.scrollTo('bottom');
        }
        return advanced;
    }
    back() {
        if(this.screen > 1) {
            this.show(this.screen - 1);
            this.scrollTo('top');
        }
    }
    // New content lands at the bottom; going back returns to the start of that page.
    scrollTo(edge) {
        for(const container of [this.containers.root, this.containers.chapter]) {
            container.element.scrollTop = edge === 'top' ? 0 : container.element.scrollHeight;
        }
    }
    // A side run keeps one panel; a new kind of side section takes the other panel.
    sidePanel(sectionType) {
        if(sectionType.side !== this.previousSide) {
            this.sideSlot = (this.sideSlot + 1) % 2;
            this.panels[this.sideSlot].empty();
        }
        return this.panels[this.sideSlot];
    }
    show(screenTo) {
        this.containers.root.empty();
        this.index = 0;
        this.screen = 0;
        this.group = undefined;
        this.previousSide = undefined;
        this.sideSlot = 1;
        this.pages = this.pageGenerator();
        while(this.screen < screenTo) {
            if(!this.next()) {
                break;
            }
        }
    }
    turnPage(event) {
        if(!this.pointerStart) {
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
    start(rows, pageTo=0) {
        this.rows = rows;
        this.show(1);
        while(pageTo > this.index) {
            if(!this.next()) {
                break;
            }
        }
        if(this.screen === 1) {
            this.scrollTo('top');
        }
        const root = this.containers.root.element;
        root.addEventListener('pointerdown', (event) => {
            this.pointerStart = {x: event.clientX, y: event.clientY};
        });
        root.addEventListener('pointerup', (event) => this.turnPage(event));
        document.addEventListener('keydown', (event) => {
            if(KEYS_FORWARDS.includes(event.key)) {
                this.next();
            } else if(KEYS_BACKWARDS.includes(event.key)) {
                this.back();
            }
        });
    }
}

export const get = (containerTypes, sectionTypes) => new Book(containerTypes, sectionTypes);
