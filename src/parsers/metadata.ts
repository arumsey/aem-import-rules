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
import {BlockConfig, BlockConfigMapping} from '../cells';

function isDate(str: unknown): str is string {
  if (typeof str !== 'string') return false;
  const date = new Date(str);
  return !Number.isNaN(Number(date));
}

const parse:ParserFn<{ cells?: BlockConfigMapping}> = (element, props) => {
  const { document } = props;
  const baseMetadata = WebImporter.Blocks.getMetadata(document) || {};
  const customMetadata = blockParser(element, props) as BlockConfig;
  const meta = { ...baseMetadata, ...customMetadata };
  Object.entries(meta).forEach(([key, value]) => {
    // use first image
    if (key === 'Image') {
      const [img1] = (value as HTMLImageElement).src.split(',');
      (value as HTMLImageElement).src = img1;
    }
    // convert dates
    if (isDate(value)) {
      meta[key] = new Date(value).toISOString().slice(0, 10);
    }
  });
  return meta;
}

export default parse;
