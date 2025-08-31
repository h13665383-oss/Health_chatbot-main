// Database model definitions and operations

export class SymptomQuery {
  constructor(data) {
    this.id = data.id;
    this.user_lang = data.user_lang;
    this.original_text = data.original_text;
    this.english_text = data.english_text;
    this.classification = data.classification;
    this.advice = data.advice;
    this.confidence = data.confidence;
    this.created_at = data.created_at;
  }

  static async create(data) {
    const { dbRun } = await import('./db.js');
    
    const query = `
      INSERT INTO symptom_queries 
      (user_lang, original_text, english_text, classification, advice, confidence)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.user_lang,
      data.original_text,
      data.english_text,
      data.classification,
      data.advice,
      data.confidence
    ];
    
    const result = await dbRun(query, params);
    return result.id;
  }

  static async findById(id) {
    const { dbGet } = await import('./db.js');
    
    const query = 'SELECT * FROM symptom_queries WHERE id = ?';
    const row = await dbGet(query, [id]);
    
    return row ? new SymptomQuery(row) : null;
  }

  static async findAll(limit = 100) {
    const { dbAll } = await import('./db.js');
    
    const query = 'SELECT * FROM symptom_queries ORDER BY created_at DESC LIMIT ?';
    const rows = await dbAll(query, [limit]);
    
    return rows.map(row => new SymptomQuery(row));
  }
}

export class AwarenessAlert {
  constructor(data) {
    this.id = data.id;
    this.event = data.event;
    this.messages = typeof data.messages === 'string' 
      ? JSON.parse(data.messages) 
      : data.messages;
    this.created_at = data.created_at;
  }

  static async create(data) {
    const { dbRun } = await import('./db.js');
    
    const query = `
      INSERT INTO awareness_alerts (event, messages)
      VALUES (?, ?)
    `;
    
    const params = [
      data.event,
      JSON.stringify(data.messages)
    ];
    
    const result = await dbRun(query, params);
    return result.id;
  }

  static async findById(id) {
    const { dbGet } = await import('./db.js');
    
    const query = 'SELECT * FROM awareness_alerts WHERE id = ?';
    const row = await dbGet(query, [id]);
    
    return row ? new AwarenessAlert(row) : null;
  }

  static async findAll(limit = 100) {
    const { dbAll } = await import('./db.js');
    
    const query = 'SELECT * FROM awareness_alerts ORDER BY created_at DESC LIMIT ?';
    const rows = await dbAll(query, [limit]);
    
    return rows.map(row => new AwarenessAlert(row));
  }
}