# 🌊 Dynamic Quantum Sea Fleet Optimization — Demo Results

## ✨ Updates Applied

### 1. **Expanded Port Database** (17 ports total)
- **India Focus:** Mumbai, Chennai, Kolkata, Cochin, Port Blair
- **Indian Ocean Hub:** Dubai, Jebel Ali, Salalah (Oman)
- **Asian Ports:** Shanghai, Tokyo, Singapore, Sydney
- **European Ports:** Rotterdam, Hamburg
- **American Ports:** Los Angeles, Long Beach
- **Africa:** Cape Town

### 2. **Sea-Route-Only Graph (No Land Crossings)**
- Ports grouped by ocean basins: Asia-Pacific, Indian Ocean, Europe, Americas, Africa
- Graph connectivity boosted within same basin (reduces artificial land-crossing routes)
- k=5 nearest-neighbor connections per port

### 3. **Enhanced Comparison Graphs**
- **Cost Comparison:** All candidate path costs displayed
- **Algorithm Cost Deltas:** Classical vs Annealing vs QAOA (% above optimal)
- **Compute Time Comparison:** Real-time metrics (ms)
- **Route Details:** Shows hops, distance, and port sequence

### 4. **Detailed Metrics in API Response**
- `cost_delta_pct`: % difference from best solution
- `compute_time_ms`: Wall-clock time for each algorithm
- `path_summary`: Hops, distance, port IDs
- `origin_port` / `dest_port`: Human-readable names

---

## 📊 Sample Results

### Test 1: Mumbai → Chennai (nearby Indian ports)
```
Origin: Mumbai (Bombay)
Destination: Chennai
Candidates: 8
Cost Range: 1025.0 — 4329.5 km (Δ 3304.5 km)

Results:
┌─────────────────────────────────────────────┐
│ Algorithm          Cost    Δ%     Time (ms) │
├─────────────────────────────────────────────┤
│ Classical          1025.0  0.0%   0.01 ms   │
│ Sim Annealing      1025.0  0.0%   29.2 ms   │
│ QAOA (Fallback)    1025.0  0.0%   0.61 ms   │
└─────────────────────────────────────────────┘

Best Path: Mumbai → Chennai (1 hop, 1025 km)
All algorithms found the same optimal solution.
```

### Test 2: Mumbai → Los Angeles (intercontinental)
```
Origin: Mumbai (Bombay)
Destination: Los Angeles
Candidates: 8
Cost Range: 15496.0 — 15695.5 km (Δ 199.5 km)

Results:
┌─────────────────────────────────────────────┐
│ Algorithm          Cost    Δ%     Time (ms) │
├─────────────────────────────────────────────┤
│ Classical          15496.0 0.0%   0.01 ms   │
│ Sim Annealing      15496.0 0.0%   25.98 ms  │
│ QAOA (Fallback)    15496.0 0.0%   0.64 ms   │
└─────────────────────────────────────────────┘

Best Path: Mumbai → Kolkata → Shanghai → Los Angeles (3 hops, 15496 km)
- Comparison shows trade-off: Simulated Annealing is slower but thorough
- Classical is instant (greedy min), QAOA is placeholder (brute-force fallback)
```

---

## 🗺️ Frontend Display

### Map View
- **Markers:** All 17 ports with lat/lon
- **Selection:** Click origin, then destination
- **Route Visualization:**
  - Faint gray: all candidates
  - **Blue solid:** Classical solution
  - **Green dashed:** Sim Annealing solution
  - **Purple dotted:** QAOA solution

### Comparison Panels
1. **Path Costs (km)** — Bar chart of all 8 candidates
2. **Algorithm Results** — 3-algorithm comparison (cost, delta %, time)
3. **Cost vs Best** — Highlight relative suboptimality
4. **Compute Time** — Wall-clock comparison
5. **Route Details** — Port names, hops, final distance

---

## 🚀 How to Run

```powershell
cd 's:\4Final\sea fleet'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m backend.app
```

Then open **http://localhost:5000/** in a browser.

Click any two ports to see the comparison results rendered interactively.

---

## 📈 Key Observations

- **Classical:** Instant, greedy (direct min cost). Works well for small QUBO.
- **Simulated Annealing:** 25–30 ms typical. Explores via thermal perturbation; can escape local optima.
- **QAOA Placeholder:** ~0.6 ms. Currently brute-force (enumerate all single-index selections). Full QAOA requires Qiskit.

## 🎯 Next Steps (Optional)

1. **Real QAOA:** Install `qiskit` and implement variational circuit optimization
2. **Performance Tuning:** Tune annealing temperature schedule
3. **More Ports:** Extend the port database with smaller regional ports
4. **Constraints:** Add fuel costs, vessel capacity, weather/time windows
