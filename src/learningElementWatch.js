import { bus } from 'partybus';
import { mutationWatch } from './mutationobserver';
import * as most from 'most';


mutationWatch('[learning-element]:not([transformed])', 'learningElements::found');

let cache = {};

const learningElements$ = most.fromEvent('learningElements::found', bus)
  .tap(els => { if(els.length === 0){ bus.emit('watcher::transformComplete'); cache = {} } })
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