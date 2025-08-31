import express from "express";
import { SymptomQuery } from "../models.js";

const router = express.Router();

// --- Language detection (simple, dependency-free) ---
function detectLanguage(text) {
  if (!text) return "en";
  // Check Unicode ranges
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasBengali = /[\u0980-\u09FF]/.test(text);
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (hasDevanagari) return "hi";
  if (hasBengali) return "bn";
  if (hasArabic) return "ur"; // basic fallback
  return "en";
}

// --- Symptom dictionary (keywords per language) ---
const SYMPTOMS = {
  fever: {
    weight: 3,
    keywords: {
      en: ["fever", "temperature", "high temp"],
      hi: ["बुखार", "तेज़ बुखार", "तापमान"],
      bn: ["জ্বর", "উচ্চ জ্বর", "তাপমাত্রা"],
    },
  },
  cough: {
    weight: 2,
    keywords: {
      en: ["cough", "coughing"],
      hi: ["खांसी", "खाँसी"],
      bn: ["কাশি"],
    },
  },
  sore_throat: {
    weight: 2,
    keywords: {
      en: ["sore throat", "throat pain"],
      hi: ["गले में दर्द", "खराश"],
      bn: ["গলা ব্যথা", "গলা খুশখুশে"],
    },
  },
  cold: {
    weight: 1,
    keywords: {
      en: ["cold", "runny nose", "sneeze", "sneezing", "blocked nose"],
      hi: ["जुकाम", "नाक बहना", "छींक", "भरी नाक"],
      bn: ["সর্দি", "নাক দিয়ে পানি পড়া", "হাঁচি", "বন্ধ নাক"],
    },
  },
  headache: {
    weight: 2,
    keywords: {
      en: ["headache", "migraine"],
      hi: ["सरदर्द", "माइग्रेन", "सिर दर्द"],
      bn: ["মাথাব্যথা", "মাইগ্রেন"],
    },
  },
  nausea: {
    weight: 3,
    keywords: {
      en: ["nausea", "nauseous"],
      hi: ["मिचली", "उल्टी जैसा"],
      bn: ["বমি বমি ভাব"],
    },
  },
  vomiting: {
    weight: 3,
    keywords: {
      en: ["vomit", "vomiting"],
      hi: ["उल्टी"],
      bn: ["বমি"],
    },
  },
  diarrhea: {
    weight: 3,
    keywords: {
      en: ["diarrhea", "loose motion"],
      hi: ["दस्त", "पतला"],
      bn: ["ডায়রিয়া", "পাতলা পায়খানা"],
    },
  },
  dizziness: {
    weight: 3,
    keywords: {
      en: ["dizzy", "dizziness", "lightheaded"],
      hi: ["चक्कर"],
      bn: ["মাথা ঘোরা"],
    },
  },
  chest_pain: {
    weight: 8, // red flag
    keywords: {
      en: ["chest pain", "pressure in chest"],
      hi: ["सीने में दर्द", "छाती में दबाव"],
      bn: ["বুকে ব্যথা", "বুকে চাপ"],
    },
    redFlag: true,
  },
  short_breath: {
    weight: 8, // red flag
    keywords: {
      en: ["shortness of breath", "hard to breathe", "breathless"],
      hi: ["सांस फूलना", "सांस लेने में तकलीफ"],
      bn: ["শ্বাসকষ্ট", "শ্বাস নিতে কষ্ট"],
    },
    redFlag: true,
  },
  seizure: {
    weight: 10, // red flag
    keywords: {
      en: ["seizure", "fits", "convulsion"],
      hi: ["दौरा", "मिर्गी"],
      bn: ["খিঁচুনি"],
    },
    redFlag: true,
  },
  unconscious: {
    weight: 10, // red flag
    keywords: {
      en: ["faint", "unconscious", "passed out"],
      hi: ["बेहोश"],
      bn: ["অচেতন"],
    },
    redFlag: true,
  },
};

