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
/* global WebImporter */

import {ParserFn} from './index.js';
import {BlockCellMapping, BlockConfigMapping} from '../cells.js';

const parse: ParserFn<{ cells?: string | BlockCellMapping | BlockConfigMapping}> = (element, { params: { cells } }) => {
  let rows: BlockCellMapping | BlockConfigMapping;
  if (typeof cells === 'string') {
    rows = [...element.querySelectorAll(cells)];
  } else if (cells) {
    rows = cells;
  } else {
    rows = [];
  }
  if (Array.isArray(rows)) {
    return WebImporter.CellUtils.buildBlockCells(element, rows);
  }
  if (typeof rows === 'object' && rows !== null) {
    return WebImporter.CellUtils.buildBlockConfig(element, rows);
  }
  return [];
}

export default parse;
