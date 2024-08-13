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

import blockParser from './block.js';
import {ParserFn} from './index';
import {BlockCellArray, BlockCellMapping} from '../cells';

/**
 * Get the common ancestor of two or more elements
 * @param {NodeList} elements The list of elements to compare
 * @returns {Node} The common ancestor
 */
function getCommonAncestor(elements: NodeList): Node | null {
  // If there are no elements, return null
  if (elements.length === 0) {
    return null;
  }

  // If there's only one element, return it
  if (elements.length === 1) {
    return elements[0];
  }

  // Otherwise, create a new Range
  const range = document.createRange();

  // Start at the beginning of the first element
  range.setStart(elements[0], 0);

  // Stop at the end of the last element
  range.setEnd(
    elements[elements.length - 1],
    elements[elements.length - 1].childNodes.length,
  );

  // Return the common ancestor
  return range.commonAncestorContainer;
}

const parse:ParserFn<{ cells?: BlockCellMapping}> = (el, props) => {
  const cellRows = (blockParser(el, props) || []) as BlockCellArray;
  if(!WebImporter.CellUtils.isBlockCellArray(cellRows)) {
    return [];
  }

  // a carousel will consist of one row for every image found
  const images = el.querySelectorAll('img');
  if (images.length === 1 && images[0].children.length === 0) {
    return [[images[0]]];
  }
  const commonParent = getCommonAncestor(images);

  const imageRows = [...images].map((img) => {
    const commonChildren = (commonParent && 'children' in commonParent) ? [...(commonParent as Element).children] : [] as Element[];
    const slide = commonChildren.find((child) => child.contains(img));
    const content = [...(slide?.children || [])].filter((child) => !child.contains(img));
    return [img, content];
  });

  return [...cellRows, ...imageRows];
}

export default parse;
