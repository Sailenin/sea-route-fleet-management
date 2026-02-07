const map = L.map('map').setView([15, 65], 3);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 10 }).addTo(map);
let ports = [];
let markers = {};
let origin = null;
let dest = null;
let otherLayers = [];
let charts = {};

fetch('/api/ports').then(r => r.json()).then(data => {
    ports = data;
    ports.forEach(p => {
        const m = L.circleMarker([p.lat, p.lon], {
            radius: 6,
            fillColor: '#1976D2',
            color: '#0d47a1',
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.85
        }).addTo(map);
        const popupText = p.name + ' (' + (p.region || 'Unknown') + ')';
        m.bindPopup(popupText);
        m.on('click', () => onPortClick(p));
        markers[p.id] = m;
    });
});

function onPortClick(p) {
    if (!origin) {
        origin = p.id;
        markers[p.id].setStyle({ fillColor: '#4CAF50', color: '#2E7D32', radius: 8, weight: 3, fillOpacity: 0.95 });
        markers[p.id].bindPopup('🟢 Origin: ' + p.name).openPopup();
        updateInfo();
    } else if (!dest && p.id !== origin) {
        dest = p.id;
        markers[p.id].setStyle({ fillColor: '#F44336', color: '#C62828', radius: 8, weight: 3, fillOpacity: 0.95 });
        markers[p.id].bindPopup('🔴 Destination: ' + p.name).openPopup();
        updateInfo();
        requestRoutes();
    } else {
        clearSelection();
        updateInfo();
    }
}

function clearSelection() {
    origin = null;
    dest = null;
    for (let id in markers) {
        markers[id].closePopup();
        markers[id].setStyle({ fillColor: '#1976D2', color: '#0d47a1', radius: 6, weight: 2, fillOpacity: 0.85 });
    }
    otherLayers.forEach(l => map.removeLayer(l));
    otherLayers = [];
    Object.values(charts).forEach(c => {
        if (c) c.destroy();
    });
    charts = {};
}

function updateInfo() {
    const info = document.getElementById('info');
    const originName = origin ? ports.find(p => p.id == origin)?.name : '—';
    const destName = dest ? ports.find(p => p.id == dest)?.name : '—';
    info.innerHTML = '<b>Origin:</b> ' + originName + '<br><b>Destination:</b> ' + destName;
}

function requestRoutes() {
    fetch(`/api/routes?origin=${origin}&dest=${dest}`)
        .then(r => r.json())
        .then(showRoutes)
        .catch(e => alert('Error: ' + e));
}

