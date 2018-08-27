import { createElement, getElement, toggleClass } from '../utils/elements';
import {triggerEvent} from '../utils/events';

import controls from '../controls';

export class LectureNoteModel {
    constructor () {
        this.showStatus = LectureNoteModel.ShowStatus.Edit;
        this.noteStatus = LectureNoteModel.NoteStatus.Create;
        this.time = 0;
        this.note = '';
    }
}

LectureNoteModel.ShowStatus = {
    Edit: 'Edit',
    Hide: 'Hide',
};
LectureNoteModel.NoteStatus = {
    Create: 'Create',
    Normal: 'Normal',
};

const AddLectureNoteButtonStatus = {
    Enable: 'enable',
    Disable: 'disable',
    Hidden: 'hidden',
};

export default class LectureNote {

    constructor (player) {
        this.player = player;
        this.lectureNoteList = [];
        this.lectureNoteContainer = null;
        this.addLectureNoteButtonStatus = AddLectureNoteButtonStatus.Hidden;
        this.isLoadedLectureNote = false;

        this.beforeAddLectureNotePlayerState = null;
        this.beforeEditLectureNotePlayerState = null;
    }

    setup () {
    }

    clear () {
        this.lectureNoteList = [];
        this.lectureNoteContainer = null;
        this.isLoadedLectureNote = false;
        this.hiddenLectureNote();
    }

    enableLectureNote () {
        this.addLectureNoteButtonStatus = AddLectureNoteButtonStatus.Enable;
        this.updateAddLectureNoteButtonUI();
    }

    disableLectureNote () {
        this.addLectureNoteButtonStatus = AddLectureNoteButtonStatus.Disable;
        this.updateAddLectureNoteButtonUI();
    }

    hiddenLectureNote () {
        this.addLectureNoteButtonStatus = AddLectureNoteButtonStatus.Hidden;
        this.updateAddLectureNoteButtonUI();
    }

    updateAddLectureNoteButtonUI () {
        const addLectureNoteButton = getElement.call(this.player, '.plyr__add-lecture-note');
        switch (this.addLectureNoteButtonStatus) {
            case AddLectureNoteButtonStatus.Enable:
                toggleClass.call(this.player, addLectureNoteButton, 'disable', false);
                toggleClass.call(this.player, addLectureNoteButton, 'hidden', false);
                toggleClass.call(this.player, '.plyr__lecture-note-container', 'hidden', false);
                break;
            case AddLectureNoteButtonStatus.Disable:
                toggleClass.call(this.player, addLectureNoteButton, 'disable', true);
                toggleClass.call(this.player, addLectureNoteButton, 'hidden', false);
                toggleClass.call(this.player, '.plyr__lecture-note-container', 'hidden', false);
                break;
            case AddLectureNoteButtonStatus.Hidden:
                toggleClass.call(this.player, addLectureNoteButton, 'disable', true);
                toggleClass.call(this.player, addLectureNoteButton, 'hidden', true);
                toggleClass.call(this.player, '.plyr__lecture-note-container', 'hidden', true);
                break;
            default:
                break;
        }
    }

    setupUI () {
        if (this.player.supported.ui) {
            const lectureNoteContainer = this.getContainer();
            for (let i = 0; i < this.lectureNoteList.length; i += 1) {
                const note = this.lectureNoteList[i];
                if (!this.isLectureNoteExists(note._id)) {
                    const lectureNoteDOM = this.generateLectureNoteDOM(note);
                    lectureNoteContainer.appendChild(lectureNoteDOM);
                }
            }
        }
    }

    initLectureNote (lectureNotes) {
        if (this.player.supported.ui) {
            this.lectureNoteList = lectureNotes;
            this.isLoadedLectureNote = true;
            this.setupUI();
            this.enableLectureNote();
        }
    }

    addLectureNote () {
        if (this.player.playing) {
            this.beforeAddLectureNotePlayerState = 'playing';
        } else {
            this.beforeAddLectureNotePlayerState = 'pause';
        }

        this.player.pause();

        const time = Math.round(this.player.currentTime);
        const note = this.getSameTimeLectureNote(time);
        if (note) {
            const lectureNoteContainer = getElement.call(this.player, `.lecture-note[data-id="${  note._id  }"]`);
            if (lectureNoteContainer) {
                const contentContianer = lectureNoteContainer.querySelector('.lecture-note__content-container');
                if (contentContianer) {
                    const clickEvent = new Event('click');
                    contentContianer.dispatchEvent(clickEvent);
                }
            }

        } else {
            this.disableLectureNote();
            triggerEvent.call(this.player, this.player.media, 'lecturenotecreate', true , {
                lectureNote: {
                    time,
                },
            });
        }
    }

    completeAddLectureNote (lectureNote) {
        this.enableLectureNote();
        const newLectureNote = Object.assign({}, lectureNote, {
            showStatus: LectureNoteModel.ShowStatus.Edit,
        });
        this.lectureNoteList.push(newLectureNote);
        const lectureNoteDOM = this.generateLectureNoteDOM(newLectureNote);
        const lectureNoteContainer = this.getContainer();
        lectureNoteContainer.appendChild(lectureNoteDOM);
    }

