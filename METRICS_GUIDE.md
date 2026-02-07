# 🚢 Quantum vs Classical Sea Fleet Optimization — Metrics Comparison

## ✨ Key Enhancement: Realistic Business Metrics

Added **7 critical optimization metrics** to compare Classical, Simulated Annealing, and QAOA algorithms:

### 📊 Metrics Calculated

1. **⛽ Fuel Cost (USD)**
   - Based on actual distance traveled
   - Rate: $0.85/km (typical marine fuel cost)
   - Formula: `distance_km × 0.85`

2. **⛽ Fuel Consumption (kg)**
   - Marine diesel consumption
   - Rate: 0.25 kg/km (main engine)
   - Formula: `distance_km × 0.25`
   - Density: 0.87 kg/liter for marine fuel

3. **⏱ Travel Time (hours)**
   - Average cruising speed: 25 knots (~46 km/h)
   - Formula: `distance_km / 46`
   - Example: 15,496 km = 619.8 hours (25.8 days)

4. **🏗 Port Congestion (hours)**
   - Wait time at intermediate ports
   - Modeled by port hub importance
   - **Major hubs** (Shanghai, Singapore, Dubai): 6–8 hours
   - **Regional ports** (Chennai, Cochin): 4 hours
   - **Small ports** (Port Blair, Salalah): 2 hours
   - Formula: `sum(wait_time at intermediate ports)`

5. **💼 Operational Cost (USD)**
   - Crew, maintenance, insurance, insurance
   - Rate: $2,000/hour (sea + port time)
   - Formula: `(travel_time + congestion_time) × 2000`
   - Example: (619.8 + 11) hrs × $2000 = $1,261,681

6. **☁ Carbon Emissions (kg CO₂)**
   - Marine fuel CO₂ intensity
   - Rate: 3.15 kg CO₂/liter of fuel burned
   - Formula: `(fuel_consumption_kg / density) × 3.15`
   - Example: 3874 kg ÷ 0.87 × 3.15 = 14,026.6 kg CO₂

7. **💰 Total Cost (USD)**
   - Fuel + Operational (excludes capital/depreciation)
   - Formula: `fuel_cost + operational_cost`
   - Example: $13,172 + $1,261,681 = $1,274,853

---

## 📈 Sample Results: Mumbai → Los Angeles

### Route Chosen
```
Mumbai (10) → Kolkata (12) → Shanghai (1) → Los Angeles (4)
Distance: 15,496 km | Hops: 3
```

### Classical Algorithm Metrics
| Metric | Value | Notes |
|--------|-------|-------|
| Fuel Cost | $13,172 | |
| Fuel Consumption | 3,874 kg | ~4 tons |
| Travel Time | 619.8 hours | **25.8 days** |
| Port Congestion | 11 hours | Ports at Mumbai, Kolkata, Shanghai |
| Operational Cost | $1,261,681 | Crew, maintenance @ $2k/hr |
| Carbon Emissions | 14,027 kg CO₂ | **14 metric tons** |
| **Total Cost** | **$1,274,853** | Per voyage |

### Algorithm Comparison (all found same optimal)
```
╔════════════════════╦═════════════════════╦════════════╦════════════╗
║ Metric             ║ Classical           ║ Sim Ann    ║ QAOA       ║
╠════════════════════╬═════════════════════╬════════════╬════════════╣
║ Total Cost         ║ $1,274,853  ✓       ║ $1,274,853 ║ $1,274,853 ║
║ Carbon Emissions   ║ 14,027 kg CO₂ ✓     ║ 14,027     ║ 14,027     ║
║ Travel Time        ║ 619.8 hrs ✓         ║ 619.8      ║ 619.8      ║
║ Fuel Consumption   ║ 3,874 kg ✓          ║ 3,874      ║ 3,874      ║
╚════════════════════╩═════════════════════╩════════════╩════════════╝
```

---

## 🎯 Frontend Display

