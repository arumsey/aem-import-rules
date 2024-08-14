/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {ImportRules} from '../src/rulebuilder';
import {SourceProps} from '../src/transformfactory';
import {BlockCellMapping, BlockCells, BlockConfigMapping} from '../src/cells';

declare global {
  // eslint-disable-next-line no-var
  var WebImporter: {
    Transformer: {
      transform: (rules: ImportRules, source: SourceProps) => Element;
    };
    FileUtils: {
      sanitizePath: (path: string) => string;
    };
    DOMUtils: {
      remove: (main: Element, selectors: string[]) => void;
    };
    CellUtils: {
      buildBlockCells: (element: Element, rows: BlockCellMapping) => BlockCells;
      buildBlockConfig: (element: Element, rows: BlockConfigMapping) => BlockCells;
      isBlockCellArray: (cells: BlockCells) => boolean;
      isBlockConfig: (cells: BlockCells) => boolean;
    };
    Blocks: {
      createBlock: (document: Document, config: { name: string, variants?: string[], cells: BlockCells}) => Element;
      computeBlockName: (type: string) => string;
      getMetadata: (document: Document) => Record<string, string>;
    };
  };
}

export { };
