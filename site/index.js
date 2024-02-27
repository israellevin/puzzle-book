// Puzzle book display.
import * as sheet from './sheet.js';

class Render {
    constructor(element, callback=() => {}) {
        this.element = element;
        sheet.get().then((rows) => {
            this.rows = rows;
            this.index = 0;
            this.pages = this.pageGenerator();
            this.element.addEventListener('click', () => this.pages.next());
            document.addEventListener('keydown', (event) => {
                if(['ArrowRight', 'Enter', 'Space', ' '].includes(event.key)) {
                    this.pages.next();
                }
            });
            this.element.classList.add(
                'w-4/5', 'h-4/5', 'bg-gray', 'p-4', 'rounded', 'border', 'border-gray-400', 'shadow-lg', 'mx-auto'
            );
            this.element.classList.remove('hidden');
            callback.call(this);
        });
    }
    addElement(element, clearBefore) {
        if(clearBefore) {
            this.element.innerHTML = '';
        }
        this.element.appendChild(element);
    }
    * pageGenerator() {
        while((this.row = this.rows[this.index]) !== undefined) {
            this.index++;
            if(!(this.row.sectionType in this)) {
                console.warn(`Unknown section type: ${this.row.sectionType}`);
                continue;
            }
            console.log(`Rendering ${this.row.sectionType}`);
            const {element, pauseBefore, pauseAfter, clearBefore} = this[this.row.sectionType]();
            if(pauseBefore) {
                console.log(this.row.sectionType);
            }

            if(pauseBefore) {
                console.log('pause before', this.row.sectionType);
                yield;
                this.addElement(element, clearBefore);
            } else {
                this.addElement(element, clearBefore);
                if(pauseAfter) {
                    console.log('pause after', this.row.sectionType);
                    yield;
                }
            }
        }
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
        subtitle.classList.add('text-3xl', 'text-center');
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
        title.classList.add('text-2xl', 'text-center', 'fixed', 'left-0', 'top-0', 'w-1/2', 'bg-white', 'z-10');
        return {element: title};
    }
}

new Render(document.getElementById('book'));
