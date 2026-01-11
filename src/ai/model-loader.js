// Local AI model loader using Transformers.js
import { pipeline, env } from '@xenova/transformers';

// Configure transformers
// Note: First load will download from HuggingFace, then cache locally
// Subsequent loads use the cached model
env.allowLocalModels = true;
env.allowRemoteModels = true; // Need to allow remote for initial download
env.localModelPath = undefined; // Use default cache location

let model = null;
let modelLoading = false;
let modelLoadError = null;

/**
 * Load the local AI model
 * @returns {Promise<Object>} - Loaded model pipeline
 */
export async function loadModel() {
  if (model) {
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
  
  try {
    // Use a lightweight text generation model
    // For browser compatibility, we'll use a small model
    // Note: In production, you might want to use WebLLM or a quantized model
    console.log('Loading AI model...');
    
    // Using a text generation pipeline with a small model
    // This is a placeholder - in production, use a properly quantized model
    model = await pipeline(
      'text-generation',
      'Xenova/gpt2', // Small model for browser compatibility
      {
        quantized: true,
        progress_callback: (progress) => {
          if (progress.status === 'progress') {
            console.log(`Model loading: ${Math.round(progress.progress * 100)}%`);
          }
        }
      }
    );
    
    console.log('AI model loaded successfully');
    modelLoading = false;
    return model;
  } catch (error) {
    console.error('Error loading AI model:', error);
    modelLoadError = error;
    modelLoading = false;
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
 * Unload the model to free memory
 */
export function unloadModel() {
  if (model) {
    model = null;
    console.log('AI model unloaded');
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
    error: modelLoadError ? modelLoadError.message : null
  };
}

