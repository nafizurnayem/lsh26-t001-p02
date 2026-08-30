import json
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import zoneinfo
import pandas as pd

DHAKA_TZ = zoneinfo.ZoneInfo("Asia/Dhaka")

def get_dhaka_today() -> str:
    """Returns today's date string (YYYY-MM-DD) in Asia/Dhaka timezone."""
    try:
        return datetime.now(DHAKA_TZ).strftime("%Y-%m-%d")
    except Exception:
        return date.today().strftime("%Y-%m-%d")

def parse_date(date_str: str) -> date:
    """Parses YYYY-MM-DD string into a date object."""
    return datetime.strptime(date_str, "%Y-%m-%d").date()

def days_until(expiry_str: str, today_str: str) -> int:
    """Calculates days remaining from today_str until expiry_str."""
    expiry = parse_date(expiry_str)
    today = parse_date(today_str)
    return (expiry - today).days

def classify_expiry(days_left: int) -> str:
    """
    Classifies expiry status based on standard hackathon rules:
    - days_left < 0: 'expired'
    - 0 <= days_left <= 30: 'expiring_30'
    - 31 <= days_left <= 90: 'expiring_90'
    - > 90: 'safe'
    """
    if days_left < 0:
        return "expired"
    elif days_left <= 30:
        return "expiring_30"
    elif days_left <= 90:
        return "expiring_90"
    else:
        return "safe"

def status_label(status: str) -> str:
    labels = {
        "expired": "🚨 Expired",
        "expiring_30": "⚠️ Expiring Soon (≤30d)",
        "expiring_90": "⏳ Expiring (31-90d)",
        "safe": "🛡️ Safe (>90d)"
    }
    return labels.get(status, status)

def load_public_dataset(filepath: str) -> Dict[str, Any]:
    """Loads P02 public dataset from JSON file."""
    path = Path(filepath)
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found at {filepath}")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def process_items(
    items: List[Dict[str, Any]], 
    today_str: str, 
    mark_returned_ids: Optional[List[str]] = None
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Processes inventory items:
    - calculates days left, status, stock value in BDT
    - applies mark_returned flags
    - generates summary KPIs
    """
    returned_set = set(mark_returned_ids or [])
    processed = []

    for item in items:
        item_id = str(item.get("id", ""))
        name = item.get("name", "")
        company = item.get("company", "")
        batch = item.get("batch", "")
        quantity = int(item.get("quantity", 0))
        
        # Handle unit_price_bdt as string or float
        unit_price = float(item.get("unit_price_bdt", 0.0))
        expiry_date = item.get("expiry") or item.get("expiry_date", "")
        
        is_returned = item_id in returned_set or bool(item.get("returned_at"))
        returned_at = item.get("returned_at") or (today_str if item_id in returned_set else None)

        days = days_until(expiry_date, today_str)
        status = classify_expiry(days)
        stock_value = round(quantity * unit_price, 2)

        processed.append({
            "id": item_id,
            "name": name,
            "company": company,
            "batch": batch,
            "quantity": quantity,
            "unit_price_bdt": unit_price,
            "expiry_date": expiry_date,
            "days_left": days,
            "status": status,
            "status_label": status_label(status),
            "stock_value_bdt": stock_value,
            "is_returned": is_returned,
            "returned_at": returned_at
        })

    df = pd.DataFrame(processed)
    
    # Active items are items not yet returned
    active_df = df[~df["is_returned"]] if not df.empty else df
    
    counts = {
        "expired": int((active_df["status"] == "expired").sum()) if not active_df.empty else 0,
        "expiring_30": int((active_df["status"] == "expiring_30").sum()) if not active_df.empty else 0,
        "expiring_90": int((active_df["status"] == "expiring_90").sum()) if not active_df.empty else 0,
        "safe": int((active_df["status"] == "safe").sum()) if not active_df.empty else 0,
        "returned": int(df["is_returned"].sum()) if not df.empty else 0,
    }

    expired_bdt = round(float(active_df[active_df["status"] == "expired"]["stock_value_bdt"].sum()), 2) if not active_df.empty else 0.0
    expiring_soon_bdt = round(float(active_df[active_df["status"] == "expiring_30"]["stock_value_bdt"].sum()), 2) if not active_df.empty else 0.0
    expiring_90_bdt = round(float(active_df[active_df["status"] == "expiring_90"]["stock_value_bdt"].sum()), 2) if not active_df.empty else 0.0
    safe_bdt = round(float(active_df[active_df["status"] == "safe"]["stock_value_bdt"].sum()), 2) if not active_df.empty else 0.0
    total_at_risk_bdt = round(expired_bdt + expiring_soon_bdt, 2)
    total_active_bdt = round(float(active_df["stock_value_bdt"].sum()), 2) if not active_df.empty else 0.0

    kpis = {
        "as_of_date": today_str,
        "total_items": len(df),
        "active_items": len(active_df),
        "counts": counts,
        "values": {
            "expired_bdt": expired_bdt,
            "expiring_soon_bdt": expiring_soon_bdt,
            "expiring_90_bdt": expiring_90_bdt,
            "safe_bdt": safe_bdt,
            "total_at_risk_bdt": total_at_risk_bdt,
            "total_active_bdt": total_active_bdt,
        }
    }

    return df, kpis