### Metric Comparison Table
Shows all 7 metrics with:
- **Classical value** (baseline)
- **Sim Annealing value** (with % delta)
- **QAOA value** (with % delta)
- **Color coding:**
  - 🟢 Green: Best algorithm for that metric
  - 🔴 Red: Worse than optimal
  - ⚪ Gray: Neutral/tied

### Example Layout (4 metrics visible):
```
⛽ Fuel Cost
  Classical: $13,172  |  Sim Ann: $13,172 (0.0%)  |  QAOA: $13,172 (0.0%)

⏱ Travel Time
  Classical: 619.8 hrs  |  Sim Ann: 619.8 hrs (0.0%)  |  QAOA: 619.8 hrs (0.0%)

🏗 Port Congestion
  Classical: 11 hrs  |  Sim Ann: 11 hrs (0.0%)  |  QAOA: 11 hrs (0.0%)

💼 Operational Cost
  Classical: $1,261,681  |  Sim Ann: $1,261,681 (0.0%)  |  QAOA: $1,261,681 (0.0%)

☁ Carbon Emissions
  Classical: 14,027 kg CO₂  |  Sim Ann: 14,027 (0.0%)  |  QAOA: 14,027 (0.0%)

💰 Total Cost
  Classical: $1,274,853  |  Sim Ann: $1,274,853 (0.0%)  |  QAOA: $1,274,853 (0.0%)
```

---

## 🔬 When Algorithms Differ

### Small paths (< 5,000 km, few hops)
- Classical often wins (instant)
- All three converge quickly

### Complex paths (> 10,000 km, multi-hop with congestion)
- **Simulated Annealing:** Explores thermal perturbations; may find better congestion paths
- **Classical (greedy):** Can miss tradeoffs (e.g., shorter distance but heavier congestion)
- **QAOA (variational):** On real quantum hardware, can explore superposition of paths

### Real-world case: fuel vs. time vs. congestion
Suppose a route exists:
- **Path A:** 10,000 km, 2 major hubs → $987k operational cost
- **Path B:** 11,500 km, 1 small hub → $920k operational cost (saves congestion)

Classical might pick A (shorter). Simulated Annealing might find B (lower total).

---

## 🚀 How It Works

### Backend (`backend/metrics.py`)
```python
calculate_metrics(path, distance_km, ports_dict)
  → returns dict with all 7 metrics
  
compare_metrics(classical_metrics, annealing_metrics, qaoa_metrics)
  → returns side-by-side % deltas
```

### Frontend (`frontend/main.js`)
```javascript
displayMetricComparison(metricComparison)
  → renders table with color highlights
  → 🟢 green for best, 🔴 red for worst
```

### API Response Structure
```json
{
  "classical": {
    "metrics": {
      "fuel_cost_usd": 13171.61,
      "travel_time_hours": 619.8,
      "port_congestion_hours": 11,
      "operational_cost_usd": 1261681.06,
      "carbon_emissions_kg_co2": 14026.6,
      "total_cost_usd": 1274852.68
    }
  },
  "annealer": { "metrics": {...} },
  "qaoa": { "metrics": {...} },
  "metric_comparison": {
    "fuel_cost_usd": {
      "classical": 13171.61,
      "annealing": 13171.61,
      "annealing_delta_pct": 0.0,
      "qaoa": 13171.61,
      "qaoa_delta_pct": 0.0
    },
    ...
  }
}
```

---

## 📊 Next Steps

1. **Multi-constraint QUBO:** Weight metrics (e.g., 50% cost, 30% time, 20% emissions)
2. **Port fees:** Add port-specific handling charges
3. **Seasonal factors:** Weather patterns, piracy risk zones
4. **Real QAOA:** Implement on Qiskit/IonQ with true variational ansatz
5. **What-if scenarios:** "Show me lowest-carbon route" vs. "fastest route"

---

## 🔗 Live Demo

Open **http://localhost:5000/** and click two ports:
- Click **origin** port
- Click **destination** port
- View metrics comparison and highlighted best algorithm for each metric
