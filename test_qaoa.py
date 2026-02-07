#!/usr/bin/env python
# Test script for quantum QAOA algorithm optimization
import sys
from flask.testing import FlaskClient
from backend.app import app

c = app.test_client()

test_routes = [(13, 12), (1, 4), (10, 11)]

for origin, dest in test_routes:
    print("\n" + "="*70)
    print(f"ROUTE: {origin} -> {dest}")
    print("="*70)
    
    r = c.get(f'/api/routes?origin={origin}&dest={dest}')
    if r.status_code != 200:
        print(f"Error: {r.status_code}")
        continue
    
    data = r.get_json()
    
    print("\nALGORITHM SELECTION:")
    print(f"  Classical (Distance-Optimized): Candidate {data['classical']['index']}")
    print(f"  QAOA (Quantum-Optimized): Candidate {data['qaoa']['index']}")
    
    if data['classical']['index'] == data['qaoa']['index']:
        print(f"  -> Both algorithms selected the SAME route (optimal for all criteria)")
    else:
        print(f"  -> DIFFERENT routes selected! QAOA found alternative optimization.")
        print(f"\n  Classical metrics:")
        for k, v in data['classical']['metrics'].items():
            print(f"    {k}: {v:.2f}")
        print(f"\n  QAOA metrics:")
        for k, v in data['qaoa']['metrics'].items():
            print(f"    {k}: {v:.2f}")
    
    print("\nOPTIMIZATION SUMMARY:")
    print(f"Optimized Component: {data.get('optimized_component', 'N/A')}")
    
    for metric, summary in data['optimization_summary'].items():
        better = summary['better']
        improvement = summary['improvement_pct']
        c_val = summary['classical']
        q_val = summary['qaoa']
        print(f"  {metric}: Classical {c_val:.2f} vs QAOA {q_val:.2f} -> {better} ({improvement:.1f}% diff)")

print("\n" + "="*70)
print("TEST COMPLETE")
print("="*70)
