import OpenAI from 'openai';

let openaiClient;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }
    
    openaiClient = new OpenAI({
      apiKey: apiKey
    });
  }
  
  return openaiClient;
}

export async function classifySymptoms(symptoms) {
  try {
    const client = getOpenAIClient();
    
    const prompt = `
You are a medical AI assistant. Analyze the following symptoms and classify them into one of these categories:

1. "Emergency" - Requires immediate medical attention (life-threatening symptoms)
2. "Doctor Visit" - Should see a doctor within 24-48 hours
3. "Self-care" - Can be managed with home remedies and over-the-counter medications

Symptoms: "${symptoms}"

Provide your response in the following JSON format:
{
  "classification": "Emergency|Doctor Visit|Self-care",
  "advice": "Brief medical advice (2-3 sentences)",
  "confidence": 0.95
}

Important: 
- Be conservative with classifications - when in doubt, recommend seeing a doctor
- Provide practical, safe advice
- Include confidence score (0-1)
- Keep advice concise but helpful
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful medical AI assistant. Always prioritize patient safety and provide conservative recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 300
    });

    const content = response.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      
      // Validate the response structure
      if (!result.classification || !result.advice || typeof result.confidence !== 'number') {
        throw new Error('Invalid AI response structure');
      }
      
      // Ensure classification is valid
      const validClassifications = ['Emergency', 'Doctor Visit', 'Self-care'];
      if (!validClassifications.includes(result.classification)) {
        result.classification = 'Doctor Visit'; // Default to safe option
      }
      
      // Ensure confidence is within valid range
      result.confidence = Math.max(0, Math.min(1, result.confidence));
      
      console.log(`🤖 AI Classification: ${result.classification} (confidence: ${result.confidence})`);
      return result;
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Fallback response
      return {
        classification: 'Doctor Visit',
        advice: 'Please consult with a healthcare professional for proper evaluation of your symptoms.',
        confidence: 0.5
      };
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback for API errors
    return {
      classification: 'Doctor Visit',
      advice: 'Unable to analyze symptoms at this time. Please consult with a healthcare professional.',
      confidence: 0.3
    };
  }
}

export async function generateAwarenessMessages(event) {
  try {
    const client = getOpenAIClient();
    
    const prompt = `
Generate public health awareness messages for the following event: "${event}"

Create messages in 3 languages:
1. English (en)
2. Hindi (hi) 
3. Bengali (bn)

Each message should be:
- Clear and informative
- Appropriate for public health communication
- 2-3 sentences long
- Include preventive measures if applicable

Provide your response in the following JSON format:
{
  "en": "English message here",
  "hi": "Hindi message here", 
  "bn": "Bengali message here"
}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a public health communication expert. Create clear, accurate, and culturally appropriate health messages.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      
      // Validate the response structure
      if (!result.en || !result.hi || !result.bn) {
        throw new Error('Invalid AI response structure - missing language messages');
      }
      
      console.log(`📢 Generated awareness messages for: ${event}`);
      return result;
      
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      
      // Fallback messages
      return {
        en: `Health Alert: ${event}. Please follow local health guidelines and consult healthcare authorities for more information.`,
        hi: `स्वास्थ्य चेतावनी: ${event}। कृपया स्थानीय स्वास्थ्य दिशानिर्देशों का पालन करें और अधिक जानकारी के लिए स्वास्थ्य अधिकारियों से संपर्क करें।`,
        bn: `স্বাস্থ্য সতর্কতা: ${event}। অনুগ্রহ করে স্থানীয় স্বাস্থ্য নির্দেশিকা অনুসরণ করুন এবং আরও তথ্যের জন্য স্বাস্থ্য কর্তৃপক্ষের সাথে যোগাযোগ করুন।`
      };
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback messages for API errors
    return {
      en: `Health Alert: ${event}. Please stay informed through official health channels.`,
      hi: `स्वास्थ्य चेतावनी: ${event}। कृपया आधिकारिक स्वास्थ्य चैनलों के माध्यम से जानकारी रखें।`,
      bn: `স্বাস্থ্য সতর্কতা: ${event}। অনুগ্রহ করে সরকারী স্বাস্থ্য চ্যানেলের মাধ্যমে অবগত থাকুন।`
    };
  }
}