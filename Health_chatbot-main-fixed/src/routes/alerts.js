import express from "express";

const router = express.Router();

const MSG = {
  en: (topic) => `Health awareness: ${topic}`,
  hi: (topic) => `स्वास्थ्य जागरूकता: ${topic}`,
  bn: (topic) => `স্বাস্থ্য সচেতনতা: ${topic}`,
};

function pickLang(lang) {
  if (["en","hi","bn"].includes(lang)) return lang;
  return "en";
}

router.post("/", (req, res) => {
  const { topic, language } = req.body || {};
  if (!topic) {
    return res.status(400).json({ error: "Field 'topic' is required." });
  }
  const lang = pickLang(language || "en");
  const message = MSG[lang](topic);
  res.json({ message, language: lang, topic, time: new Date().toISOString() });
});

export default router;
