// Shared in-memory cache hooks to prevent circular dependencies between admin-data and surveys modules

let surveysInvalidationCallbacks: Array<() => void> = [];

export function registerSurveysCacheInvalidator(callback: () => void) {
  surveysInvalidationCallbacks.push(callback);
}

export function invalidateSurveysCache() {
  for (const fn of surveysInvalidationCallbacks) {
    try {
      fn();
    } catch {}
  }
}
