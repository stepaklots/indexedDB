const objectStores = {
  user: {
    keyPath: 'id',
    autoIncrement: true,
  },
};

export const upgradeCallback = (db) => {
  for (const [name, options] of Object.entries(objectStores)) {
    if (!db.objectStoreNames.contains(name)) {
      db.createObjectStore(name, options);
    }
  }
};
