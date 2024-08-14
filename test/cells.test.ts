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

import { assert } from 'chai';
import CellUtils, { BlockCells, BlockConfig } from '../src/cells';

describe('CellUtils.isBlockCellArray', () => {
  it('should return true for a valid BlockCellArray', () => {
    const blockCellArray: BlockCells = [['cell1', 'cell2'], ['cell3', 'cell4']];
    assert.isTrue(CellUtils.isBlockCellArray(blockCellArray));
  });

  it('should return false for a BlockConfig object', () => {
    const blockConfig: BlockCells = {
      key1: 'value1',
      key2: 'selector1',
    };
    assert.isFalse(CellUtils.isBlockCellArray(blockConfig));
  });

  it('should return false for a null value', () => {
    assert.isFalse(CellUtils.isBlockCellArray(null as unknown as BlockCells));
  });

  it('should return false for an undefined value', () => {
    assert.isFalse(CellUtils.isBlockCellArray(undefined as unknown as BlockCells));
  });

  it('should return false for a string', () => {
    assert.isFalse(CellUtils.isBlockCellArray('string' as unknown as BlockCells));
  });

  it('validate WebImporter usage', () => {
    assert.equal(WebImporter.CellUtils.isBlockCellArray([]), true);
  });
});

describe('CellUtils.isBlockConfig', () => {
  const blockConfig: BlockConfig = {
    key1: 'value1',
    key2: 'selector',
  };

  it('should return true for a valid BlockConfig object', () => {
    assert.isTrue(CellUtils.isBlockConfig(blockConfig));
  });

  it('validate WebImporter usage', () => {
    assert.equal(WebImporter.CellUtils.isBlockConfig(blockConfig), true);
  });

  it('should return false for an array', () => {
    const blockCells: BlockCells = [['cell1', 'cell2'], ['cell3', 'cell4']];
    assert.isFalse(CellUtils.isBlockConfig(blockCells));
  });

  it('should return false for a null value', () => {
    assert.isFalse(CellUtils.isBlockConfig(null as unknown as BlockCells));
  });

  it('should return false for an undefined value', () => {
    assert.isFalse(CellUtils.isBlockConfig(undefined as unknown as BlockCells));
  });

  it('should return false for a string', () => {
    assert.isFalse(CellUtils.isBlockConfig('test' as unknown as BlockCells));
  });
});
