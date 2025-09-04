#!/bin/bash
mkdir -p /backup
pg_dump -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_DB_NAME > /backup/db_backup.sql
echo $PROJECT_ID
echo $INSTANCE_VERSION
gsutil cp /backup/db_backup.sql gs://$PROJECT_ID-superset-postgres-backups/${INSTANCE_VERSION:+${INSTANCE_VERSION}/}db_backup_$(date +%Y%m%d).sql