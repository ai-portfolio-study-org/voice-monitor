import { useState } from "react";
import { Card } from "@/components/ui/card";
import LoginScreen from "./LoginScreen";
import TransferScreen from "./TransferScreen";

export type Screen = "login" | "signup" | "main";

const MobileSimulator = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [user, setUser] = useState<{ email: string; name: string } | null>(
    null
  );

  const handleLogin = (email: string, name: string) => {
    setUser({ email, name });
    setCurrentScreen("main");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen("login");
  };

  return (
    <Card className="w-full max-w-[360px] h-[720px] bg-white phone-shadow rounded-[30px] overflow-hidden relative">
      {/* 상단 상태바 */}
      <div className="h-8 bg-primary flex items-center justify-between px-6 text-white text-sm font-medium">
        <span>9:41</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2 border border-white rounded-sm">
            <div className="w-3 h-1 bg-white rounded-sm"></div>
          </div>
        </div>
      </div>

      {/* 앱 헤더 */}
      <div className="h-16 bg-primary flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-lg">₩</span>
          </div>
          <span className="text-white font-bold text-lg">VoicePay</span>
        </div>

        {user && (
          <button
            onClick={handleLogout}
            className="text-white/80 hover:text-white text-sm"
          >
            로그아웃
          </button>
        )}
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 overflow-hidden">
        {currentScreen === "login" && (
          <LoginScreen
            onLogin={handleLogin}
            onSwitchToSignup={() => setCurrentScreen("signup")}
          />
        )}

        {currentScreen === "signup" && (
          <LoginScreen
            isSignup
            onLogin={handleLogin}
            onSwitchToSignup={() => setCurrentScreen("login")}
          />
        )}

        {currentScreen === "main" && user && <TransferScreen user={user} />}
      </div>
    </Card>
  );
};

export default MobileSimulator;
