import json
import random
from datetime import datetime, timedelta


# Each cell has a 16-hour work shift inside daily power_on and power_off events.
# This allows testing how the metrics engines handle out-of-shift periods
# versus real data gaps

def generate_large_scale_telemetry(num_cells=105, total_days=30):
    # Dynamically generate 100+ unique cell identifiers
    cells = [f"CELL_{str(i).zfill(3)}" for i in range(1, num_cells + 1)]
    start_time = datetime(2026, 5, 1, 6, 0, 0)

    cycle_counters = {c: 5000 for c in cells}
    output_filename = "large_scale_chaotic_telemetry.json"

    total_events_count = 0

    print(f"Initializing telemetry generation for {num_cells} cells over {total_days} days...")

    with open(output_filename, "w") as f:
        # Start the JSON Array bracket
        f.write("[\n")
        first_event = True

        # Outer loop by DAY, inner loop by CELL to ensure data is interleaved chronologically
        for day in range(total_days):
            current_date = start_time + timedelta(days=day)

            for cell in cells:
                # Active 16-hour daily shift per cell
                shift_start = current_date.replace(hour=6, minute=0, second=0)
                end_shift = current_date.replace(hour=22, minute=0, second=0)
                current_time = shift_start

                # Step 1: Shift Initialization (Power On)
                power_on_evt = {
                    "cellId": cell,
                    "timestamp": f"{current_time.isoformat()}Z",
                    "eventType": "power_on",
                    "payload": {"firmware_version": "v4.12.2", "boot_diagnostics": "PASS"}
                }

                if not first_event:
                    f.write(",\n")
                json.dump(power_on_evt, f, indent=2)
                first_event = False
                total_events_count += 1

                current_time += timedelta(seconds=30)

                # Step 2: Main Operational Loop
                while current_time < end_shift:
                    dice_roll = random.random()

                    # A. Temporal Gap (6% Probability)
                    if dice_roll < 0.06:
                        current_time += timedelta(minutes=45)
                        continue

                    # B. Maintenance Cycle (4% Probability)
                    elif dice_roll < 0.10:
                        m_start = {
                            "cellId": cell,
                            "timestamp": f"{current_time.isoformat()}Z",
                            "eventType": "maintenance_start",
                            "payload": {"scheduled": random.choice([True, False]), "issued_by": "predictive_analytics"}
                        }
                        f.write(",\n")
                        json.dump(m_start, f, indent=2)
                        total_events_count += 1

                        current_time += timedelta(minutes=random.randint(25, 50))

                        m_end = {
                            "cellId": cell,
                            "timestamp": f"{current_time.isoformat()}Z",
                            "eventType": "maintenance_end",
                            "payload": {"status": "RESOLVED", "signature": f"tech_{random.randint(10, 99)}"}
                        }
                        f.write(",\n")
                        json.dump(m_end, f, indent=2)
                        total_events_count += 1
                        continue

                    # C. Equipment Fault Sequence (5% Probability)
                    elif dice_roll < 0.15:
                        fault_evt = {
                            "cellId": cell,
                            "timestamp": f"{current_time.isoformat()}Z",
                            "eventType": "fault",
                            "payload": {"error_code": random.choice(
                                ["M_AXIS_OVER_CURRENT", "PNEUMATIC_LOW_PRESSURE", "GRIPPER_TIMEOUT"])}
                        }
                        f.write(",\n")
                        json.dump(fault_evt, f, indent=2)
                        total_events_count += 1

                        current_time += timedelta(minutes=random.randint(8, 20))

                        clear_evt = {
                            "cellId": cell,
                            "timestamp": f"{current_time.isoformat()}Z",
                            "eventType": "fault_cleared",
                            "payload": {"recovered": "operator_manual_clear"}
                        }
                        f.write(",\n")
                        json.dump(clear_evt, f, indent=2)
                        total_events_count += 1
                        continue

                    # D. Standard Production Cycles (85% Probability)
                    cycle_counters[cell] += 1
                    c_id = f"cyc_{cycle_counters[cell]}"

                    start_type = "cycle_start"
                    if random.random() < 0.05:
                        start_type = random.choice(["CYCLE_START", "cycle-start", "CycleStart", "CYCLESTART"])

                    start_evt = {
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": start_type,
                        "payload": {"cycleId": c_id, "mode": "AUTO"}
                    }
                    f.write(",\n")
                    json.dump(start_evt, f, indent=2)
                    total_events_count += 1

                    if random.random() < 0.03:  # Duplicate packet injection
                        f.write(",\n")
                        json.dump(start_evt, f, indent=2)
                        total_events_count += 1

                    current_time += timedelta(seconds=random.randint(45, 90))

                    end_evt = {
                        "cellId": cell,
                        "timestamp": f"{current_time.isoformat()}Z",
                        "eventType": "cycle_end",
                        "payload": {"cycleId": c_id, "metrics": {"duration_ms": 72000}}
                    }

                    # Property Drop Chaos
                    corrupt_evt = end_evt.copy()
                    is_corrupted = False
                    if random.random() < 0.03:
                        del corrupt_evt["cellId"]
                        is_corrupted = True
                    if random.random() < 0.03:
                        if "payload" in corrupt_evt:
                            del corrupt_evt["payload"]
                        is_corrupted = True

                    f.write(",\n")
                    if is_corrupted:
                        json.dump(corrupt_evt, f, indent=2)
                    else:
                        json.dump(end_evt, f, indent=2)
                    total_events_count += 1

                    # Bad Timestamp Chaos
                    if random.random() < 0.03:
                        bad_ts_variants = ["not-a-date", None, "2026-99-99T99:99:99Z", 1779313200]
                        f.write(",\n")
                        json.dump({
                            "cellId": cell,
                            "timestamp": random.choice(bad_ts_variants),
                            "eventType": "cycle_start",
                            "payload": {"corrupt_stream": True}
                        }, f, indent=2)
                        total_events_count += 1

                    # Out of Order Delivery Chaos
                    if random.random() < 0.03:
                        lagged_time = current_time - timedelta(minutes=random.randint(5, 15))
                        f.write(",\n")
                        json.dump({
                            "cellId": cell,
                            "timestamp": f"{lagged_time.isoformat()}Z",
                            "eventType": "cycle_start",
                            "payload": {"network_buffer_flush": "delayed"}
                        }, f, indent=2)
                        total_events_count += 1

                    current_time += timedelta(seconds=random.randint(120, 180))

                # Step 3: End of Shift (Power Off)
                power_off_evt = {
                    "cellId": cell,
                    "timestamp": f"{end_shift.isoformat()}Z",
                    "eventType": "power_off",
                    "payload": {"shutdown_type": "SCHEDULED", "total_shift_cycles": cycle_counters[cell]}
                }
                f.write(",\n")
                json.dump(power_off_evt, f, indent=2)
                total_events_count += 1

            print(f"Finished generating data for Day {day + 1}/{total_days}...")

        # Step 4: Inject Deliberate Unclosed Open Intervals at the very end of Day 30
        # We pick 3 random cells from our large array to stay permanently running or faulted
        stuck_cells = random.sample(cells, 2)
        last_tick = start_time + timedelta(days=total_days - 1, hours=21, minutes=55)

        f.write(",\n")
        json.dump({
            "cellId": stuck_cells[0],
            "timestamp": f"{last_tick.isoformat()}Z",
            "eventType": "cycle_start",
            "payload": {"cycleId": "cyc_final_stuck_running_large_scale"}
        }, f, indent=2)

        f.write(",\n")
        json.dump({
            "cellId": stuck_cells[1],
            "timestamp": f"{last_tick.isoformat()}Z",
            "eventType": "fault",
            "payload": {"error_code": "CRITICAL_E_STOP_STUCK_LARGE_SCALE"}
        }, f, indent=2)
        total_events_count += 2

        # Close out the root array structure
        f.write("\n]")

    print("\n" + "=" * 50)
    print(f"SUCCESS: Large-scale data compilation complete.")
    print(f"Target Output Path : {output_filename}")
    print(f"Total Robotic Cells: {num_cells}")
    print(f"Total Stream Events: {total_events_count:,}")
    print("=" * 50)


if __name__ == "__main__":
    # Generates data for 105 total cells over a 30 day window (~1.3 Million events)
    generate_large_scale_telemetry(num_cells=105, total_days=30)
