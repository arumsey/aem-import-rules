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

import {ParserFn} from './parsers/index.js';

export type TransformRule = {
  name: string;
};

export type BlockRule = {
  type: string;
  variants?: string[],
  selectors?: string[];
  parse?: ParserFn;
  params?: Record<string, unknown>;
  insertMode?: 'replace' | 'append' | 'prepend';
};

export type ImportRules = {
  root?: string;
  cleanup?: {
    start?: string[];
    end?: string[];
  };
  blocks: Array<BlockRule>;
  transformers?: Array<TransformRule>;
}

const ImportRuleBuilder = (rules: Partial<ImportRules> = {}) => {
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
    transformers = [],
  } = rules;

  let importRules: ImportRules = {
    root,
    cleanup: {
      start: removeStart,
      end: removeEnd,
    },
    blocks,
    transformers,
  };

  return {
    build: (): ImportRules => {
      return importRules;
    },
    setRoot: (root: string) => {
      importRules = {
        ...importRules,
        root,
      };
    },
    addCleanup: (selectors: string[], phase: keyof Required<ImportRules>['cleanup'] = 'start') => {
      const {
        cleanup: {
          start: removeStart = [],
          end: removeEnd = [],
        } = {
          start: [],
          end: [],
        },
      } = importRules;

      const updatedSet = new Set(phase === 'end' ? removeEnd : removeStart);
      selectors.forEach(selector => updatedSet.add(selector));

      importRules = {
        ...importRules,
        cleanup: {
          start: phase === 'start' ? Array.from(updatedSet) : removeStart,
          end: phase === 'end' ? Array.from(updatedSet) : removeEnd,
        },
      };
    },
    addBlock: (block: BlockRule) => {
      const {blocks: blockRules = []} = importRules;
      const filteredBlockRules = blockRules.filter(({type}) => type !== block.type);
      const matchingBlock = blockRules.find(({type}) => type === block.type);
      const newBlock = {
        ...matchingBlock,
        ...block,
      };
      // combine the selectors of matching block with new block without duplicates
      newBlock.selectors = [...new Set([...(matchingBlock?.selectors || []), ...(block?.selectors || [])])];
      newBlock.variants = [...new Set([...(matchingBlock?.variants || []), ...(block?.variants || [])])];
      importRules = {
        ...importRules,
        blocks: [...filteredBlockRules, newBlock],
      };
    },
    addTransformer: (transform: TransformRule) => {
      const {transformers: transformRules = []} = importRules;
      const filteredTransformRules = transformRules.filter(({name}) => name !== transform.name);
      importRules = {
        ...importRules,
        transformers: [...filteredTransformRules, transform],
      };
    },
    findBlock: (block: string) => {
      return importRules.blocks.find(({type}) => type === block);
    },
    findTransformer: (transformer: string) => {
      return importRules.transformers?.find(({name}) => name === transformer);
    },
  }
};

export default ImportRuleBuilder;
