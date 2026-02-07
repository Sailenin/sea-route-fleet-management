#!/usr/bin/env python
from backend.app import app
import json

app.config['TESTING'] = True
c = app.test_client()
r = c.get('/api/routes?origin=13&dest=12')
data = json.loads(r.data)

print("=== CANDIDATE ROUTES ===")
print(f"Total candidates: {data['candidates_count']}")
print(f"Distance costs: {data['candidates_costs']}")
print(f"\nAll metrics for each candidate:")

for idx, metrics in enumerate(data['all_metrics']):
    print(f"\nCandidate {idx}:")
    print(f"  Fuel Cost: ${metrics['fuel_cost_usd']}")
    print(f"  Total Cost: ${metrics['total_cost_usd']}")
    print(f"  Travel Time: {metrics['travel_time_hours']} hrs")
    print(f"  Carbon: {metrics['carbon_emissions_kg_co2']} kg CO2")
    
    # Calculate QAOA weighted cost
    fuel_weight = metrics['fuel_cost_usd'] * 0.4
    operational_weight = metrics['operational_cost_usd'] * 0.3
    carbon_weight = metrics['carbon_emissions_kg_co2'] * 0.001 * 0.3
    weighted = fuel_weight + operational_weight + carbon_weight
    print(f"  QAOA Weighted Cost: {weighted:.2f}")
