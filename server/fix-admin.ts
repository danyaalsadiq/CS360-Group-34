import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { connectToMongoDB } from './db';
import { UserModel } from './models';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function fixAdminPassword() {
  try {
    // Connect to MongoDB
    await connectToMongoDB();
    
    console.log('Connected to MongoDB, looking for admin user...');
    
    // Find the admin user
    const adminUser = await UserModel.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('Admin user not found. Creating new admin user...');
      const newAdmin = new UserModel({
        username: 'admin',
        password: await hashPassword('admin1'),
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date()
      });
      
      await newAdmin.save();
      console.log('Created new admin user with username: admin, password: admin1');
    } else {
      console.log('Found existing admin user. Updating password...');
      adminUser.password = await hashPassword('admin1');
      await adminUser.save();
      console.log('Updated admin password to: admin1');
    }
    
    console.log('Admin user update completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin user:', error);
    process.exit(1);
  }
}

fixAdminPassword();