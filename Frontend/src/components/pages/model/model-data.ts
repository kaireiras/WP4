export type MetricCardVariant = 'bar' | 'radial' | 'highlight' | 'compact'
export type MetricColor =
  | 'primary'
  | 'success'
  | 'indigo'
  | 'amber'
  | 'teal'
  | 'purple'
  | 'rose'
  | 'cyan'

export interface ModelMetricItem {
  id: string
  label: string
  value: string | number
  delta?: string
  description: string
  progress: number // 0 - 100 untuk visual meter
  unit?: string
  status: 'excellent' | 'good' | 'moderate'
  category: 'classification' | 'regression'
  variant?: MetricCardVariant
  color?: MetricColor
  subtitle?: string
}

export interface ModelMetadata {
  name: string
  version: string
  type: string
  algorithm: string
  deployedDate: string
  status: 'active' | 'training' | 'archived'
  framework: string
  latency: string
  datasetSamples: string
  targetRooms: string
  modelId: string
}

export const CURRENT_MODEL_INFO: ModelMetadata = {
  name: 'Crowd Detection ML Engine',
  version: 'V2.1',
  type: 'Random Forest Ensemble Classifier & Regressor',
  algorithm: 'Random Forest (V2.1)',
  deployedDate: '15 September 2026',
  status: 'active',
  framework: 'Scikit-Learn 1.5 · Python 3.11',
  latency: '12 ms',
  datasetSamples: '45.200 Sampel Sensor',
  targetRooms: '11 Ruangan (Gedung SV UGM)',
  modelId: 'rf-crowd-v2.1-prod-20260915',
}

// 6 Metrik Utama dari Desain Figma (Node 13:72)
export const MODEL_CORE_METRICS: ModelMetricItem[] = [
  {
    id: 'accuracy',
    label: 'Accuracy',
    value: '84.2%',
    delta: '+2.4% vs V2.0',
    description:
      'Tingkat akurasi klasifikasi status keramaian secara keseluruhan',
    progress: 84.2,
    status: 'excellent',
    category: 'classification',
    variant: 'bar',
    color: 'cyan',
    subtitle: 'Prediksi Kategori Tepat',
  },
  {
    id: 'f1-score',
    label: 'F1-Score',
    value: '0.81',
    delta: '+0.03 vs V2.0',
    description: 'Harmonic mean keseimbangan antara presisi dan recall model',
    progress: 81,
    status: 'excellent',
    category: 'classification',
    variant: 'bar',
    color: 'indigo',
    subtitle: 'Keseimbangan Presisi-Recall',
  },
  {
    id: 'precision',
    label: 'Precision',
    value: '0.83',
    delta: '+0.02 vs V2.0',
    description:
      'Rasio prediksi kondisi ramai yang benar-benar akurat di lapangan',
    progress: 83,
    status: 'excellent',
    category: 'classification',
    variant: 'bar',
    color: 'success',
    subtitle: 'Ketepatan Deteksi Ramai',
  },
  {
    id: 'recall',
    label: 'Recall',
    value: '0.71',
    delta: '+0.04 vs V2.0',
    description:
      'Sensitivitas model dalam mendeteksi seluruh kondisi ruangan ramai',
    progress: 71,
    status: 'good',
    category: 'classification',
    variant: 'bar',
    color: 'amber',
    subtitle: 'Cakupan Deteksi Aktual',
  },
  {
    id: 'mae',
    label: 'MAE',
    value: '2.31',
    unit: 'orang/ruang',
    delta: '-0.45 vs V2.0',
    description:
      'Mean Absolute Error: rata-rata simpangan perkiraan jumlah orang',
    progress: 88,
    status: 'excellent',
    category: 'regression',
    variant: 'compact',
    color: 'teal',
    subtitle: 'Deviasi Rendah (±2 orang)',
  },
  {
    id: 'rmse',
    label: 'RMSE',
    value: '3.14',
    unit: 'orang/ruang',
    delta: '-0.52 vs V2.0',
    description:
      'Root Mean Square Error: kestabilan varians error estimasi keramaian',
    progress: 82,
    status: 'good',
    category: 'regression',
    variant: 'compact',
    color: 'purple',
    subtitle: 'Varians Residual Konsisten',
  },
]
