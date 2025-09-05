#!/usr/bin/env node

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'acs_user',
  host: 'localhost',
  database: 'acs_db',
  password: 'acs_password',
  port: 5432,
});

async function resetUserPassword(username, newPassword) {
  try {
    console.log(`🔄 Resetting password for user: ${username}`);
    
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT id, name, username, email FROM users WHERE username = $1',
      [username]
    );
    
    if (userCheck.rows.length === 0) {
      console.log(`❌ User '${username}' not found`);
      return false;
    }
    
    const user = userCheck.rows[0];
    console.log(`👤 Found user: ${user.name} (${user.email})`);
    
    // Hash the new password
    console.log('🔐 Hashing new password...');
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the password in database
    const updateResult = await pool.query(
      'UPDATE users SET "passwordHash" = $1, password = $1, "updatedAt" = NOW() WHERE username = $2 RETURNING id',
      [hashedPassword, username]
    );
    
    if (updateResult.rows.length > 0) {
      console.log('✅ Password reset successfully!');
      console.log(`📧 User: ${user.name} (${username})`);
      console.log(`🔑 New password: ${newPassword}`);
      return true;
    } else {
      console.log('❌ Failed to update password');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    return false;
  }
}

async function listUsers() {
  try {
    console.log('👥 Available users:');
    const result = await pool.query(
      'SELECT id, name, username, email, role, "isActive" FROM users ORDER BY name'
    );
    
    console.log('\n📋 User List:');
    console.log('─'.repeat(80));
    console.log('Name'.padEnd(20) + 'Username'.padEnd(15) + 'Email'.padEnd(25) + 'Role'.padEnd(15) + 'Active');
    console.log('─'.repeat(80));
    
    result.rows.forEach(user => {
      console.log(
        user.name.padEnd(20) + 
        user.username.padEnd(15) + 
        user.email.padEnd(25) + 
        user.role.padEnd(15) + 
        (user.isActive ? '✅' : '❌')
      );
    });
    console.log('─'.repeat(80));
    
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log('🔐 User Password Reset Tool');
    console.log('');
    console.log('Usage:');
    console.log('  node reset-user-password.js <username> <new-password>');
    console.log('  node reset-user-password.js --list');
    console.log('');
    console.log('Examples:');
    console.log('  node reset-user-password.js john.smith newpassword123');
    console.log('  node reset-user-password.js nikhil.parab password123');
    console.log('  node reset-user-password.js --list');
    console.log('');
    process.exit(0);
  }
  
  if (args[0] === '--list' || args[0] === '-l') {
    await listUsers();
    process.exit(0);
  }
  
  if (args.length < 2) {
    console.log('❌ Error: Both username and new password are required');
    console.log('Usage: node reset-user-password.js <username> <new-password>');
    process.exit(1);
  }
  
  const [username, newPassword] = args;
  
  if (newPassword.length < 6) {
    console.log('❌ Error: Password must be at least 6 characters long');
    process.exit(1);
  }
  
  const success = await resetUserPassword(username, newPassword);
  
  await pool.end();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
