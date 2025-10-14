import { useState, useEffect } from "react";
import MobileSimulator from "../components/MobileSimulator";
import GrafanaWebView from "../components/GrafanaWebView";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const Index = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  // 화면 크기에 따라 모바일 여부 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex relative">
      {/* 데스크톱에서는 항상 좌측에 표시 */}
      {!isMobile && (
        <div className="flex-none w-[480px] min-w-[360px] bg-slate-100 flex items-center justify-center p-8">
          <MobileSimulator />
        </div>
      )}

      {/* Grafana 웹뷰 */}
      <div className="flex-1 bg-slate-900">
        <GrafanaWebView />
      </div>

      {/* 모바일에서는 플로팅 버튼과 오버레이로 표시 */}
      {isMobile && (
        <>
          {/* 플로팅 버튼 */}
          <Button
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
            onClick={() => setShowSimulator(!showSimulator)}
          >
            <Phone className="w-6 h-6" />
          </Button>

          {/* 모바일 시뮬레이터 오버레이 */}
          {showSimulator && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
              <div className="relative w-full max-w-[360px]">
                <MobileSimulator />
                <Button
                  className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={() => setShowSimulator(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Index;
