import {
  DOMUtils,
  FileUtils,
  Blocks,
} from '@adobe/helix-importer';
import {Transformer, CellUtils} from '../src/index.js';

export function mochaGlobalSetup() {
  global.WebImporter = {
    Transformer,
    CellUtils,
    Blocks,
    DOMUtils,
    FileUtils
  };
  console.log('**** WebImporter has been added to the global scope');
}
