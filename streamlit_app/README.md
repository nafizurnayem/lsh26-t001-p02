# PharmaShelf Streamlit Dashboard (Problem P02)

Interactive Streamlit analytics dashboard for real-time pharmacy expiry shelf audit, batch tracking, and vendor returns management.

## Features
- **Benchmark Case Selector**: Seamlessly load and switch between cases `PUB-01` through `PUB-20` from the public dataset.
- **Express API Live Mode**: Connect directly to the Node.js backend (`http://localhost:4000/api/medicines`).
- **Interactive Visualizations**: Donut chart of expiry categories, horizontal bar chart of company financial risk, and days-to-expiry timeline.
- **Shelf Check Table**: Search and filter by name, company, batch number, and expiry status.
- **Vendor Returns Processing**: One-click return flagging with automated financial risk recalculation and exportable return invoices.
- **Exporting**: Download shelf audit and return invoices as CSV or standard JSON format.

## Setup & Run

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Launch Streamlit App**:
   ```bash
   streamlit run app.py
   ```
   Or double-click `run_streamlit.bat`.
