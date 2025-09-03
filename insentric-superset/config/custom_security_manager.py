import firebase_admin
import logging
from typing import Optional
import jwt

from firebase_admin import auth, credentials
from flask import request, make_response, redirect, session, g, flash, url_for
from flask_appbuilder.security.views import expose, AuthDBView, AuthOAuthView
from flask_appbuilder._compat import as_unicode
from flask_appbuilder.security.utils import generate_random_string
from superset.security import SupersetSecurityManager
from flask_login import login_user
from urllib.parse import urlparse, urljoin
from werkzeug.wrappers import Response as WerkzeugResponse

# Initialize Firebase Admin SDK
cred = credentials.ApplicationDefault()
root_app = firebase_admin.initialize_app(cred, {
    'projectId': 'insentric-root',
    }, 'insentric-root')

# Checks if target URL is safe by ensuring it has the same netloc as the referrer URL
def is_safe_url(target: str) -> bool:
    ref_url = urlparse(request.host_url)
    test_url = urlparse(urljoin(request.host_url, target))

    # Ensure target URL is same domain and uses HTTP(S)
    return (
        test_url.scheme in ("http", "https")
        and test_url.netloc.endswith(ref_url.netloc)
    )

# Attemps to log the user in using the Firebase session cookie, if present
def login_with_admin_session(appbuilder, default_login):
    # Get the session from the cookie
    session = request.cookies.get('session')
    # If the session is present, verify it and log the user in. If not present or invalid, fall back to the default login view
    if session is not None:
        try:
            logging.info("session cookie found, verifying..")
            decoded_claims = auth.verify_session_cookie(session, check_revoked=True, app=root_app)

            logging.info(f"Decoded session: {decoded_claims}")
            user_email = decoded_claims.get('email')
            logging.info(f"User email from session: {user_email}")
            user = appbuilder.sm.find_user(email=user_email)
            if not user:
                return default_login()
            if user:
                login_user(user)
                redirect_url = request.args.get('redirect')
                if not redirect_url or not is_safe_url(redirect_url):
                    redirect_url = appbuilder.get_url_for_index
                return redirect(redirect_url)
            else:
                return default_login()
        except auth.InvalidSessionCookieError as e:
            logging.error(f"Invalid Firebase session: {e}")
            return default_login()
        except Exception as e:
            logging.error(f"Error verifying Firebase session: {e}")
            return default_login()
    else:
        return default_login()
        
def delete_admin_session_cookie(response):
    response.delete_cookie(
        key='session', 
        path='/', 
        domain='.insentric.net', 
        secure=True, 
        httponly=True, 
        samesite='Strict'
    )

class CustomAuthDBView(AuthDBView):
    @expose('/login/', methods=['GET', 'POST'])
    def login(self):
        return login_with_admin_session(self.appbuilder, super(CustomAuthDBView, self).login) 
    
    @expose('/logout/')
    def logout(self):
        response = make_response(redirect(self.appbuilder.get_url_for_login))
        delete_admin_session_cookie(response)
        # Call the superclass logout method to handle the rest of the logout process
        super().logout()
        return response

class CustomAuthOAuthView(AuthOAuthView):
    @expose("/login/")
    @expose("/login/<provider>")
    def login(self, provider: Optional[str] = None) -> WerkzeugResponse:
        logging.debug("Provider: %s", provider)
        if g.user is not None and g.user.is_authenticated:
            logging.debug("Already authenticated %s", g.user)
            return redirect(self.appbuilder.get_url_for_index)

        if provider is None:
            return login_with_admin_session(self.appbuilder, super(CustomAuthOAuthView, self).login)

        logging.debug("Going to call authorize for: %s", provider)
        random_state = generate_random_string()
        state = jwt.encode(
            request.args.to_dict(flat=False), random_state, algorithm="HS256"
        )
        session["oauth_state"] = random_state
        try:
            if provider == "twitter":
                return self.appbuilder.sm.oauth_remotes[provider].authorize_redirect(
                    redirect_uri=url_for(
                        ".oauth_authorized",
                        provider=provider,
                        _external=True,
                        state=state,
                    )
                )
            else:
                return self.appbuilder.sm.oauth_remotes[provider].authorize_redirect(
                    redirect_uri=url_for(
                        ".oauth_authorized", provider=provider, _external=True
                    ),
                    state=state.decode("ascii") if isinstance(state, bytes) else state,
                )
        except Exception as e:
            logging.error("Error on OAuth authorize: %s", e)
            flash(as_unicode(self.invalid_login_message), "warning")
            return redirect(self.appbuilder.get_url_for_index)
        
    @expose('/logout/')
    def logout(self):
        response = make_response(redirect(self.appbuilder.get_url_for_login))
        delete_admin_session_cookie(response)
        # Call the superclass logout method to handle the rest of the logout process
        super().logout()
        return response

class CustomSecurityManager(SupersetSecurityManager):
    authdbview = CustomAuthDBView
    authoauthview = CustomAuthOAuthView

    def __init__(self, appbuilder):
        super(CustomSecurityManager, self).__init__(appbuilder)
        appbuilder.get_app.before_request(self.refresh_session)

    @staticmethod
    def refresh_session():
        session.permanent = True
        session.modified = True

    def oauth_user_info(self, provider, response=None):
        
          if provider == "google":
               me = self.appbuilder.sm.oauth_remotes[provider].get("userinfo")
               data = me.json()
               logging.debug("User info from Google: %s", data)
               return {
                    "username": data.get("email"),
                    "first_name": data.get("given_name", ""),
                    "last_name": data.get("family_name", ""),
                    "email": data.get("email"),
               }
          else:
            return super(CustomSecurityManager, self).oauth_user_info(provider, response)