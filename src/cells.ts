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
import DOMPurify from 'dompurify';

const PSEUDO_TEXT_SELECTOR = '::text';
const TEMPLATE_REGEX = /\{\{(.+?)}}/g;
const ATTRIBUTE_REGEX = /\[([^=]*?)]$/;

type ConfigOptions = {
  replace?: [string, string],
  split?: [string, number],
};

export type AnyCell = string | Element | (string | Element)[];
export type BlockCellArray = (AnyCell[] | AnyCell[][])[];
export type BlockConfig = Record<string, string | Element>;
export type BlockCells = BlockCellArray | BlockConfig;

export type BlockCellMapping = Array<Element | string | string[]>;
export type BlockConfigCell = string | [string, string, ConfigOptions][];
export type BlockConfigMapping = Record<string, BlockConfigCell>;

function isElement(el: unknown): el is Element {
  return (
    typeof Element === 'object' ? el instanceof Element // DOM2
      : typeof el === 'object'
      && (el as Node).nodeType === 1
  );
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isValidCSSSelector(selector: unknown) {
  try {
    document.querySelector(selector as string);
    return true;
  } catch (e) {
    return false;
  }
}

function isAttributeSelector(selector: string) {
  return ATTRIBUTE_REGEX.test(selector);
}

function getValueSelector(selector = '') {
  const expr = new RegExp(`${PSEUDO_TEXT_SELECTOR}(?::nth-child\\((?<nthChild>\\d+)\\))?$`);
  const useText = expr.test(selector);
  const [, nthChild] = selector.match(expr) || [];
  let cleanSelector = selector.replace(expr, '');
  const useSiblingText = useText && cleanSelector.endsWith('+ ');
  cleanSelector = cleanSelector.replace(/\+ \*$/, '');
  return {
    selector: cleanSelector.trim(),
    useText,
    useSiblingText,
    childIndex: parseInt(nthChild, 10),
  };
}

type ElementTextOptions = {
  useText: boolean,
  childIndex: number,
  useSiblingText: boolean,
  selector: string,
};

function getElementText(element: Element, options: Partial<ElementTextOptions>): string {
  const {
    useText, childIndex, useSiblingText, selector,
  } = options;
  const [, attribute] = selector?.match(ATTRIBUTE_REGEX) || [];
  if (!useText && attribute) {
    return element.getAttribute(attribute) || '';
  }
  if (childIndex && !Number.isNaN(childIndex)) {
    const textNodes = [...element.childNodes]
      .filter((el) => el.nodeType === Node.TEXT_NODE);
    return textNodes[childIndex - 1]?.textContent || '';
  }
  return useSiblingText
    ? element.nextSibling?.textContent || ''
    : element.textContent || (element as HTMLMetaElement).content || '';
}

/**
 * Evaluate a cell value based on a selector or template string.
 * If the cell is a selector, query the element for the value.
 * If the cell is a template string, replace the templates with the
 * selector value and create a document fragment.
 *
 * @param element Block element
 * @param cell Selector or template string
 * @param params Additional parameters for cell evaluation
 */
function evaluateCell(element: Element, cell?: string, params: ConfigOptions = {}): AnyCell[] {
  if (!cell) {
    return [];
  }

  let cellList: string[];
  if (Array.isArray(cell)) {
    cellList = cell;
  } else {
    cellList = [cell];
  }
  return cellList
    .map((c) => {
      const {selector: valueSelector, useText, ...textProps} = getValueSelector(c);
      const selector = valueSelector;
      if (selector && isValidCSSSelector(selector)) {
        // convert selector string to a cell value
        const cellValue = [...element.querySelectorAll(selector)].map((el) => {
          const isEmptyElement = el.childNodes.length === 0;
          if (isEmptyElement
            || useText
            || isAttributeSelector(selector)
            || params.replace) {
            let text = getElementText(el, {useText, ...textProps, selector});
            // additional processing based on conditional params that were provided
            const {replace, split} = params;
            // perform replacements
            if (replace) {
              const [search, replacement = ''] = replace;
              text = text.replace(new RegExp(search), replacement).trim();
            }
            if (split) {
              const [delim, partIndex = 0] = split;
              const textParts = text.split(delim).filter((part) => part);
              if (textParts.length > partIndex) {
                text = textParts[partIndex];
              }
            }
            return text ? text.replace(/^\s+|\s+$/g, '') : text;
          }
          return el;
        });
        if (cellValue.length <= 1) {
          const [singleValue = selector] = cellValue;
          return singleValue;
        }
        return cellValue;
      }
      // convert template string to a cell value
      let html = c.replace(TEMPLATE_REGEX, (match, expression) => {
        const value: string = expression.trim();
        if (isValidCSSSelector(value)) {
          const matchedElement = element.querySelector(value);
          if (matchedElement && isAttributeSelector(value)) {
            return getElementText(matchedElement, {selector: value});
          }
          return matchedElement?.innerHTML || '';
        }
        return value;
      });
      // clean up HTML and return a document fragment
      html = DOMPurify.sanitize(html);
      return element.ownerDocument.createRange().createContextualFragment(html).firstElementChild;
    })
    .filter(isDefined);
}

export default class CellUtils {
  /**
   * Build a name/value pair block configuration from a selector object.
   *
   * Selector Object:
   * {
   *   name: value_selector | [condition_selector, value_selector, options]
   * }
   *
   * @param element Root element to query from
   * @param items Object of selector conditions
   */
  static buildBlockConfig(element: Element, items: BlockConfigMapping): BlockCells {
    const cfg: Record<string, Element> = {};
    Object.entries(items).forEach(([name, value]) => {
      let selector: string | undefined = typeof value === 'string' ? value : '';
      let params = {};
      if (Array.isArray(value)) {
        // find first matching element
        const [, conditionalSelector, conditionalParams] = value
          .find(([condition]) => element.querySelector(condition)) || [];
        selector = conditionalSelector;
        params = conditionalParams || {};
      }
      const cfgValue = evaluateCell(element, selector, params);
      if (cfgValue !== undefined) {
        const doc = element.ownerDocument || element;
        const cfgElement = doc.createElement('p');
        const nodes = cfgValue.flat();
        cfgElement.append(...nodes);
        cfg[name] = cfgElement;
      }
    });
    return cfg;
  }

  /**
   * Build a two-dimensional array of block cells from a selector array.
   * Each column in the selector array can be a CSS selector or a template string.
   * A template string allows for additional HTML to be added along with selector references.
   *
   * Selector Array:
   * [
   *  [colSelector | colTemplate, ...],
   * ]
   *
   * @param element
   * @param cells
   */
  static buildBlockCells(element: Element, cells: BlockCellMapping): BlockCells {
    return cells
      .map((row) => {
        if (isElement(row)) {
          return [row];
        }
        if (Array.isArray(row)) {
          return row.map((col) => evaluateCell(element, col));
        }
        return evaluateCell(element, row);
      })
      .filter(isDefined)
      .filter((row) => row.some((col) => (Array.isArray(col) ? col.length > 0 : col)));
  }

  /**
   * Is the cells parameter considered empty?
   * Block cells can either be an object or an array.
   * Cells that are an empty array or an object with no keys are considered to be empty.
   * @param cells An object or array of cell values.
   * @return {boolean}
   */
  static isEmpty(cells: BlockCells): boolean {
    if (Array.isArray(cells)) {
      return cells.length === 0;
    }
    if (typeof cells === 'object' && cells !== null) {
      return Object.keys(cells).length === 0;
    }
    return false;
  }

  static isBlockCellArray(cells: BlockCells): cells is (AnyCell[] | AnyCell[][])[] {
    return Array.isArray(cells);
  }

  static isBlockConfig(cells: BlockCells): cells is BlockConfig {
    return typeof cells === 'object' && cells !== null && !Array.isArray(cells);
  }

  /**
   * Does the selector represent a valid CSS selector?
   * @param selector
   * @return {boolean}
   */
  static isValidCSSSelector(selector: unknown = ''): boolean {
    return isValidCSSSelector(selector);
  }

  static isTextSelector(selector: unknown = ''): selector is string {
    const isString = (typeof selector === 'string' || selector instanceof String);
    return isString && selector.includes(PSEUDO_TEXT_SELECTOR);
  }

  static getSearchSelector(selector = '') {
    const [, searchText] = selector.match(new RegExp(`${PSEUDO_TEXT_SELECTOR}\\((.*?)\\)`)) || [];
    const cleanSelector = selector
      .replace(new RegExp(`${PSEUDO_TEXT_SELECTOR}\\((.*)\\)`), '')
      .trim();
    return {
      selector: cleanSelector,
      search: searchText,
    };
  }
}
