// Onboarding system for first-time users
import { getStorageValue, setStorageValue } from './storage.js';
import { STORAGE_KEYS } from './config.js';

const ONBOARDING_KEY = 'onboardingState';

/**
 * Default onboarding state
 */
const DEFAULT_ONBOARDING_STATE = {
  completed: false,
  currentStep: 0,
  skipped: false,
  completedSteps: [],
  seenTooltips: [],
  firstInstallDate: null,
  tutorialShown: false
};

/**
 * Onboarding steps configuration
 */
export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Shame Clock',
    description: 'Your personal accountability companion for mindful browsing.',
    icon: '⏰'
  },
  {
    id: 'sites',
    title: 'Choose Your Distractions',
    description: 'Select websites where you tend to lose track of time.',
    icon: '🌐'
  },
  {
    id: 'personas',
    title: 'Pick Your Voice',
    description: 'Choose who will remind you to stay focused.',
    icon: '🎭'
  },
  {
    id: 'settings',
    title: 'Set Your Limits',
    description: 'Configure how and when you want to be reminded.',
    icon: '⚙️'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'Start browsing mindfully. We\'ll keep you accountable.',
    icon: '🎉'
  }
];

/**
 * Get onboarding state
 * @returns {Promise<Object>}
 */
export async function getOnboardingState() {
  const state = await getStorageValue(ONBOARDING_KEY);
  return state || { ...DEFAULT_ONBOARDING_STATE, firstInstallDate: Date.now() };
}

/**
 * Save onboarding state
 * @param {Object} state
 * @returns {Promise<void>}
 */
export async function saveOnboardingState(state) {
  return setStorageValue(ONBOARDING_KEY, state);
}

/**
 * Check if onboarding is needed
 * @returns {Promise<boolean>}
 */
export async function needsOnboarding() {
  const state = await getOnboardingState();
  return !state.completed && !state.skipped;
}

/**
 * Check if this is a first-time user
 * @returns {Promise<boolean>}
 */
export async function isFirstTimeUser() {
  const state = await getOnboardingState();
  return state.firstInstallDate === null || !state.tutorialShown;
}

/**
 * Mark onboarding as completed
 * @returns {Promise<void>}
 */
export async function completeOnboarding() {
  const state = await getOnboardingState();
  state.completed = true;
  state.currentStep = ONBOARDING_STEPS.length - 1;
  state.tutorialShown = true;
  await saveOnboardingState(state);
}

/**
 * Skip onboarding
 * @returns {Promise<void>}
 */
export async function skipOnboarding() {
  const state = await getOnboardingState();
  state.skipped = true;
  state.tutorialShown = true;
  await saveOnboardingState(state);
}

/**
 * Advance to next onboarding step
 * @returns {Promise<number>} - New step index
 */
export async function nextOnboardingStep() {
  const state = await getOnboardingState();
  if (state.currentStep < ONBOARDING_STEPS.length - 1) {
    state.completedSteps.push(ONBOARDING_STEPS[state.currentStep].id);
    state.currentStep++;
    await saveOnboardingState(state);
  }
  return state.currentStep;
}

/**
 * Go to previous onboarding step
 * @returns {Promise<number>} - New step index
 */
export async function prevOnboardingStep() {
  const state = await getOnboardingState();
  if (state.currentStep > 0) {
    state.currentStep--;
    await saveOnboardingState(state);
  }
  return state.currentStep;
}

/**
 * Go to specific onboarding step
 * @param {number} step
 * @returns {Promise<void>}
 */
export async function goToOnboardingStep(step) {
  const state = await getOnboardingState();
  if (step >= 0 && step < ONBOARDING_STEPS.length) {
    state.currentStep = step;
    await saveOnboardingState(state);
  }
}

/**
 * Mark tooltip as seen
 * @param {string} tooltipId
 * @returns {Promise<void>}
 */
export async function markTooltipSeen(tooltipId) {
  const state = await getOnboardingState();
  if (!state.seenTooltips.includes(tooltipId)) {
    state.seenTooltips.push(tooltipId);
    await saveOnboardingState(state);
  }
}

/**
 * Check if tooltip has been seen
 * @param {string} tooltipId
 * @returns {Promise<boolean>}
 */
export async function hasSeenTooltip(tooltipId) {
  const state = await getOnboardingState();
  return state.seenTooltips.includes(tooltipId);
}

/**
 * Reset onboarding (for testing or re-showing)
 * @returns {Promise<void>}
 */
export async function resetOnboarding() {
  await saveOnboardingState({ ...DEFAULT_ONBOARDING_STATE, firstInstallDate: Date.now() });
}

/**
 * Get current step info
 * @returns {Promise<Object>}
 */
export async function getCurrentStepInfo() {
  const state = await getOnboardingState();
  return {
    step: state.currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    stepInfo: ONBOARDING_STEPS[state.currentStep],
    isFirst: state.currentStep === 0,
    isLast: state.currentStep === ONBOARDING_STEPS.length - 1,
    progress: ((state.currentStep + 1) / ONBOARDING_STEPS.length) * 100
  };
}

