import json
import random
from datetime import datetime, timedelta

# Each cell has a 16-hour work shift inside daily power_on and power_off events.
# This allows testing how the metrics engines handle out-of-shift periods
# versus real data gaps

def generate_balanced_chaotic_telemetry():
    cells = ["CELL_01", "CELL_02", "CELL_03"]
    start_time = datetime(2026, 5, 1, 6, 0, 0)
    events = []

    cycle_counters = {c: 5000 for c in cells}

    for day in range(30):
        current_date = start_time + timedelta(days=day)

        for cell in cells:
            shift_start = current_date.replace(hour=6, minute=0, second=0)
            end_shift = current_date.replace(hour=22, minute=0, second=0)
            current_time = shift_start

            # Shift initialization
            events.append({
                "cellId": cell,
                "timestamp": f"{current_time.isoformat()}Z",
                "eventType": "power_on",
                "payload": {"firmware_version": "v4.12.2", "boot_diagnostics": "PASS"}
            })
            current_time += timedelta(seconds=30)

            while current_time < end_shift:
                # --- HIGH-LEVEL OPERATIONAL MODE SELECTION ---
                # We intentionally allocate a 15% cumulative chance to trigger major macro-level
                # anomalies on any given cycle iteration to deliberately lower cycle_start density bias.
                dice_roll = random.random()

                # --- CHAOS 1: Gaps in Data (Trigger UNKNOWN state transitions) ---
                # Trigger 45-Minute Temporal Gap (6% Probability)
                if dice_roll < 0.06:
                    current_time += timedelta(minutes=45)
                    continue

                # --- CHAOS 2: Maintenance Cycles ---
                # Trigger Real Maintenance Cycle (4% Probability)
                elif dice_roll < 0.10:
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "maintenance_start",
                        "payload": {"scheduled": True, "issued_by": "system_clock"}
                    })
                    current_time += timedelta(minutes=random.randint(25, 50))
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "maintenance_end",
                        "payload": {"status": "RESOLVED"}
                    })
                    continue

                # --- CHAOS 3: Faults & Clear Transitions ---
                # Trigger Equipment Fault Sequences (5% Probability)
                elif dice_roll < 0.15:
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "fault",
                        "payload": {"error_code": "M_AXIS_OVER_CURRENT"}
                    })
                    current_time += timedelta(minutes=random.randint(8, 20))
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "maintenance_start",
                        "payload": {"recovered": "operator_manual_clear"}
                    })
                    continue

                # --- STANDARD PROCESS LOOPS (Remaining 85% Probability Space) ---
                cycle_counters[cell] += 1
                c_id = f"cyc_{cycle_counters[cell]}"

                # --- CHAOS 4: Inconsistent Naming Variants ---
                start_type = "cycle_start"
                if random.random() < 0.05:
                    start_type = random.choice(["CYCLE_START", "cycle-start", "CycleStart", "CYCLESTART"])

                start_evt = {
                    "cellId": cell,
                    "timestamp": f"{current_time.isoformat()}Z",
                    "eventType": start_type,
                    "payload": {"cycleId": c_id, "mode": "AUTO"}
                }
                events.append(start_evt)

                # --- CHAOS 5: Exact Ingestion Duplicates ---
                if random.random() < 0.03:
                    events.append(start_evt.copy())

                current_time += timedelta(seconds=random.randint(45, 90))

                # Base End Event
                end_evt = {
                    "cellId": cell,
                    "timestamp": f"{current_time.isoformat()}Z",
                    "eventType": "cycle_end",
                    "payload": {"cycleId": c_id, "metrics": {"duration_ms": 72000}}
                }

                # --- CHAOS 6: Safe Property Drops ---
                corrupt_evt = end_evt.copy()
                is_corrupted = False

                if random.random() < 0.03:
                    del corrupt_evt["cellId"]
                    is_corrupted = True
                if random.random() < 0.03:
                    if "payload" in corrupt_evt:
                        del corrupt_evt["payload"]
                    is_corrupted = True

                if is_corrupted:
                    events.append(corrupt_evt)
                else:
                    events.append(end_evt)

                #  --- CHAOS 7: Unparseable Timestamps (3%)
                if random.random() < 0.03:
                    bad_ts_variants = ["not-a-date", None, "2026-99-99T99:99:99Z", 1779313200]
                    events.append({
                        "cellId": cell,
                        "timestamp": random.choice(bad_ts_variants),
                        "eventType": "cycle_start",
                        "payload": {"corrupt_stream": True}
                    })

                # --- CHAOS 8: Out-of-Order Packet Delivery (3%)
                if random.random() < 0.03:
                    lagged_time = current_time - timedelta(minutes=random.randint(5, 15))
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{lagged_time.isoformat()}Z",
                        "eventType": "cycle_start",
                        "payload": {"network_buffer_flush": "delayed"}
                    })

                current_time += timedelta(seconds=random.randint(120, 180))

            events.append({
                "cellId": cell,
                "timestamp": f"{end_shift.isoformat()}Z",
                "eventType": "power_off",
                "payload": {"shutdown_type": "SCHEDULED", "total_shift_cycles": cycle_counters[cell]}
            })

    # Force final open intervals on Day 30
    last_tick = start_time + timedelta(days=29, hours=21, minutes=55)

    # CELL_01 cuts off mid-cycle (Left stuck in RUNNING)
    events.append({
        "cellId": "CELL_01",
        "timestamp": f"{last_tick.isoformat()}Z",
        "eventType": "cycle_start",
        "payload": {"cycleId": "cyc_final_stuck_running"}
    })

    # CELL_02 cuts off mid-breakdown (Left stuck in FAULT)
    events.append({
        "cellId": "CELL_02",
        "timestamp": f"{last_tick.isoformat()}Z",
        "eventType": "fault",
        "payload": {"error_code": "CRITICAL_E_STOP_STUCK"}
    })

    with open("raw_chaotic_telemetry.json", "w") as f:
        json.dump(events, f, indent=2)

    print(f"File created successfully. Compressed cycle dominance. Generated {len(events)} diverse data events.")

if __name__ == "__main__":
    generate_balanced_chaotic_telemetry()