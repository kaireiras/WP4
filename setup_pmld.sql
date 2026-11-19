CREATE DATABASE IF NOT EXISTS pmld_2 CHARACTER SET utf8mb4;

CREATE USER IF NOT EXISTS 'admindb'@'localhost' IDENTIFIED BY 'DB-WP2';
GRANT ALL PRIVILEGES ON pmld.* TO 'admindb'@'localhost';
FLUSH PRIVILEGES;

USE pmld_2;

CREATE TABLE IF NOT EXISTS ap_registry (
  ap_id          VARCHAR(32) PRIMARY KEY,
  ip_address     VARCHAR(45) NOT NULL,
  snmp_community VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS poll_log (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  ts         DATETIME    NOT NULL,
  ap_id      VARCHAR(32) NOT NULL,
  n_clients  INT         NOT NULL,
  poll_ok    BOOLEAN     NOT NULL,
  INDEX idx_poll_ts_ap (ts, ap_id)
);

CREATE TABLE IF NOT EXISTS vap_snapshot (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  ts          DATETIME    NOT NULL,
  ap_id       VARCHAR(32) NOT NULL,
  vap_name    VARCHAR(32) NOT NULL,
  band        VARCHAR(8)  NOT NULL,
  essid       VARCHAR(64) NOT NULL,
  channel     INT         NULL,
  n_clients   INT         NOT NULL,
  tx_bytes    BIGINT      NULL,
  rx_bytes    BIGINT      NULL,
  tx_packets  BIGINT      NULL,
  rx_packets  BIGINT      NULL,
  tx_retries  BIGINT      NULL,
  vap_up      BOOLEAN     NOT NULL,
  INDEX idx_vap_ts_ap (ts, ap_id)
);

-- Daftarkan AP (ganti IP dan community sesuai AP-mu)
INSERT INTO ap_registry (ap_id, ip_address, snmp_community) VALUES
('AP1-CU205', '10.33.244.19', 'public')
ON DUPLICATE KEY UPDATE
  ip_address = VALUES(ip_address),
  snmp_community = VALUES(snmp_community);
