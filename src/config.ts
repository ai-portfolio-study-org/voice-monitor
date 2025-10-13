// API 설정
export const API_CONFIG = {
  // Railway 백엔드 URL
  BASE_URL: import.meta.env.VITE_API_URL || 'https://voice-monitor-back-production.up.railway.app',
  
  // Grafana 대시보드 URL
  GRAFANA_URL: import.meta.env.VITE_GRAFANA_URL || 'https://voice-monitor-back-production.up.railway.app/dashboard',
  
  // API 엔드포인트
  ENDPOINTS: {
    PREDICT: '/predict/',
    METRICS: '/metrics',
    DASHBOARD: '/dashboard',
  }
};

// 개발 환경 체크
export const isDevelopment = import.meta.env.DEV;

// 로컬 개발용 URL (개발 시에만 사용)
export const LOCAL_API_URL = 'http://localhost:8000';
export const LOCAL_GRAFANA_URL = 'http://localhost:3000';

