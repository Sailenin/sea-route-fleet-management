#!/usr/bin/env python
from backend.app import app
import json

app.config['TESTING'] = True
c = app.test_client()
r = c.get('/api/routes?origin=13&dest=12')
data = json.loads(r.data)

print("=== CANDIDATE ROUTES - QAOA OBJECTIVES ===")
for idx, metrics in enumerate(data['all_metrics']):
    carbon_cost = metrics['carbon_emissions_kg_co2'] * 0.2
    fuel_weight = metrics['fuel_cost_usd'] * 0.3
    operational_weight = metrics['operational_cost_usd'] * 0.2
    qaoa_objective = carbon_cost + fuel_weight + operational_weight
    
    distance = data['candidates_costs'][idx]
    print(f"\nCandidate {idx}:")
    print(f"  Distance (Classical): {distance} km")
    print(f"  QAOA Objective: {qaoa_objective:.2f}")
    print(f"    - Carbon (x0.2): {carbon_cost:.2f}")
    print(f"    - Fuel (x0.3): {fuel_weight:.2f}")
    print(f"    - Operational (x0.2): {operational_weight:.2f}")

print("\n" + "="*50)
print(f"Classical selects: Candidate {data['classical']['index']} (min distance)")
print(f"QAOA selects: Candidate {data['qaoa']['index']} (min carbon-weighted)")
