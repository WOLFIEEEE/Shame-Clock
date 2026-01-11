// Persona definitions and management
let personaPrompts = null;

/**
 * Load persona prompts from JSON file
 */
async function loadPersonaPrompts() {
  if (personaPrompts) {
    return personaPrompts;
  }
  
  try {
    const browserAPI = typeof chrome !== 'undefined' && chrome.runtime ? chrome : browser;
    const response = await fetch(browserAPI.runtime.getURL('data/persona-prompts.json'));
    personaPrompts = await response.json();
    return personaPrompts;
  } catch (error) {
    console.error('Error loading persona prompts:', error);
    return null;
  }
}

/**
 * Get a persona by ID
 * @param {string} personaId - Persona identifier
 * @returns {Promise<Object|null>}
 */
export async function getPersona(personaId) {
  const prompts = await loadPersonaPrompts();
  if (!prompts || !prompts[personaId]) {
    return null;
  }
  
  return prompts[personaId];
}

/**
 * Get all available personas
 * @returns {Promise<Array>}
 */
export async function getAllPersonas() {
  const prompts = await loadPersonaPrompts();
  if (!prompts) {
    return [];
  }
  
  return Object.keys(prompts).map(id => ({
    id: id,
    name: prompts[id].name,
    ...prompts[id]
  }));
}

/**
 * Get a random enabled persona based on weights
 * @param {Array} enabledPersonas - Array of enabled persona IDs
 * @param {Object} weights - Persona weights
 * @returns {Promise<string>} - Selected persona ID
 */
export async function getRandomPersona(enabledPersonas, weights) {
  if (!enabledPersonas || enabledPersonas.length === 0) {
    enabledPersonas = ['future_self', 'mom', 'historical_figures'];
  }
  
  // Calculate weighted random selection
  const totalWeight = enabledPersonas.reduce((sum, id) => {
    return sum + (weights[id] || 0.33);
  }, 0);
  
  let random = Math.random() * totalWeight;
  
  for (const personaId of enabledPersonas) {
    const weight = weights[personaId] || 0.33;
    random -= weight;
    if (random <= 0) {
      return personaId;
    }
  }
  
  // Fallback to first enabled persona
  return enabledPersonas[0];
}

/**
 * Get a template message for a persona
 * @param {string} personaId - Persona identifier
 * @param {Object} context - Context data (time, site, etc.)
 * @returns {Promise<string>}
 */
export async function getPersonaTemplate(personaId, context) {
  const persona = await getPersona(personaId);
  if (!persona || !persona.templates || persona.templates.length === 0) {
    return `You've spent ${context.time} on ${context.site}. Time to refocus!`;
  }
  
  // Select random template
  const template = persona.templates[Math.floor(Math.random() * persona.templates.length)];
  
  // Replace placeholders
  let message = template;
  message = message.replace(/{time}/g, context.time || 'some time');
  message = message.replace(/{site}/g, context.site || 'this site');
  
  if (context.suggestion && persona.suggestions) {
    const suggestion = persona.suggestions[Math.floor(Math.random() * persona.suggestions.length)];
    message = message.replace(/{suggestion}/g, suggestion);
  }
  
  return message;
}

