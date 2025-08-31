import axios from 'axios';

const BHASHINI_API_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';

// Language mappings for Bhashini API
const LANGUAGE_CODES = {
  'hi': 'hi',  // Hindi
  'bn': 'bn',  // Bengali
  'en': 'en'   // English
};

export async function translateText(text, sourceLang, targetLang) {
  try {
    // If source and target are the same, return original text
    if (sourceLang === targetLang) {
      return text;
    }

    // For demo purposes, we'll use a mock translation service
    // In production, replace this with actual Bhashini API calls
    const mockTranslations = await mockTranslationService(text, sourceLang, targetLang);
    
    console.log(`🔄 Translated "${text}" from ${sourceLang} to ${targetLang}`);
    return mockTranslations;
    
  } catch (error) {
    console.error('Translation error:', error);
    
    // Fallback: return original text if translation fails
    console.warn('⚠️ Translation failed, returning original text');
    return text;
  }
}

// Mock translation service for demonstration
// Replace with actual Bhashini API integration
async function mockTranslationService(text, sourceLang, targetLang) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock translations for common medical phrases
  const translations = {
    'hi-en': {
      'मुझे तेज बुखार है': 'I have high fever',
      'सिर दर्द हो रहा है': 'I have a headache',
      'पेट में दर्द है': 'I have stomach pain',
      'खांसी आ रही है': 'I have a cough',
      'सांस लेने में तकलीफ': 'I have breathing difficulty'
    },
    'en-hi': {
      'I have high fever': 'मुझे तेज बुखार है',
      'You should see a doctor immediately': 'आपको तुरंत डॉक्टर से मिलना चाहिए',
      'Take rest and drink plenty of fluids': 'आराम करें और खूब पानी पिएं',
      'This is an emergency situation': 'यह एक आपातकालीन स्थिति है',
      'Monitor your symptoms closely': 'अपने लक्षणों पर बारीकी से नज़र रखें'
    },
    'en-bn': {
      'I have high fever': 'আমার প্রচণ্ড জ্বর হয়েছে',
      'You should see a doctor immediately': 'আপনার তৎক্ষণাৎ ডাক্তার দেখানো উচিত',
      'Take rest and drink plenty of fluids': 'বিশ্রাম নিন এবং প্রচুর তরল পান করুন',
      'This is an emergency situation': 'এটি একটি জরুরি অবস্থা',
      'Monitor your symptoms closely': 'আপনার লক্ষণগুলি নিবিড়ভাবে পর্যবেক্ষণ করুন'
    }
  };
  
  const translationKey = `${sourceLang}-${targetLang}`;
  const translationMap = translations[translationKey];
  
  if (translationMap && translationMap[text]) {
    return translationMap[text];
  }
  
  // If no exact match, return a generic translation indicator
  return `[Translated from ${sourceLang} to ${targetLang}] ${text}`;
}

// Real Bhashini API integration (commented out for demo)
async function callBhashiniAPI(text, sourceLang, targetLang) {
  const apiKey = process.env.BHASHINI_KEY;
  
  if (!apiKey) {
    throw new Error('BHASHINI_KEY not configured');
  }
  
  const payload = {
    pipelineTasks: [
      {
        taskType: "translation",
        config: {
          language: {
            sourceLanguage: LANGUAGE_CODES[sourceLang],
            targetLanguage: LANGUAGE_CODES[targetLang]
          }
        }
      }
    ],
    inputData: {
      input: [
        {
          source: text
        }
      ]
    }
  };
  
  const response = await axios.post(BHASHINI_API_URL, payload, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  return response.data.pipelineResponse[0].output[0].target;
}