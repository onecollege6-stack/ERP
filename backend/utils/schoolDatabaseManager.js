const mongoose = require('mongoose');

class SchoolDatabaseManager {
  static connections = new Map();
  
  // Get or create connection to a school's database
  static async getSchoolConnection(schoolCode) {
    const dbName = `school_${schoolCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    
    if (this.connections.has(dbName)) {
      return this.connections.get(dbName);
    }
    
    const connection = mongoose.createConnection(
      `mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/${dbName}?retryWrites=true&w=majority&appName=erp`
    );
    
    await new Promise((resolve, reject) => {
      connection.once('open', resolve);
      connection.once('error', reject);
    });
    
    this.connections.set(dbName, connection);
    console.log(`🔌 Connected to school database: ${dbName}`);
    
    return connection;
  }
  
  // Create models for a specific school database
  static createSchoolModels(connection) {
    // Import schemas
    const userSchema = require('./User').schema;
    const classSchema = require('./Class').schema;
    const subjectSchema = require('./Subject').schema;
    
    return {
      User: connection.model('User', userSchema),
      Class: connection.model('Class', classSchema),
      Subject: connection.model('Subject', subjectSchema),
      // Add more models as needed
    };
  }
  
  // Generate unique user ID for a school
  static async generateUserId(schoolCode, role = 'user') {
    const connection = await this.getSchoolConnection(schoolCode);
    const collection = connection.collection('id_sequences');
    
    const sequenceDoc = await collection.findOneAndUpdate(
      { _id: `${role}_sequence` },
      { $inc: { sequence_value: 1 } },
      { returnDocument: 'after' }
    );
    
    if (!sequenceDoc.value) {
      // Create new sequence if it doesn't exist
      await collection.insertOne({
        _id: `${role}_sequence`,
        sequence_value: 1001,
        schoolCode: schoolCode
      });
      return `${schoolCode.toUpperCase()}${role.toUpperCase()}1001`;
    }
    
    return `${schoolCode.toUpperCase()}${role.toUpperCase()}${sequenceDoc.value.sequence_value}`;
  }
  
  // Close all school database connections
  static async closeAllConnections() {
    for (const [dbName, connection] of this.connections) {
      await connection.close();
      console.log(`🔌 Closed connection to: ${dbName}`);
    }
    this.connections.clear();
  }
  
  // Get database name for a school
  static getDatabaseName(schoolCode) {
    return `school_${schoolCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }
  
  // Check if school database exists
  static async databaseExists(schoolCode) {
    try {
      const connection = await this.getSchoolConnection(schoolCode);
      const collections = await connection.db.listCollections().toArray();
      return collections.length > 0;
    } catch (error) {
      return false;
    }
  }
}

module.exports = SchoolDatabaseManager;
