const phraseMatches = (value, phrase) => String(value || '').trim().toUpperCase() === phrase;

export function evaluateResetEligibility({
  busy,
  authorized,
  authenticated = false,
  preview,
  selected = [],
  modules = [],
  scope = 'selected',
  confirmation,
  acknowledgement,
  globalConfirmation,
  now = Date.now(),
}) {
  const expiresAt = preview?.expiresAt ? new Date(preview.expiresAt).getTime() : Number.NaN;
  const previewExpired = !Number.isFinite(expiresAt) || expiresAt <= now;
  const warnings = preview?.dependencyWarnings || [];
  const blockers = warnings.filter((item) => Boolean(item.blocking));
  const resolvedDependencies = warnings.filter((item) => !item.preserved
    && (Number(item.resolvedRecords || 0) > 0 || (!item.blocking && item.records > 0)));
  const unresolvedDependencies = warnings.filter((item) => item.blocking || Number(item.unresolvedRecords || 0) > 0);
  const confirmationValid = phraseMatches(confirmation, 'RESET');
  const acknowledgementValid = scope === 'selected' || phraseMatches(acknowledgement, 'RESET ALL DATA');
  const globalConfirmationValid = scope !== 'global' || phraseMatches(globalConfirmation, 'RESET GLOBAL');
  const hasPreviewToken = Boolean(preview?.previewToken);
  const expectedPreviewModules = (scope === 'selected'
    ? selected
    : modules.filter((item) => item.available).map((item) => item.id)).slice().sort();
  const actualPreviewModules = (preview?.modules || []).map((item) => item.id).slice().sort();
  const previewMatchesSelection = hasPreviewToken && expectedPreviewModules.length === actualPreviewModules.length
    && expectedPreviewModules.every((id, index) => id === actualPreviewModules[index]);
  const disableReasons = [];

  if (busy) disableReasons.push('A data operation is already running.');
  if (!authorized) disableReasons.push(authenticated
    ? 'Only a Super Admin can execute a reset.'
    : 'Sign in as a Super Admin to execute a reset.');
  if (!preview || !hasPreviewToken || !previewMatchesSelection) disableReasons.push('Run a fresh preview for the current module selection.');
  else if (previewExpired) disableReasons.push('The reset preview expired. Run it again.');
  if (preview && blockers.length) disableReasons.push(`${blockers.length} blocking dependency ${blockers.length === 1 ? 'remains' : 'items remain'}; review the unresolved list below.`);
  if (!confirmationValid) disableReasons.push('Confirmation text is missing or incorrect. Enter RESET.');
  if (!acknowledgementValid) disableReasons.push('Full reset confirmation is missing or incorrect. Enter RESET ALL DATA.');
  if (!globalConfirmationValid) disableReasons.push('Global confirmation is missing or incorrect. Enter RESET GLOBAL.');

  return {
    previewExpired,
    warnings,
    blockers,
    resolvedDependencies,
    unresolvedDependencies,
    authorized,
    confirmationValid,
    acknowledgementValid,
    globalConfirmationValid,
    previewMatchesSelection,
    disableReasons,
    disabled: disableReasons.length > 0,
  };
}
