// AI message generation
import { loadModel, isModelLoaded } from './model-loader.js';
import { getPersona, getRandomPersona, getPersonaTemplate } from './personas.js';
import { getConfig } from '../utils/storage.js';
import { DEFAULT_CONFIG } from '../utils/config.js';

let messageCache = [];
const MAX_CACHE_SIZE = 10;

/**
 * Format time in milliseconds to human-readable string
 * @param {number} ms - Milliseconds
 * @returns {string}
 */
function formatTime(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const seconds = Math.floor(ms / 1000);
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
}

/**
 * Generate AI message using local model
 * @param {string} personaId - Persona identifier
 * @param {Object} context - Context (domain, timeSpent, etc.)
 * @returns {Promise<string>}
 */
async function generateAIMessage(personaId, context) {
  try {
    const persona = await getPersona(personaId);
    if (!persona) {
      return await getPersonaTemplate(personaId, context);
    }
    
    // Check if model is available
    if (!isModelLoaded()) {
      // Fallback to template
      return await getPersonaTemplate(personaId, context);
    }
    
    const model = await loadModel();
    const systemPrompt = persona.system_prompt || '';
    const userPrompt = `Generate a brief, motivational message (2-3 sentences max) about spending ${context.time} on ${context.site}. Be ${persona.name.toLowerCase()}.`;
    
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // Generate text
    const result = await model(fullPrompt, {
      max_new_tokens: 100,
      temperature: 0.8,
      do_sample: true,
      top_p: 0.9
    });
    
    let message = result[0].generated_text;
    
    // Extract just the generated part (remove prompt)
    if (message.includes(fullPrompt)) {
      message = message.substring(message.indexOf(fullPrompt) + fullPrompt.length).trim();
    }
    
    // Clean up message
    message = message.split('\n')[0].trim();
    if (message.length === 0) {
      // Fallback to template
      return await getPersonaTemplate(personaId, context);
    }
    
    return message;
  } catch (error) {
    console.error('Error generating AI message:', error);
    // Fallback to template
    return await getPersonaTemplate(personaId, context);
  }
}

/**
 * Check if message is too similar to cached messages
 * @param {string} message - Message to check
 * @returns {boolean}
 */
function isMessageSimilar(message) {
  const threshold = 0.7; // Similarity threshold
  const words = message.toLowerCase().split(/\s+/);
  
  for (const cached of messageCache) {
    const cachedWords = cached.toLowerCase().split(/\s+/);
    const commonWords = words.filter(w => cachedWords.includes(w));
    const similarity = commonWords.length / Math.max(words.length, cachedWords.length);
    
    if (similarity > threshold) {
      return true;
    }
  }
  
  return false;
}

/**
 * Add message to cache
 * @param {string} message - Message to cache
 */
function addToCache(message) {
  messageCache.push(message);
  if (messageCache.length > MAX_CACHE_SIZE) {
    messageCache.shift(); // Remove oldest
  }
}

/**
 * Generate a guilt trip message
 * @param {string} domain - Domain name
 * @param {number} timeSpent - Time spent in milliseconds
 * @returns {Promise<string>}
 */
export async function generateMessage(domain, timeSpent) {
  const config = await getConfig();
  const enabledPersonas = config.enabledPersonas || DEFAULT_CONFIG.enabledPersonas;
  const personaWeights = config.personaWeights || DEFAULT_CONFIG.personaWeights;
  const useAI = config.aiEnabled !== false && config.useLocalAI !== false;
  
  // Select persona
  const personaId = await getRandomPersona(enabledPersonas, personaWeights);
  
  // Prepare context
  const context = {
    domain: domain,
    site: domain,
    time: formatTime(timeSpent),
    timeMs: timeSpent
  };
  
  let message;
  
  // Try AI generation if enabled
  if (useAI) {
    try {
      message = await generateAIMessage(personaId, context);
      
      // Check for similarity and regenerate if too similar
      let attempts = 0;
      while (isMessageSimilar(message) && attempts < 3) {
        message = await generateAIMessage(personaId, context);
        attempts++;
      }
    } catch (error) {
      console.error('AI generation failed, using template:', error);
      message = await getPersonaTemplate(personaId, context);
    }
  } else {
    // Use template
    message = await getPersonaTemplate(personaId, context);
  }
  
  // Add to cache
  addToCache(message);
  
  return {
    message: message,
    persona: personaId,
    timestamp: Date.now()
  };
}

