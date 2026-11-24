import test from 'node:test';
import assert from 'node:assert/strict';
import { route } from './route.mjs';
const good = {cyclesUsed:1,cycleLimit:3,tests:'pass',staticChecks:'pass',review:'pass',findings:[]};
const f = {id:'F-1',owner:'frontend',kind:'repairable',requirement:'Reset page',evidence:'Check failed',nextAction:'Reset page'};
test('success awaits human approval, even at limit', () => assert.equal(route({...good,cyclesUsed:3}).action,'await_human_approval'));
test('requires independent review', () => assert.equal(route({...good,review:'not_run'}).action,'review'));
test('routes targeted repairs once', () => assert.deepEqual(route({...good,tests:'fail',review:'not_run',findings:[f,{...f,id:'F-2',owner:'api'},f]}).owners,['api','frontend']));
test('no fourth cycle', () => assert.equal(route({...good,cyclesUsed:3,review:'fail',findings:[f]}).action,'escalate'));
test('human decision wins over repair', () => assert.equal(route({...good,review:'fail',findings:[f,{...f,owner:'human',kind:'blocker'}]}).action,'escalate'));
test('missing, blocked or unclassified evidence fails closed', () => {
 for (const input of [null,{...good,tests:'not_run'},{...good,staticChecks:'blocked'},{...good,tests:'fail'},{...good,findings:[{owner:'api'}]}]) assert.equal(route(input).action,'escalate');
});
