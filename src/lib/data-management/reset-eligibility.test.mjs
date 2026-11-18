import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateResetEligibility } from './reset-eligibility.mjs';

const validState = (overrides = {}) => ({
  busy: false,
  authorized: true,
  authenticated: true,
  preview: {
    previewToken: 'preview-token',
    expiresAt: new Date(2_000).toISOString(),
    modules: [{ id: 'employees' }],
    dependencyWarnings: [],
  },
  selected: ['employees'],
  modules: [{ id: 'employees', available: true }],
  scope: 'selected',
  confirmation: ' reset ',
  acknowledgement: '',
  globalConfirmation: '',
  now: 1_000,
  ...overrides,
});

test('enables reset after valid preview and exact confirmation when no blockers remain', () => {
  const state = evaluateResetEligibility(validState());
  assert.equal(state.disabled, false);
  assert.deepEqual(state.disableReasons, []);
});

test('informational and resolved warnings do not disable reset', () => {
  const state = evaluateResetEligibility(validState({
    preview: {
      ...validState().preview,
      dependencyWarnings: [{ model: 'customer', records: 1, resolvedRecords: 1, unresolvedRecords: 0, blocking: false }],
    },
  }));
  assert.equal(state.disabled, false);
  assert.equal(state.resolvedDependencies.length, 1);
  assert.equal(state.blockers.length, 0);
});

test('genuine blocking dependencies keep reset disabled', () => {
  const state = evaluateResetEligibility(validState({
    preview: {
      ...validState().preview,
      dependencyWarnings: [{ model: 'commission', records: 3, resolvedRecords: 1, unresolvedRecords: 2, crossTenantRecords: 2, blocking: true }],
    },
  }));
  assert.equal(state.disabled, true);
  assert.equal(state.blockers.length, 1);
  assert.ok(state.disableReasons.some((reason) => reason.includes('blocking dependency remains')));
});

test('missing or invalid previews and module mismatches keep reset disabled', () => {
  assert.equal(evaluateResetEligibility(validState({ preview: null })).disabled, true);
  assert.equal(evaluateResetEligibility(validState({ selected: ['employees', 'attendance'] })).previewMatchesSelection, false);
  assert.equal(evaluateResetEligibility(validState({ selected: ['employees', 'attendance'] })).disabled, true);
  assert.equal(evaluateResetEligibility(validState({ preview: { ...validState().preview, expiresAt: 'invalid' } })).previewExpired, true);
  assert.equal(evaluateResetEligibility(validState({ preview: { ...validState().preview, expiresAt: 'invalid' } })).disabled, true);
});

test('expiration disables an otherwise valid reset', () => {
  const state = evaluateResetEligibility(validState({
    preview: { ...validState().preview, expiresAt: new Date(1_000).toISOString() },
  }));
  assert.equal(state.previewExpired, true);
  assert.equal(state.disabled, true);
});

test('full-application and global resets require their additional acknowledgement phrases', () => {
  const modules = [{ id: 'employees', available: true }, { id: 'attendance', available: false }];
  const applicationState = evaluateResetEligibility(validState({
    scope: 'application',
    modules,
    preview: { ...validState().preview, modules: [{ id: 'employees' }] },
  }));
  assert.equal(applicationState.disabled, true);
  assert.ok(applicationState.disableReasons.some((reason) => reason.includes('RESET ALL DATA')));

  const globalState = evaluateResetEligibility(validState({
    scope: 'global',
    modules,
    preview: { ...validState().preview, modules: [{ id: 'employees' }] },
    acknowledgement: 'reset all data',
  }));
  assert.equal(globalState.disabled, true);
  assert.ok(globalState.disableReasons.some((reason) => reason.includes('RESET GLOBAL')));
});

test('authorization and running-operation state disable reset', () => {
  assert.equal(evaluateResetEligibility(validState({ busy: true })).disabled, true);
  const unauthorized = evaluateResetEligibility(validState({ authorized: false, authenticated: true }));
  assert.equal(unauthorized.disabled, true);
  assert.ok(unauthorized.disableReasons.some((reason) => reason.includes('Only a Super Admin')));
});

test('incorrect reset confirmation disables reset', () => {
  const state = evaluateResetEligibility(validState({ confirmation: 'DELETE' }));
  assert.equal(state.confirmationValid, false);
  assert.equal(state.disabled, true);
});
