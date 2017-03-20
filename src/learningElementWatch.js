import { bus } from 'partybus';
import { mutationWatch } from './mutationobserver';
import * as most from 'most';

mutationWatch('[learning-element]:not([transformed])', 'learningElements::found');

let cache = {};

most.fromEvent('watcher::transformComplete', bus)
  .tap(() => { cache = {} })
  .drain();

console.log('CREATE WATCH STREAM', Date.now());

const learningElement$ = most.fromEvent('learningElements::found', bus)
  .flatMap(els => most.from(els) )
  .filter(el => cache[el.getAttribute('learning-element-ref')] !== true )
  .tap(el => cache[el.getAttribute('learning-element-ref')] = true )
  .tap(el => el.setAttribute('transformed', true) );

export { learningElement$ };

// el contract attrs:
// learning-element="poll"
// learning-element-ref="identifier" //TODO: discuss uniqueness of identifier, how is this managed?
// transformed (when element is sent for transformation)

// EXAMPLE IMPLEMENTATION:
//learningElements$
//  .filter(el => el.getAttribute('learning-element') === 'poll')
//  .tap(el => el.append('<div class="mount"></div>') )
//.drain()