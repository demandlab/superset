import os
import firebase_admin
from firebase_admin import firestore, credentials

# --- Step 1: Initialize and Fetch Config ---
# This section connects to Firestore and gets your fiscal year start month.
# =========================================================================
cred = credentials.ApplicationDefault()
try:
    app = firebase_admin.initialize_app(cred)
except ValueError:
    app = firebase_admin.get_app()  # Avoid re-initializing if run in a persistent environment
db = firestore.client(app)

account_ref = db.collection("accounts").limit(1).get()
if not account_ref:
    raise ConnectionError("Could not fetch account from Firestore.")

account = account_ref[0].to_dict()
fiscal_year_config = account.get("fiscal_year", {})

if fiscal_year_config.get("custom"):
    FISCAL_START = fiscal_year_config["start_month"]
else:
    FISCAL_START = 1

if not 1 <= FISCAL_START <= 12:
    raise ValueError(f"Invalid fiscal start month: {FISCAL_START}. Must be 1–12.")
FISCAL_OFFSET = 13 - FISCAL_START  # for shifting into fiscal year