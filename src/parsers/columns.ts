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

import blockParser from './block';
import {ParserFn} from './index';
import {BlockCellMapping} from '../cells';

function getXPath(elm: Element, document: Document, withDetails = false) {
  const allNodes = document.getElementsByTagName('*');
  const segments: string[] = [];
  let parent: Node | null | undefined = elm;
  for (segments; elm && elm.nodeType === 1; parent = parent?.parentNode) {
    if (withDetails) {
      if (elm.hasAttribute('id')) {
        let uniqueIdCount = 0;
        for (let n = 0; n < allNodes.length; n++) {
          if (allNodes[n].hasAttribute('id') && allNodes[n].id === elm.id) uniqueIdCount++;
          if (uniqueIdCount > 1) break;
        }
        if (uniqueIdCount === 1) {
          segments.unshift(`id("${elm.getAttribute('id')}")`);
          return segments.join('/');
        }
        segments.unshift(`${elm.localName.toLowerCase()}[@id="${elm.getAttribute('id')}"]`);
      } else if (elm.hasAttribute('class')) {
        segments.unshift(`${elm.localName.toLowerCase()}[@class="${[...elm.classList].join(' ').trim()}"]`);
      }
    } else {
      let i = 1;
      let sib: ChildNode | null;
      for (i = 1, sib = elm.previousSibling; sib; sib = sib.previousSibling) {
        if ('localName' in sib && (sib as Element).localName === elm.localName) {
          i += 1;
        }
      }
      segments.unshift(`${elm.localName.toLowerCase()}[${i}]`);
    }
  }

  return segments.length ? `/${segments.join('/')}` : null;
}

// courtesy of https://github.com/adobecom/aem-milo-migrations/blob/main/tools/importer/parsers/utils.js
function getNSiblingsDivs(el: Element, document: Document, n: ((n: number) => boolean) | number | null = null) {
  let cmpFn: (n: number) => boolean = () => false;

  if (typeof n === 'function') {
    cmpFn = n;
  }
  if (Number.isInteger(n)) {
    cmpFn = (c) => c === n;
  }

  let selectedXpathPattern = '';
  const xpathGrouping: Record<string, Element[]> = {};

  el.querySelectorAll('*').forEach((d) => {
    const xpath = getXPath(d, document);
    const xp = xpath?.substring(0, xpath.lastIndexOf('['));
    if (xp) {
      if (!xpathGrouping[xp]) {
        xpathGrouping[xp] = [d];
      } else {
        xpathGrouping[xp].push(d);
      }
    }
  });

  // find the xpath pattern that has n elements
  for (const key in xpathGrouping) {
    if (cmpFn(xpathGrouping[key].length)) {
      selectedXpathPattern = key;
      break;
    }
  }
  if (!selectedXpathPattern) {
    if (cmpFn(el.children.length)) {
      return [...el.children];
    }
  }

  return xpathGrouping[selectedXpathPattern] || null;
}

const parse:ParserFn<{ cells?: BlockCellMapping}> = (el, props) => {
  // cleanup
  el.querySelectorAll('script, style').forEach((e) => e.remove());
  el.querySelectorAll('div').forEach((e) => {
    if (!e.querySelector('img, svg, iframe') && e.textContent?.replaceAll('\n', '').trim().length === 0) {
      e.remove();
    }
  });

  const { document, params: { cells } } = props;
  if (cells) {
    return blockParser(el, props);
  }

  // begin automatic detection
  // el.querySelectorAll('div').forEach((d) => {
  //   console.log(`XPATH: ${getXPath(d, document, true)}`);
  //   if (d.dataset.hlxImpRect) {
  //     console.log(d.dataset.hlxImpRect);
  //     console.log(JSON.parse(d.dataset.hlxImpRect));
  //   }
  // });

  return [getNSiblingsDivs(el, document, (n) => n > 1)];
}

export default parse;
