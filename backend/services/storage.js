const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '../database.json');

// Initialize empty DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    users: [],
    policies: [],
    payments: [],
    claims: [],
    triggers: []
  }, null, 2));
}

const readDb = () => {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    return { users: [], policies: [], payments: [], claims: [], triggers: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const Storage = {
  // Collection Helpers
  find: (collection, query = {}) => {
    const db = readDb();
    const items = db[collection] || [];
    return items.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },

  findOne: (collection, query = {}) => {
    const items = Storage.find(collection, query);
    return items.length > 0 ? items[0] : null;
  },

  save: (collection, item) => {
    const db = readDb();
    if (!db[collection]) db[collection] = [];
    
    // Auto-id if missing
    if (!item.id && !item._id) {
      item._id = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    
    db[collection].push(item);
    writeDb(db);
    return item;
  },

  findOneAndUpdate: (collection, query, update) => {
    const db = readDb();
    const index = db[collection].findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index !== -1) {
      db[collection][index] = { ...db[collection][index], ...update };
      writeDb(db);
      return db[collection][index];
    }
    return null;
  },
  
  countDocuments: (collection, query = {}) => {
    return Storage.find(collection, query).length;
  }
};

module.exports = Storage;
