import json
import random
from datetime import datetime, timedelta

# Each cell has a 16-hour work shift inside daily power_on and power_off events.
# This allows testing how the metrics engines handle out-of-shift periods
# versus real data gaps

def generate_raw_ingestion_payloads():
    cells = ["CELL_01", "CELL_02", "CELL_03"]
    start_time = datetime(2026, 5, 1, 6, 0, 0)
    events = []

    cycle_counters = {c: 5000 for c in cells}
    cell_in_maintenance = {c: False for c in cells}

    for day in range(30):
        current_date = start_time + timedelta(days=day)

        for cell in cells:
            # Shift boundaries
            shift_start = current_date.replace(hour=6, minute=0, second=0)
            end_shift = current_date.replace(hour=22, minute=0, second=0)
            current_time = shift_start

            # --- NEW SCHEMA FEATURE: Power On Sequence ---
            events.append({
                "cellId": cell,
                "timestamp": f"{current_time.isoformat()}Z",
                "eventType": "power_on",
                "payload": {"firmware_version": "v4.12.2", "boot_diagnostics": "PASS"}
            })

            # Tiny gap between power up and first production cycle
            current_time += timedelta(seconds=random.randint(30, 90))

            while current_time < end_shift:
                # --- CHAOS 1: Gaps in Data (Trigger UNKNOWN state transitions) ---
                if random.random() < 0.005:
                    current_time += timedelta(minutes=45)
                    continue

                # --- CHAOS 2: Maintenance Cycles ---
                if random.random() < 0.003 and not cell_in_maintenance[cell]:
                    cell_in_maintenance[cell] = True
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "maintenance_start",
                        "payload": {"scheduled": True, "issued_by": "system_clock"}
                    })

                    current_time += timedelta(minutes=random.randint(20, 45))

                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "maintenance_end",
                        "payload": {"status": "RESOLVED"}
                    })
                    cell_in_maintenance[cell] = False
                    continue

                # --- CHAOS 3: Faults & Clear Transitions ---
                if random.random() < 0.01:
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "fault",
                        "payload": {"error_code": "M_AXIS_OVER_CURRENT"}
                    })

                    current_time += timedelta(minutes=random.randint(5, 12))

                    events.append({
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "fault_cleared",
                        "payload": {"recovered": "auto_purge"}
                    })
                    continue

                # --- STANDARD PROCESS LOOPS ---
                cycle_counters[cell] += 1
                c_id = f"cyc_{cycle_counters[cell]}"

                start_type = "cycle_start"

                # --- CHAOS 4: Inconsistent Naming Variants ---
                rand_naming = random.random()
                if rand_naming < 0.005:
                    start_type = "CYCLE_START"
                elif rand_naming < 0.010:
                    start_type = "cycle-start"
                elif rand_naming < 0.015:
                    start_type = "CycleStart"
                elif rand_naming < 0.020:
                    start_type = "CYCLESTART"

                start_evt = {
                    "cellId": cell,
                    "timestamp": f"{current_time.isoformat()}Z",
                    "eventType": start_type,
                    "payload": {"cycleId": c_id, "mode": "AUTO"}
                }
                events.append(start_evt)

                # --- CHAOS 5: Exact Ingestion Duplicates ---
                if random.random() < 0.005:
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

                if random.random() < 0.005:
                    del corrupt_evt["cellId"]
                    is_corrupted = True
                if random.random() < 0.005:
                    if "payload" in corrupt_evt:
                        del corrupt_evt["payload"]
                    is_corrupted = True

                if is_corrupted:
                    events.append(corrupt_evt)
                else:
                    events.append(end_evt)

                # --- CHAOS 7: Unparseable Timestamps ---
                if random.random() < 0.004:
                    bad_ts_variants = ["not-a-date", None, "2026-99-99T99:99:99Z", 1779313200]
                    events.append({
                        "cellId": cell,
                        "timestamp": random.choice(bad_ts_variants),
                        "eventType": "cycle_start", # Changed from 'unknown' to standard enum
                        "payload": {"corrupt_stream": True}
                    })

                # --- CHAOS 8: Out-of-Order Packet Delivery ---
                if random.random() < 0.005:
                    lagged_time = current_time - timedelta(minutes=random.randint(3, 7))
                    events.append({
                        "cellId": cell,
                        "timestamp": f"{lagged_time.isoformat()}Z",
                        "eventType": "cycle_start", # Changed from 'unknown' to standard enum
                        "payload": {"network_buffer_flush": "delayed"}
                    })

                current_time += timedelta(seconds=random.randint(120, 180))

            # --- NEW SCHEMA FEATURE: Power Off Sequence ---
            events.append({
                "cellId": cell,
                "timestamp": f"{end_shift.isoformat()}Z",
                "eventType": "power_off",
                "payload": {"shutdown_type": "SCHEDULED", "total_shift_cycles": cycle_counters[cell]}
            })

    # --- DESIGN SPEC: DELIBERATE UNCLOSED OPEN INTERVALS ---
    # These events happen right at the end of day 30, but bypass the nightly power_off sequence
    # to test how your system calculates boundary windows up to execution limits.
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

    print(f"File created successfully! Generated {len(events)} schema-compliant dirty payloads.")

if __name__ == "__main__":
    generate_raw_ingestion_payloads()