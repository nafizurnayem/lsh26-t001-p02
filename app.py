"""
Root entrypoint for Streamlit Community Cloud.
Dispatches directly to streamlit_app/app.py.
"""
import sys
from pathlib import Path

# Add streamlit_app to sys.path
STREAMLIT_APP_DIR = Path(__file__).parent / "streamlit_app"
if str(STREAMLIT_APP_DIR) not in sys.path:
    sys.path.insert(0, str(STREAMLIT_APP_DIR))

# Execute app.py
from app import *