// --- Advice templates per symptom & language ---
const T = {
  triage: {
    EMERGENCY: {
      en: "⚠️ Your symptoms appear serious. Please seek emergency medical care immediately (ER / 112).",
      hi: "⚠️ आपके लक्षण गंभीर लग रहे हैं। कृपया तुरंत आपातकालीन चिकित्सा सहायता लें (ER / 112)।",
      bn: "⚠️ আপনার উপসর্গগুলো গুরুতর মনে হচ্ছে। দয়া করে অবিলম্বে জরুরি চিকিৎসা নিন (ER / 112)।",
    },
    URGENT: {
      en: "Your condition may need a doctor within 24 hours.",
      hi: "आपकी स्थिति को 24 घंटे के भीतर डॉक्टर की जरूरत हो सकती है।",
      bn: "আপনার অবস্থার জন্য ২৪ ঘণ্টার মধ্যে ডাক্তার দেখানো দরকার হতে পারে।",
    },
    HOME: {
      en: "You can start with home care and monitor for 48 hours.",
      hi: "आप घर पर देखभाल से शुरुआत कर सकते हैं और 48 घंटे तक नज़र रखें।",
      bn: "আপনি বাড়িতে প্রাথমিক যত্ন শুরু করতে পারেন এবং ৪৮ ঘণ্টা পর্যবেক্ষণ করুন।",
    },
  },
  generic: {
    hydrate: { en: "Stay well hydrated.", hi: "पानी पर्याप्त मात्रा में पिएँ।", bn: "পর্যাপ্ত পানি পান করুন।" },
    rest: { en: "Get adequate rest and sleep.", hi: "पर्याप्त आराम और नींद लें।", bn: "যথেষ্ট বিশ্রাম ও ঘুম নিন।" },
    paracetamol: { en: "You may take paracetamol for fever/pain (as per label).", hi: "बुखार/दर्द के लिए पैरासिटामोल ले सकते हैं (निर्देशानुसार)।", bn: "জ্বর/ব্যথার জন্য প্যারাসিটামল নিতে পারেন (নির্দেশনা অনুযায়ী)।" },
    ors: { en: "Use oral rehydration salts (ORS) for dehydration/diarrhea.", hi: "डिहाइड्रेशन/दस्त के लिए ORS का उपयोग करें।", bn: "ডিহাইড্রেশন/ডায়রিয়ায় ORS ব্যবহার করুন।" },
    honeyTea: { en: "Warm fluids like honey-ginger tea can soothe cough.", hi: "शहद-अदरक की चाय जैसी गर्म तरल खांसी में आराम देती है।", bn: "মধু-আদার চা মতো গরম পানীয় কাশি উপশমে সাহায্য করে।" },
    saline: { en: "Steam inhalation or saline gargles may help.", hi: "भाप लेना या नमक के पानी से गरारे मददगार हो सकते हैं।", bn: "ভাপ নেয়া বা নুন-জলে গার্গল উপকারী হতে পারে।" },
    seekGP: { en: "If symptoms persist/worsen, see a doctor.", hi: "लक्षण बने रहें/बढ़ें तो डॉक्टर से मिलें।", bn: "লক্ষণ স্থায়ী হলে/বাড়লে ডাক্তার দেখান।" },
  },
  symptom: {
    fever: {
      en: ["Monitor temperature every 6–8 hours.", "Light clothing; sponge with lukewarm water if high fever."],
      hi: ["हर 6–8 घंटे में तापमान देखें।", "हल्के कपड़े पहनें; तेज बुखार में गुनगुने पानी से स्पंज करें।"],
      bn: ["প্রতি ৬–৮ ঘণ্টায় তাপমাত্রা মাপুন।", "হালকা পোশাক; বেশি জ্বর হলে কুসুম গরম পানিতে স্পঞ্জ করুন।"],
    },
    cough: {
      en: ["Avoid smoke/dust exposure.", "Consider throat lozenges."],
      hi: ["धुएँ/धूल से बचें।", "गले की गोली का उपयोग कर सकते हैं।"],
      bn: ["ধোঁয়া/ধূলা এড়িয়ে চলুন।", "গলার লজেন্স ব্যবহার করতে পারেন।"],
    },
    sore_throat: {
      en: ["Gargle with warm saline water twice daily."],
      hi: ["दिन में दो बार गुनगुने नमक पानी से गरारे करें।"],
      bn: ["দিনে দু’বার কুসুম গরম নুন-জলে গার্গল করুন।"],
    },
    cold: {
      en: ["Steam inhalation helps with nasal blockage."],
      hi: ["भाप लेना नाक बंद में लाभदायक है।"],
      bn: ["নাক বন্ধ থাকলে ভাপ নেয়া উপকারী।"],
    },
    headache: {
      en: ["Limit screen time and rest your eyes."],
      hi: ["स्क्रीन टाइम कम करें और आँखों को आराम दें।"],
      bn: ["স্ক্রিন-টাইম কমান, চোখকে বিশ্রাম দিন।"],
    },
    nausea: {
      en: ["Eat small, bland meals."],
      hi: ["थोड़ा-थोड़ा और सादा भोजन करें।"],
      bn: ["অল্প অল্প করে সাদাভাবে খাবার খান।"],
    },
    vomiting: {
      en: ["Sip fluids frequently to avoid dehydration."],
      hi: ["डिहाइड्रेशन से बचने के लिए थोड़ी-थोड़ी मात्रा में तरल लें।"],
      bn: ["ডিহাইড্রেশন এড়াতে অল্প অল্প করে তরল পান করুন।"],
    },
    diarrhea: {
      en: ["Avoid raw/milky/spicy foods for 24–48 hours."],
      hi: ["24–48 घंटे तक कच्चा/दूधीय/मसालेदार भोजन न लें।"],
      bn: ["২৪–৪৮ ঘণ্টা কাঁচা/দুধজাত/ঝাল খাবার এড়িয়ে চলুন।"],
    },
    dizziness: {
      en: ["Sit/lie down until the feeling passes; rise slowly."],
      hi: ["चक्कर आने पर बैठें/लेटें; धीरे-धीरे उठें।"],
      bn: ["মাথা ঘোরালে বসুন/শুয়ে পড়ুন; ধীরে ধীরে উঠুন।"],
    },
    chest_pain: {
      en: ["Do not exert yourself; arrange emergency evaluation."],
      hi: ["मेहनत वाले कार्य न करें; आपात जाँच की व्यवस्था करें।"],
      bn: ["শরীরচর্চা/শ্রম করবেন না; জরুরি পরীক্ষা করুন।"],
    },
    short_breath: {
      en: ["Sit upright; avoid lying flat; seek urgent care."],
      hi: ["सीधे बैठें; सीधा लेटने से बचें; तुरंत चिकित्सा लें।"],
      bn: ["সোজা হয়ে বসুন; সোজা শুতে যাবেন না; দ্রুত চিকিৎসা নিন।"],
    },
    seizure: {
      en: ["Protect from injury, turn to side, time the seizure."],
      hi: ["चोट से बचाएँ, करवट करवट करें, दौरे का समय नोट करें।"],
      bn: ["আঘাত থেকে বাঁচান, কাত করে দিন, খিঁচুনির সময় নোট করুন।"],
    },
    unconscious: {
      en: ["Check breathing; call emergency services."],
      hi: ["सांस जाँचें; आपातकालीन सेवा को कॉल करें।"],
      bn: ["শ্বাস চলছে কি না দেখুন; জরুরি সেবায় ফোন করুন।"],
    },
  },
};

