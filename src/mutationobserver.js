import { bus } from 'partybus';

const MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

let mutationListeners = [];

const observer = new MutationObserver(function(mutations) {
  mutationListeners.forEach(function({ selector, emitMessage }){
    //selector: '[learning-element]:not([transformed])'
    //emitMessage: `learningElement::found`
    const transformables = document.querySelectorAll(selector);
    if(transformables.length > 0){ bus.emit(emitMessage, transformables); }
  })
});

observer.observe(document, { attributes: true, childList: true, characterData: true, subtree: true });

const mutationWatch = (selector, emitMessage) => {
  mutationListeners.push({selector, emitMessage})
};

export { mutationWatch };
