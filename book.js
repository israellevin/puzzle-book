// Puzzle book display.

const KEYS_FORWARDS = ['ArrowRight', 'Enter', 'Space', ' '];

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

// Styled section element.
class Section {
    constructor(tagName, text, classes, container) {
        this.element = document.createElement(tagName);
        this.element.textContent = text;
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

            if(sectionType.clearBefore) {
                sectionType.container.empty();
            }

            new Section(sectionType.tagName, row.text ?? '', sectionType.classes, sectionType.container);
            console.log('rendered', row.sectionType);

            if(sectionType.pauseAfter) {
                yield;
            }
        }
    }
    start(rows, pageTo=0) {
        this.rows = rows;
        this.index = 0;
        this.pages = this.pageGenerator();
        this.containers.root.element.addEventListener('click', () => this.pages.next());
        document.addEventListener('keydown', (event) => {
            if(KEYS_FORWARDS.includes(event.key)) {
                this.pages.next();
            }
        });
        while(pageTo > this.index) {
            this.pages.next();
        }
    }
}

export const get = (containerTypes, sectionTypes) => new Book(containerTypes, sectionTypes);
