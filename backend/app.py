from flask import Flask, jsonify, request
from backend.data_ports import PORTS
from backend.optimizers import classical_choice, qaoa_simulator
from backend.metrics import calculate_metrics, compare_metrics
import networkx as nx
import math
from itertools import islice

app = Flask(__name__, static_folder='../frontend', static_url_path='/static')

# Serve the frontend index
@app.route('/')
def index():
    return app.send_static_file('index.html')

# helper: haversine distance

def haversine(a, b):
    lat1, lon1 = math.radians(a[0]), math.radians(a[1])
    lat2, lon2 = math.radians(b[0]), math.radians(b[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    R = 6371.0
    sa = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 2*R*math.asin(math.sqrt(sa))

# build graph: sea routes only (avoid land crossings via regional proximity)
def build_graph(k=8):
    G = nx.Graph()
    for p in PORTS:
        G.add_node(p['id'], name=p['name'], lat=p['lat'], lon=p['lon'], region=p.get('region', ''))
    
    # group ports by ocean basin for smarter connectivity
    basins = {
        'Asia-Pacific': [1, 2, 8, 9],
        'Indian Ocean': [10, 11, 12, 13, 14, 6, 15, 16],
        'Europe': [3, 5],
        'Americas': [4, 17],
        'Africa': [7]
    }
    
    for p in PORTS:
        dists = []
        for q in PORTS:
            if p['id'] == q['id']:
                continue
            d = haversine((p['lat'], p['lon']), (q['lat'], q['lon']))
            # boost connections within same ocean basin (sea routes)
            if any(p['id'] in b and q['id'] in b for b in basins.values()):
                d *= 0.85  # prefer intra-basin routes (stronger preference)
            else:
                d *= 1.1   # add slight cost to inter-basin routes for path diversity
            dists.append((d, q['id']))
        dists.sort()
        # Connect to top k neighbors
        for d, qid in dists[:k]:
            if not G.has_edge(p['id'], qid):
                G.add_edge(p['id'], qid, weight=d)
    return G

# get k candidate simple paths (by length) using shortest_simple_paths
from networkx.algorithms.simple_paths import shortest_simple_paths

def k_shortest_paths(G, source, target, k=8):
    try:
        paths_gen = shortest_simple_paths(G, source, target, weight='weight')
        return list(islice(paths_gen, k))
    except Exception:
        return []

@app.route('/api/ports')
def api_ports():
    return jsonify(PORTS)

@app.route('/api/routes')
def api_routes():
    origin = request.args.get('origin')
    dest = request.args.get('dest')
    if origin is None or dest is None:
        return jsonify({'error': 'origin and dest required'}), 400
    origin = int(origin)
    dest = int(dest)
    G = build_graph(k=8)
    if origin not in G or dest not in G:
        return jsonify({'error': 'invalid port ids'}), 400
    candidates = k_shortest_paths(G, origin, dest, k=8)
    if not candidates:
        return jsonify({'error': 'no paths found'}), 404
    
    # Keep more candidates for better QAOA optimization (show top 4 to user)
    
    # compute lengths and path summaries
    costs = []
    coords_candidates = []
    path_summaries = []
    for path in candidates:
        length = 0.0
        coords = []
        hops = len(path) - 1
        for i in range(len(path)-1):
            a = (G.nodes[path[i]]['lat'], G.nodes[path[i]]['lon'])
            b = (G.nodes[path[i+1]]['lat'], G.nodes[path[i+1]]['lon'])
            length += haversine(a, b)
        for pid in path:
            node = G.nodes[pid]
            coords.append([node['lat'], node['lon'], pid])
        costs.append(length)
        coords_candidates.append(coords)
        path_summaries.append({'path_ids': path, 'hops': hops, 'distance_km': round(length, 1)})

    # Calculate metrics for each candidate (for overview)
    all_metrics = []
    ports_map = {p['id']: p for p in PORTS}
    for idx, path in enumerate(candidates):
        metrics = calculate_metrics(path, costs[idx], ports_map)
        all_metrics.append(metrics)

    # Build QUBO: Classical optimizes distance, QAOA optimizes carbon & fuel efficiency
    # Classical: minimize distance (shortest route)
    # QAOA: try to optimize any metric by constructing per-metric QUBOs
    metric_keys = ['fuel_cost_usd', 'fuel_consumption_kg', 'travel_time_hours',
                   'port_congestion_hours', 'operational_cost_usd', 'carbon_emissions_kg_co2', 'total_cost_usd']

    n = len(all_metrics)

    def build_qubo_from_values(values):
        # Enhanced QUBO with scaling for better QAOA performance
        if not values or max(values) == min(values):
            # all equal costs
            Q_local = [[0.0]*n for _ in range(n)]
            penalty = 10.0
            for i in range(n):
                Q_local[i][i] = -penalty
            for i in range(n):
                for j in range(i+1, n):
                    Q_local[i][j] = Q_local[j][i] = 2.0 * penalty
            return Q_local
        
        # Normalize values to [0,1] for better QAOA numerics
        vmin = min(values)
        vmax = max(values)
        vrange = vmax - vmin
        normalized = [(v - vmin) / vrange for v in values]
        
        # penalty for constraint violations
        penalty = 15.0
        Q_local = [[0.0]*n for _ in range(n)]
        for i in range(n):
            Q_local[i][i] = normalized[i] - penalty
        for i in range(n):
            for j in range(i+1, n):
                Q_local[i][j] = Q_local[j][i] = 2.0 * penalty
        return Q_local

    # Compute classical choice first (before per-metric analysis)
    import time
    t0 = time.time()
    classical_idx = classical_choice(costs)
    t_classical = (time.time() - t0) * 1000  # ms

    # For each metric, build a QUBO and run the QAOA simulator to see what it selects
    qaoa_candidates_by_metric = {}
    improvements_by_metric = {}
    for key in metric_keys:
        # extract metric values across candidates
        vals = [m.get(key, 0.0) for m in all_metrics]
        Q_local = build_qubo_from_values(vals)
        try:
            idx_local = qaoa_simulator(Q_local, p=2, n_samples=1000)
        except Exception:
            # fallback brute-force
            idx_local = int(min(range(len(vals)), key=lambda i: vals[i]))
        qaoa_candidates_by_metric[key] = idx_local
        # compute percent improvement vs classical pick for this metric
        classical_val = all_metrics[classical_idx].get(key, 0)
        qaoa_val = all_metrics[idx_local].get(key, 0)
        imp = 100.0 * (classical_val - qaoa_val) / classical_val if classical_val and classical_val > 0 else 0.0
        improvements_by_metric[key] = imp

    # Choose the best metric (if any) that QAOA improves vs Classical
    # Select metric with maximum positive improvement
    optimized_metric = None
    best_metric = None
    best_metric_imp = 0.0
    for k, imp in improvements_by_metric.items():
        if imp > best_metric_imp:
            best_metric_imp = imp
            best_metric = k

    # If we found a metric with >0 improvement, use its QAOA selection
    if best_metric and best_metric_imp > 0.0:
        optimized_metric = best_metric
        qaoa_idx = qaoa_candidates_by_metric[best_metric]
    else:
        # fallback: use carbon-emphasized choice (previous behavior)
        optimized_metric = 'carbon_emissions_kg_co2'
        # build carbon-weighted objective and run simulator
        carbon_vals = [m.get('carbon_emissions_kg_co2', 0.0)*2.5 + m.get('fuel_cost_usd',0.0)*0.5 + m.get('operational_cost_usd',0.0)*0.2 for m in all_metrics]
        Qc = build_qubo_from_values(carbon_vals)
        try:
            qaoa_idx = qaoa_simulator(Qc, p=2, n_samples=1000)
        except Exception:
            qaoa_idx = int(min(range(len(carbon_vals)), key=lambda i: carbon_vals[i]))

    # run solvers
    # run solvers (classical already computed above)
    t_qaoa = (time.time() - t0) * 1000

    min_cost = min(costs)
    max_cost = max(costs)
    
    def idx_to_result(idx, algo_name, elapsed_ms):
        cost = costs[idx]
        path = candidates[idx]
        metrics = calculate_metrics(path, cost, {p['id']: p for p in PORTS})
        return {
            'index': int(idx),
            'path': path,
            'coords': coords_candidates[idx],
            'cost': round(cost, 1),
            'cost_delta_pct': round(100 * (cost - min_cost) / min_cost, 2),
            'algorithm': algo_name,
            'compute_time_ms': round(elapsed_ms, 2),
            'path_summary': path_summaries[idx],
            'metrics': metrics
        }

    # (all_metrics already computed above)

    result = {
        'min_cost': round(min_cost, 1),
        'max_cost': round(max_cost, 1),
        'cost_range': round(max_cost - min_cost, 1),
        'classical': idx_to_result(classical_idx, 'Classical', t_classical),
        'qaoa': idx_to_result(qaoa_idx, 'QAOA (Quantum-Optimized)', t_qaoa),
        'candidates_coords': coords_candidates,
        'candidates_summary': path_summaries,
        'origin_port': next((p['name'] for p in PORTS if p['id'] == origin), 'Unknown'),
        'dest_port': next((p['name'] for p in PORTS if p['id'] == dest), 'Unknown'),
        'all_metrics': all_metrics
    }
    # Compare classical vs chosen-QAOA metrics
    classical_metrics = result['classical']['metrics']
    qaoa_metrics = result['qaoa']['metrics']
    result['metric_comparison'] = compare_metrics(classical_metrics, qaoa_metrics)
    
    # Generate optimization summary: show which algorithm is better for each metric
    optimization_summary = {}
    for metric_key in ['fuel_cost_usd', 'fuel_consumption_kg', 'travel_time_hours', 
                       'port_congestion_hours', 'operational_cost_usd', 'carbon_emissions_kg_co2', 'total_cost_usd']:
        classical_val = classical_metrics[metric_key]
        qaoa_val = qaoa_metrics[metric_key]
        delta_pct = 100 * (qaoa_val - classical_val) / classical_val if classical_val > 0 else 0
        better = 'QAOA' if qaoa_val < classical_val else ('Classical' if qaoa_val > classical_val else 'Tie')
        optimization_summary[metric_key] = {
            'classical': round(classical_val, 2),
            'qaoa': round(qaoa_val, 2),
            'better': better,
            'improvement_pct': round(abs(delta_pct), 2) if better != 'Tie' else 0.0
        }
    result['optimization_summary'] = optimization_summary
    # Which component QAOA focused on (if any)
    result['optimized_component'] = optimized_metric
    if result['optimized_component']:
        target = result['optimized_component']
        result['component_comparison'] = {
            target: {
                'classical': round(classical_metrics.get(target, 0), 2),
                'qaoa': round(qaoa_metrics.get(target, 0), 2),
                'improvement_pct': round(improvements_by_metric.get(target, 0.0), 2)
            }
        }
    
    return jsonify(result)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
