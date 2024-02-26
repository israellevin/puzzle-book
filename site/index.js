// Puzzle book display.
import * as sheet from './sheet.js';

class Render {
    constructor(element, callback=() => {}) {
        this.element = element;
        sheet.get().then((rows) => {
            this.rows = rows;
            this.index = 0;
            this.currentChapter = 1;
            this.element.addEventListener('click', () => this.nextPage());
            document.addEventListener('keydown', (event) => {
                if(['ArrowRight', 'Enter', 'Space', ' '].includes(event.key)) {
                    this.nextPage();
                }
            });
            this.element.classList.remove('hidden');
            callback.call(this);
        });
    }
    * pages() {
        while((this.row = this.rows[this.index]) !== undefined) {
            this.index++;
            if(!(this.row.sectionType in this)) {
                console.warn(`Unknown section type: ${this.row.sectionType}`);
                continue;
            }
            console.log(this.row.sectionType);
            const {element, pauseBefore, pauseAfter, clearBefore} = this[this.row.sectionType]();
            if(clearBefore) {
                this.element.innerHTML = '';
            }
            if(pauseBefore) {
                console.log('pause before', this.row.sectionType);
                yield;
            }
            this.element.appendChild(element);
            if(pauseAfter) {
                console.log('pause after', this.row.sectionType);
                yield;
            }
        }
    }
    nextPage() {
        this.pages().next();
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
        return {element: subtitle, pauseAfter: true};
    }
    chapterPreface() {
        const preface = document.createElement('p');
        preface.textContent = this.row.text;
        return {element: preface};
    }
}

new Render(document.getElementById('book'));
