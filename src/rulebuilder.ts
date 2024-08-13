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

import {ParserFn} from './parsers';

export type ImportRules = {
  root?: string;
  cleanup?: {
    start?: string[];
    end?: string[];
  };
  blocks: Array<{
    type: string;
    variants?: string[],
    selectors: string[];
    parse?: ParserFn;
    params?: Record<string, unknown>;
    insertMode?: 'replace' | 'append' | 'prepend';
  }>;
}

export default function ImportRuleBuilder(rules: Partial<ImportRules> = {}): ImportRules {
  const {
    root = 'main',
    cleanup: {
      start: removeStart = [],
      end: removeEnd = [],
    } = {
      start: [],
      end: [],
    },
    blocks = [],
  } = rules;

  return {
    root,
    cleanup: {
      start: removeStart,
      end: removeEnd,
    },
    blocks
  };
}
