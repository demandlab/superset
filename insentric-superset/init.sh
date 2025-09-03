#!/bin/bash

# Run database migrations and initialize Superset (if necessary)
superset db upgrade
superset init

superset fab create-admin --username "$ADMIN_USERNAME" --firstname Insentric --lastname Admin --email "$ADMIN_EMAIL" --password "$ADMIN_PASSWORD"

superset fab import-roles --path "/roles.json"