function toLang(key, lang) {
  const d = T.generic[key];
  return d ? (d[lang] || d.en) : "";
}

function adviceForSymptom(symKey, lang) {
  const arr = T.symptom[symKey];
  return arr ? (arr[lang] || arr.en) : [];
}

// Normalize text for matching
function containsAny(text, arr) {
  if (!arr || !arr.length) return false;
  const low = text.toLowerCase();
  return arr.some((kw) => low.includes(kw.toLowerCase()));
}

// Core analyzer: detect symptoms, severity, red flags
function analyze(text, lang) {
  const detected = [];
  let score = 0;
  let hasRedFlag = false;
  for (const [key, def] of Object.entries(SYMPTOMS)) {
    const kws = def.keywords[lang] || def.keywords.en;
    if (containsAny(text, kws)) {
      detected.push(key);
      score += def.weight;
      if (def.redFlag) hasRedFlag = true;
    }
  }
  return { detected, score, hasRedFlag };
}

// Escalation by risk factors
function adjustTriageLevel(level, user) {
  // level: "HOME" | "URGENT" | "EMERGENCY"
  if (!user) return level;
  const risk = [];
  if (typeof user.age === "number" && (user.age >= 65 || user.age <= 5)) risk.push("age");
  if (user.pregnant === true) risk.push("pregnancy");
  const chronic = (user.conditions || []).map((s)=>String(s).toLowerCase());
  if (chronic.some(c => ["diabetes","heart","asthma","copd","kidney","cancer"].some(x=>c.includes(x)))) {
    risk.push("chronic");
  }
  if (risk.length === 0) return level;
  if (level === "HOME") return "URGENT";
  return level; // keep EMERGENCY/URGENT as is
}

