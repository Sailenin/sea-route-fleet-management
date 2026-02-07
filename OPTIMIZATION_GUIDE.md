# Classical vs QAOA Route Optimization Comparison

## Overview

This sea fleet route optimization system now compares two fundamentally different optimization approaches:

### **Classical Approach**
- **Objective**: Minimize route distance (shortest path)
- **Optimization Metric**: Distance in kilometers
- **Use Case**: Fast maritime logistics, time-sensitive shipments
- **Advantage**: Simplest, fastest to compute

### **QAOA Approach**  
- **Objective**: Minimize carbon footprint and fuel consumption
- **Optimization Metrics**: 
  - 100% Carbon Emissions (primary driver)
  - 25% Fuel Cost (secondary)
  - 15% Operational Cost (tertiary)
- **Use Case**: Sustainable shipping, environmental compliance
- **Advantage**: Considers multi-objective optimization with environmental impact

---

## Displayed Metrics

Each route comparison shows **7 key performance indicators**:

| Metric | Unit | What It Measures | Optimized By |
|--------|------|------------------|--------------|
| **⛽ Fuel Cost** | USD | Fuel expense for voyage | Both equally |
| **⛽ Fuel Consumption** | kg | Total fuel burned | Both equally |
| **☁ Carbon Emissions** | kg CO2 | Environmental impact | QAOA (carbon-weighted) |
| **⏱ Travel Time** | hours | Total journey duration | Classical (shorter distance) |
| **🏗 Port Congestion** | hours | Wait time at intermediate ports | Both depend on route |
| **💼 Operational Cost** | USD | Crew, maintenance, insurance | Both depend on time |
| **💰 Total Cost** | USD | Fuel + Operational combined | Classical (typically) |

---

## Result Display

After selecting an origin and destination:

### **1. Algorithm Selection**
Shows which route each algorithm chose:
- Classical: Selects candidate with minimum distance
- QAOA: Selects candidate with minimum carbon + fuel + operational cost

### **2. Metrics Comparison Table**
For each metric:
- **Classical Value**: What the classical optimized route achieves
- **QAOA Value**: What the QAOA optimized route achieves
- **Delta %**: Percent difference between approaches
- **Best**: Which approach achieves the better result (✅ highlighted)

### **3. Approach Comparison Results**
Summary showing:
- How many metrics each approach wins
- Specific improvements QAOA provides (if carbon-optimized route selected)
- Specific improvements Classical provides (if distance is dominant)

---

## QAOA Implementation (Simulated)

For the demo we include a small, self-contained QAOA-style simulator implemented
in `backend/optimizers.py`. This is a classical statevector simulation of the
QAOA variational ansatz (no external quantum SDK required) designed to:

- Demonstrate the QAOA workflow: prepare a parameterized quantum state,
  apply cost and mixing operators, evaluate the resulting probability
  distribution, and select a candidate solution.
- Work for the small candidate sets used in this demo (now limited to 4
  candidate paths), so the entire 2^n statevector is simulated efficiently
  using NumPy.

Key details:
- The simulator constructs the QUBO cost for all basis states and applies
  diagonal cost phases `exp(-i * gamma * H_cost)` and single-qubit mixing
  rotations `Rx(2*beta)` for `p` layers (default `p=1`).
- A short random parameter search (many gamma/beta samples) is used to find
  parameters that produce a high-probability feasible solution (we restrict
  final selections to basis states with Hamming weight = 1, i.e. pick exactly
  one candidate path).
- The function `qaoa_simulator(Q, p=1, n_samples=400)` returns the index of
  the selected candidate (the qubit position set to 1 in the chosen basis
  state).

Why this approach?
- It gives a realistic, demonstrable QAOA-like pipeline without adding heavy
  dependencies (no Qiskit required). For small problems the statevector
  simulation faithfully shows how parameterized quantum states change the
  output distribution and which candidates become more likely.

Where to look
- Implementation: [backend/optimizers.py](backend/optimizers.py)
- Invocation: [backend/app.py](backend/app.py) calls `qaoa_simulator(Q)` and
  returns the selected candidate and compute time in the API response.

Notes
- This simulated QAOA is educational and not optimized for production. To
  run a production QAOA one would integrate a quantum SDK (e.g., Qiskit),
  implement parameter optimization (gradient-based or COBYLA), and increase
  `p` for deeper circuits.

---

## Example Interpretation

**If the results show:**
```
Classical: 154,056 USD total cost
QAOA:      154,056 USD total cost  (0.0% difference)
Better:    Tie
```

**This means:**
- Both algorithms selected the same optimal route
- For this particular route pair, minimizing distance also minimizes cost
- No trade-off exists between speed and sustainability

**However, if QAOA selected a different route with results like:**
```
Carbon Emissions:
  Classical: 1,000 kg CO2
  QAOA:      800 kg CO2 (20% better)
  
Travel Time:
  Classical: 50 hrs
  QAOA:      65 hrs (30% worse)
  
Total Cost:
  Classical: $80,000
  QAOA:      $85,000 (6% worse)
```

**This means:**
- ✅ QAOA is **20% better for carbon reduction** (800 vs 1,000 kg CO2)
- ❌ QAOA is 30% worse for speed (needs 15 extra hours)
- ❌ QAOA costs 6% more in total operational expense
- **Trade-off**: Paying $5,000 extra and 15 hours to save 200 kg of CO2

---

## Technical Implementation

### Backend (Python/Flask)
- `classical_choice()`: Picks minimum distance route
- `qaoa_simulator()`: Evaluates routes using carbon-weighted objective function
- `calculate_metrics()`: Applies realistic fuel efficiency factors and hub premiums
- `compare_metrics()`: Computes deltas and identifies which approach is better

### Frontend (JavaScript/Leaflet)
- **Visual Routes**: Blue line = Classical, Purple line = QAOA
- **Charts**: Cost comparison, compute time, delta percentages
- **Summary Table**: Each metric with best-performing approach highlighted
- **Results Section**: Shows which metrics QAOA optimizes better than Classical

---

## Interpretation Guide

| Scenario | Meaning |
|----------|---------|
| All metrics show **Tie (0.0%)** | Both algorithms selected same route; it's Pareto optimal |
| QAOA better for **Carbon**, Classical better for **Cost** | Classic speed-vs-environment trade-off |
| QAOA better for **multiple metrics** | Carbon-optimized route is genuinely superior overall |
| Classical better for **all metrics** | Distance is naturally the best optimization criterion for this route |

---

## Key Insights

1. **When routes are well-distributed**: Different algorithms may select different routes with distinct trade-offs
2. **When one route dominates**: Both algorithms converge on the same choice (Pareto optimal)
3. **Carbon-weighted approach**: QAOA's emphasis on emissions encourages fuel-efficient routing
4. **Cost efficiency**: Classical approach often minimizes total cost due to shorter travel time
5. **Real-world application**: Choose based on priorities:
   - **Classical**: Cost-focused, time-critical shipments
   - **QAOA**: Environmental compliance, green shipping, carbon trading scenarios

