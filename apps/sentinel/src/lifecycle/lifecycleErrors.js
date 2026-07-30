class LifecycleError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
  }
}

class LifecycleValidationError extends LifecycleError {}
class LifecycleConflictError extends LifecycleError {}
class GovernanceTransitionError extends LifecycleError {}

module.exports = {
  GovernanceTransitionError,
  LifecycleConflictError,
  LifecycleError,
  LifecycleValidationError
};