    removeLectureNote (lectureNote) {
        const lectureNoteContainer = getElement.call(this.player, `div[data-id="${lectureNote._id}"]`);
        if (lectureNoteContainer) {
            lectureNoteContainer.parentElement.removeChild(lectureNoteContainer);
            for (let i = 0; i < this.lectureNoteList.length; i += 1) {
                if (this.lectureNoteList[i]._id === lectureNote._id) {
                    this.lectureNoteList.splice(i, 1);
                    return;
                }
            }
        }
    }

    hasSameTimeLectureNote (time) {
        for (let i = 0; i < this.lectureNoteList.length; i += 1) {
            if (this.lectureNoteList[i].time === time) {
                return true;
            }
        }
        return false;
    }

    getSameTimeLectureNote (time) {
        for (let i = 0; i < this.lectureNoteList.length; i += 1) {
            if (this.lectureNoteList[i].time === time) {
                return this.lectureNoteList[i];
            }
        }
        return null;
    }

    /**
     * @private
     * @return {null|*}
     */
    getContainer () {
        if (this.lectureNoteContainer && !this.lectureNoteContainer.parentElement) {
            this.lectureNoteContainer = null;
        }
        if (this.lectureNoteContainer === null) {
            this.lectureNoteContainer = createElement('div', {
                'class': 'plyr__lecture-note-container',
            });
            const progresses = getElement.call(this.player, this.player.config.selectors.progress);
            if (progresses) {
                progresses.appendChild(this.lectureNoteContainer);
            }
        }
        return this.lectureNoteContainer;
    }

    /**
     * @private
     * @param lectureNoteId
     * @return {boolean}
     */
    isLectureNoteExists (lectureNoteId) {
        return getElement.call(this.player, `.lecture-note[data-id="${lectureNoteId}"]`) !== null;
    }

