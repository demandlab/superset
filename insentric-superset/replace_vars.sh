#!/bin/bash

echo "Replacing variables in superset_config.py"

GOOGLE_AUTH_CLIENT_SECRET_ESCAPED=$(printf '%s\n' "$GOOGLE_AUTH_CLIENT_SECRET" | sed -e 's/[\/&]/\\&/g')
GOOGLE_AUTH_CLIENT_ID_ESCAPED=$(printf '%s\n' "$GOOGLE_AUTH_CLIENT_ID" | sed -e 's/[\/&]/\\&/g')
SMTP_USER_ESCAPED=$(printf '%s\n' "$SMTP_USER" | sed -e 's/[\/&]/\\&/g')
SMTP_PASSWORD_ESCAPED=$(printf '%s\n' "$SMTP_PASSWORD" | sed -e 's/[\/&]/\\&/g')

sed -i "s/\$GOOGLE_AUTH_CLIENT_SECRET/${GOOGLE_AUTH_CLIENT_SECRET_ESCAPED}/g" /app/superset_config.py
sed -i "s/\$GOOGLE_AUTH_CLIENT_ID/${GOOGLE_AUTH_CLIENT_ID_ESCAPED}/g" /app/superset_config.py
sed -i "s/\$SMTP_USER/${SMTP_USER_ESCAPED}/g" /app/superset_config.py
sed -i "s/\$SMTP_PASSWORD/${SMTP_PASSWORD_ESCAPED}/g" /app/superset_config.py