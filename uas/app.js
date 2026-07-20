// Fallback dataset in case CSV loading fails
const DEFAULT_DATASET = [
    { defect_id: "D001", product_id: "P001", defect_type: "Scratch", severity: "Minor", repair_cost: 25.50 },
    { defect_id: "D002", product_id: "P002", defect_type: "Dent", severity: "Moderate", repair_cost: 85.00 },
    { defect_id: "D003", product_id: "P003", defect_type: "Crack", severity: "Critical", repair_cost: 250.00 },
    { defect_id: "D004", product_id: "P004", defect_type: "Scratch", severity: "Minor", repair_cost: 30.00 },
    { defect_id: "D005", product_id: "P005", defect_type: "Misalignment", severity: "Moderate", repair_cost: 95.00 },
    { defect_id: "D006", product_id: "P006", defect_type: "Crack", severity: "Critical", repair_cost: 280.00 },
    { defect_id: "D007", product_id: "P007", defect_type: "Color Defect", severity: "Minor", repair_cost: 20.00 },
    { defect_id: "D008", product_id: "P008", defect_type: "Dent", severity: "Moderate", repair_cost: 75.00 },
    { defect_id: "D009", product_id: "P009", defect_type: "Missing Part", severity: "Critical", repair_cost: 320.00 },
    { defect_id: "D010", product_id: "P010", defect_type: "Scratch", severity: "Minor", repair_cost: 28.00 },
    { defect_id: "D011", product_id: "P011", defect_type: "Misalignment", severity: "Moderate", repair_cost: 110.00 },
    { defect_id: "D012", product_id: "P012", defect_type: "Crack", severity: "Critical", repair_cost: 295.00 },
    { defect_id: "D013", product_id: "P013", defect_type: "Color Defect", severity: "Minor", repair_cost: 22.00 },
    { defect_id: "D014", product_id: "P014", defect_type: "Dent", severity: "Moderate", repair_cost: 80.00 },
    { defect_id: "D015", product_id: "P015", defect_type: "Scratch", severity: "Minor", repair_cost: 35.00 },
    { defect_id: "D016", product_id: "P016", defect_type: "Crack", severity: "Critical", repair_cost: 265.00 },
    { defect_id: "D017", product_id: "P017", defect_type: "Misalignment", severity: "Moderate", repair_cost: 100.00 },
    { defect_id: "D018", product_id: "P018", defect_type: "Missing Part", severity: "Critical", repair_cost: 350.00 },
    { defect_id: "D019", product_id: "P019", defect_type: "Color Defect", severity: "Minor", repair_cost: 18.00 },
    { defect_id: "D020", product_id: "P020", defect_type: "Scratch", severity: "Minor", repair_cost: 32.00 },
    { defect_id: "D021", product_id: "P021", defect_type: "Dent", severity: "Moderate", repair_cost: 90.00 },
    { defect_id: "D022", product_id: "P022", defect_type: "Crack", severity: "Critical", repair_cost: 275.00 },
    { defect_id: "D023", product_id: "P023", defect_type: "Misalignment", severity: "Moderate", repair_cost: 105.00 },
    { defect_id: "D024", product_id: "P024", defect_type: "Color Defect", severity: "Minor", repair_cost: 24.00 },
    { defect_id: "D025", product_id: "P025", defect_type: "Scratch", severity: "Minor", repair_cost: 29.00 },
    { defect_id: "D026", product_id: "P026", defect_type: "Crack", severity: "Critical", repair_cost: 310.00 },
    { defect_id: "D027", product_id: "P027", defect_type: "Missing Part", severity: "Critical", repair_cost: 340.00 },
    { defect_id: "D028", product_id: "P028", defect_type: "Dent", severity: "Moderate", repair_cost: 88.00 },
    { defect_id: "D029", product_id: "P029", defect_type: "Color Defect", severity: "Minor", repair_cost: 21.00 },
    { defect_id: "D030", product_id: "P030", defect_type: "Scratch", severity: "Minor", repair_cost: 33.00 }
];

