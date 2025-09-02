# 🔄 Database Migration: ACS_DB → CRM_DB

**Date:** August 30, 2025  
**Purpose:** Rename database from `acs_db` to `crm_db` and update user credentials  
**Status:** ✅ READY TO EXECUTE  

---

## 📋 Migration Overview

### **Current Configuration:**
- Database: `acs_db`
- User: `acs_user`
- Password: `acs_password`

### **New Configuration:**
- Database: `crm_db`
- User: `crm_user`
- Password: `crm_secure_password_2025`

---

## 🔧 Migration Steps

### **Step 1: Create New Database and User**

```sql
-- Connect as superuser (postgres)
-- Create new user
CREATE USER crm_user WITH PASSWORD 'crm_secure_password_2025';

-- Create new database
CREATE DATABASE crm_db OWNER crm_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
GRANT CREATE ON SCHEMA public TO crm_user;
GRANT USAGE ON SCHEMA public TO crm_user;
```

### **Step 2: Export Data from ACS_DB**

```bash
# Export schema and data from acs_db
pg_dump "postgresql://acs_user:acs_password@localhost:5432/acs_db" \
  --clean --create --if-exists \
  --file=acs_db_backup.sql

# Alternative: Export only data (if schema already exists)
pg_dump "postgresql://acs_user:acs_password@localhost:5432/acs_db" \
  --data-only --inserts \
  --file=acs_db_data_only.sql
```

### **Step 3: Import Data to CRM_DB**

```bash
# Import complete database
psql "postgresql://crm_user:crm_secure_password_2025@localhost:5432/crm_db" \
  -f acs_db_backup.sql

# Fix ownership issues
psql "postgresql://crm_user:crm_secure_password_2025@localhost:5432/crm_db" \
  -c "REASSIGN OWNED BY acs_user TO crm_user;"
```

### **Step 4: Update Application Configuration**

Update `.env` file:
```bash
# Old configuration
# DATABASE_URL="postgresql://acs_user:acs_password@localhost:5432/acs_db"

# New configuration
DATABASE_URL="postgresql://crm_user:crm_secure_password_2025@localhost:5432/crm_db"
```

---

## 🚀 Automated Migration Script

### **Complete Migration Script:**

```bash
#!/bin/bash
# Database Migration Script: ACS_DB → CRM_DB

set -e  # Exit on any error

echo "🔄 Starting database migration from acs_db to crm_db..."

# Configuration
OLD_DB_URL="postgresql://acs_user:acs_password@localhost:5432/acs_db"
NEW_DB_URL="postgresql://crm_user:crm_secure_password_2025@localhost:5432/crm_db"
POSTGRES_URL="postgresql://postgres@localhost:5432/postgres"
BACKUP_FILE="acs_db_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "📦 Step 1: Creating backup of acs_db..."
pg_dump "$OLD_DB_URL" --clean --create --if-exists --file="$BACKUP_FILE"
echo "✅ Backup created: $BACKUP_FILE"

echo "👤 Step 2: Creating new user and database..."
psql "$POSTGRES_URL" << EOF
-- Create new user
CREATE USER crm_user WITH PASSWORD 'crm_secure_password_2025';

-- Create new database
CREATE DATABASE crm_db OWNER crm_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;
GRANT CREATE ON SCHEMA public TO crm_user;
GRANT USAGE ON SCHEMA public TO crm_user;
EOF
echo "✅ New user and database created"

echo "📥 Step 3: Importing data to crm_db..."
# Modify backup file to use new user
sed -i.bak 's/acs_user/crm_user/g' "$BACKUP_FILE"

# Import to new database
psql "$NEW_DB_URL" -f "$BACKUP_FILE"
echo "✅ Data imported successfully"

echo "🔧 Step 4: Fixing ownership and permissions..."
psql "$NEW_DB_URL" << EOF
-- Fix any remaining ownership issues
REASSIGN OWNED BY acs_user TO crm_user;

-- Grant all necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO crm_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO crm_user;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO crm_user;
EOF
echo "✅ Ownership and permissions fixed"

echo "🧪 Step 5: Verifying migration..."
TABLE_COUNT=$(psql "$NEW_DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ Tables in new database: $TABLE_COUNT"

USER_COUNT=$(psql "$NEW_DB_URL" -t -c "SELECT COUNT(*) FROM users;")
echo "✅ Users in new database: $USER_COUNT"

echo "🎉 Migration completed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env file with new DATABASE_URL"
echo "2. Restart application services"
echo "3. Test application functionality"
echo "4. Remove old database after verification"
echo ""
echo "🔗 New DATABASE_URL:"
echo "DATABASE_URL=\"postgresql://crm_user:crm_secure_password_2025@localhost:5432/crm_db\""
```

---

## 📁 Files to Update

### **1. Backend Environment (.env)**
```bash
# Update CRM-BACKEND/.env
DATABASE_URL="postgresql://crm_user:crm_secure_password_2025@localhost:5432/crm_db"
```

### **2. Docker Configuration (if applicable)**
```yaml
# Update docker-compose.yml
environment:
  - DATABASE_URL=postgresql://crm_user:crm_secure_password_2025@localhost:5432/crm_db
```

### **3. Documentation Updates**
- Update README.md with new database credentials
- Update deployment documentation
- Update development setup instructions

---

## ✅ Verification Checklist

After migration, verify:

- [ ] New database `crm_db` exists
- [ ] New user `crm_user` has proper permissions
- [ ] All tables migrated successfully
- [ ] All data migrated correctly
- [ ] Performance monitoring tables exist
- [ ] Application connects successfully
- [ ] All API endpoints work
- [ ] Authentication works
- [ ] File uploads work
- [ ] WebSocket connections work

---

## 🔒 Security Considerations

### **Password Security:**
- New password: `crm_secure_password_2025`
- Consider using environment-specific passwords
- Use strong passwords in production
- Rotate passwords regularly

### **Access Control:**
- Limit database user permissions
- Use connection pooling
- Enable SSL in production
- Monitor database access logs

---

## 🗑️ Cleanup (After Verification)

Once migration is verified and application is working:

```sql
-- Connect as superuser
-- Drop old database and user
DROP DATABASE IF EXISTS acs_db;
DROP USER IF EXISTS acs_user;
```

```bash
# Remove backup files (optional)
rm acs_db_backup_*.sql
rm acs_db_backup_*.sql.bak
```

---

## 🚨 Rollback Plan

If migration fails:

1. **Stop application services**
2. **Restore from backup:**
   ```bash
   psql "$OLD_DB_URL" -f "$BACKUP_FILE.bak"
   ```
3. **Revert .env changes**
4. **Restart services**

---

**Migration Status: ✅ READY TO EXECUTE**  
**Estimated Time: 5-10 minutes**  
**Downtime Required: Yes (during data migration)**