function showRoutes(data) {
    otherLayers.forEach(l => map.removeLayer(l));
    otherLayers = [];

    const drawPath = (coords, opts) => {
        const latlngs = coords.map(c => [c[0], c[1]]);
        const pl = L.polyline(latlngs, opts).addTo(map);
        otherLayers.push(pl);
    };

    // Draw all candidates with very subtle styling
    data.candidates_coords.forEach((c, i) => {
        drawPath(c, { color: '#e0e0e0', weight: 1.2, opacity: 0.15, lineCap: 'round' });
    });

    // Draw top solutions prominently with enhanced styling
    const best = data.classical.index;
    const qaoa = data.qaoa.index;

    // Classical route: solid blue with glow effect
    drawPath(data.classical.coords, { color: '#1976D2', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round', dashArray: '0' });
    drawPath(data.classical.coords, { color: '#1976D2', weight: 9, opacity: 0.2, lineCap: 'round', lineJoin: 'round' });

    // QAOA route: dashed purple with glow effect
    drawPath(data.qaoa.coords, { color: '#7B1FA2', weight: 4.5, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: '6,3' });
    drawPath(data.qaoa.coords, { color: '#7B1FA2', weight: 8, opacity: 0.15, lineCap: 'round', lineJoin: 'round', dashArray: '6,3' });

    displayComparisons(data);
    displayRouteDetails(data);
}

function displayComparisons(data) {
    // CLEAR SUMMARY AT TOP - Board Presentation Style
    {
        const summaryContainer = document.getElementById('comparisons').querySelector('.board-summary') || document.createElement('div');
        if (!summaryContainer.className) {
            summaryContainer.className = 'board-summary comparison-section';
            document.getElementById('comparisons').insertBefore(summaryContainer, document.getElementById('comparisons').firstChild);
        }

        const classical = data.classical;
        const qaoa = data.qaoa;

        let bestRoute = classical.cost < qaoa.cost ? 'Classical' : 'QAOA';
        let costSavings = Math.abs(classical.cost - qaoa.cost);

        let html = `<div style="background: #e8f4f8; padding: 10px; border-radius: 4px; margin-bottom: 8px;">
            <h4 style="margin: 0 0 8px 0; color: #0d47a1; font-size: 13px;">📊 OPTIMIZATION RESULTS SUMMARY</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div style="background: #1976D2; color: white; padding: 8px; border-radius: 3px; text-align: center;">
                    <div style="font-size: 10px; opacity: 0.9;">🔵 CLASSICAL</div>
                    <div style="font-size: 14px; font-weight: bold;">${classical.cost.toFixed(0)} km</div>
                    <div style="font-size: 9px; margin-top: 3px;">Distance-optimized</div>
                </div>
                <div style="background: #7B1FA2; color: white; padding: 8px; border-radius: 3px; text-align: center;">
                    <div style="font-size: 10px; opacity: 0.9;">🟣 QAOA</div>
                    <div style="font-size: 14px; font-weight: bold;">${qaoa.cost.toFixed(0)} km</div>
                    <div style="font-size: 9px; margin-top: 3px;">Quantum-optimized</div>
                </div>
            </div>
            <div style="margin-top: 8px; padding: 6px; background: white; border-radius: 3px; text-align: center; border: 2px solid #ff6b00;">
                <div style="font-size: 11px; color: #333;"><strong>KEY DIFFERENCE: ${costSavings.toFixed(0)} km (${(Math.abs(classical.cost - qaoa.cost) / Math.max(classical.cost, qaoa.cost) * 100).toFixed(1)}%)</strong></div>
                <div style="font-size: 10px; color: #666; margin-top: 4px;">
                    ${data.metric_comparison ?
                `QAOA optimizes multiple metrics beyond distance: fuel, carbon, time, cost` :
                'Select route to see detailed metrics comparison'
            }
                </div>
            </div>
        </div>`;

        summaryContainer.innerHTML = html;
    }

    // Component Comparison Chart (replace path-costs chart)
    {
        const target = data.optimized_component || 'carbon_emissions_kg_co2';
        const labelMap = {
            'carbon_emissions_kg_co2': 'Carbon Emissions (kg CO₂)',
            'fuel_cost_usd': 'Fuel Cost (USD)',
            'fuel_consumption_kg': 'Fuel Consumption (kg)',
            'travel_time_hours': 'Travel Time (hrs)',
            'operational_cost_usd': 'Operational Cost (USD)',
            'port_congestion_hours': 'Port Congestion (hrs)',
            'total_cost_usd': 'Total Cost (USD)'
        };

        const displayLabel = labelMap[target] || target;
        const divId = 'componentChart';
        let div = document.getElementById(divId + '_container');
        if (!div) {
            div = document.createElement('div');
            div.id = divId + '_container';
            div.className = 'comparison-section';
            div.innerHTML = `<h4>Comparison — ${displayLabel}</h4><canvas id="${divId}" height="120"></canvas>`;
            document.getElementById('comparisons').insertBefore(div, document.getElementById('comparisons').firstChild);
        }

        const canvas = document.getElementById(divId);
        if (charts.component) charts.component.destroy();
        const cValue = (obj, key) => (obj && obj.metrics && typeof obj.metrics[key] !== 'undefined') ? obj.metrics[key] : 0;
        charts.component = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Classical', 'QAOA'],
                datasets: [{
                    label: displayLabel,
                    data: [cValue(data.classical, target), cValue(data.qaoa, target)],
                    backgroundColor: ['#1976D2', '#7B1FA2'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'x',
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
        // show improvement text under the chart
        const impPct = data.optimization_summary[target] ? data.optimization_summary[target].improvement_pct : 0;
        const impElemId = divId + '_imp';
        let impElem = document.getElementById(impElemId);
        if (!impElem) {
            impElem = document.createElement('div');
            impElem.id = impElemId;
            impElem.style.fontSize = '11px';
            impElem.style.marginTop = '6px';
            div.appendChild(impElem);
        }
        if (impPct > 0) {
            impElem.innerHTML = `QAOA improves ${displayLabel} by ${impPct.toFixed(1)}% vs Classical.`;
        } else {
            impElem.innerHTML = `No improvement in ${displayLabel} vs Classical.`;
        }
    }

    // Algorithm Cost Comparison
    {
        const div = document.getElementById('comparisons').querySelector('.cost-algo') || document.createElement('div');
        if (!div.className) {
            div.className = 'comparison-section cost-algo';
            div.innerHTML = '<h4>Algorithm Results</h4>';
            document.getElementById('comparisons').appendChild(div);
        }

        const best = Math.min(data.classical.cost, data.qaoa.cost);
        const algoData = [
            { name: 'Classical', cost: data.classical.cost, delta: data.classical.cost_delta_pct, time: data.classical.compute_time_ms, objective: 'Minimize distance' },
            { name: 'QAOA (Carbon-Optimized)', cost: data.qaoa.cost, delta: data.qaoa.cost_delta_pct, time: data.qaoa.compute_time_ms, objective: 'Minimize carbon + fuel + operational' }
        ];

        div.innerHTML = '<h4>Algorithm Results</h4>' +
            algoData.map(a => {
                const isBest = a.cost === best;
                return `<div class="algo-result ${isBest ? 'best' : ''}"><div class="algo-row">
                    <span class="algo-name">${a.name}</span></div>
                    <div style="font-size:9px; color:#444; margin:4px 0;">Objective: ${a.objective}</div>
                    <div class="algo-row"><span>Cost:</span> <span class="algo-metric">${a.cost.toFixed(0)} km</span></div>
                    <div class="algo-row"><span>Δ:</span> <span class="algo-metric">${a.delta.toFixed(1)}%</span></div>
                    <div class="algo-row"><span>Time:</span> <span class="algo-metric">${a.time.toFixed(2)} ms</span></div></div>`;
            }).join('');
    }

    // (Removed Cost vs Best chart for this demo — simplifies comparisons)

    // Compute Time Comparison
    {
        const ctx = document.getElementById('timeChart');
        if (!ctx) {
            const div = document.createElement('div');
            div.className = 'comparison-section';
            div.innerHTML = '<h4>Compute Time (ms)</h4><canvas id="timeChart" height="80"></canvas>';
            document.getElementById('comparisons').appendChild(div);
        }
        const canvas = document.getElementById('timeChart');
        if (charts.time) charts.time.destroy();
        charts.time = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['Classical', 'QAOA (Carbon-Optimized)'],
                datasets: [{
                    label: 'Time (ms)',
                    data: [data.classical.compute_time_ms, data.qaoa.compute_time_ms],
                    backgroundColor: ['#1976D2', '#7B1FA2'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                indexAxis: 'x',
                scales: { y: { beginAtZero: true } },
                plugins: { legend: { display: false } }
            }
        });
    }

    // Display optimization metrics comparison
    if (data.metric_comparison) {
        displayMetricComparison(data.metric_comparison, data);
    }
}

function displayRouteDetails(data) {
    const html = `
        <h4 style="margin-top: 10px; color: #1a5490;">Route Details</h4>
        <div><b>From:</b> ${data.origin_port}</div>
        <div><b>To:</b> ${data.dest_port}</div>
        <div><b>Cost Range:</b> ${data.min_cost.toFixed(0)} — ${data.max_cost.toFixed(0)} km (Δ ${data.cost_range.toFixed(0)} km)</div>
        <div style="margin-top: 4px;"><b>Chosen Path (Classical):</b></div>
        <div style="font-size: 9px; margin-left: 6px;">
            ${data.classical.path_summary.path_ids.map(pid => {
        const p = ports.find(x => x.id == pid);
        return p ? `${p.name}` : `ID:${pid}`;
    }).join(' → ')}
            <br/>(${data.classical.path_summary.hops} hops, ${data.classical.path_summary.distance_km.toFixed(0)} km)
        </div>
    `;
    document.getElementById('routeDetails').innerHTML = html;
}

function displayMetricComparison(metricComparison) {
    // Create a container for metric comparisons
    let metricsContainer = document.getElementById('metricsComparisonContainer');
    if (!metricsContainer) {
        metricsContainer = document.createElement('div');
        metricsContainer.id = 'metricsComparisonContainer';
        metricsContainer.className = 'comparison-section';
        document.getElementById('comparisons').appendChild(metricsContainer);
    }

    // Define metric display names and units
    const metricLabels = {
        'fuel_cost_usd': { name: '⛽ Fuel Cost', unit: 'USD' },
        'fuel_consumption_kg': { name: '⛽ Fuel Consumption', unit: 'kg' },
        'travel_time_hours': { name: '⏱ Travel Time', unit: 'hrs' },
        'port_congestion_hours': { name: '🏗 Port Congestion', unit: 'hrs' },
        'operational_cost_usd': { name: '💼 Operational Cost', unit: 'USD' },
        'carbon_emissions_kg_co2': { name: '☁ Carbon Emissions', unit: 'kg CO2' },
        'total_cost_usd': { name: '💰 Total Cost', unit: 'USD' }
    };

    let html = '<h4>⚡ Optimization Metrics Comparison</h4>';
    html += '<div class="metrics-table">';

    // Create comparison tables for each metric (Classical vs QAOA)
    for (const [metric, comparison] of Object.entries(metricComparison)) {
        const label = metricLabels[metric] || { name: metric, unit: '' };
        const classical = comparison.classical;
        const qaoa = comparison.qaoa;
        const qaoaDelta = comparison.qaoa_delta_pct;

        // Highlight which is better
        const classicalBest = classical <= qaoa;
        const qaoaBest = qaoa <= classical;

        html += `
            <div class="metric-row">
                <div class="metric-name">${label.name}</div>
                <div class="metric-box ${classicalBest ? 'best' : 'neutral'}">
                    <div class="metric-algo">Classical</div>
                    <div class="metric-value">${classical.toFixed(1)}</div>
                    <div class="metric-unit">${label.unit}</div>
                </div>
                <div class="metric-box ${qaoaBest ? 'best' : (qaoaDelta > 0 ? 'worse' : 'neutral')}">
                    <div class="metric-algo">QAOA</div>
                    <div class="metric-value">${qaoa.toFixed(1)}</div>
                    <div class="metric-delta ${qaoaDelta > 0 ? 'negative' : 'positive'}">
                        ${qaoaDelta > 0 ? '+' : ''}${qaoaDelta.toFixed(1)}%
                    </div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    metricsContainer.innerHTML = html;

    // Display optimization summary below metrics
    if (data && data.optimization_summary) {
        displayOptimizationSummary(data);
    }
}

function displayOptimizationSummary(data) {
    let summaryContainer = document.getElementById('optimizationSummaryContainer');
    if (!summaryContainer) {
        summaryContainer = document.createElement('div');
        summaryContainer.id = 'optimizationSummaryContainer';
        summaryContainer.className = 'comparison-section';
        document.getElementById('comparisons').appendChild(summaryContainer);
    }

    let html = '<h4 style="color: #0d47a1; border-bottom: 2px solid #ff6b00; padding-bottom: 6px;">📊 APPROACH COMPARISON: Which Algorithm Is Better?</h4>';

    // Count which approach is better for which metrics
    let classicalWins = 0, qaoaWins = 0, ties = 0;
    const results = [];

    for (const [metric, summary] of Object.entries(data.optimization_summary)) {
        if (summary.better === 'Classical') classicalWins++;
        else if (summary.better === 'QAOA') qaoaWins++;
        else ties++;
        results.push({ metric, ...summary });
    }

    const total = classicalWins + qaoaWins + ties;

    html += `<div style="margin: 10px 0; padding: 10px; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 4px; border: 2px solid #1976D2;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: center;">
            <div>
                <div style="font-size: 12px; font-weight: 600; color: #1976D2;">🔵 CLASSICAL</div>
                <div style="font-size: 20px; font-weight: bold; color: #1976D2;">${classicalWins}</div>
                <div style="font-size: 10px; color: #666;">of ${total} metrics</div>
            </div>
            <div>
                <div style="font-size: 12px; font-weight: 600; color: #7B1FA2;">🟣 QAOA</div>
                <div style="font-size: 20px; font-weight: bold; color: #7B1FA2;">${qaoaWins}</div>
                <div style="font-size: 10px; color: #666;">of ${total} metrics</div>
            </div>
        </div>
    </div>`;

    // Show detailed improvements
    html += '<div style="font-size: 0.85em; color: #333;">';

    // QAOA advantages
    const qaoaImprovements = results.filter(r => r.better === 'QAOA');
    if (qaoaImprovements.length > 0) {
        html += '<div style="margin: 10px 0; padding: 8px; background: #f3e5f5; border-left: 4px solid #7B1FA2; border-radius: 2px;"><strong style="color: #7B1FA2;">✅ QAOA performs better in:</strong>';
        qaoaImprovements.forEach(r => {
            const metricName = r.metric.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            html += `<div style="margin: 4px 0 4px 12px; font-size: 10px;">• <strong>${metricName}</strong>: <span style="color: #7B1FA2; font-weight: bold;">${r.improvement_pct.toFixed(1)}%</span> improvement</div>`;
        });
        html += '</div>';
    }

    // Classical advantages
    const classicalImprovements = results.filter(r => r.better === 'Classical');
    if (classicalImprovements.length > 0) {
        html += '<div style="margin: 10px 0; padding: 8px; background: #e3f2fd; border-left: 4px solid #1976D2; border-radius: 2px;"><strong style="color: #1976D2;">✅ CLASSICAL performs better in:</strong>';
        classicalImprovements.forEach(r => {
            const metricName = r.metric.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            html += `<div style="margin: 4px 0 4px 12px; font-size: 10px;">• <strong>${metricName}</strong>: <span style="color: #1976D2; font-weight: bold;">${r.improvement_pct.toFixed(1)}%</span> better</div>`;
        });
        html += '</div>';
    }

    html += '</div>';

    // Add board presentation insight
    if (qaoaWins > classicalWins) {
        html += `<div style="margin-top: 10px; padding: 8px; background: #fff9c4; border-left: 4px solid #ff6b00; border-radius: 2px; font-size: 10px; color: #666;">
            <strong style="color: #ff6b00;">💡 INSIGHT:</strong> QAOA quantum-optimized approach provides measurable advantages across ${qaoaWins} key metrics, demonstrating multi-objective optimization superiority for real-world fleet operations.
        </div>`;
    }

    summaryContainer.innerHTML = html;
}

function displayMetricComparison(metricComparison, allData) {
    // Create a container for metric comparisons
    let metricsContainer = document.getElementById('metricsComparisonContainer');
    if (!metricsContainer) {
        metricsContainer = document.createElement('div');
        metricsContainer.id = 'metricsComparisonContainer';
        metricsContainer.className = 'comparison-section';
        document.getElementById('comparisons').appendChild(metricsContainer);
    }

    // Define metric display names and units
    const metricLabels = {
        'fuel_cost_usd': { name: '⛽ Fuel Cost', unit: 'USD' },
        'fuel_consumption_kg': { name: '⛽ Fuel Consumption', unit: 'kg' },
        'travel_time_hours': { name: '⏱ Travel Time', unit: 'hrs' },
        'port_congestion_hours': { name: '🏗 Port Congestion', unit: 'hrs' },
        'operational_cost_usd': { name: '💼 Operational Cost', unit: 'USD' },
        'carbon_emissions_kg_co2': { name: '☁ Carbon Emissions', unit: 'kg CO2' },
        'total_cost_usd': { name: '💰 Total Cost', unit: 'USD' }
    };

    let html = '<h4>⚡ Optimization Metrics Comparison</h4>';
    html += '<div class="metrics-table">';

    // Create comparison tables for each metric (Classical vs QAOA)
    for (const [metric, comparison] of Object.entries(metricComparison)) {
        const label = metricLabels[metric] || { name: metric, unit: '' };
        const classical = comparison.classical;
        const qaoa = comparison.qaoa;
        const qaoaDelta = comparison.qaoa_delta_pct;

        // Highlight which is better
        const classicalBest = classical <= qaoa;
        const qaoaBest = qaoa <= classical;

        html += `
            <div class="metric-row">
                <div class="metric-name">${label.name}</div>
                <div class="metric-box ${classicalBest ? 'best' : 'neutral'}">
                    <div class="metric-algo">Classical</div>
                    <div class="metric-value">${classical.toFixed(1)}</div>
                    <div class="metric-unit">${label.unit}</div>
                </div>
                <div class="metric-box ${qaoaBest ? 'best' : (qaoaDelta > 0 ? 'worse' : 'neutral')}">
                    <div class="metric-algo">QAOA</div>
                    <div class="metric-value">${qaoa.toFixed(1)}</div>
                    <div class="metric-delta ${qaoaDelta > 0 ? 'negative' : 'positive'}">
                        ${qaoaDelta > 0 ? '+' : ''}${qaoaDelta.toFixed(1)}%
                    </div>
                </div>
            </div>
        `;
    }

    html += '</div>';
    metricsContainer.innerHTML = html;

    // Display optimization summary below metrics
    if (allData && allData.optimization_summary) {
        displayOptimizationSummary(allData);
    }
}