function triage(score, hasRedFlag) {
  if (hasRedFlag) return "EMERGENCY";
  if (score >= 7) return "URGENT";
  return "HOME";
}

router.post("/", async (req, res) => {
  try {
    const { symptoms, language, user } = req.body || {};
    if (!symptoms || typeof symptoms !== "string") {
      return res.status(400).json({ error: "Field 'symptoms' (string) is required." });
    }
    // Decide language
    const lang = (language && ["en","hi","bn"].includes(language)) ? language : detectLanguage(symptoms);
    const { detected, score, hasRedFlag } = analyze(symptoms, lang);
    let level = triage(score, hasRedFlag);
    level = adjustTriageLevel(level, user);

    // Build advice
    const lines = [];
    if (level === "EMERGENCY") {
      lines.push(T.triage.EMERGENCY[lang] || T.triage.EMERGENCY.en);
    } else if (level === "URGENT") {
      lines.push(T.triage.URGENT[lang] || T.triage.URGENT.en);
    } else {
      lines.push(T.triage.HOME[lang] || T.triage.HOME.en);
    }

    // Symptom-specific advice
    const unique = new Set();
    for (const s of detected) {
      for (const tip of adviceForSymptom(s, lang)) {
        unique.add(tip);
      }
    }
    // Generic supportive advice
    unique.add(toLang("hydrate", lang));
    unique.add(toLang("rest", lang));
    if (detected.includes("fever")) unique.add(toLang("paracetamol", lang));
    if (detected.includes("diarrhea") || detected.includes("vomiting")) unique.add(toLang("ors", lang));
    if (detected.includes("cough") || detected.includes("sore_throat") || detected.includes("cold")) {
      unique.add(toLang("honeyTea", lang));
      unique.add(toLang("saline", lang));
    }
    unique.add(toLang("seekGP", lang));

    const advice = Array.from(unique);

    // Save to DB (best effort)
    try {
      await SymptomQuery.create({
        user_lang: lang,
        original_text: symptoms,
        english_text: symptoms, // no external translation used
        classification: JSON.stringify({ detected, score, level }),
        advice: JSON.stringify(advice),
        confidence: Math.min(1, Math.round((score / 10) * 100) / 100), // rough
      });
    } catch (e) {
      console.warn("DB log failed (non-fatal):", e?.message || e);
    }

    return res.json({
      language: lang,
      level,
      detected,
      score,
      advice,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("❌ Error in /api/symptom-check:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