// App State
let dataset = [];
let chartInstance = null;
let currentK = 3;
let scalerParams = { meanCost: 0, stdCost: 1, meanSev: 0, stdSev: 1 };
let trainedCentroids = []; // Centroids in scaled space
let clusterMetadata = [];  // Metadata of sorted clusters
let isKmeansRunning = false;

// Color Palette for clusters
const CLUSTER_COLORS = [
    { fill: '#10b981', border: '#059669', label: 'green' },   // Klaster 0: Aman (Emerald)
    { fill: '#fbbf24', border: '#d97706', label: 'yellow' },  // Klaster 1: Efisiensi Rendah (Kuning)
    { fill: '#f97316', border: '#ea580c', label: 'orange' },  // Klaster 2: Masalah Operasional (Oranye)
    { fill: '#ef4444', border: '#dc2626', label: 'red' },     // Klaster 3: Kritis (Merah)
    { fill: '#a855f7', border: '#8b5cf6', label: 'purple' }   // Cadangan
];

// Severity score mapping
const SEVERITY_MAPPING = { 'Minor': 1, 'Moderate': 2, 'Critical': 3 };

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initLuxuryEffects();
    initEventListeners();
    loadData();
});

// Mouse Light / Card Hover Glow Effect
function initLuxuryEffects() {
    document.addEventListener('mousemove', (e) => {
        document.querySelectorAll('.glass-card').forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// Setup Event Listeners
function initEventListeners() {
    // K Slider
    const kSlider = document.getElementById('k-slider');
    const kValue = document.getElementById('k-value');
    kSlider.addEventListener('input', (e) => {
        currentK = parseInt(e.target.value);
        kValue.textContent = currentK;
        runAnimatedClustering();
    });

    // Re-cluster animation button
    document.getElementById('btn-recluster').addEventListener('click', () => {
        runAnimatedClustering();
    });

    // Segmented Pill controls handler
    setupSegmentControls('pred-severity-segment', 'pred-severity');
    setupSegmentControls('new-severity-segment', 'new-severity');

    // Predict Form Submit
    document.getElementById('btn-predict').addEventListener('click', handlePredict);

    // Add Data Form Submit
    document.getElementById('btn-add-data').addEventListener('click', handleAddData);

    // Toggle Table section
    const tableToggle = document.getElementById('table-toggle');
    const tableWrapper = document.getElementById('table-wrapper');
    tableToggle.addEventListener('click', () => {
        tableWrapper.classList.toggle('collapsed');
        const icon = tableToggle.querySelector('.toggle-icon');
        icon.textContent = tableWrapper.classList.contains('collapsed') ? '▼' : '▲';
    });

    // Financial Simulator Checkboxes
    document.querySelectorAll('.mitigation-cb').forEach(cb => {
        cb.addEventListener('change', updateFinancialSimulation);
    });
}

// Setup Segmented Buttons
function setupSegmentControls(containerId, hiddenInputId) {
    const container = document.getElementById(containerId);
    const hiddenInput = document.getElementById(hiddenInputId);
    const buttons = container.querySelectorAll('.segment-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            hiddenInput.value = btn.getAttribute('data-value');
        });
    });
    
    // Set initial active state based on hidden input
    buttons.forEach(btn => {
        if (btn.getAttribute('data-value') === hiddenInput.value) {
            btn.classList.add('active');
        }
    });
}

// Load CSV data
async function loadData() {
    const statusText = document.getElementById('data-status-text');
    const statusDot = document.querySelector('.status-dot');
    
    try {
        statusText.textContent = "Mengunduh file data...";
        const response = await fetch('defects_data.csv');
        if (!response.ok) throw new Error("Gagal mengambil file CSV");
        
        const csvText = await response.text();
        dataset = parseCSV(csvText);
        
        statusText.textContent = "Data CSV berhasil dimuat";
        statusDot.classList.add('active');
    } catch (error) {
        console.warn("Menggunakan dataset fallback karena:", error.message);
        dataset = JSON.parse(JSON.stringify(DEFAULT_DATASET));
        statusText.textContent = "Data internal dimuat (fallback)";
        statusDot.classList.add('active');
    }

    // Run first animated clustering
    runAnimatedClustering();
}

