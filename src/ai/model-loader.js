// Local AI model loader using Transformers.js with enhanced UX
import { pipeline, env } from '@xenova/transformers';
import { setStorageValue, getStorageValue } from '../utils/storage.js';

const MODEL_STATUS_KEY = 'aiModelStatus';

// Configure transformers
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.localModelPath = undefined;

let model = null;
let modelLoading = false;
let modelLoadError = null;
let loadProgress = 0;
let progressListeners = [];

/**
 * Model status states
 */
export const ModelStatus = {
  NOT_LOADED: 'not_loaded',
  DOWNLOADING: 'downloading',
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};

/**
 * Get current model status from storage
 * @returns {Promise<Object>}
 */
export async function getModelStatusFromStorage() {
  const status = await getStorageValue(MODEL_STATUS_KEY);
  return status || {
    status: ModelStatus.NOT_LOADED,
    progress: 0,
    lastLoaded: null,
    error: null,
    modelName: 'Xenova/gpt2',
    estimatedSize: '115 MB'
  };
}

/**
 * Save model status to storage
 * @param {Object} status
 */
async function saveModelStatus(status) {
  await setStorageValue(MODEL_STATUS_KEY, status);
  // Notify listeners
  progressListeners.forEach(listener => listener(status));
}

/**
 * Add progress listener
 * @param {Function} listener
 * @returns {Function} - Cleanup function
 */
export function addProgressListener(listener) {
  progressListeners.push(listener);
  return () => {
    progressListeners = progressListeners.filter(l => l !== listener);
  };
}

/**
 * Load the local AI model with progress tracking
 * @param {Object} options
 * @returns {Promise<Object>} - Loaded model pipeline
 */
export async function loadModel(options = {}) {
  const { forceReload = false } = options;
  
  if (model && !forceReload) {
    return model;
  }
  
  if (modelLoading) {
    // Wait for ongoing load
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (model) return model;
    throw modelLoadError || new Error('Failed to load model');
  }
  
  modelLoading = true;
  modelLoadError = null;
  loadProgress = 0;
  
  const startTime = Date.now();
  
  await saveModelStatus({
    status: ModelStatus.DOWNLOADING,
    progress: 0,
    lastLoaded: null,
    error: null,
    modelName: 'Xenova/gpt2',
    estimatedSize: '115 MB',
    startTime
  });
  
  try {
    console.log('Loading AI model...');
    
    model = await pipeline(
      'text-generation',
      'Xenova/gpt2',
      {
        quantized: true,
        progress_callback: async (progress) => {
          if (progress.status === 'progress') {
            loadProgress = Math.round(progress.progress * 100);
            
            await saveModelStatus({
              status: ModelStatus.DOWNLOADING,
              progress: loadProgress,
              lastLoaded: null,
              error: null,
              modelName: 'Xenova/gpt2',
              estimatedSize: '115 MB',
              startTime,
              file: progress.file,
              loaded: progress.loaded,
              total: progress.total
            });
            
            console.log(`Model loading: ${loadProgress}%`);
          } else if (progress.status === 'ready') {
            await saveModelStatus({
              status: ModelStatus.LOADING,
              progress: 100,
              lastLoaded: null,
              error: null,
              modelName: 'Xenova/gpt2',
              estimatedSize: '115 MB',
              startTime
            });
          }
        }
      }
    );
    
    const loadTime = Date.now() - startTime;
    
    await saveModelStatus({
      status: ModelStatus.READY,
      progress: 100,
      lastLoaded: new Date().toISOString(),
      loadTimeMs: loadTime,
      error: null,
      modelName: 'Xenova/gpt2',
      estimatedSize: '115 MB'
    });
    
    console.log(`AI model loaded successfully in ${Math.round(loadTime / 1000)}s`);
    modelLoading = false;
    return model;
  } catch (error) {
    console.error('Error loading AI model:', error);
    modelLoadError = error;
    modelLoading = false;
    
    await saveModelStatus({
      status: ModelStatus.ERROR,
      progress: loadProgress,
      lastLoaded: null,
      error: error.message,
      modelName: 'Xenova/gpt2',
      estimatedSize: '115 MB'
    });
    
    throw error;
  }
}

/**
 * Check if model is loaded
 * @returns {boolean}
 */
export function isModelLoaded() {
  return model !== null;
}

/**
 * Check if model is loading
 * @returns {boolean}
 */
export function isModelLoading() {
  return modelLoading;
}

/**
 * Get current load progress
 * @returns {number}
 */
export function getLoadProgress() {
  return loadProgress;
}

/**
 * Unload the model to free memory
 */
export async function unloadModel() {
  if (model) {
    model = null;
    console.log('AI model unloaded');
    
    await saveModelStatus({
      status: ModelStatus.NOT_LOADED,
      progress: 0,
      lastLoaded: null,
      error: null,
      modelName: 'Xenova/gpt2',
      estimatedSize: '115 MB'
    });
  }
}

/**
 * Get model status
 * @returns {Object}
 */
export function getModelStatus() {
  return {
    loaded: model !== null,
    loading: modelLoading,
    progress: loadProgress,
    error: modelLoadError ? modelLoadError.message : null
  };
}

/**
 * Preload model in background
 * @returns {Promise<void>}
 */
export async function preloadModelInBackground() {
  // Load model without blocking
  loadModel().catch(error => {
    console.warn('Background model load failed:', error.message);
  });
}

/**
 * Clear model cache (requires browser restart to take effect)
 * @returns {Promise<void>}
 */
export async function clearModelCache() {
  // Clear IndexedDB cache for transformers.js
  if (typeof indexedDB !== 'undefined') {
    try {
      await new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase('transformers-cache');
        request.onsuccess = resolve;
        request.onerror = reject;
      });
      console.log('Model cache cleared');
    } catch (error) {
      console.error('Error clearing model cache:', error);
    }
  }
  
  // Unload current model
  await unloadModel();
}

/**
 * Get estimated download size
 * @returns {Object}
 */
export function getModelInfo() {
  return {
    name: 'GPT-2 Small (Quantized)',
    size: '~115 MB',
    description: 'A lightweight language model optimized for browser use.',
    capabilities: ['Text generation', 'Message completion'],
    requirements: {
      browser: 'Chrome 80+, Firefox 80+, Edge 80+',
      memory: '~200 MB RAM'
    }
  };
}

/**
 * Check if model should auto-load
 * @returns {Promise<boolean>}
 */
export async function shouldAutoLoad() {
  const status = await getModelStatusFromStorage();
  // Auto-load if it was previously loaded successfully
  return status.status === ModelStatus.READY || status.lastLoaded !== null;
}
