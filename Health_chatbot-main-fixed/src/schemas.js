// Request and response schemas for validation

export function validateSymptomCheckRequest(data) {
  const errors = [];
  
  if (!data.language || typeof data.language !== 'string') {
    errors.push('language is required and must be a string');
  }
  
  if (!data.symptoms || typeof data.symptoms !== 'string') {
    errors.push('symptoms is required and must be a string');
  }
  
  if (data.language && !['en', 'hi', 'bn'].includes(data.language)) {
    errors.push('language must be one of: en, hi, bn');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAwarenessAlertRequest(data) {
  const errors = [];
  
  if (!data.event || typeof data.event !== 'string') {
    errors.push('event is required and must be a string');
  }
  
  if (data.event && data.event.trim().length < 5) {
    errors.push('event must be at least 5 characters long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function createSymptomCheckResponse(data) {
  return {
    classification: data.classification,
    advice: data.advice,
    confidence: data.confidence,
    timestamp: new Date().toISOString()
  };
}

export function createAwarenessAlertResponse(data) {
  return {
    messages: data.messages,
    timestamp: new Date().toISOString()
  };
}

export function createErrorResponse(message, details = null) {
  const response = {
    error: message,
    timestamp: new Date().toISOString()
  };
  
  if (details) {
    response.details = details;
  }
  
  return response;
}