// CSV Parser
function parseCSV(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;
        
        const obj = {};
        headers.forEach((header, idx) => {
            let val = values[idx];
            if (header === 'repair_cost') {
                val = parseFloat(val);
            }
            obj[header] = val;
        });
        result.push(obj);
    }
    return result;
}

// Preprocessing: standard scaling params calculation
function calculateScalerParams(data) {
    const n = data.length;
    let sumCost = 0;
    let sumSev = 0;
    
    data.forEach(item => {
        sumCost += item.repair_cost;
        sumSev += SEVERITY_MAPPING[item.severity];
    });
    
    const meanCost = sumCost / n;
    const meanSev = sumSev / n;
    
    let sqDiffCost = 0;
    let sqDiffSev = 0;
    
    data.forEach(item => {
        sqDiffCost += Math.pow(item.repair_cost - meanCost, 2);
        sqDiffSev += Math.pow(SEVERITY_MAPPING[item.severity] - meanSev, 2);
    });
    
    const stdCost = Math.sqrt(sqDiffCost / n) || 1;
    const stdSev = Math.sqrt(sqDiffSev / n) || 1;
    
    scalerParams = { meanCost, stdCost, meanSev, stdSev };
}

function scalePoint(cost, severityStr) {
    const sevScore = SEVERITY_MAPPING[severityStr] || 1;
    return {
        x: (cost - scalerParams.meanCost) / scalerParams.stdCost,
        y: (sevScore - scalerParams.meanSev) / scalerParams.stdSev
    };
}

// Generator to yield step-by-step K-Means updates for visual animation
function* kmeansGenerator(scaledData, k) {
    // Initial Centroids: spaced out uniformly based on data indices
    const step = Math.floor(scaledData.length / k);
    let centroids = [];
    for (let i = 0; i < k; i++) {
        const dataIdx = Math.min(i * step, scaledData.length - 1);
        centroids.push({ x: scaledData[dataIdx].x, y: scaledData[dataIdx].y });
    }
    
    let assignments = new Array(scaledData.length).fill(-1);
    let converged = false;
    let maxIterations = 8;
    let iter = 0;
    
    yield { centroids, assignments, step: 0 };
    
    while (!converged && iter < maxIterations) {
        converged = true;
        iter++;
        
        // 1. Assign points to nearest centroid
        for (let i = 0; i < scaledData.length; i++) {
            let minDist = Infinity;
            let bestCluster = 0;
            
            for (let c = 0; c < k; c++) {
                const dist = Math.pow(scaledData[i].x - centroids[c].x, 2) + 
                             Math.pow(scaledData[i].y - centroids[c].y, 2);
                if (dist < minDist) {
                    minDist = dist;
                    bestCluster = c;
                }
            }
            
            if (assignments[i] !== bestCluster) {
                assignments[i] = bestCluster;
                converged = false;
            }
        }
        
        // 2. Recompute Centroids
        const sumX = new Array(k).fill(0);
        const sumY = new Array(k).fill(0);
        const count = new Array(k).fill(0);
        
        for (let i = 0; i < scaledData.length; i++) {
            const c = assignments[i];
            sumX[c] += scaledData[i].x;
            sumY[c] += scaledData[i].y;
            count[c]++;
        }
        
        for (let c = 0; c < k; c++) {
            if (count[c] > 0) {
                centroids[c] = { x: sumX[c] / count[c], y: sumY[c] / count[c] };
            }
        }
        
        yield { centroids, assignments, step: iter };
    }
}

