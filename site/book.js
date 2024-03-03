// Puzzle book display.

const KEYS_FORWARDS = ['ArrowRight', 'Enter', 'Space', ' '];

// Styled div container for a section.
class Container {
    constructor(parentNode, classes, append) {
        this.parentNode = parentNode;
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
    appendChild(element) {
        return this.element.appendChild(element);
    }
    empty(node=this.element) {
        for(let childIndex = node.childNodes.length - 1; childIndex >= 0; childIndex--) {
            const child = node.childNodes[childIndex];
            if(child.classList && child.classList.contains('_container')) {
                this.empty(child);
            } else {
                child.remove();
            }
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

// Singleton book rendering class.
class Book {
    static instance;
    constructor(containerTypes, sectionTypes) {
        if(new.target.instance) {
            return new.target.instance;
        }
        this.containers = {};
        for(const [containerId, [parentId, classes]] of Object.entries(containerTypes)) {
            this.containers[containerId] = new Container(this.containers[parentId] || document.body, [
                '_container', `_${containerId}-container`, ...(classes || [])
            ]);
        }
        this.sectionTypes = {};
        for(const [sectionType, sectionProperties] of Object.entries(sectionTypes)) {
            this.sectionTypes[sectionType] = {
                ...sectionProperties, container: this.containers[sectionProperties.containerId], classes: [
                    '_section', `_${sectionType}-section`, ...(sectionProperties.classes || [])
                ]
            };
        }
    }
    * pageGenerator() {
        let row;
        while((row = this.rows[this.index]) !== undefined) {
            this.index++;

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

            new Section(sectionType.tagName, row.text, sectionType.classes, sectionType.container);
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
        this.pages.next(pageTo);
    }
}

export const get = (containerTypes, sectionTypes) => new Book(containerTypes, sectionTypes);
