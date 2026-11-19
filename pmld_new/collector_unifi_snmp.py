#!/usr/bin/env python3
"""
Polling AP UniFi tiap 15 detik via SNMP (UBNT-UniFi-MIB) -> CSV + MySQL.
Hanya butuh ap_registry: ap_id, ip_address, snmp_community (sama seperti MikroTik).

Batasan UniFi SNMP (terverifikasi pada U6-Enterprise fw 6.8.2):
  - Tidak ada tabel per-client dan BRIDGE-MIB tidak tersedia, sehingga
    mac_hash, mac_random, uptime_s, snr_db per client TIDAK bisa diambil.
  - Yang tersedia adalah unifiVapTable: agregat per SSID per radio.

Output:
  poll_log    : ts, ap_id, n_clients, poll_ok                (format sama dengan MikroTik)
  vap_snapshot: ts, ap_id, vap_name, band, essid, channel, n_clients,
                tx_bytes, rx_bytes, tx_packets, rx_packets, tx_retries, vap_up

Catatan analisis:
  - tx/rx bytes & packets adalah Counter32 kumulatif sejak AP boot dan bisa
    wrap di 4.294.967.296. Hitung selisih antar polling, bukan nilai mentah.
  - Kolom RxCrypts/RxDropped/RxErrors tidak diambil: nilainya identik satu
    sama lain di firmware ini sehingga tidak bisa dipercaya.

Tabel MySQL baru (sekali saja):
  CREATE TABLE vap_snapshot (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    ts          DATETIME     NOT NULL,
    ap_id       VARCHAR(32)  NOT NULL,
    vap_name    VARCHAR(32)  NOT NULL,
    band        VARCHAR(8)   NOT NULL,
    essid       VARCHAR(64)  NOT NULL,
    channel     INT          NULL,
    n_clients   INT          NOT NULL,
    tx_bytes    BIGINT       NULL,
    rx_bytes    BIGINT       NULL,
    tx_packets  BIGINT       NULL,
    rx_packets  BIGINT       NULL,
    tx_retries  BIGINT       NULL,
    vap_up      BOOLEAN      NOT NULL,
    INDEX idx_vap_ts_ap (ts, ap_id)
  );

Environment variable: DB_PASS
"""

import csv
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import pymysql

# ============================================================
# KONFIGURASI
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "user": "admindb",
    "password": os.environ.get("DB_PASS", ""),
    "database": "pmld_2",
}

POLL_INTERVAL_SEC = 15

AP_ID_MAP = {}

# Interface radio -> band. Sesuai U6-Enterprise (tri-band). Nomor channel
# tidak dipakai untuk menentukan band karena 5 GHz dan 6 GHz bisa tumpang tindih
# (contoh: channel 37 valid di 6 GHz, channel 161 di 5 GHz).
BAND_BY_RADIO = {"wifi0": "2.4GHz", "wifi1": "5GHz", "wifi2": "6GHz"}

OID_VAPTAB = ".1.3.6.1.4.1.41112.1.6.1.2.1"
WIB = ZoneInfo("Asia/Jakarta")

# kolom unifiVapEntry yang diambil
COL = {
    "4": "channel", "6": "essid", "7": "vap_name", "8": "n_clients",
    "10": "rx_bytes", "15": "rx_packets", "16": "tx_bytes",
    "19": "tx_packets", "20": "tx_retries", "22": "vap_up",
}

OUTPUT_DIR = Path("./collector_output_unifi_snmp")
POLL_LOG_CSV = OUTPUT_DIR / "poll_log.csv"
VAP_CSV = OUTPUT_DIR / "vap_snapshot.csv"

POLL_COLS = ["ts", "ap_id", "n_clients", "poll_ok"]
VAP_COLS = ["ts", "ap_id", "vap_name", "band", "essid", "channel", "n_clients",
            "tx_bytes", "rx_bytes", "tx_packets", "rx_packets", "tx_retries", "vap_up"]

LINE_RE = re.compile(
    r"^\.1\.3\.6\.1\.4\.1\.41112\.1\.6\.1\.2\.1\.(\d+)\.(\d+) = "
    r"(?:INTEGER|Counter32|Counter64|Gauge32|STRING|Hex-STRING): ?(.*)$"
)


# ============================================================
# HELPER
# ============================================================

def get_ap_targets():
    conn = pymysql.connect(**DB_CONFIG)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT ap_id, ip_address, snmp_community FROM ap_registry")
            rows = cur.fetchall()
    finally:
        conn.close()
    return [{"ap_id": r[0], "ip": r[1], "community": r[2]} for r in rows]


def now_wib():
    return datetime.now(WIB).strftime("%Y-%m-%d %H:%M:%S")


def to_int(v):
    m = re.match(r"\s*(-?\d+)", v or "")
    return int(m.group(1)) if m else None