// Run Step-by-Step K-Means Animation
function runAnimatedClustering(predictedPoint = null) {
    if (dataset.length === 0 || isKmeansRunning) return;
    
    isKmeansRunning = true;
    
    // Show spinner overlay
    const overlay = document.getElementById('animation-overlay');
    overlay.classList.remove('hidden');
    
    calculateScalerParams(dataset);
    updateGlobalStats();
    
    const scaledData = dataset.map(item => {
        const scaled = scalePoint(item.repair_cost, item.severity);
        return { x: scaled.x, y: scaled.y, original: item };
    });
    
    // Instantiate K-Means step generator
    const stepsGen = kmeansGenerator(scaledData, currentK);
    
    const runStep = () => {
        const { value, done } = stepsGen.next();
        
        if (done || !value) {
            // Animation finished: finalize cluster metadata, sort them for stable colors, and render final cards
            finalizeClustering(scaledData, dataset.map(item => item.cluster_temp || 0), predictedPoint);
            overlay.classList.add('hidden');
            isKmeansRunning = false;
            return;
        }
        
        // Temporarily store cluster assignments in dataset
        dataset.forEach((item, idx) => {
            item.cluster_temp = value.assignments[idx];
        });
        
        // Unscale intermediate centroids to render them on chart
        const tempCentroids = value.centroids.map(c => ({
            cost: c.x * scalerParams.stdCost + scalerParams.meanCost,
            severityScore: c.y * scalerParams.stdSev + scalerParams.meanSev
        }));
        
        // Render step
        renderIntermediateChart(tempCentroids, predictedPoint);
        
        // Queue next step
        setTimeout(runStep, 350);
    };
    
    runStep();
}

// Render Intermediate Clustering State
function renderIntermediateChart(centroids, predictedPoint) {
    const clusterDatasets = Array.from({ length: currentK }, (_, i) => {
        const colorObj = CLUSTER_COLORS[i] || CLUSTER_COLORS[4];
        return {
            label: `Klaster Sementara ${i}`,
            data: [],
            backgroundColor: colorObj.fill,
            borderColor: '#0b0f19',
            borderWidth: 1.5,
            pointRadius: 7,
            pointHoverRadius: 9,
            showLine: false
        };
    });
    
    dataset.forEach(item => {
        const tempClust = item.cluster_temp;
        if (tempClust !== undefined && tempClust < currentK) {
            clusterDatasets[tempClust].data.push({
                x: item.repair_cost,
                y: SEVERITY_MAPPING[item.severity],
                info: item
            });
        }
    });
    
    // Add current intermediate centroids to chart
    const centroidDataset = {
        label: 'Centroids (Target)',
        data: centroids.map(c => ({ x: c.cost, y: c.severityScore })),
        backgroundColor: '#ffffff',
        borderColor: '#4f46e5',
        borderWidth: 2.5,
        pointRadius: 13,
        pointStyle: 'rectRot',
        showLine: false
    };
    
    const datasets = [...clusterDatasets, centroidDataset];
    
    if (predictedPoint) {
        datasets.push({
            label: 'Data Prediksi',
            data: [{ x: predictedPoint.cost, y: SEVERITY_MAPPING[predictedPoint.severity] }],
            backgroundColor: '#ffffff',
            borderColor: '#3b82f6',
            borderWidth: 3,
            pointRadius: 16,
            pointStyle: 'star',
            showLine: false
        });
    }
    
    updateChartData(datasets);
}

