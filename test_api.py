#!/usr/bin/env python
from backend.app import app
import json

app.config['TESTING'] = True
c = app.test_client()
r = c.get('/api/routes?origin=13&dest=12')
data = json.loads(r.data)

print("Classical Index:", data['classical']['index'])
print("QAOA Index:", data['qaoa']['index'])
print("Same Route:", data['classical']['index'] == data['qaoa']['index'])
print("\n=== OPTIMIZATION SUMMARY ===\n")
for metric, summary in data['optimization_summary'].items():
    print(f"{metric.upper()}")
    print(f"  Classical: {summary['classical']}")
    print(f"  QAOA:      {summary['qaoa']}")
    print(f"  Better:    {summary['better']}")
    print(f"  Improvement: {summary['improvement_pct']}%\n")
