// AI-powered email personalization
import { loadModel, isModelLoaded } from './model-loader.js';

let modelCache = null;

/**
 * Personalize email with recipient information
 * @param {string} template - Email template
 * @param {Object} recipient - Recipient information
 * @param {Object} research - Research data (optional)
 * @param {string} style - Personalization style
 * @returns {Promise<string>}
 */
export async function personalizeEmail(template, recipient, research = {}, style = 'professional') {
  try {
    // Basic personalization first
    let personalized = applyBasicPersonalization(template, recipient);
    
    // Check if AI is available
    if (!isModelLoaded() || !research || Object.keys(research).length === 0) {
      return personalized;
    }
    
    // Load model if needed
    const model = await loadModel();
    modelCache = model;
    
    // Build prompt for AI personalization
    const prompt = buildPersonalizationPrompt(personalized, recipient, research, style);
    
    // Generate personalized version
    const result = await model(prompt, {
      max_new_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      do_sample: true
    });
    
    let aiPersonalized = result[0].generated_text;
    
    // Extract just the email part
    if (aiPersonalized.includes(prompt)) {
      aiPersonalized = aiPersonalized.substring(aiPersonalized.indexOf(prompt) + prompt.length).trim();
    }
    
    // Clean up
    aiPersonalized = aiPersonalized.split('\n\n')[0].trim();
    
    // If result is good, use it; otherwise use basic
    if (aiPersonalized.length > 50 && aiPersonalized.length < 2000) {
      return aiPersonalized;
    }
    
    return personalized;
  } catch (error) {
    console.error('AI personalization error:', error);
    // Fallback to basic personalization
    return applyBasicPersonalization(template, recipient);
  }
}

/**
 * Apply basic personalization (template-based)
 */
function applyBasicPersonalization(template, recipient) {
  let personalized = template;
  
  const firstName = recipient.firstName || recipient.name?.split(' ')[0] || '';
  const lastName = recipient.lastName || recipient.name?.split(' ').slice(1).join(' ') || '';
  const fullName = recipient.name || '';
  const company = recipient.company || '';
  const jobTitle = recipient.jobTitle || recipient.title || '';
  
  // Replace placeholders
  personalized = personalized.replace(/\[FirstName\]/g, firstName);
  personalized = personalized.replace(/\[LastName\]/g, lastName);
  personalized = personalized.replace(/\[FullName\]/g, fullName);
  personalized = personalized.replace(/\[Name\]/g, fullName || firstName);
  personalized = personalized.replace(/\[Company\]/g, company);
  personalized = personalized.replace(/\[JobTitle\]/g, jobTitle);
  personalized = personalized.replace(/\[Title\]/g, jobTitle);
  
  // Remove empty brackets
  personalized = personalized.replace(/\[.*?\]/g, '');
  
  return personalized;
}

/**
 * Build personalization prompt for AI
 */
function buildPersonalizationPrompt(template, recipient, research, style) {
  const styleInstructions = {
    professional: 'Write in a professional, business-appropriate tone.',
    casual: 'Write in a casual, friendly tone.',
    friendly: 'Write in a warm, approachable tone.',
    formal: 'Write in a very formal, official tone.'
  };
  
  const instruction = styleInstructions[style] || styleInstructions.professional;
  
  let context = `Recipient: ${recipient.name || 'Unknown'}`;
  if (recipient.company) context += `\nCompany: ${recipient.company}`;
  if (recipient.jobTitle) context += `\nJob Title: ${recipient.jobTitle}`;
  
  if (research.linkedin) {
    context += `\nLinkedIn: ${JSON.stringify(research.linkedin).substring(0, 200)}`;
  }
  
  if (research.company) {
    context += `\nCompany Info: ${JSON.stringify(research.company).substring(0, 200)}`;
  }
  
  return `${instruction}\n\nPersonalize this email template for the recipient:\n\nTemplate:\n${template}\n\nContext:\n${context}\n\nPersonalized Email:`;
}

/**
 * Generate A/B variants
 * @param {string} baseEmail - Base email
 * @param {Object} recipient - Recipient info
 * @param {number} numVariants - Number of variants
 * @returns {Promise<Array<string>>}
 */
export async function generateVariants(baseEmail, recipient, numVariants = 3) {
  const variants = [];
  
  // Template-based variants
  const variantStyles = [
    { name: 'direct', desc: 'Direct, value-focused approach' },
    { name: 'relationship', desc: 'Relationship-building, softer approach' },
    { name: 'problem', desc: 'Problem-focused, pain point emphasis' },
    { name: 'social', desc: 'Social proof, case study approach' },
    { name: 'question', desc: 'Question-based, engagement-focused' }
  ];
  
  for (let i = 0; i < Math.min(numVariants, variantStyles.length); i++) {
    const style = variantStyles[i];
    try {
      const variant = await personalizeEmail(baseEmail, recipient, {}, style.name);
      variants.push(variant);
    } catch (error) {
      console.warn(`Failed to generate variant ${i + 1}:`, error);
    }
  }
  
  // If we don't have enough variants, duplicate the base
  while (variants.length < numVariants) {
    variants.push(baseEmail);
  }
  
  return variants;
}

/**
 * Generate subject lines
 * @param {string} emailBody - Email body
 * @param {Object} recipient - Recipient info
 * @param {number} numSubjects - Number of subject lines
 * @returns {Promise<Array<string>>}
 */
export async function generateSubjectLines(emailBody, recipient, numSubjects = 5) {
  const subjects = [];
  
  const firstName = recipient.firstName || recipient.name?.split(' ')[0] || '';
  const company = recipient.company || '';
  
  // Template-based subject lines
  const templates = [
    `Quick question about ${company}`,
    `Following up on ${company}`,
    `${firstName ? `Hi ${firstName}, ` : ''}Quick question`,
    `Re: ${company} - Quick question`,
    `Thought you'd find this interesting`,
    `Quick 15-minute call?`,
    `Following up - ${company}`,
    `${firstName ? `${firstName}, ` : ''}Quick question about your role`,
    `Re: ${company} opportunity`,
    `Quick question about ${company}`
  ];
  
  // Select unique templates
  const selected = templates.slice(0, numSubjects);
  subjects.push(...selected);
  
  // If we need more, generate variations
  while (subjects.length < numSubjects) {
    subjects.push(`Quick question about ${company || 'your company'}`);
  }
  
  return subjects.slice(0, numSubjects);
}

/**
 * Check if AI is available
 */
export async function isAIAvailable() {
  try {
    return isModelLoaded() || await loadModel() !== null;
  } catch (error) {
    return false;
  }
}