// Finalize K-Means: Sort clusters by threat score and render final dashboard
function finalizeClustering(scaledData, finalAssignments, predictedPoint) {
    // Group clusters to sort them by risk score ascending (stable color assignment)
    let tempClusters = [];
    for (let c = 0; c < currentK; c++) {
        let sumCost = 0;
        let sumSev = 0;
        let count = 0;
        let sumScaledX = 0;
        let sumScaledY = 0;
        
        for (let i = 0; i < dataset.length; i++) {
            if (finalAssignments[i] === c) {
                sumCost += dataset[i].repair_cost;
                sumSev += SEVERITY_MAPPING[dataset[i].severity];
                sumScaledX += scaledData[i].x;
                sumScaledY += scaledData[i].y;
                count++;
            }
        }
        
        const avgCost = count > 0 ? sumCost / count : 0;
        const avgSev = count > 0 ? sumSev / count : 0;
        
        tempClusters.push({
            oldId: c,
            avgCost,
            avgSev,
            count,
            scaledCentroid: {
                x: count > 0 ? sumScaledX / count : 0,
                y: count > 0 ? sumScaledY / count : 0
            },
            riskScore: avgSev * 100 + avgCost
        });
    }
    
    // Sort clusters based on risk score ascending
    tempClusters.sort((a, b) => a.riskScore - b.riskScore);
    
    // Map assignments to dataset
    const clusterMap = {};
    tempClusters.forEach((tc, newId) => {
        clusterMap[tc.oldId] = newId;
    });
    
    trainedCentroids = [];
    clusterMetadata = [];
    
    tempClusters.forEach((tc, newId) => {
        trainedCentroids[newId] = tc.scaledCentroid;
        clusterMetadata[newId] = {
            id: newId,
            avgCost: tc.avgCost,
            avgSev: tc.avgSev,
            count: tc.count
        };
    });
    
    dataset.forEach((item, idx) => {
        const oldCluster = finalAssignments[idx];
        item.cluster = clusterMap[oldCluster];
        delete item.cluster_temp;
    });
    
    // Render dynamic components
    renderInsights();
    renderTable();
    renderFinalChart(predictedPoint);
    updateFinancialSimulation();
}

// Render Finalized Scatter Plot with Centroids
function renderFinalChart(predictedPoint = null) {
    const clusterDatasets = Array.from({ length: currentK }, (_, i) => {
        const colorObj = CLUSTER_COLORS[i] || CLUSTER_COLORS[4];
        return {
            label: `Klaster ${i}`,
            data: [],
            backgroundColor: colorObj.fill,
            borderColor: '#0b0f19',
            borderWidth: 1.5,
            pointRadius: 8,
            pointHoverRadius: 11,
            showLine: false
        };
    });
    
    dataset.forEach(item => {
        if (item.cluster < currentK) {
            clusterDatasets[item.cluster].data.push({
                x: item.repair_cost,
                y: SEVERITY_MAPPING[item.severity],
                info: item
            });
        }
    });
    
    // Unscale trained centroids and plot them as large rings
    const unscaledCentroids = trainedCentroids.map((c, i) => {
        const cost = c.x * scalerParams.stdCost + scalerParams.meanCost;
        const sev = c.y * scalerParams.stdSev + scalerParams.meanSev;
        return { x: cost, y: sev, id: i };
    });
    
    const centroidDataset = {
        label: 'Centroid Klaster',
        data: unscaledCentroids.map(c => ({ x: c.x, y: c.y, info: { centroidId: c.id } })),
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: '#ffffff',
        borderWidth: 2,
        pointRadius: 14,
        pointHoverRadius: 16,
        pointStyle: 'circle',
        showLine: false
    };
    
    const datasets = [...clusterDatasets, centroidDataset];
    
    if (predictedPoint) {
        datasets.push({
            label: 'Data Prediksi',
            data: [{
                x: predictedPoint.cost,
                y: SEVERITY_MAPPING[predictedPoint.severity],
                info: {
                    defect_id: 'PRED',
                    product_id: 'NEW',
                    defect_type: 'Prediksi',
                    severity: predictedPoint.severity,
                    repair_cost: predictedPoint.cost,
                    cluster: predictedPoint.cluster
                }
            }],
            backgroundColor: '#ffffff',
            borderColor: '#3b82f6',
            borderWidth: 3,
            pointRadius: 16,
            pointHoverRadius: 18,
            pointStyle: 'star',
            showLine: false
        });
    }
    
    updateChartData(datasets);
    renderCentroidLegends(unscaledCentroids);
}

// Render Centroid Badge details inside chart header
function renderCentroidLegends(centroids) {
    const container = document.getElementById('chart-legends-container');
    container.innerHTML = '';
    
    centroids.forEach(c => {
        const colorObj = CLUSTER_COLORS[c.id] || CLUSTER_COLORS[4];
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `
            <span class="c-dot" style="background-color: ${colorObj.fill};"></span>
            Centroid ${c.id}: $${c.cost !== undefined ? c.cost.toFixed(1) : c.x.toFixed(1)} / ${c.severityScore !== undefined ? c.severityScore.toFixed(1) : c.y.toFixed(1)}
        `;
        container.appendChild(item);
    });
}

