const mongoose = require('mongoose');

async function checkExistingIds() {
  try {
    // Connect to the main database
    await mongoose.connect('mongodb+srv://nitopunk04o:IOilWo4osDam0vmN@erp.ua5qems.mongodb.net/institute_erp?retryWrites=true&w=majority&appName=erp');
    console.log('✅ Connected to MongoDB');
    
    // Access the school-specific database
    const schoolDbName = 'school_p';
    const schoolDb = mongoose.connection.useDb(schoolDbName);
    
    // Define a simple user schema for querying
    const userSchema = new mongoose.Schema({
      userId: String,
      role: String
    }, { strict: false });
    
    // Check different collections
    const collections = ['admins', 'teachers', 'students', 'parents'];
    
    console.log(`\n🏫 Checking existing user IDs in school database: ${schoolDbName}\n`);
    
    let allUserIds = [];
    
    for (const collectionName of collections) {
      try {
        const UserModel = schoolDb.model(`${collectionName}_temp`, userSchema, collectionName);
        const users = await UserModel.find({}).select('userId role').lean();
        
        console.log(`📊 ${collectionName.toUpperCase()} collection: ${users.length} users`);
        users.forEach(user => {
          if (user.userId) {
            console.log(`  📄 ${user.userId} (${user.role || 'unknown'})`);
            allUserIds.push(user.userId);
          }
        });
        console.log('');
      } catch (error) {
        console.log(`⚠️  Collection ${collectionName} not found or empty\n`);
      }
    }
    
    // Analyze ID patterns
    console.log(`\n📈 ANALYSIS:`);
    console.log(`Total user IDs found: ${allUserIds.length}\n`);
    
    // Group by role
    const roles = ['A', 'T', 'S', 'P'];
    roles.forEach(roleCode => {
      const pattern = `P-${roleCode}-`;
      const roleIds = allUserIds.filter(id => id.startsWith(pattern));
      
      let maxNumber = 0;
      roleIds.forEach(id => {
        const match = id.match(/P-[ATSP]-(\d{4})/);
        if (match) {
          const number = parseInt(match[1], 10);
          if (number > maxNumber) maxNumber = number;
        }
      });
      
      const nextNumber = maxNumber + 1;
      const nextId = `P-${roleCode}-${nextNumber.toString().padStart(4, '0')}`;
      
      const roleNames = { 'A': 'Admin', 'T': 'Teacher', 'S': 'Student', 'P': 'Parent' };
      console.log(`🆔 ${roleNames[roleCode]}: Found ${roleIds.length} users, highest: ${maxNumber}, next ID: ${nextId}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkExistingIds();
