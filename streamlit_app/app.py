import os
import sys
import json
from datetime import datetime, date
from pathlib import Path

# Add current directory to path for Cloud deployment compatibility
CURRENT_DIR = Path(__file__).parent.resolve()
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import requests

from expiry_engine import (
    get_dhaka_today,
    days_until,
    classify_expiry,
    status_label,
    load_public_dataset,
    process_items
)

# Page configuration
st.set_page_config(
    page_title="PharmaShelf AI | Expiry Check & Returns (P02)",
    page_icon="💊",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom UI styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    .main-title {
        font-size: 2.2rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    
    .subtitle {
        color: #64748b;
        font-size: 0.95rem;
        margin-bottom: 1.5rem;
    }
    
    .kpi-card {
        padding: 1.25rem 1.1rem;
        border-radius: 14px;
        color: white;
        box-shadow: 0 8px 24px -6px rgba(0,0,0,0.12);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        margin-bottom: 0.75rem;
    }
    .kpi-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px -6px rgba(0,0,0,0.18);
    }
    .kpi-label {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
        opacity: 0.9;
        margin-bottom: 0.35rem;
    }
    .kpi-value {
        font-size: 1.75rem;
        font-weight: 800;
        line-height: 1.1;
    }
    .kpi-sub {
        font-size: 0.8rem;
        opacity: 0.85;
        margin-top: 0.4rem;
        font-weight: 500;
    }
    
    .badge-expired { background-color: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    .badge-expiring30 { background-color: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    .badge-expiring90 { background-color: #e0f2fe; color: #075985; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    .badge-safe { background-color: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; }
    .badge-returned { background-color: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 9999px; font-weight: 600; font-size: 0.75rem; text-decoration: line-through; }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if "returned_item_ids" not in st.session_state:
    st.session_state.returned_item_ids = set()

# Helper to find dataset path
def find_dataset_file() -> Path:
    candidates = [
        Path(__file__).parent.parent / "P02_pharmacy_expiry_public.json",
        Path(__file__).parent / "P02_pharmacy_expiry_public.json",
        Path("P02_pharmacy_expiry_public.json"),
        Path("Pharmacy Expire Project/P02_pharmacy_expiry_public.json"),
    ]
    for p in candidates:
        if p.exists():
            return p.resolve()
    return Path("P02_pharmacy_expiry_public.json")

DATASET_PATH = find_dataset_file()

# Sidebar: Controls & Data Source
with st.sidebar:
    st.image("https://img.icons8.com/isometric/96/medicine-bottle.png", width=64)
    st.title("PharmaShelf Settings")
    st.caption("Team T001 | Problem P02")
    
    st.markdown("---")
    data_source = st.radio(
        "📁 Data Source",
        ["Public Benchmark Dataset (P02)", "Live Backend API", "Upload File (JSON/CSV)"],
        index=0
    )
    
    dataset_data = None
    items_raw = []
    default_today = get_dhaka_today()
    case_ids = []
    
    if data_source == "Public Benchmark Dataset (P02)":
        if DATASET_PATH.exists():
            try:
                dataset_data = load_public_dataset(str(DATASET_PATH))
                cases = dataset_data.get("cases", [])
                case_ids = [c["case_id"] for c in cases]
                
                selected_case_id = st.selectbox(
                    "Select Benchmark Case",
                    case_ids,
                    index=case_ids.index("PUB-12") if "PUB-12" in case_ids else 0
                )
                
                selected_case = next((c for c in cases if c["case_id"] == selected_case_id), cases[0])
                items_raw = selected_case.get("items", [])
                default_today = selected_case.get("today", default_today)
                mark_returned_preset = selected_case.get("mark_returned", [])
                
                # Preset returns if switched case
                if f"last_case_{selected_case_id}" not in st.session_state:
                    st.session_state.returned_item_ids = set(mark_returned_preset)
                    st.session_state[f"last_case_{selected_case_id}"] = True
                    
                st.info(f"Loaded **{len(items_raw)} items** from `{selected_case_id}` (Base Date: `{default_today}`)")
            except Exception as e:
                st.error(f"Error loading public dataset: {e}")
        else:
            st.error(f"Dataset file `{DATASET_PATH.name}` not found!")

    elif data_source == "Live Backend API":
        api_base = st.text_input("Backend API Base URL", "http://localhost:4000")
        try:
            res = requests.get(f"{api_base}/health", timeout=2)
            if res.status_code == 200:
                st.success("✅ Connected to Express Backend API")
                med_res = requests.get(f"{api_base}/api/medicines", timeout=3)
                if med_res.status_code == 200:
                    items_raw = med_res.json()
                    st.info(f"Loaded {len(items_raw)} records from API")
            else:
                st.warning("⚠️ Backend server returned non-200")
        except Exception:
            st.error("❌ Could not connect to Express API. Ensure backend is running (`npm run dev`).")

    elif data_source == "Upload File (JSON/CSV)":
        uploaded_file = st.file_uploader("Upload Inventory Data", type=["json", "csv"])
        if uploaded_file is not None:
            try:
                if uploaded_file.name.endswith(".json"):
                    content = json.load(uploaded_file)
                    if isinstance(content, dict) and "cases" in content:
                        items_raw = content["cases"][0].get("items", [])
                    elif isinstance(content, list):
                        items_raw = content
                    elif isinstance(content, dict) and "items" in content:
                        items_raw = content.get("items", [])
                elif uploaded_file.name.endswith(".csv"):
                    df_upload = pd.read_csv(uploaded_file)
                    items_raw = df_upload.to_dict(orient="records")
                st.success(f"Loaded {len(items_raw)} items from upload")
            except Exception as ex:
                st.error(f"Failed to parse file: {ex}")

    st.markdown("---")
    st.subheader("📅 Expiry Reference Date")
    override_date = st.date_input(
        "Calculate expiry as of ('Today')",
        value=datetime.strptime(default_today, "%Y-%m-%d").date() if default_today else date.today()
    )
    today_str = override_date.strftime("%Y-%m-%d")
    st.caption(f"Active reference date: `{today_str}` (Asia/Dhaka)")
    
    st.markdown("---")
    if st.button("🔄 Reset Returned Batches", use_container_width=True):
        st.session_state.returned_item_ids = set()
        st.rerun()

# Process data
df, kpis = process_items(items_raw, today_str, list(st.session_state.returned_item_ids))

# Main UI Header
col_header_left, col_header_right = st.columns([3, 1])
with col_header_left:
    st.markdown('<div class="main-title">💊 Pharmacy Expiry Shelf Check</div>', unsafe_allow_html=True)
    st.markdown(
        f'<div class="subtitle">Real-time Expiry Risk Audit, Batch Management & Vendor Returns | As of <b>{today_str}</b></div>',
        unsafe_allow_html=True
    )
with col_header_right:
    st.metric("Total Inventory Items", f"{kpis['total_items']:,}", delta=f"{kpis['active_items']} Active")

# KPI Summary Tiles
kpi1, kpi2, kpi3, kpi4, kpi5 = st.columns(5)

with kpi1:
    st.markdown(f"""
    <div class="kpi-card" style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);">
        <div class="kpi-label">🚨 Expired</div>
        <div class="kpi-value">{kpis['counts']['expired']}</div>
        <div class="kpi-sub">Loss: ৳{kpis['values']['expired_bdt']:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi2:
    st.markdown(f"""
    <div class="kpi-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
        <div class="kpi-label">⚠️ Expiring Soon (≤30d)</div>
        <div class="kpi-value">{kpis['counts']['expiring_30']}</div>
        <div class="kpi-sub">At-Risk: ৳{kpis['values']['expiring_soon_bdt']:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi3:
    st.markdown(f"""
    <div class="kpi-card" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);">
        <div class="kpi-label">⏳ Expiring (31–90d)</div>
        <div class="kpi-value">{kpis['counts']['expiring_90']}</div>
        <div class="kpi-sub">Value: ৳{kpis['values']['expiring_90_bdt']:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi4:
    st.markdown(f"""
    <div class="kpi-card" style="background: linear-gradient(135deg, #10b981 0%, #047857 100%);">
        <div class="kpi-label">🛡️ Safe Stock (&gt;90d)</div>
        <div class="kpi-value">{kpis['counts']['safe']}</div>
        <div class="kpi-sub">Safe Val: ৳{kpis['values']['safe_bdt']:,.2f}</div>
    </div>
    """, unsafe_allow_html=True)

with kpi5:
    st.markdown(f"""
    <div class="kpi-card" style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%);">
        <div class="kpi-label">💰 Total Value at Risk</div>
        <div class="kpi-value">৳{kpis['values']['total_at_risk_bdt']:,.2f}</div>
        <div class="kpi-sub">Returned: {kpis['counts']['returned']} items</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Visualizations Row
if not df.empty:
    tab_analytics, tab_shelf, tab_returns, tab_export = st.tabs([
        "📊 Visual Analytics & Risk",
        "📋 Interactive Shelf Check",
        "📦 Vendor Returns Management",
        "📥 Export & Audit Reports"
    ])

    with tab_analytics:
        col_c1, col_c2 = st.columns(2)
        
        with col_c1:
            st.subheader("Expiry Risk Distribution")
            status_df = pd.DataFrame([
                {"Status": "Expired (<0d)", "Count": kpis['counts']['expired'], "Value_BDT": kpis['values']['expired_bdt'], "Color": "#EF4444"},
                {"Status": "Expiring Soon (0-30d)", "Count": kpis['counts']['expiring_30'], "Value_BDT": kpis['values']['expiring_soon_bdt'], "Color": "#F59E0B"},
                {"Status": "Expiring Medium (31-90d)", "Count": kpis['counts']['expiring_90'], "Value_BDT": kpis['values']['expiring_90_bdt'], "Color": "#3B82F6"},
                {"Status": "Safe (>90d)", "Count": kpis['counts']['safe'], "Value_BDT": kpis['values']['safe_bdt'], "Color": "#10B981"},
            ])
            status_df = status_df[status_df["Count"] > 0]
            
            if not status_df.empty:
                fig_donut = px.pie(
                    status_df,
                    names="Status",
                    values="Count",
                    color="Status",
                    color_discrete_map={row["Status"]: row["Color"] for _, row in status_df.iterrows()},
                    hole=0.55,
                )
                fig_donut.update_traces(textposition='inside', textinfo='percent+label')
                fig_donut.update_layout(showlegend=False, margin=dict(t=10, b=10, l=10, r=10), height=320)
                st.plotly_chart(fig_donut, use_container_width=True)
            else:
                st.info("No active items to display.")

        with col_c2:
            st.subheader("At-Risk Stock Value by Manufacturer (BDT)")
            risk_df = df[df["status"].isin(["expired", "expiring_30"]) & (~df["is_returned"])]
            if not risk_df.empty:
                comp_risk = risk_df.groupby("company")["stock_value_bdt"].sum().reset_index()
                comp_risk = comp_risk.sort_values(by="stock_value_bdt", ascending=True)
                fig_bar = px.bar(
                    comp_risk,
                    x="stock_value_bdt",
                    y="company",
                    orientation="h",
                    labels={"stock_value_bdt": "At-Risk Value (৳)", "company": "Manufacturer"},
                    color="stock_value_bdt",
                    color_continuous_scale="Reds"
                )
                fig_bar.update_layout(coloraxis_showscale=False, margin=dict(t=10, b=10, l=10, r=10), height=320)
                st.plotly_chart(fig_bar, use_container_width=True)
            else:
                st.success("🎉 No high-risk or expired stock across all companies!")

        # Days left histogram
        st.subheader("Days-to-Expiry Timeline (Active Inventory)")
        active_items_df = df[~df["is_returned"]]
        if not active_items_df.empty:
            fig_hist = px.histogram(
                active_items_df,
                x="days_left",
                color="status_label",
                nbins=40,
                labels={"days_left": "Days Remaining Until Expiry", "count": "Medicine Batches"},
                color_discrete_map={
                    "🚨 Expired": "#EF4444",
                    "⚠️ Expiring Soon (≤30d)": "#F59E0B",
                    "⏳ Expiring (31-90d)": "#3B82F6",
                    "🛡️ Safe (>90d)": "#10B981"
                }
            )
            fig_hist.add_vline(x=0, line_dash="dash", line_color="red", annotation_text="Today")
            fig_hist.add_vline(x=30, line_dash="dot", line_color="orange", annotation_text="30 Days")
            fig_hist.add_vline(x=90, line_dash="dot", line_color="blue", annotation_text="90 Days")
            fig_hist.update_layout(margin=dict(t=20, b=10, l=10, r=10), height=280)
            st.plotly_chart(fig_hist, use_container_width=True)

    with tab_shelf:
        st.subheader("Shelf Check Inventory Table")
        
        col_f1, col_f2, col_f3 = st.columns([2, 1.5, 1.5])
        with col_f1:
            search_query = st.text_input("🔍 Search medicine name, brand, or batch...", "").strip().lower()
        with col_f2:
            companies = sorted(list(df["company"].unique()))
            selected_company = st.selectbox("Filter by Company", ["All Companies"] + companies)
        with col_f3:
            status_filter = st.selectbox(
                "Filter by Expiry Category",
                ["All Active", "🚨 Expired Only", "⚠️ Expiring Soon (≤30d)", "⏳ Expiring (31-90d)", "🛡️ Safe Only", "📦 Returned"]
            )

        # Filtering logic
        filtered_df = df.copy()
        if search_query:
            filtered_df = filtered_df[
                filtered_df["name"].str.lower().str.contains(search_query) |
                filtered_df["company"].str.lower().str.contains(search_query) |
                filtered_df["batch"].str.lower().str.contains(search_query) |
                filtered_df["id"].str.lower().str.contains(search_query)
            ]
        if selected_company != "All Companies":
            filtered_df = filtered_df[filtered_df["company"] == selected_company]
            
        if status_filter == "All Active":
            filtered_df = filtered_df[~filtered_df["is_returned"]]
        elif status_filter == "🚨 Expired Only":
            filtered_df = filtered_df[(filtered_df["status"] == "expired") & (~filtered_df["is_returned"])]
        elif status_filter == "⚠️ Expiring Soon (≤30d)":
            filtered_df = filtered_df[(filtered_df["status"] == "expiring_30") & (~filtered_df["is_returned"])]
        elif status_filter == "⏳ Expiring (31-90d)":
            filtered_df = filtered_df[(filtered_df["status"] == "expiring_90") & (~filtered_df["is_returned"])]
        elif status_filter == "🛡️ Safe Only":
            filtered_df = filtered_df[(filtered_df["status"] == "safe") & (~filtered_df["is_returned"])]
        elif status_filter == "📦 Returned":
            filtered_df = filtered_df[filtered_df["is_returned"]]

        st.caption(f"Showing {len(filtered_df)} matching batches")
        
        # Display formatted table
        display_cols = ["id", "name", "company", "batch", "quantity", "unit_price_bdt", "expiry_date", "days_left", "status_label", "stock_value_bdt", "is_returned"]
        st.dataframe(
            filtered_df[display_cols].rename(columns={
                "id": "Item ID",
                "name": "Medicine Name",
                "company": "Company",
                "batch": "Batch #",
                "quantity": "Qty",
                "unit_price_bdt": "Unit Price (৳)",
                "expiry_date": "Expiry Date",
                "days_left": "Days Left",
                "status_label": "Status",
                "stock_value_bdt": "Total Value (৳)",
                "is_returned": "Returned?"
            }),
            use_container_width=True,
            hide_index=True
        )

    with tab_returns:
        st.subheader("📦 Vendor Returns Action Center")
        st.write("Flag batches to return back to pharmaceutical distributors for credit/replacement.")
        
        # Selectable expired/expiring items for return
        actionable_df = df[~df["is_returned"] & df["status"].isin(["expired", "expiring_30"])].copy()
        
        if not actionable_df.empty:
            st.markdown(f"**{len(actionable_df)} batches eligible for vendor return:**")
            
            col_act1, col_act2 = st.columns([3, 1])
            with col_act1:
                items_to_return = st.multiselect(
                    "Select Batch IDs to Mark as Returned",
                    options=actionable_df["id"].tolist(),
                    format_func=lambda x: f"[{x}] {actionable_df[actionable_df['id']==x]['name'].values[0]} (Batch: {actionable_df[actionable_df['id']==x]['batch'].values[0]}) - ৳{actionable_df[actionable_df['id']==x]['stock_value_bdt'].values[0]}"
                )
            with col_act2:
                st.write("")
                st.write("")
                if st.button("✅ Process Return", type="primary", use_container_width=True):
                    if items_to_return:
                        for it in items_to_return:
                            st.session_state.returned_item_ids.add(it)
                        st.success(f"Successfully processed {len(items_to_return)} items for vendor return!")
                        st.rerun()
                    else:
                        st.warning("Please select at least one batch ID.")
        else:
            st.success("No unreturned expired or high-risk items remaining.")

        # Show returned log
        returned_df = df[df["is_returned"]]
        if not returned_df.empty:
            st.markdown("---")
            st.markdown(f"#### 📋 Returned Items Log ({len(returned_df)} batches)")
            st.dataframe(
                returned_df[["id", "name", "company", "batch", "quantity", "unit_price_bdt", "stock_value_bdt", "returned_at"]].rename(columns={
                    "id": "Item ID",
                    "name": "Medicine",
                    "company": "Company",
                    "batch": "Batch",
                    "quantity": "Qty",
                    "unit_price_bdt": "Unit Price (৳)",
                    "stock_value_bdt": "Recovered Value (৳)",
                    "returned_at": "Returned Date"
                }),
                use_container_width=True,
                hide_index=True
            )

    with tab_export:
        st.subheader("📥 Audit & Vendor Invoices Export")
        
        col_ex1, col_ex2 = st.columns(2)
        with col_ex1:
            st.markdown("#### Full Shelf Audit CSV")
            csv_all = df.to_csv(index=False).encode('utf-8')
            st.download_button(
                label="📄 Download Complete Shelf Audit (.CSV)",
                data=csv_all,
                file_name=f"pharmacy_shelf_audit_{today_str}.csv",
                mime="text/csv",
                use_container_width=True
            )
            
        with col_ex2:
            st.markdown("#### Vendor Return Invoice CSV")
            ret_export_df = df[df["is_returned"]]
            if not ret_export_df.empty:
                csv_ret = ret_export_df.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="📦 Download Vendor Return Invoice (.CSV)",
                    data=csv_ret,
                    file_name=f"vendor_returns_{today_str}.csv",
                    mime="text/csv",
                    use_container_width=True
                )
            else:
                st.info("No returned items to export yet.")
                
        st.markdown("---")
        st.markdown("#### JSON Submission Format (Problem P02)")
        export_payload = {
            "case_id": selected_case_id if 'selected_case_id' in locals() else "CUSTOM",
            "as_of_date": today_str,
            "counts": kpis["counts"],
            "values": kpis["values"],
            "mark_returned": list(st.session_state.returned_item_ids)
        }
        st.json(export_payload)
        
        st.download_button(
            label="💾 Download P02 Solution Summary (.JSON)",
            data=json.dumps(export_payload, indent=2),
            file_name=f"p02_solution_{today_str}.json",
            mime="application/json"
        )
else:
    st.warning("No medicine items loaded. Please select a valid dataset case or upload data.")