// Chart.js instance creator & updater
function updateChartData(datasets) {
    const ctx = document.getElementById('clusterChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#f8fafc',
                        font: { family: 'Outfit', size: 11, weight: 600 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const raw = context.raw.info;
                            if (!raw) return 'Titik Koordinat';
                            if (raw.centroidId !== undefined) {
                                return `Centroid Klaster ${raw.centroidId}`;
                            }
                            return [
                                `ID Cacat: ${raw.defect_id}`,
                                `ID Produk: ${raw.product_id}`,
                                `Tipe Cacat: ${raw.defect_type}`,
                                `Biaya: $${raw.repair_cost.toFixed(2)}`,
                                `Keparahan: ${raw.severity}`,
                                `Klaster: ${raw.cluster !== undefined ? raw.cluster : '-'}`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Biaya Perbaikan Produk ($)',
                        color: '#94a3b8',
                        font: { family: 'Outfit', weight: 600, size: 12 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#94a3b8' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Skor Keparahan',
                        color: '#94a3b8',
                        font: { family: 'Outfit', weight: 600, size: 12 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    min: 0.5,
                    max: 3.5,
                    ticks: {
                        stepSize: 1,
                        color: '#94a3b8',
                        callback: function(value) {
                            if (value === 1) return '1 (Minor)';
                            if (value === 2) return '2 (Moderate)';
                            if (value === 3) return '3 (Critical)';
                            return '';
                        }
                    }
                }
            }
        }
    });
}

// Global Dashboard Metrics Calculator
function updateGlobalStats() {
    document.getElementById('stat-total-cases').textContent = dataset.length;
    
    const sumCost = dataset.reduce((sum, item) => sum + item.repair_cost, 0);
    const avgCost = dataset.length > 0 ? (sumCost / dataset.length) : 0;
    document.getElementById('stat-avg-cost').textContent = `$${avgCost.toFixed(2)}`;
    
    const criticalCount = dataset.filter(item => item.severity === 'Critical').length;
    document.getElementById('stat-critical-count').textContent = criticalCount;
}

// Business Logic Interpreter
function getClusterInterpretation(avgCost, avgSev) {
    if (avgSev >= 2.3 && avgCost >= 200) {
        return {
            category: "🔴 KRITIS & KERUGIAN TINGGI (High-Risk Financial Damage)",
            insight: "Kelompok ini adalah ancaman terbesar bagi profitabilitas dan reputasi perusahaan. Cacat bersifat fatal dan perbaikannya sangat mahal.",
            rekomendasi: "Hentikan jalur perakitan terkait sementara untuk kalibrasi ulang komponen presisi, evaluasi vendor pemasok bahan baku utama, dan perketat lolos QC awal.",
            class: "kategori-red"
        };
    } else if (avgSev >= 2.1) {
        return {
            category: "🟠 KEPARAHAN TINGGI - BIAYA SEDANG (Operational Issues)",
            insight: "Cacat pada kelompok ini berdampak buruk bagi fungsi produk, namun biaya penanganannya masih masuk dalam batas toleransi standar.",
            rekomendasi: "Tingkatkan intensitas perawatan mesin (preventive maintenance) dan lakukan audit berkala terhadap kepatuhan SOP operator di lapangan.",
            class: "kategori-orange"
        };
    } else if (avgCost >= 150) {
        return {
            category: "🟡 BIAYA TINGGI - KEPARAHAN RINGAN (Inefficient Repair Cost)",
            insight: "Tingkat keparahan produk sebenarnya tidak fatal (kosmetik/minor), namun biaya penanganan atau penggantian partnya tidak efisien.",
            rekomendasi: "Tinjau ulang kontrak dengan penyedia jasa perbaikan luar atau cari komponen substitusi lokal yang lebih murah tanpa menurunkan kualitas standar.",
            class: "kategori-yellow"
        };
    } else {
        return {
            category: "🟢 KATEGORI AMAN (Low-Cost & Minor Defects)",
            insight: "Kelompok cacat ringan dengan biaya perbaikan yang sangat murah. Karakteristik ini wajar terjadi dalam batas toleransi produksi massal.",
            rekomendasi: "Cukup lakukan pemantauan berkala menggunakan grafik kendali kualitas statistik (SPC) dan lakukan inspeksi visual reguler di akhir lini.",
            class: "kategori-green"
        };
    }
}

