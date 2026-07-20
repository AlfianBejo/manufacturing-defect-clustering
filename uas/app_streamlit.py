import streamlit as st
import pandas as pd
import numpy as np
import os
import plotly.graph_objects as go
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

# 1. Page Configuration & Aesthetic Setup
st.set_page_config(
    page_title="Enterprise QC - Advanced Clustering Dashboard",
    page_icon="🔮",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Premium Styling (Dark Theme & Ambient Glows)
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
    
    /* Core fonts */
    html, body, [data-testid="stAppViewContainer"], [data-testid="stHeader"] {
        font-family: 'Outfit', sans-serif;
        background-color: #0b0f19 !important;
        color: #f8fafc !important;
    }
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background-color: #0f172a !important;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    /* Glass card container */
    .glass-card {
        background: rgba(17, 25, 40, 0.65);
        backdrop-filter: blur(16px) saturate(180%);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 24px;
        margin-bottom: 24px;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
    }
    
    .card-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .card-subtitle {
        font-size: 0.85rem;
        color: #94a3b8;
        margin-bottom: 20px;
    }
    
    /* Financial Simulator display */
    .gauge-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(15, 23, 42, 0.5);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.04);
        text-align: center;
        margin-bottom: 20px;
    }
    
    .gauge-value {
        font-size: 2.25rem;
        font-weight: 800;
        color: #10b981;
        text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    }
    
    .gauge-title {
        font-size: 0.85rem;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-top: 4px;
    }
    
    /* Risk Badges */
    .risk-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 12px;
    }
    .risk-label {
        font-size: 0.85rem;
        color: #cbd5e1;
    }
    .risk-badge {
        padding: 4px 12px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 0.75rem;
        text-transform: uppercase;
    }
    .risk-critical { background-color: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    .risk-warning { background-color: rgba(249, 115, 22, 0.15); color: #f97316; border: 1px solid rgba(249, 115, 22, 0.3); }
    .risk-moderate { background-color: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
    .risk-safe { background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }

    /* Cluster Insights cards */
    .insight-card {
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 16px;
        border-left: 5px solid #64748b;
        background: rgba(30, 41, 59, 0.3);
    }
    .insight-card.kategori-red { border-left-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
    .insight-card.kategori-orange { border-left-color: #f97316; background: rgba(249, 115, 22, 0.05); }
    .insight-card.kategori-yellow { border-left-color: #fbbf24; background: rgba(251, 191, 36, 0.05); }
    .insight-card.kategori-green { border-left-color: #10b981; background: rgba(16, 185, 129, 0.05); }
    
    .insight-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
    }
    .insight-title h4 {
        margin: 0;
        font-weight: 700;
    }
    .insight-title span {
        font-size: 0.8rem;
        font-weight: 600;
        display: block;
        margin-top: 2px;
    }
    .badge-count {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 2px 10px;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
    }
    .insight-stats {
        display: flex;
        gap: 24px;
        margin-bottom: 12px;
        background: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 8px;
    }
    .insight-stat {
        display: flex;
        flex-direction: column;
    }
    .stat-name {
        font-size: 0.75rem;
        color: #94a3b8;
    }
    .stat-value {
        font-size: 0.95rem;
        font-weight: 700;
    }
    .insight-desc p {
        margin: 0 0 10px 0;
        font-size: 0.88rem;
        line-height: 1.5;
    }
    .insight-recom {
        font-size: 0.88rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        padding-top: 10px;
    }
</style>
""", unsafe_allow_html=True)

# 2. Severity Mappings
SEVERITY_MAPPING = { 'Minor': 1, 'Moderate': 2, 'Critical': 3 }
SEVERITY_REV_MAPPING = { 1: 'Minor', 2: 'Moderate', 3: 'Critical' }

# Cluster Color Palette (Consistent with JS implementation)
CLUSTER_COLORS = [
    '#10b981',  # Klaster 0: Emerald Green (Aman)
    '#fbbf24',  # Klaster 1: Kuning (Efisiensi Rendah / Biaya Tinggi)
    '#f97316',  # Klaster 2: Oranye (Masalah Operasional / Keparahan Tinggi)
    '#ef4444',  # Klaster 3: Merah (Kritis)
    '#a855f7'   # Cadangan (Ungu)
]

# 3. Data Loading Function with Fallback
def load_data():
    csv_path = "defects_data.csv"
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path)
            required = ['defect_id', 'product_id', 'defect_type', 'severity', 'repair_cost']
            if all(col in df.columns for col in required):
                # Ensure correct types
                df['repair_cost'] = df['repair_cost'].astype(float)
                return df[required].to_dict(orient='records')
        except Exception as e:
            pass
            
    # Fallback dataset (matching JS DEFAULT_DATASET)
    return [
        { "defect_id": "D001", "product_id": "P001", "defect_type": "Scratch", "severity": "Minor", "repair_cost": 25.50 },
        { "defect_id": "D002", "product_id": "P002", "defect_type": "Dent", "severity": "Moderate", "repair_cost": 85.00 },
        { "defect_id": "D003", "product_id": "P003", "defect_type": "Crack", "severity": "Critical", "repair_cost": 250.00 },
        { "defect_id": "D004", "product_id": "P004", "defect_type": "Scratch", "severity": "Minor", "repair_cost": 30.00 },
        { "defect_id": "D005", "product_id": "P005", "defect_type": "Misalignment", "severity": "Moderate", "repair_cost": 95.00 },
        { "defect_id": "D006", "product_id": "P006", "defect_type": "Crack", "severity": "Critical", "repair_cost": 280.00 },
        { "defect_id": "D007", "product_id": "P007", "defect_type": "Color Defect", "severity": "Minor", "repair_cost": 20.00 },
        { "defect_id": "D008", "product_id": "P008", "defect_type": "Dent", "severity": "Moderate", "repair_cost": 75.00 },
        { "defect_id": "D009", "product_id": "P009", "defect_type": "Missing Part", "severity": "Critical", "repair_cost": 320.00 },
        { "defect_id": "D010", "product_id": "P010", "defect_type": "Scratch", "severity": "Minor", "repair_cost": 28.00 },
        { "defect_id": "D011", "product_id": "P011", "defect_type": "Misalignment", "severity": "Moderate", "repair_cost": 110.00 },
        { "defect_id": "D012", "product_id": "P012", "defect_type": "Crack", "severity": "Critical", "repair_cost": 295.00 },
        { "defect_id": "D013", "product_id": "P013", "defect_type": "Color Defect", "severity": "Minor", "repair_cost": 22.00 },
        { "defect_id": "D014", "product_id": "P014", "defect_type": "Dent", "severity": "Moderate", "repair_cost": 80.00 },
        { "defect_id": "D015", "product_id": "P015", "defect_type": "Scratch", "severity": "Minor", "repair_cost": 35.00 },
        { "defect_id": "D016", "product_id": "P016", "defect_type": "Crack", "severity": "Critical", "repair_cost": 265.00 },
        { "defect_id": "D017", "product_id": "P017", "defect_type": "Misalignment", "severity": "Moderate", "repair_cost": 100.00 },
        { "defect_id": "D018", "product_id": "P018", "defect_type": "Missing Part", "severity": "Critical", "repair_cost": 350.00 },
        { "defect_id": "D019", "product_id": "P019", "defect_type": "Color Defect", "severity": "Minor", "repair_cost": 18.00 },
        { "defect_id": "D020", "product_id": "P020", "defect_type": "Scratch", "severity": "Minor", "repair_cost": 32.00 },
        { "defect_id": "D021", "product_id": "P021", "defect_type": "Dent", "severity": "Moderate", "repair_cost": 90.00 },
        { "defect_id": "D022", "product_id": "P022", "defect_type": "Crack", "severity": "Critical", "repair_cost": 275.00 },
        { "defect_id": "D023", "product_id": "P023", "defect_type": "Misalignment", "severity": "Moderate", "repair_cost": 105.00 },
        { "defect_id": "D024", "product_id": "P024", "defect_type": "Color Defect", "severity": "Minor", "repair_cost": 24.00 },
        { "defect_id": "D025", "product_id": "P025", "defect_type": "Scratch", "severity": "Minor", "repair_cost": 29.00 },
        { "defect_id": "D026", "product_id": "P026", "defect_type": "Crack", "severity": "Critical", "repair_cost": 310.00 },
        { "defect_id": "D027", "product_id": "P027", "defect_type": "Missing Part", "severity": "Critical", "repair_cost": 340.00 },
        { "defect_id": "D028", "product_id": "P028", "defect_type": "Dent", "severity": "Moderate", "repair_cost": 88.00 },
        { "defect_id": "D029", "product_id": "P029", "defect_type": "Color Defect", "severity": "Minor", "repair_cost": 21.00 },
        { "defect_id": "D030", "product_id": "P030", "defect_type": "Scratch", "severity": "Minor", "repair_cost": 33.00 }
    ]

# Initialize dataset in session state
if 'dataset' not in st.session_state:
    st.session_state.dataset = load_data()
    
# Initialize predictor point in session state
if 'predict_point' not in st.session_state:
    st.session_state.predict_point = None

# 4. K-Means Core Processing
def process_clustering(k_val):
    df_raw = pd.DataFrame(st.session_state.dataset)
    df_raw['severity_score'] = df_raw['severity'].map(SEVERITY_MAPPING)
    
    # Extract features & fit standardizer
    X = df_raw[['repair_cost', 'severity_score']].copy()
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Run K-Means
    kmeans = KMeans(n_clusters=k_val, random_state=42, n_init=10)
    raw_labels = kmeans.fit_predict(X_scaled)
    df_raw['raw_cluster'] = raw_labels
    centroids_scaled = kmeans.cluster_centers_
    
    # Sort clusters by risk score ascending (severity * 100 + cost) to stabilize labeling & colors
    temp_clusters = []
    for c in range(k_val):
        cluster_subset = df_raw[df_raw['raw_cluster'] == c]
        if len(cluster_subset) > 0:
            avg_cost = cluster_subset['repair_cost'].mean()
            avg_sev = cluster_subset['severity_score'].mean()
            count = len(cluster_subset)
            scaled_cent = centroids_scaled[c]
        else:
            avg_cost, avg_sev, count = 0.0, 0.0, 0
            scaled_cent = np.array([0.0, 0.0])
            
        risk_score = avg_sev * 100 + avg_cost
        temp_clusters.append({
            'old_id': c,
            'avg_cost': avg_cost,
            'avg_sev': avg_sev,
            'count': count,
            'scaled_centroid': scaled_cent,
            'risk_score': risk_score
        })
        
    # Sort
    temp_clusters = sorted(temp_clusters, key=lambda x: x['risk_score'])
    
    # Map raw cluster ID to sorted cluster ID
    cluster_map = {tc['old_id']: new_id for new_id, tc in enumerate(temp_clusters)}
    df_raw['cluster'] = df_raw['raw_cluster'].map(cluster_map)
    df_raw = df_raw.drop(columns=['raw_cluster'])
    
    # Rebuild cluster metadata for the sorted clusters
    sorted_metadata = []
    for new_id, tc in enumerate(temp_clusters):
        sorted_metadata.append({
            'id': new_id,
            'avg_cost': tc['avg_cost'],
            'avg_sev': tc['avg_sev'],
            'count': tc['count'],
            'scaled_centroid': tc['scaled_centroid']
        })
        
    return df_raw, scaler, sorted_metadata

# Helper for business interpretation (from JS implementation)
def get_cluster_interpretation(avg_cost, avg_sev):
    if avg_sev >= 2.3 and avg_cost >= 200:
        return {
            "category": "🔴 KRITIS & KERUGIAN TINGGI (High-Risk Financial Damage)",
            "insight": "Kelompok ini adalah ancaman terbesar bagi profitabilitas dan reputasi perusahaan. Cacat bersifat fatal dan perbaikannya sangat mahal.",
            "rekomendasi": "Hentikan jalur perakitan terkait sementara untuk kalibrasi ulang komponen presisi, evaluasi vendor pemasok bahan baku utama, dan perketat lolos QC awal.",
            "color_class": "kategori-red"
        }
    elif avg_sev >= 2.1:
        return {
            "category": "🟠 KEPARAHAN TINGGI - BIAYA SEDANG (Operational Issues)",
            "insight": "Cacat pada kelompok ini berdampak buruk bagi fungsi produk, namun biaya penanganannya masih masuk dalam batas toleransi standar.",
            "rekomendasi": "Tingkatkan intensitas perawatan mesin (preventive maintenance) dan lakukan audit berkala terhadap kepatuhan SOP operator di lapangan.",
            "color_class": "kategori-orange"
        }
    elif avg_cost >= 150:
        return {
            "category": "🟡 BIAYA TINGGI - KEPARAHAN RINGAN (Inefficient Repair Cost)",
            "insight": "Tingkat keparahan produk sebenarnya tidak fatal (kosmetik/minor), namun biaya penanganan atau penggantian partnya tidak efisien.",
            "rekomendasi": "Tinjau ulang kontrak dengan penyedia jasa perbaikan luar atau cari komponen substitusi lokal yang lebih murah tanpa menurunkan kualitas standar.",
            "color_class": "kategori-yellow"
        }
    else:
        return {
            "category": "🟢 KATEGORI AMAN (Low-Cost & Minor Defects)",
            "insight": "Kelompok cacat ringan dengan biaya perbaikan yang sangat murah. Karakteristik ini wajar terjadi dalam batas toleransi produksi massal.",
            "rekomendasi": "Cukup lakukan pemantauan berkala menggunakan grafik kendali kualitas statistik (SPC) dan lakukan inspeksi visual reguler di akhir lini.",
            "color_class": "kategori-green"
        }

# 5. UI Layout - HEADER
st.title("🔮 Enterprise QC - Advanced Clustering Dashboard")
st.caption("Deteksi anomali operasional & pemetaan klaster kerugian menggunakan K-Means Clustering teroptimasi")

# Sidebar Controls
st.sidebar.header("⚙️ Konfigurasi Sistem")

# 1. K Slider
k_value = st.sidebar.slider("Jumlah Klaster (K)", min_value=2, max_value=5, value=3)

# Process Clustering
clustered_df, fitted_scaler, cluster_meta = process_clustering(k_value)

# 2. Sidebar Form to Add New Record
st.sidebar.markdown("---")
st.sidebar.subheader("➕ Input Record Baru")
with st.sidebar.form(key="add_defect_form", clear_on_submit=True):
    col_id, col_prod = st.columns(2)
    new_id = col_id.text_input("Defect ID", placeholder="contoh: D031").strip()
    new_prod = col_prod.text_input("Product ID", placeholder="contoh: P031").strip()
    new_type = st.text_input("Tipe Cacat", placeholder="contoh: Scratch / Dent").strip()
    new_cost = st.number_input("Biaya Perbaikan ($)", min_value=0.0, step=0.1, value=50.0)
    new_severity = st.selectbox("Tingkat Keparahan", options=["Minor", "Moderate", "Critical"])
    
    submit_btn = st.form_submit_button("Tambahkan ke Dashboard")
    
    if submit_btn:
        if not new_id or not new_prod or not new_type:
            st.sidebar.error("Mohon lengkapi seluruh kolom formulir!")
        elif any(item['defect_id'].lower() == new_id.lower() for item in st.session_state.dataset):
            st.sidebar.error(f"Defect ID {new_id} sudah terdaftar!")
        else:
            st.session_state.dataset.append({
                "defect_id": new_id,
                "product_id": new_prod,
                "defect_type": new_type,
                "severity": new_severity,
                "repair_cost": float(new_cost)
            })
            st.session_state.predict_point = None  # Clear predictor point
            st.sidebar.success(f"Data cacat {new_id} berhasil ditambahkan!")
            st.rerun()

# 6. Global Stats Indicators
total_cases = len(clustered_df)
avg_cost = clustered_df['repair_cost'].mean() if total_cases > 0 else 0
critical_count = len(clustered_df[clustered_df['severity'] == 'Critical'])

stat_col1, stat_col2, stat_col3 = st.columns(3)
with stat_col1:
    st.markdown(f"""
    <div class="glass-card" style="padding: 16px; text-align: center; margin-bottom: 12px;">
        <span style="font-size: 1.75rem;">📊</span>
        <div style="font-size: 1.75rem; font-weight:800; color: #3b82f6;">{total_cases}</div>
        <div style="font-size: 0.8rem; color:#94a3b8; text-transform:uppercase;">Total Sampel Cacat</div>
    </div>
    """, unsafe_allow_html=True)
with stat_col2:
    st.markdown(f"""
    <div class="glass-card" style="padding: 16px; text-align: center; margin-bottom: 12px;">
        <span style="font-size: 1.75rem;">💸</span>
        <div style="font-size: 1.75rem; font-weight:800; color: #fbbf24;">${avg_cost:.2f}</div>
        <div style="font-size: 0.8rem; color:#94a3b8; text-transform:uppercase;">Rerata Kerugian Perbaikan</div>
    </div>
    """, unsafe_allow_html=True)
with stat_col3:
    st.markdown(f"""
    <div class="glass-card" style="padding: 16px; text-align: center; margin-bottom: 12px;">
        <span style="font-size: 1.75rem;">🔥</span>
        <div style="font-size: 1.75rem; font-weight:800; color: #ef4444;">{critical_count}</div>
        <div style="font-size: 0.8rem; color:#94a3b8; text-transform:uppercase;">Risiko Kasus Kritis</div>
    </div>
    """, unsafe_allow_html=True)

# Tabs Navigation
tab_viz, tab_data = st.tabs(["📊 Visual & Analisis Klaster", "📋 Repositori Data"])

with tab_viz:
    col_plot, col_calc = st.columns([2, 1])
    
    # Financial Simulator state
    with col_calc:
        st.markdown("""
        <div class="glass-card" style="height: 100%;">
            <div class="card-title">💰 Simulasi Finansial & Mitigasi Cacat</div>
            <div class="card-subtitle">Simulasikan efisiensi biaya jika rekomendasi klaster diterapkan</div>
        """, unsafe_allow_html=True)
        
        # Checkboxes for mitigations
        mitigate_crit = st.checkbox(
            "Kalibrasi Mesin & Audit Bahan Baku (Klaster Kritis)\n\nMengurangi cacat kritis. Potensi: +$1,200/bln", 
            value=False
        )
        mitigate_mod = st.checkbox(
            "Pemeliharaan Mesin Preventif berkala (Klaster Sedang)\n\nMencegah malfungsi sistemik. Potensi: +$650/bln", 
            value=False
        )
        mitigate_min = st.checkbox(
            "Substitusi Komponen Lokal Berkualitas (Klaster Kosmetik)\n\nMengefisienkan biaya perbaikan. Potensi: +$450/bln", 
            value=False
        )
        
        # Calculate savings
        savings = 0
        checked_count = 0
        if mitigate_crit:
            savings += 1200
            checked_count += 1
        if mitigate_mod:
            savings += 650
            checked_count += 1
        if mitigate_min:
            savings += 450
            checked_count += 1
            
        # Risk levels
        if checked_count == 0:
            risk_text = "KRITIS"
            risk_class = "risk-critical"
        elif checked_count == 1:
            risk_text = "AWAS"
            risk_class = "risk-warning"
        elif checked_count == 2:
            risk_text = "SEDANG"
            risk_class = "risk-moderate"
        else:
            risk_text = "AMAN"
            risk_class = "risk-safe"
            
        st.markdown(f"""
            <div class="gauge-container">
                <div class="gauge-value">${savings:,}</div>
                <div class="gauge-title">Penghematan Terproyeksi</div>
                <div class="risk-container">
                    <span class="risk-label">Status Risiko Pabrik:</span>
                    <span class="risk-badge {risk_class}">{risk_text}</span>
                </div>
            </div>
        </div>
        """, unsafe_allow_html=True)

    # Plotly Scatter Plot
    with col_plot:
        # Determine if we have a temporary predicted point to show
        pred_pt = st.session_state.predict_point
        
        # Plot
        fig = go.Figure()
        
        # Points for each cluster
        for c in range(k_value):
            cluster_subset = clustered_df[clustered_df['cluster'] == c]
            color = CLUSTER_COLORS[c % len(CLUSTER_COLORS)]
            
            fig.add_trace(go.Scatter(
                x=cluster_subset['repair_cost'],
                y=cluster_subset['severity_score'],
                mode='markers',
                marker=dict(
                    size=11,
                    color=color,
                    line=dict(width=1.5, color='#0b0f19')
                ),
                name=f'Klaster {c}',
                text=[
                    f"ID Cacat: {row['defect_id']}<br>"
                    f"ID Produk: {row['product_id']}<br>"
                    f"Tipe Cacat: {row['defect_type']}<br>"
                    f"Biaya: ${row['repair_cost']:.2f}<br>"
                    f"Keparahan: {row['severity']}<br>"
                    f"Klaster: {row['cluster']}"
                    for _, row in cluster_subset.iterrows()
                ],
                hoverinfo='text'
            ))
            
        # Centroids plotting
        centroid_costs = []
        centroid_sevs = []
        for meta in cluster_meta:
            scaled_cent = meta['scaled_centroid']
            # Unscale centroid coordinates back to original scale
            cost = scaled_cent[0] * np.sqrt(fitted_scaler.var_[0]) + fitted_scaler.mean_[0]
            sev = scaled_cent[1] * np.sqrt(fitted_scaler.var_[1]) + fitted_scaler.mean_[1]
            centroid_costs.append(cost)
            centroid_sevs.append(sev)
            
        fig.add_trace(go.Scatter(
            x=centroid_costs,
            y=centroid_sevs,
            mode='markers',
            marker=dict(
                size=16,
                color='rgba(255, 255, 255, 0.1)',
                line=dict(width=2.5, color='#ffffff'),
                symbol='circle'
            ),
            name='Centroid Klaster',
            text=[f"Centroid Klaster {c}" for c in range(k_value)],
            hoverinfo='text'
        ))
        
        # Plot predicted point if present
        if pred_pt is not None:
            fig.add_trace(go.Scatter(
                x=[pred_pt['cost']],
                y=[SEVERITY_MAPPING[pred_pt['severity']]],
                mode='markers',
                marker=dict(
                    size=20,
                    color='#ffffff',
                    line=dict(width=2.5, color='#3b82f6'),
                    symbol='star'
                ),
                name='Data Prediksi',
                text=[
                    f"Prediksi Baru<br>"
                    f"Biaya: ${pred_pt['cost']:.2f}<br>"
                    f"Keparahan: {pred_pt['severity']}<br>"
                    f"Prediksi Klaster: {pred_pt['cluster']}"
                ],
                hoverinfo='text'
            ))
            
        fig.update_layout(
            template='plotly_dark',
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(15, 23, 42, 0.4)',
            height=400,
            xaxis=dict(
                title='Biaya Perbaikan Produk ($)',
                gridcolor='rgba(255, 255, 255, 0.04)',
                zeroline=False
            ),
            yaxis=dict(
                title='Tingkat Keparahan',
                tickvals=[1, 2, 3],
                ticktext=['1 (Minor)', '2 (Moderate)', '3 (Critical)'],
                range=[0.5, 3.5],
                gridcolor='rgba(255, 255, 255, 0.04)',
                zeroline=False
            ),
            margin=dict(l=40, r=40, t=30, b=40),
            hovermode='closest',
            legend=dict(
                orientation='h',
                yanchor='bottom',
                y=1.02,
                xanchor='right',
                x=1
            )
        )
        
        st.plotly_chart(fig, use_container_width=True)

    # 7. Predict Form Section
    st.markdown("---")
    col_pred_form, col_pred_res = st.columns([2, 1])
    
    with col_pred_form:
        st.subheader("🛠️ Prediksi & Klasifikasi Data")
        st.write("Prediksikan klasterisasi kasus cacat baru berdasarkan biaya dan keparahan.")
        
        with st.form(key="prediction_form"):
            col_pcost, col_psev = st.columns(2)
            pred_cost = col_pcost.number_input("Biaya Perbaikan ($)", min_value=0.0, step=10.0, value=150.0)
            pred_sev = col_psev.selectbox("Tingkat Keparahan", options=["Minor", "Moderate", "Critical"], index=1)
            
            predict_btn = st.form_submit_button("Analisis Data Baru")
            
            if predict_btn:
                # Run prediction
                sev_score = SEVERITY_MAPPING[pred_sev]
                scaled_point = fitted_scaler.transform([[pred_cost, sev_score]])[0]
                
                # Check closest centroid
                min_dist = float('inf')
                closest_cluster = 0
                
                for idx, meta in enumerate(cluster_meta):
                    c_scaled = meta['scaled_centroid']
                    dist = (scaled_point[0] - c_scaled[0])**2 + (scaled_point[1] - c_scaled[1])**2
                    if dist < min_dist:
                        min_dist = dist
                        closest_cluster = meta['id']
                        
                st.session_state.predict_point = {
                    'cost': float(pred_cost),
                    'severity': pred_sev,
                    'cluster': closest_cluster
                }
                st.rerun()

    with col_pred_res:
        if st.session_state.predict_point is not None:
            pt = st.session_state.predict_point
            color = CLUSTER_COLORS[pt['cluster'] % len(CLUSTER_COLORS)]
            meta = cluster_meta[pt['cluster']]
            interpret = get_cluster_interpretation(meta['avg_cost'], meta['avg_sev'])
            
            st.markdown(f"""
            <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 20px; height: 100%;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span style="font-weight: 700; font-size: 1.1rem; color: #f8fafc;">Hasil Analisis</span>
                    <span style="background-color: {color}; color: #0b0f19; font-weight: 800; padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem;">
                        KLASTER {pt['cluster']}
                    </span>
                </div>
                <div style="font-size: 0.9rem; margin-bottom: 10px;">
                    <strong>Kategori:</strong><br><span style="color: {color}; font-weight: 600;">{interpret['category']}</span>
                </div>
                <div style="font-size: 0.85rem; border-top: 1px solid rgba(255, 255, 255, 0.05); padding-top: 8px;">
                    <strong>Rekomendasi Mitigasi:</strong><br>
                    <span>{interpret['rekomendasi']}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div style="background: rgba(30, 41, 59, 0.2); border: 1px dashed rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
                <span style="color: #64748b; font-size: 0.9rem;">Masukkan parameter dan klik 'Analisis Data Baru' untuk memprediksi klaster.</span>
            </div>
            """, unsafe_allow_html=True)

    # 8. Cluster Insights Cards Grid
    st.markdown("---")
    st.subheader("💡 Karakteristik Klaster & Rekomendasi Solusi Taktis")
    st.write("Profil kerugian rata-rata dan langkah strategis operasional untuk masing-masing klaster.")
    
    cols = st.columns(len(cluster_meta))
    for idx, meta in enumerate(cluster_meta):
        interpret = get_cluster_interpretation(meta['avg_cost'], meta['avg_sev'])
        card_color = CLUSTER_COLORS[meta['id'] % len(CLUSTER_COLORS)]
        
        with cols[idx]:
            st.markdown(f"""
            <div class="insight-card {interpret['color_class']}">
                <div class="insight-header">
                    <div class="insight-title">
                        <h4 style="color: {card_color};">Klaster {meta['id']}</h4>
                        <span style="color: {card_color};">{interpret['category'].split('(')[0].strip()}</span>
                    </div>
                    <span class="badge-count">{meta['count']} Produk</span>
                </div>
                <div class="insight-stats">
                    <div class="insight-stat">
                        <span class="stat-name">Rerata Biaya</span>
                        <span class="stat-value">${meta['avg_cost']:.2f}</span>
                    </div>
                    <div class="insight-stat" style="margin-left: 20px;">
                        <span class="stat-name">Skor Keparahan</span>
                        <span class="stat-value">{meta['avg_sev']:.2f} / 3.00</span>
                    </div>
                </div>
                <div class="insight-desc">
                    <p><strong>Analisis:</strong> {interpret['insight']}</p>
                </div>
                <div class="insight-recom">
                    <strong>Rekomendasi Strategis:</strong><br>
                    <span>{interpret['rekomendasi']}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

with tab_data:
    st.subheader("📋 Repositori Record Cacat Produksi")
    st.write("Daftar seluruh sampel cacat manufaktur yang saat ini terdaftar di sistem.")
    
    # Format table data
    table_display = clustered_df.copy()
    
    # Add colored status for streamlit dataframe
    def color_cluster(val):
        color = CLUSTER_COLORS[int(val) % len(CLUSTER_COLORS)]
        return f'background-color: {color}; color: #0b0f19; font-weight: bold; border-radius: 4px;'
        
    st.dataframe(
        table_display[['defect_id', 'product_id', 'defect_type', 'severity', 'repair_cost', 'cluster']],
        column_config={
            "defect_id": "Defect ID",
            "product_id": "Product ID",
            "defect_type": "Tipe Cacat",
            "severity": "Keparahan",
            "repair_cost": st.column_config.NumberColumn("Biaya Perbaikan ($)", format="$%.2f"),
            "cluster": st.column_config.NumberColumn("Klaster", format="%d")
        },
        use_container_width=True,
        hide_index=True
    )