    /**
     * @private
     * @param lectureNote
     */
    generateLectureNoteDOM (lectureNote) {
        const { duration } = this.player;
        const percent = (lectureNote.time / duration) * 100 || 0;

        let cancelTimeout = null;

        const lectureNoteContainer = createElement('div', {
            'data-id': lectureNote._id,
            class: 'lecture-note',
        });

        /* lecture-note__mark */
        const className = 'lecture-note__mark';
        const mark = createElement('span', {
            class: className,
        });
        lectureNoteContainer.appendChild(mark);

        // 點擊 mark 跳到對應的播放時間
        mark.addEventListener('click', (e) => {
            this.player.currentTime = lectureNote.time;
            e.preventDefault();
            e.stopPropagation();
        });
        /* lecture-note__mark */

        /* lecture-note__content-container */
        const status = lectureNote.showStatus;
        const contentContainer = createElement('div', {
            class: `lecture-note__content-container ${status === LectureNoteModel.ShowStatus.Edit ? ' lecture-note__content-container--edit' : ''}`,
        });
        lectureNoteContainer.appendChild(contentContainer);
        /* lecture-note__content-container */

        /* lecture-note__content-textarea */
        const contentTextarea = createElement('textarea', {
            class: 'lecture-note__content-textarea',
            placeholder: '新增筆記 (限 50 字)',
            maxLength: 50,
            rows: 1,
        });
        contentTextarea.value = lectureNote.note || '';
        contentContainer.appendChild(contentTextarea);
        /* lecture-note__content-textarea */

        /* lecture-note__content-show-text */
        const contentShowText = createElement('span', {
            class: 'lecture-note__content-show-text',
        });
        contentShowText.innerHTML = lectureNote.note;
        contentContainer.appendChild(contentShowText);
        /* lecture-note__content-show-text */

        /* lecture-note__trash-icon-wrapper */
        const trashIconWrapper = createElement('span', {
            class: 'lecture-note__trash-icon-wrapper',
        });
        const trashIcon = controls.createIcon.call(this.player, 'trash');
        trashIconWrapper.appendChild(trashIcon);
        contentContainer.appendChild(trashIconWrapper);
        // 點擊垃圾桶 icon 刪除 lecturenote
        trashIconWrapper.addEventListener('click', (e) => {
            triggerEvent.call(this.player, this.player.media, 'lecturenotedelete', true ,{
                lectureNote,
            });
            this.removeLectureNote(lectureNote);
        });
        /* lecture-note__trash-icon-wrapper */

        // 點擊 container 開啟編輯模式
        contentContainer.addEventListener('click', (e) => {
            if (lectureNote.showStatus !== LectureNoteModel.ShowStatus.Edit) {
                if (this.player.playing) {
                    this.beforeEditLectureNotePlayerState = 'playing';
                } else {
                    this.beforeEditLectureNotePlayerState = 'pause';
                }
                this.player.pause();
                toggleClass(contentContainer, 'lecture-note__content-container--edit', true);
                lectureNote.showStatus = LectureNoteModel.ShowStatus.Edit;
                contentTextarea.style.height = 'auto';
                contentTextarea.style.height = `${contentTextarea.scrollHeight}px`;
                contentTextarea.focus();
            }
        });


        setTimeout(() => {
            contentTextarea.focus();
        }, 50);

        contentTextarea.addEventListener('keyup', () => {
            contentTextarea.style.height = 'auto';
            contentTextarea.style.height = `${contentTextarea.scrollHeight}px`;
        });

        let isInComposition = false;
        contentTextarea.addEventListener('compositionstart', (e) => {
            isInComposition = true;
        });

        contentTextarea.addEventListener('compositionend', (e) => {
            setTimeout(() => {
                isInComposition = false;
            }, 10);
        });

        contentTextarea.addEventListener('keydown', (e) => {
            if (!isInComposition && e.key === 'Enter') {
                lectureNote.note = contentTextarea.value;
                contentShowText.innerHTML = lectureNote.note;
                toggleClass(contentContainer, 'lecture-note__content-container--edit', false);
                lectureNote.showStatus = LectureNoteModel.ShowStatus.Hide;
                toggleClass(lectureNoteContainer, 'hover', true);
                cancelTimeout = setTimeout(() => {
                    toggleClass(lectureNoteContainer, 'hover', false);
                }, 1000);
                triggerEvent.call(this.player, this.player.media, 'lecturenoteupdate', true, {
                    lectureNote,
                });
                console.group('keydown enter');
                console.log(this.beforeAddLectureNotePlayerState, this.beforeEditLectureNotePlayerState);
                console.groupEnd();
                try{
                    if (this.beforeAddLectureNotePlayerState) {
                        if (this.beforeAddLectureNotePlayerState === 'playing') {
                            this.player.play();
                        }
                        this.beforeAddLectureNotePlayerState = null;
                    }
                    if (this.beforeEditLectureNotePlayerState) {
                        if (this.beforeEditLectureNotePlayerState === 'playing') {
                            this.player.play();
                        }
                        this.beforeEditLectureNotePlayerState = null;
                    }
                } catch (e) {
                    // ignore
                }
                e.preventDefault();
            }
            if (e.key === 'Escape') {
                contentTextarea.value = lectureNote.note;
                toggleClass(contentContainer, 'lecture-note__content-container--edit', false);
                lectureNote.showStatus = LectureNoteModel.ShowStatus.Hide;
            }
        });

        contentTextarea.addEventListener('blur', (e) => {
            lectureNote.note = contentTextarea.value;
            contentShowText.innerHTML = lectureNote.note;
            toggleClass(contentContainer, 'lecture-note__content-container--edit', false);
            lectureNote.showStatus = LectureNoteModel.ShowStatus.Hide;
            toggleClass(lectureNoteContainer, 'hover', true);
            cancelTimeout = setTimeout(() => {
                toggleClass(lectureNoteContainer, 'hover', false);
            }, 1000);
            triggerEvent.call(this.player, this.player.media, 'lecturenoteupdate', true, {
                lectureNote,
            });
            e.preventDefault();
        });

        mark.addEventListener('mouseenter', (e) => {
            if (cancelTimeout) {
                clearTimeout(cancelTimeout);
                cancelTimeout = null;
            }
            toggleClass(contentContainer, 'lecture-note__content-container--show', true);
            const container = this.getContainer();
            const leftLimit = ((container.offsetWidth - 200) / container.offsetWidth) * 100 || 0;
            if (percent > leftLimit) {
                toggleClass(contentContainer, 'lecture-note__content-container--near-end', true);
            } else {
                toggleClass(contentContainer, 'lecture-note__content-container--near-end', false);
            }
            e.preventDefault();
        });

        mark.addEventListener('mouseleave', (e) => {
            cancelTimeout = setTimeout(() => {
                toggleClass(contentContainer, 'lecture-note__content-container--show', false);
            }, 500);

            e.preventDefault();
        });

        contentContainer.addEventListener('mouseenter', (e) => {
            if (cancelTimeout) {
                clearTimeout(cancelTimeout);
                cancelTimeout = null;
            }
            toggleClass(contentContainer, 'lecture-note__content-container--show', true);
            const container = this.getContainer();
            const leftLimit = ((container.offsetWidth - 200) / container.offsetWidth) * 100 || 0;
            if (percent > leftLimit) {
                toggleClass(contentContainer, 'lecture-note__content-container--near-end', true);
            } else {
                toggleClass(contentContainer, 'lecture-note__content-container--near-end', false);
            }
            e.preventDefault();
        });

        contentContainer.addEventListener('mouseleave', (e) => {
            cancelTimeout = setTimeout(() => {
                toggleClass(contentContainer, 'lecture-note__content-container--show', false);
            }, 500);

            e.preventDefault();
        });

        lectureNoteContainer.style.left = `calc(${percent}%)`;
        return lectureNoteContainer;
    }
}
