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

import parsers, {ParserFn} from './parsers/index.js';
import CellUtils from './cells.js';
import {ImportRules} from './rulebuilder.js';
import {SourceProps} from './transformfactory.js';

type AttributeSelector = { attribute: string, property: string, value: string };

const IGNORE_ELEMENTS = [
  'style',
  'source',
  'script',
  'noscript',
  'iframe',
];

function isElementSelector(selector: string | AttributeSelector): selector is string {
  return !CellUtils.isTextSelector(selector) && typeof selector !== 'object';
}

function matchByAttribute(el: Element, attribute: string, value: string) {
  // 'Class' is a special case (aka className, classList)
  if (attribute === 'class') {
    return [...el.classList].join(' ').includes(value);
  }
  return el.getAttribute(attribute)?.includes(value) || false;
}

function processRemoval(main: Element, selectors: (string | AttributeSelector)[] = []) {
  const elementSelectors = selectors.filter(isElementSelector);
  WebImporter.DOMUtils.remove(
    main,
    elementSelectors,
  );

  const textSelectors = selectors.filter(CellUtils.isTextSelector);
  textSelectors.forEach((selector) => {
    const { selector: searchSelector, search: searchValue } = CellUtils.getSearchSelector(selector);
    [...main.querySelectorAll(searchSelector)]
      .flatMap((el) => [...el.childNodes])
      .filter((node) => node.nodeType === Node.TEXT_NODE
        && node.textContent?.trim() === searchValue)
      .forEach((node) => node.remove());
  });

  const attributeSelectors = selectors.filter((selector) => typeof selector === 'object');
  attributeSelectors
    .forEach((cfg) => {
      const { attribute, property, value } = cfg;
      const all = [...main.querySelectorAll(`[${attribute}]`)];
      if (property?.length && property !== '-') {
        all
          .filter((el) => {
            const propValue = (el as unknown as HTMLFormElement)[attribute][property];
            if (typeof propValue === 'string') {
              return propValue.includes(value);
            }
            return false;
          })
          .forEach((el) => {
            el.remove();
          });
      } else {
        all
          .filter((el) => matchByAttribute(el, attribute, value))
          .forEach((el) => {
            el.remove();
          });
      }
  });
}

export default class Transformer {
  /**
   * Transform a source document from a set of rules.
   *
   * @param rules Transformation ruleset
   * @param source Source document properties
   * @return Transformed root element
   */
  static transform(rules: ImportRules, source: SourceProps): Element {
    const { document } = source;

    const {
      root = 'main',
      cleanup: {
        start: removeStart = [],
        end: removeEnd = [],
      } = {},
      blocks = [],
    } = rules;

    // phase 1: get root element
    const main = document.querySelector(root) || document.body;

    // phase 2: DOM removal - start
    processRemoval(main, [...removeStart, ...IGNORE_ELEMENTS]);

    // phase 3: block creation
    blocks.forEach((blockCfg) => {
      const {
        type, variants, selectors, parse, insertMode = 'replace', params = {},
      } = blockCfg;
      const parserFn: ParserFn = parse || parsers[type] || parsers.block;
      const validSelectors = selectors
        ? selectors.filter(CellUtils.isValidCSSSelector)
        : [];
      const elements = validSelectors.length
        ? selectors.reduce((acc, selector) => [...acc, ...main.querySelectorAll(selector)], [] as Element[])
        : [main];
      // process every element for this block
      elements.forEach((element) => {
        // add params to source
        const mergedParams = { ...source.params, ...params };
        // parse the element into block cell items
        let items = parserFn.call(this, element, { ...source, params: mergedParams });
        if (Array.isArray(items)) {
          items = items.filter((item) => item);
        }
        if (!CellUtils.isEmpty(items)) {
          // create the block
          const block = WebImporter.Blocks.createBlock(document, {
            name: WebImporter.Blocks.computeBlockName(type),
            variants,
            cells: items,
          });
          if (block) {
            // add block to DOM
            if (insertMode === 'append') {
              main.append(block);
            } else if (insertMode === 'prepend') {
              main.prepend(block);
            } else {
              element.replaceWith(block);
            }
          }
        }
      });
    });

    // phase 4: DOM removal - end
    processRemoval(main, removeEnd);

    return main;
  }
}
