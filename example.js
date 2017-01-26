import { mutationWatch, learningElement$ } from './src/watcher';

learningElement$
  .tap(console.log)
  .drain();