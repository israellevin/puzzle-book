// Puzzle book display.
import * as sheet from './sheet.js';

const KEYS_FORWARDS = ['ArrowRight', 'Enter', 'Space', ' '];
const FULL_SCREEN = ['fixed', 'left-0', 'top-0', 'w-full', 'h-full', 'bg-white', 'p-4', 'z-100'];

// Virtual singleton rendering class.
class Render {
    static instance;
    constructor(rowsGetter) {
        // Singleton.
        if(new.target.instance) {
            return new.target.instance;
        }
        // Virtual.
        if(new.target === Render) {
            throw new TypeError('Cannot construct Render instances directly');
        }

        this.root = document.createElement('div');
        this.containers = {root: this.root};
        rowsGetter().then((rows) => {
            this.rows = rows;
            this.index = 0;
            this.pages = this.pageGenerator();
            this.root.addEventListener('click', () => this.pages.next());
            document.addEventListener('keydown', (event) => {
                if(KEYS_FORWARDS.includes(event.key)) {
                    this.pages.next();
                }
            });
            this.root.classList.add(...FULL_SCREEN);
            document.body.appendChild(this.root);
        });
    }
    reusableContainer(sectionType) {
        if(!this.containers[sectionType]) {
            console.warn(`No container for ${sectionType}`);
            this.containers[sectionType] = document.element;
        } else if(!(this.containers[sectionType] instanceof HTMLElement)) {
            const [parentElementId, classes] = this.containers[sectionType];
            this.containers[sectionType] = document.createElement('div');
            this.containers[sectionType].classList.add(...classes);
            this.reusableContainer(parentElementId).appendChild(this.containers[sectionType]);
        }
        return this.containers[sectionType];
    }
    addSection(element, sectionType, clearBefore=false) {
        const parentElement = this.reusableContainer(sectionType);
        if(clearBefore) {
            parentElement.innerHTML = '';
        }
        parentElement.appendChild(element);
    }
    * pageGenerator() {
        while((this.row = this.rows[this.index]) !== undefined) {
            this.index++;
            let section;
            try {
                section = this[this.row.sectionType]();
            } catch(error) {
                if(error instanceof TypeError) {
                    console.warn(`Unknown section type: ${this.row.sectionType}`);
                    continue;
                }
                throw error;
            }

            console.log(`Rendering ${this.row.sectionType}`);
            const {element, pauseBefore, pauseAfter, clearBefore} = section;

            if(this.index === 1) {
                this.addSection(element, this.row.sectionType, clearBefore);
            } else if(pauseBefore) {
                console.log('pause before', this.row.sectionType);
                yield;
                this.addSection(element, this.row.sectionType, clearBefore);
            } else {
                this.addSection(element, this.row.sectionType, clearBefore);
                if(pauseAfter) {
                    console.log('pause after', this.row.sectionType);
                    yield;
                }
            }
        }
    }
}

class PuzzleBook extends Render {
    constructor(callback) {
        super(sheet.get);
        this.containers.chapter = ['root', ['text-2xl', 'text-center']];
        this.containers.chapterName = ['chapter', ['text-4xl', 'text-center']];
        this.containers.chapterSubtitle = ['chapter', ['text-3xl', 'text-center']];
        this.containers.chapterPreface = ['chapter', ['bg-gray-200', 'p-4']];
        this.containers.aside = ['chapter', ['fixed', 'left-0', 'top-0', 'w-1/4', 'bg-pink-200', 'p-4']];
        this.containers.asideTitle = ['aside', ['text-2xl']];
        callback && callback.call(this);
    }
    chapterName() {
        const title = document.createElement('h1');
        title.textContent = `פרק ${this.row.chapterNumber}: ${this.row.text}`;
        title.classList.add('text-4xl', 'text-center');
        return {element: title, pauseBefore: true, clearBefore: true};
    }
    chapterSubtitle() {
        const subtitle = document.createElement('h2');
        subtitle.textContent = this.row.text;
        return {element: subtitle};
    }
    chapterPreface() {
        const preface = document.createElement('p');
        preface.textContent = this.row.text;
        return {element: preface};
    }
    asideTitle() {
        const title = document.createElement('h3');
        title.textContent = this.row.text;
        title.classList.add();
        return {element: title};
    }
    aside() {
        const aside = document.createElement('p');
        aside.textContent = this.row.text;
        return {element: aside};
    }
}

new PuzzleBook();
