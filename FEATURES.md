# 🌊 Sea Fleet Quantum Optimization — Complete Feature Set

## ✅ Implemented Features

### 1. **Dynamic Map-Based Interface**
- ✓ Leaflet world map with 17 ports
- ✓ Point-and-click origin/destination selection
- ✓ Sea-route-only graph (ocean basin grouping)
- ✓ Visual route rendering with algorithm highlighting

### 2. **Multi-Algorithm Comparison**
Algorithms included:
- **Classical:** Greedy shortest-path (instant, 0.01 ms)
- **Simulated Annealing:** Thermal exploration (25–50 ms, explores local optima)
- **QAOA:** Variational quantum circuit placeholder (brute-force fallback, 0.6 ms)

### 3. **Comprehensive Optimization Metrics** (7 total)
- ⛽ **Fuel Cost** (USD) — $0.85/km rate
- ⛽ **Fuel Consumption** (kg) — 0.25 kg/km
- ⏱ **Travel Time** (hours) — 46 km/h average speed
- 🏗 **Port Congestion** (hours) — hub-dependent wait times
- 💼 **Operational Cost** (USD) — $2,000/hour crew & maintenance
- ☁ **Carbon Emissions** (kg CO₂) — 3.15 kg CO₂/liter
- 💰 **Total Cost** (USD) — fuel + operational

### 4. **Visual Comparisons**
Frontend displays:
- ✓ **Cost comparison chart** (all candidate paths)
- ✓ **Algorithm cost delta chart** (% above optimal)
- ✓ **Compute time chart** (Classical vs Annealing vs QAOA)
- ✓ **Metrics comparison table** with color coding
  - 🟢 Green: Best algorithm for metric
  - 🔴 Red: Suboptimal
  - ⚪ Gray: Tied

### 5. **Port Database** (17 Ports)
**India Focus:**
- Mumbai (Bombay), Chennai, Kolkata, Cochin, Port Blair

**Indian Ocean Hub:**
- Dubai, Jebel Ali, Salalah (Oman)

**Global:**
- Shanghai, Tokyo, Singapore, Sydney (Asia)
- Rotterdam, Hamburg (Europe)
- Los Angeles, Long Beach (Americas)
- Cape Town (Africa)

---

## 📊 Real-World Example: Mumbai → Los Angeles

### Route & Distance
```
Mumbai → Kolkata → Shanghai → Los Angeles
15,496 km | 3 hops | 25.8 days transit
```

### Complete Metrics Breakdown

| Component | Value | Annualized (40 voyages/yr) |
|-----------|-------|---------------------------|
| Fuel Cost | $13,172 | $526,880 |
| Fuel Consumption | 3,874 kg | 154,960 kg |
| Travel Time | 619.8 hrs | 24,792 hrs |
| Port Congestion | 11 hrs | 440 hrs |
| Operational Cost | $1,261,681 | $50,467,240 |
| **Carbon Emissions** | **14,027 kg CO₂** | **561,080 kg CO₂** |
| **Total Cost** | **$1,274,853** | **$50,994,120** |

### Algorithm Performance
All three found same optimal solution for this route (straight-line path exists).

When algorithms differ:
- **Classical:** Fast greedy (best for simple trade-offs)
- **Sim Annealing:** Better at complex congestion/cost trade-offs
- **QAOA (real):** Explores superposition; potential exponential speedup for large problems

---

## 🎮 Interactive Demo

### Quick Start
```powershell
cd 's:\4Final\sea fleet'
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m backend.app
```

### Using the Interface
1. Open http://localhost:5000/ in browser
2. Click an origin port (e.g., Mumbai)
3. Click a destination port (e.g., Los Angeles)
4. View results:
   - **Map:** Sea routes drawn (blue=classical, green=annealing, purple=QAOA)
   - **Charts:** Cost, time, compute comparison
   - **Metrics Table:** 7 metrics with algorithm deltas
   - **Route Details:** Port sequence, hops, distance

---

## 🔧 Technical Stack

### Backend
- **Framework:** Flask (Python)
- **Graph:** NetworkX (k-shortest paths)
- **Optimization:** Custom scipy-style
- **Metrics:** Realistic maritime cost model

### Frontend
- **Map:** Leaflet.js (OpenStreetMap)
- **Charts:** Chart.js (cost, time, emissions)
- **Styling:** Custom CSS (responsive panels)

### Data
- **Ports:** 17 major + regional ports (lat/lon)
- **Routes:** Sea basins (Asia-Pacific, Indian Ocean, Europe, Americas, Africa)
- **Costs:** Real-world marine fuel & operational rates

---

## 📈 Key Insights

### Where Classical Excels
✓ Simple, direct routes (few candidates)
✓ Instant response (0.01 ms)
✓ Predictable greedy behavior

### Where Quantum Shines (theoretically)
✓ Complex multi-hop routes (many candidates)
✓ When multiple objectives compete (cost vs. time vs. emissions)
✓ Large combinatorial search spaces
✓ Real QAOA: exponential speedup for certain problem classes

### This Demo
- Classical vs. Simulated Annealing often converge (problem still small, ~8 candidates)
- Simulated Annealing shows when full exploration matters
- QAOA placeholder demonstrates framework for future quantum integration

---

## 🚀 Future Enhancements

1. **Real QAOA Integration**
   - Install Qiskit: `pip install qiskit qiskit-aer`
   - Implement variational circuit with COBYLA optimizer

2. **Multi-Objective Optimization**
   - Parameterized QUBO: `α·cost + β·time + γ·emissions`
   - Pareto frontier visualization

3. **Constraint Handling**
   - Vessel capacity constraints
   - Weather/piracy avoidance
   - Time windows (delivery deadlines)

4. **Real-Time Integration**
   - Live AIS data (vessel tracking)
   - Current weather/sea conditions
   - Dynamic fuel prices

5. **Scalability**
   - 100+ ports (major global network)
   - Streaming graph updates
   - Distributed solvers

---

## 📞 Support

**Questions about the demo?**
- See [README.md](README.md) for setup
- See [METRICS_GUIDE.md](METRICS_GUIDE.md) for metric details
- See [DEMO_RESULTS.md](DEMO_RESULTS.md) for sample outputs

**Want to extend it?**
- Modify `backend/metrics.py` for new cost models
- Extend `backend/data_ports.py` with more ports
- Add new charts in `frontend/main.js`
