// Puzzle book display.
import * as sheet from './sheet.js';

const KEYS_FORWARDS = ['ArrowRight', 'Enter', 'Space', ' '];
const FULL_SCREEN = ['fixed', 'left-0', 'top-0', 'w-full', 'h-full', 'bg-white', 'p-4', 'z-100'];

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
    constructor() {
        if(new.target.instance) {
            return new.target.instance;
        }

        this.containers = {root: new Container(document.body, [
            '_container', '_container-root', ...FULL_SCREEN
        ])};
        this.containers.chapter = new Container(this.containers.root, [
            '_container', '_container-chapter', 'text-center', 'bg-gray-100', 'p-4'
        ]);
        this.containers.chapterPreface = new Container(this.containers.chapter, [
            '_container', '_container-chapterPreface', 'text-right', 'bg-gray-200'
        ]);
        this.containers.aside = new Container(this.containers.chapter, [
            '_container', '_container-aside', 'fixed', 'left-0', 'top-0', 'w-1/4', 'bg-pink-200'
        ]);

        this.sectionTypes = Object.entries({
            chapterName: {
                tagName: 'h1',
                classes: ['text-4xl'],
                container: this.containers.chapter,
                pauseBefore: true,
                clearBefore: true
            },
            chapterSubtitle: {
                tagName: 'h2',
                classes: ['text-3xl'],
                container: this.containers.chapter
            },
            chapterPreface: {
                tagName: 'p',
                classes: ['text-lg'],
                container: this.containers.chapterPreface
            },
            asideTitle: {
                tagName: 'h3',
                classes: ['text-2xl'],
                container: this.containers.aside
            },
            aside: {
                tagName: 'p',
                container: this.containers.aside
            }
        }).reduce((sectionTypes, [sectionType, section]) => ({
            ...sectionTypes, [sectionType]: {
                ...section, classes: [...(section.classes || []), `_${sectionType}`]
            }
        }), {});
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

sheet.get().then((rows) => {
    const book = new Book();
    const hash = window.location.hash;
    book.start(rows, hash ? parseInt(hash.slice(1)) : 0);
}).catch(console.error);
