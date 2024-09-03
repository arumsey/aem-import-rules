import { expect } from 'chai';
import ImportRuleBuilder, { ImportRules } from '../src/rulebuilder.js';

describe('ImportRuleBuilder', () => {
  it('should build default import rules', () => {
    const builder = ImportRuleBuilder();
    const rules = builder.build();
    expect(rules.root).to.equal('main');
    expect(rules.cleanup).to.deep.equal({ start: [], end: [] });
    expect(rules.blocks).to.be.an('array').that.is.empty;
  });

  it('should add cleanup selectors', () => {
    const builder = ImportRuleBuilder();
    builder.addCleanup(['.remove-this'], 'start');
    const rules = builder.build();
    expect(rules.cleanup?.start).to.include('.remove-this');
  });

  it('should add block rules', () => {
    const builder = ImportRuleBuilder();
    const blockRule = { type: 'test-block', selectors: ['.test'] };
    builder.addBlock(blockRule);
    const rules = builder.build();
    expect(rules.blocks).to.deep.include(blockRule);
  });

  it('should replace existing block rules with the same type', () => {
    const customRules: Partial<ImportRules> = {
      root: 'custom-root',
      cleanup: { start: ['.custom-start'], end: ['.custom-end'] },
      blocks: [{ type: 'custom-block', selectors: ['.custom'] }]
    };
    const builder = ImportRuleBuilder(customRules);
    const blockRule1 = { type: 'test-block', selectors: ['.test1'] };
    const blockRule2 = { type: 'test-block', selectors: ['.test2'] };
    builder.addBlock(blockRule1);
    builder.addBlock(blockRule2);
    const rules = builder.build();
    expect(rules.blocks.length).to.equal(2);
    expect(rules.blocks[1]).to.deep.equal(blockRule2);
  });

  it('should merge custom rules with default rules', () => {
    const customRules: Partial<ImportRules> = {
      root: 'custom-root',
      cleanup: { start: ['.custom-start'], end: ['.custom-end'] },
      blocks: [{ type: 'custom-block', selectors: ['.custom'] }]
    };
    const builder = ImportRuleBuilder(customRules);
    const rules = builder.build();
    expect(rules.root).to.equal('custom-root');
    expect(rules.cleanup?.start).to.include('.custom-start');
    expect(rules.cleanup?.end).to.include('.custom-end');
    expect(rules.blocks).to.deep.include({ type: 'custom-block', selectors: ['.custom'] });
  });

  it('should set the root correctly', () => {
    const builder = ImportRuleBuilder();
    builder.setRoot('new-root');
    const rules = builder.build();
    expect(rules.root).to.equal('new-root');
  });

  it('should override the existing root', () => {
    const customRules: Partial<ImportRules> = { root: 'initial-root' };
    const builder = ImportRuleBuilder(customRules);
    builder.setRoot('overridden-root');
    const rules = builder.build();
    expect(rules.root).to.equal('overridden-root');
  });

  it('should handle setting root to an empty string', () => {
    const builder = ImportRuleBuilder();
    builder.setRoot('');
    const rules = builder.build();
    expect(rules.root).to.equal('');
  });

  it('should handle setting root to null', () => {
    const builder = ImportRuleBuilder();
    builder.setRoot(null as unknown as string);
    const rules = builder.build();
    expect(rules.root).to.be.null;
  });

  it('should handle setting root to undefined', () => {
    const builder = ImportRuleBuilder();
    builder.setRoot(undefined as unknown as string);
    const rules = builder.build();
    expect(rules.root).to.be.undefined;
  });
});