def snmpwalk(ip, community):
    """-On: OID numerik agar parsing tidak bergantung pada MIB yang terpasang."""
    cmd = ["snmpbulkwalk", "-v2c", "-On", "-c", community, "-t", "5", "-r", "3", ip, OID_VAPTAB]
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    except subprocess.TimeoutExpired:
        return False, ""
    if res.returncode != 0 or "Timeout" in res.stdout or "Timeout" in res.stderr:
        return False, ""
    return True, res.stdout


def parse_walk(raw):
    """Return list of dict per VAP (index unifiVapTable)."""
    vaps = {}
    for line in raw.splitlines():
        m = LINE_RE.match(line.strip())
        if m and m.group(1) in COL:
            vaps.setdefault(m.group(2), {})[COL[m.group(1)]] = m.group(3).strip().strip('"')

    out = []
    for idx in sorted(vaps, key=int):
        v = vaps[idx]
        name = v.get("vap_name", f"vap{idx}")
        radio = name.split("ap")[0]                     # "wifi1ap2" -> "wifi1"
        out.append({
            "vap_name": name,
            "band": BAND_BY_RADIO.get(radio, radio),
            "essid": v.get("essid", ""),
            "channel": to_int(v.get("channel")),
            "n_clients": to_int(v.get("n_clients")) or 0,
            "tx_bytes": to_int(v.get("tx_bytes")),
            "rx_bytes": to_int(v.get("rx_bytes")),
            "tx_packets": to_int(v.get("tx_packets")),
            "rx_packets": to_int(v.get("rx_packets")),
            "tx_retries": to_int(v.get("tx_retries")),
            "vap_up": to_int(v.get("vap_up")) == 1,     # TruthValue: 1=true, 2=false
        })
    return out


def ensure_csv_headers():
    OUTPUT_DIR.mkdir(exist_ok=True)
    for path, cols in ((POLL_LOG_CSV, POLL_COLS), (VAP_CSV, VAP_COLS)):
        if not path.exists():
            with open(path, "w", newline="") as f:
                csv.writer(f, lineterminator="\n").writerow(cols)


# ============================================================
# POLLING SATU SIKLUS
# ============================================================

def build_rows(ts, ap_id, poll_ok, vaps):
    vap_rows = [[ts, ap_id] + [v[c] for c in VAP_COLS[2:]] for v in vaps]
    n_clients = sum(v["n_clients"] for v in vaps if v["vap_up"]) if poll_ok else 0
    return [ts, ap_id, n_clients, poll_ok], vap_rows


def poll_once(ap_targets):
    ts = now_wib()
    poll_rows, vap_rows = [], []

    for t in ap_targets:
        ap_id = AP_ID_MAP.get(t["ap_id"], t["ap_id"])
        ok, raw = snmpwalk(t["ip"], t["community"])
        vaps = parse_walk(raw) if ok else []
        if ok and not vaps:          # agent menjawab tapi tabel kosong / bukan UniFi
            ok = False
        p, v = build_rows(ts, ap_id, ok, vaps)
        poll_rows.append(p)
        vap_rows.extend(v)
        print(f"[{ts}] {ap_id}: {p[2]} client(s), {len(vaps)} VAP, poll_ok={ok}")

    with open(POLL_LOG_CSV, "a", newline="") as pf, open(VAP_CSV, "a", newline="") as vf:
        csv.writer(pf, lineterminator="\n").writerows(poll_rows)
        csv.writer(vf, lineterminator="\n").writerows(vap_rows)

    try:
        conn = pymysql.connect(**DB_CONFIG)
        try:
            with conn.cursor() as cur:
                cur.executemany(
                    "INSERT INTO poll_log (ts, ap_id, n_clients, poll_ok) "
                    "VALUES (%s,%s,%s,%s)", poll_rows)
                if vap_rows:
                    cur.executemany(
                        "INSERT INTO vap_snapshot (ts, ap_id, vap_name, band, essid, channel, "
                        "n_clients, tx_bytes, rx_bytes, tx_packets, rx_packets, tx_retries, vap_up) "
                        "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", vap_rows)
            conn.commit()
            print(f"[{ts}] [MYSQL OK] poll_log={len(poll_rows)} vap_snapshot={len(vap_rows)}")
        finally:
            conn.close()
    except Exception as e:
        print(f"[{ts}] [MYSQL ERROR] {type(e).__name__}: {e}")


# ============================================================
# MAIN
# ============================================================

def main():
    if not DB_CONFIG["password"]:
        sys.exit("Set dulu: export DB_PASS=...")
    ensure_csv_headers()
    print(f"Mulai polling UniFi SNMP tiap {POLL_INTERVAL_SEC} detik. Ctrl+C untuk stop.")
    next_run = time.time()
    try:
        while True:
            ap_targets = get_ap_targets()
            if not ap_targets:
                print("Peringatan: tabel ap_registry kosong.")
            poll_once(ap_targets)
            next_run += POLL_INTERVAL_SEC
            time.sleep(max(0, next_run - time.time()))
    except KeyboardInterrupt:
        print(f"\nDihentikan. Hasil di {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
