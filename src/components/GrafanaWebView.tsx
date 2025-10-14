import { useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Activity, TrendingUp, Shield } from "lucide-react";
import { API_CONFIG } from "@/config";

const GrafanaWebView = () => {
  const [isGrafanaError, setIsGrafanaError] = useState(false);

  // Railway 백엔드의 Grafana 대시보드 URL
  const grafanaUrl = API_CONFIG.GRAFANA_URL;

  if (!grafanaUrl || isGrafanaError) {
    // Grafana 연결 실패 시 모킹 대시보드 표시
    return (
      <div className="h-full bg-slate-900 text-white p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-2xl font-bold">이상거래 탐지 모니터링</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">실시간 모니터링</span>
          </div>
        </div>

        {/* 경고 메시지 */}
        <Card className="bg-yellow-900/20 border-yellow-500/30 mb-6 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-yellow-400 font-medium">
                Grafana 연결 대기 중
              </div>
              <div className="text-sm text-slate-300">
                실제 Grafana 대시보드 연결 전까지 모킹 데이터가 표시됩니다.
              </div>
            </div>
          </div>
        </Card>

        {/* 메트릭 카드들 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6 text-blue-400" />
              <div>
                <div className="text-sm text-slate-400">총 거래 수</div>
                <div className="text-2xl font-bold text-blue-400">1,247</div>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <div className="text-sm text-slate-400">이상 거래</div>
                <div className="text-2xl font-bold text-red-400">3</div>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <div>
                <div className="text-sm text-slate-400">정상 거래율</div>
                <div className="text-2xl font-bold text-green-400">99.7%</div>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800 border-slate-700 p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-purple-400" />
              <div>
                <div className="text-sm text-slate-400">보안 점수</div>
                <div className="text-2xl font-bold text-purple-400">A+</div>
              </div>
            </div>
          </Card>
        </div>

        {/* 실시간 로그 */}
        <Card className="bg-slate-800 border-slate-700 flex-1">
          <div className="p-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">실시간 거래 로그</h3>
          </div>
          <div className="p-4 space-y-2 h-64 overflow-y-auto">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-400">15:32:45</span>
              <span className="text-white">
                정상 거래 - 김민수 → 이영희 (50,000원)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-400">15:31:23</span>
              <span className="text-white">
                정상 거래 - 박철수 → 최영미 (120,000원)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-slate-400">15:29:11</span>
              <span className="text-red-400">
                ⚠️ 이상 거래 탐지 - 의심스러운 패턴
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-400">15:28:55</span>
              <span className="text-white">
                정상 거래 - 정대영 → 홍길동 (75,000원)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-slate-400">15:27:33</span>
              <span className="text-white">
                정상 거래 - 김영수 → 이민정 (200,000원)
              </span>
            </div>
          </div>
        </Card>

        {/* 연결 설정 안내 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-slate-400">
            실제 Grafana 대시보드를 연결하려면 환경변수
            <code className="bg-slate-800 px-2 py-1 rounded mx-1">
              REACT_APP_GRAFANA_URL
            </code>
            을 설정하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <iframe
        src={grafanaUrl}
        className="w-full h-full border-0"
        title="Grafana Dashboard"
        onError={() => setIsGrafanaError(true)}
        allowFullScreen
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};

export default GrafanaWebView;