// Render dynamic Cluster Insights Cards
function renderInsights() {
    const container = document.getElementById('insights-container');
    container.innerHTML = '';
    
    clusterMetadata.forEach((meta) => {
        const interpret = getClusterInterpretation(meta.avgCost, meta.avgSev);
        const cardColor = CLUSTER_COLORS[meta.id] || CLUSTER_COLORS[4];
        
        const card = document.createElement('div');
        card.className = `insight-card glass-card ${interpret.class}`;
        
        card.innerHTML = `
            <div class="insight-header">
                <div class="insight-title">
                    <h4 style="color: ${cardColor.fill};">Klaster ${meta.id}</h4>
                    <span style="color: ${cardColor.fill};">${interpret.category}</span>
                </div>
                <span class="badge-count">${meta.count} Produk</span>
            </div>
            <div class="insight-stats">
                <div class="insight-stat">
                    <span class="stat-name">Rerata Biaya</span>
                    <span class="stat-value">$${meta.avgCost.toFixed(2)}</span>
                </div>
                <div class="insight-stat">
                    <span class="stat-name">Skor Keparahan</span>
                    <span class="stat-value">${meta.avgSev.toFixed(2)} / 3.00</span>
                </div>
            </div>
            <div class="insight-desc">
                <p><strong>Analisis:</strong> ${interpret.insight}</p>
            </div>
            <div class="insight-recom">
                <strong>Rekomendasi Strategis:</strong>
                <span>${interpret.rekomendasi}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Render Data Table & Cross-Highlighting
function renderTable() {
    const tbody = document.getElementById('data-table-body');
    tbody.innerHTML = '';
    
    dataset.forEach((item, index) => {
        const colorObj = CLUSTER_COLORS[item.cluster] || CLUSTER_COLORS[4];
        const row = document.createElement('tr');
        row.setAttribute('data-index', index);
        row.setAttribute('data-cluster', item.cluster);
        
        row.innerHTML = `
            <td><strong>${item.defect_id}</strong></td>
            <td>${item.product_id}</td>
            <td>${item.defect_type}</td>
            <td><span class="sev-badge ${item.severity}">${item.severity}</span></td>
            <td>$${item.repair_cost.toFixed(2)}</td>
            <td>
                <span class="cluster-dot-badge">
                    <span class="c-dot" style="background-color: ${colorObj.fill}; color: ${colorObj.fill};"></span>
                    Klaster ${item.cluster}
                </span>
            </td>
        `;
        
        // Mouse hover interactions: highlight scatter point when table row is hovered
        row.addEventListener('mouseenter', () => {
            row.classList.add('highlighted');
            if (chartInstance) {
                // Find matching datasetIndex and pointIndex
                const targetCluster = item.cluster;
                if (targetCluster < currentK) {
                    const ds = chartInstance.data.datasets[targetCluster];
                    const ptIndex = ds.data.findIndex(pt => pt.info && pt.info.defect_id === item.defect_id);
                    if (ptIndex !== -1) {
                        chartInstance.setActiveElements([{ datasetIndex: targetCluster, index: ptIndex }]);
                        chartInstance.update();
                    }
                }
            }
        });
        
        row.addEventListener('mouseleave', () => {
            row.classList.remove('highlighted');
            if (chartInstance) {
                chartInstance.setActiveElements([]);
                chartInstance.update();
            }
        });
        
        tbody.appendChild(row);
    });
}

// Predict cluster for new input data
function predictCluster(cost, severityStr) {
    if (trainedCentroids.length === 0) return 0;
    
    const scaled = scalePoint(cost, severityStr);
    
    let minDist = Infinity;
    let closestCluster = 0;
    
    for (let c = 0; c < currentK; c++) {
        const centroid = trainedCentroids[c];
        const dist = Math.pow(scaled.x - centroid.x, 2) + Math.pow(scaled.y - centroid.y, 2);
        if (dist < minDist) {
            minDist = dist;
            closestCluster = c;
        }
    }
    
    return closestCluster;
}

// Handle Predict Click
function handlePredict() {
    const cost = parseFloat(document.getElementById('pred-cost').value);
    const severity = document.getElementById('pred-severity').value;
    
    if (isNaN(cost) || cost < 0) {
        alert("Masukkan biaya perbaikan yang valid");
        return;
    }
    
    const assignedCluster = predictCluster(cost, severity);
    
    // Display results
    const resultDiv = document.getElementById('predict-result');
    const resClusterId = document.getElementById('res-cluster-id');
    const resDesc = document.getElementById('res-desc');
    
    resultDiv.classList.remove('hidden');
    resClusterId.textContent = assignedCluster;
    
    const colorObj = CLUSTER_COLORS[assignedCluster] || CLUSTER_COLORS[4];
    resClusterId.parentElement.style.backgroundColor = colorObj.fill;
    
    const meta = clusterMetadata[assignedCluster];
    const interpret = getClusterInterpretation(meta.avgCost, meta.avgSev);
    resDesc.innerHTML = `<strong>${interpret.category}</strong><br>Mitigasi: ${interpret.rekomendasi}`;
    
    // Re-render chart with predicted point plotted
    renderFinalChart({ cost, severity, cluster: assignedCluster });
}

// Handle Add Data click
function handleAddData() {
    const id = document.getElementById('new-id').value.trim();
    const product = document.getElementById('new-product').value.trim();
    const type = document.getElementById('new-type').value.trim();
    const cost = parseFloat(document.getElementById('new-cost').value);
    const severity = document.getElementById('new-severity').value;
    
    if (!id || !product || !type || isNaN(cost) || cost < 0) {
        alert("Mohon lengkapi seluruh kolom formulir.");
        return;
    }
    
    if (dataset.some(item => item.defect_id.toLowerCase() === id.toLowerCase())) {
        alert(`Defect ID ${id} sudah terdaftar.`);
        return;
    }
    
    dataset.push({
        defect_id: id,
        product_id: product,
        defect_type: type,
        severity: severity,
        repair_cost: cost
    });
    
    // Reset form inputs
    document.getElementById('add-data-form').reset();
    
    // Reset segment controls visual state
    setupSegmentControls('new-severity-segment', 'new-severity');
    
    // Re-run animated K-Means
    runAnimatedClustering();
    
    alert(`Data cacat ${id} sukses ditambahkan.`);
}

// Financial Mitigation Simulation Logic
function updateFinancialSimulation() {
    const checkboxes = document.querySelectorAll('.mitigation-cb');
    let totalSavings = 0;
    let checkedCount = 0;
    
    checkboxes.forEach(cb => {
        if (cb.checked) {
            totalSavings += parseInt(cb.getAttribute('data-value'));
            checkedCount++;
        }
    });
    
    // Animate counter value
    const savingsVal = document.getElementById('projected-savings-val');
    animateValue(savingsVal, 0, totalSavings, 600);
    
    // Update Risk Badge
    const riskBadge = document.getElementById('current-risk-badge');
    
    riskBadge.className = 'risk-badge';
    
    if (checkedCount === 0) {
        riskBadge.textContent = "KRITIS";
        riskBadge.classList.add('badge-critical');
    } else if (checkedCount === 1) {
        riskBadge.textContent = "AWAS";
        riskBadge.classList.add('badge-warning');
    } else if (checkedCount === 2) {
        riskBadge.textContent = "SEDANG";
        riskBadge.classList.add('badge-moderate');
    } else {
        riskBadge.textContent = "AMAN";
        riskBadge.classList.add('badge-safe');
    }
}

// Helper to animate numbers smoothly
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentVal = Math.floor(progress * (end - start) + start);
        obj.textContent = `$${currentVal.toLocaleString()}`;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}
