import { mutationWatch, learningElement$ } from './src/watcher';

learningElement$
  .tap(console.log)
  .drain();

///////////////////////////////
// Test addition and removal //
///////////////////////////////

setTimeout(function(){

  var el = document.querySelector('[learning-element-ref="poll-1-version-1"]');
  el.outerHTML = "";
  //delete el;

  document.body.insertAdjacentHTML( 'afterbegin', '<div learning-element="poll" learning-element-ref="poll-1-version-1" learning-element-options="{}" second-load></div>' );

}, 2000);