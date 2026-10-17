import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

describe('admin dashboard workspace scrolling', () => {
  it('locks only the outer document while retaining the workspace main-pane scroller', () => {
    const css = postcss.parse(readFileSync('src/styles/input.css', 'utf8'));
    const screen = css.nodes.find((node): node is postcss.AtRule => node.type === 'atrule' && node.name === 'media' && node.params === 'screen');
    const screenRules = screen?.nodes?.filter((node): node is postcss.Rule => node.type === 'rule') || [];
    const rules = css.nodes.filter((node): node is postcss.Rule => node.type === 'rule');
    const outerLock = screenRules.find(rule => rule.selector === 'html:has(.workspace-shell)');
    const innerScroll = rules.find(rule => rule.selector === '.wk-main');

    const declarations = (rule: postcss.Rule | undefined) => rule?.nodes?.filter((node): node is postcss.Declaration => node.type === 'decl') || [];
    expect(screen).toBeDefined();
    expect(declarations(outerLock).find(declaration => declaration.prop === 'overflow')?.value).toBe('hidden');
    expect(declarations(innerScroll).find(declaration => declaration.prop === 'overflow-y')?.value).toBe('auto');
  });
});
