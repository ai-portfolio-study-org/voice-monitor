import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mic, Send, User, DollarSign } from "lucide-react";
import TransferMessage from "./TransferMessage";
import { API_CONFIG } from "@/config";

// Web Speech API 타입 정의
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface WebkitSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionError) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    webkitSpeechRecognition: {
      new (): WebkitSpeechRecognition;
    };
  }
}

interface User {
  email: string;
  name: string;
}

interface Message {
  id: string;
  type: "user" | "system" | "transfer";
  content: string;
  timestamp: Date;
  transferData?: {
    receiver: string;
    amount: number;
    status: "processing" | "completed" | "failed";
  };
  isStreaming?: boolean;
}

interface DutchPayState {
  isActive: boolean;
  totalAmount?: number;
  numberOfPeople?: number;
  amountPerPerson?: number;
  friends?: string[];
  step: "initial" | "asking_people" | "asking_friends" | "confirming" | "completed";
}

interface TransferScreenProps {
  user: User;
}

const TransferScreen = ({ user }: TransferScreenProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "system",
      content: `안녕하세요 ${user.name}님! 음성 또는 텍스트로 송금을 요청해주세요.`,
      timestamp: new Date(),
      isStreaming: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dutchPayState, setDutchPayState] = useState<DutchPayState>({
    isActive: false,
    step: "initial"
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const parseTransferRequest = (text: string) => {
    // 더치페이 키워드 확인
    if (text.includes("더치페이") || text.includes("나눠서") || text.includes("같이 내")) {
      return { type: "dutch_pay", text };
    }

    // 간단한 패턴 매칭으로 송금 요청 파싱
    const patterns = [
      // "김민수에게 5만원 보내줘" 패턴
      /([가-힣]+)(?:에게|한테)\s*(\d+(?:만|천)?원?)?\s*(?:보내|송금|전송)/,
      // "5만원 김민수에게 보내줘" 패턴
      /(\d+(?:만|천)?원?)?\s*([가-힣]+)(?:에게|한테)\s*(?:보내|송금|전송)/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let receiver = "";
        let amountText = "";

        // 첫 번째 그룹이 한글이면 수신자, 아니면 금액
        if (match[1] && /[가-힣]/.test(match[1])) {
          receiver = match[1];
          amountText = match[2] || "";
        } else {
          receiver = match[2] || "";
          amountText = match[1] || "";
        }

        if (receiver) {
          let amount = 0;
          if (amountText) {
            const numMatch = amountText.match(/(\d+)/);
            if (numMatch) {
              amount = parseInt(numMatch[1]);
              if (amountText.includes("만")) {
                amount *= 10000;
              } else if (amountText.includes("천")) {
                amount *= 1000;
              }
            }
          }

          return { type: "regular_transfer", receiver, amount };
        }
      }
    }
    return null;
  };

  const handleDutchPayFlowWithMessages = (userInput: string, currentMessages: Message[]) => {
    const newMessages = [...currentMessages];

    switch (dutchPayState.step) {
      case "initial":
        // 더치페이 시작
        setDutchPayState({
          ...dutchPayState,
          isActive: true,
          step: "asking_people"
        });

        const systemResponse1: Message = {
          id: (Date.now() + 1).toString(),
          type: "system",
          content: "몇 분이서 총 얼마 나왔나요?",
          timestamp: new Date(),
          isStreaming: true,
        };
        return [...newMessages, systemResponse1];

      case "asking_people":
        // 인원 수와 총 금액을 한번에 파악
        const peopleMatch = userInput.match(/(\d+|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s*명/);
        const amountMatch = userInput.match(/(\d+)\s*만?\s*원?/);

        if (peopleMatch && amountMatch) {
          // 한글 숫자를 아라비아 숫자로 변환
          const koreanToNumber: { [key: string]: number } = {
            '한': 1, '두': 2, '세': 3, '네': 4, '다섯': 5,
            '여섯': 6, '일곱': 7, '여덟': 8, '아홉': 9, '열': 10
          };

          let numberOfPeople: number;
          if (isNaN(parseInt(peopleMatch[1]))) {
            numberOfPeople = koreanToNumber[peopleMatch[1]] || 0;
          } else {
            numberOfPeople = parseInt(peopleMatch[1]);
          }

          let totalAmount = parseInt(amountMatch[1]);
          if (userInput.includes("만")) {
            totalAmount *= 10000;
          }

          const amountPerPerson = Math.floor(totalAmount / numberOfPeople);

          setDutchPayState({
            ...dutchPayState,
            numberOfPeople,
            totalAmount,
            amountPerPerson,
            step: "asking_friends"
          });

          const systemResponse2: Message = {
            id: (Date.now() + 1).toString(),
            type: "system",
            content: `1인당 ${amountPerPerson.toLocaleString()}원씩이네요. 연락처에서 함께 식사하신 분들을 찾아볼까요?`,
            timestamp: new Date(),
            isStreaming: true,
          };
          return [...newMessages, systemResponse2];
        }
        break;


      case "asking_friends":
        // 친구들 이름 파악
        const friendsText = userInput.replace(/응|네|좋아/, "").trim();
        const friends = friendsText.split(/,|\s+/).filter(name =>
          name.length > 1 && /[가-힣]/.test(name)
        );

        if (friends.length > 0) {
          setDutchPayState({
            ...dutchPayState,
            friends,
            step: "confirming"
          });

          const systemResponse4: Message = {
            id: (Date.now() + 1).toString(),
            type: "system",
            content: `${friends.join(", ")} 님께 각각 ${dutchPayState.amountPerPerson?.toLocaleString()}원씩 송금하시겠습니까?`,
            timestamp: new Date(),
            isStreaming: true,
          };
          return [...newMessages, systemResponse4];
        }
        break;

      case "confirming":
        if (userInput.includes("네") || userInput.includes("응") || userInput.includes("좋아")) {
          setDutchPayState({
            ...dutchPayState,
            step: "completed"
          });

          // 송금 처리 메시지들 생성
          const transferMessages: Message[] = dutchPayState.friends?.map((friend, index) => ({
            id: (Date.now() + index + 2).toString(),
            type: "transfer",
            content: `${friend}님에게 ${dutchPayState.amountPerPerson?.toLocaleString()}원을 송금합니다.`,
            timestamp: new Date(),
            transferData: {
              receiver: friend,
              amount: dutchPayState.amountPerPerson || 0,
              status: "processing"
            }
          })) || [];

          // 송금 완료 처리 및 백엔드 API 호출
          setTimeout(() => {
            transferMessages.forEach((msg, index) => {
              setTimeout(async () => {
                try {
                  // 백엔드로 거래 데이터 전송
                  if (msg.transferData) {
                    await sendTransactionData({
                      receiver: msg.transferData.receiver,
                      amount: msg.transferData.amount
                    });
                  }

                  // 송금 완료 상태로 업데이트
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === msg.id
                        ? { ...m, transferData: { ...m.transferData!, status: "completed" } }
                        : m
                    )
                  );
                } catch (error) {
                  // 에러 시 실패 상태로 업데이트
                  setMessages(prev =>
                    prev.map(m =>
                      m.id === msg.id
                        ? { ...m, transferData: { ...m.transferData!, status: "failed" } }
                        : m
                    )
                  );
                }
              }, (index + 1) * 1000);
            });

            // 모든 송금 완료 후 상태 초기화
            setTimeout(() => {
              setDutchPayState({
                isActive: false,
                step: "initial"
              });
            }, transferMessages.length * 1000 + 500);
          }, 1000);

          return [...newMessages, ...transferMessages];
        }
        break;
    }

    return newMessages;
  };

  const sendTransactionData = async (transferData: {
    receiver: string;
    amount: number;
  }) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PREDICT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: transferData.amount,
          user_id: user.email, // 사용자 이메일을 user_id로 사용
        }),
      });

      if (!response.ok) {
        throw new Error("Transaction failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Error sending transaction:", error);
      throw error;
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputText,
      timestamp: new Date(),
    };

    setInputText("");
    setIsProcessing(true);

    // 더치페이 진행 중인지 확인
    if (dutchPayState.isActive) {
      setMessages((prev) => [...prev, userMessage]);
      setTimeout(() => {
        setMessages((currentMessages) => {
          const updatedMessages = handleDutchPayFlowWithMessages(inputText, currentMessages);
          return updatedMessages;
        });
        setIsProcessing(false);
        setTimeout(scrollToBottom, 100);
      }, 100);
      return;
    }

    setMessages((prev) => [...prev, userMessage]);

    const transferData = parseTransferRequest(inputText);

    if (transferData) {
      // 더치페이 시작
      if (transferData.type === "dutch_pay") {
        setTimeout(() => {
          setMessages((currentMessages) => {
            const updatedMessages = handleDutchPayFlowWithMessages(inputText, currentMessages);
            return updatedMessages;
          });
          setIsProcessing(false);
          setTimeout(scrollToBottom, 100);
        }, 100);
        return;
      }

      // 일반 송금 처리
      if (transferData.type === "regular_transfer") {
        try {
          const transferMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "transfer",
            content: `${
              transferData.receiver
            }님에게 ${transferData.amount.toLocaleString()}원을 송금합니다.`,
            timestamp: new Date(),
            transferData: {
              receiver: transferData.receiver,
              amount: transferData.amount,
              status: "processing",
            },
          };

          setMessages((prev) => [...prev, transferMessage]);

          // 백엔드로 거래 데이터 전송
          await sendTransactionData({
            receiver: transferData.receiver,
            amount: transferData.amount
          });

          // 송금 완료 처리
          setTimeout(() => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === transferMessage.id
                  ? {
                      ...msg,
                      transferData: { ...msg.transferData!, status: "completed" },
                    }
                  : msg
              )
            );
          }, 3000);
        } catch (error) {
          // 에러 처리
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            type: "system",
            content: "송금 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
            timestamp: new Date(),
            isStreaming: true,
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } else {
      const systemMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content:
          '송금 요청을 이해하지 못했습니다. "김민수에게 5만원 보내줘" 또는 "친구들이랑 밥먹고 더치페이해야 하는데"와 같이 말씀해주세요.',
        timestamp: new Date(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, systemMessage]);
    }
    setIsProcessing(false);
    setTimeout(scrollToBottom, 100);
  };

  const handleMicClick = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("음성 인식이 지원되지 않는 브라우저입니다.");
      return;
    }

    setIsListening(true);

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
    };

    recognition.onerror = (error: SpeechRecognitionError) => {
      setIsListening(false);
      alert("음성 인식 중 오류가 발생했습니다.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="h-full flex flex-col">
      {/* 사용자 정보 */}
      <div className="p-4 bg-slate-50 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-medium text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">잔액: 1,234,567원</div>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <TransferMessage key={message.id} message={message} />
        ))}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl p-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full loading-dots"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full loading-dots"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full loading-dots"></div>
                </div>
                <span className="text-slate-600 text-sm">처리 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="송금 요청을 입력하세요..."
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              className="pr-12"
            />
            <Button
              type="button"
              onClick={handleMicClick}
              disabled={isListening}
              className={`absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 rounded-full ${
                isListening
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-slate-400 hover:bg-slate-500"
              }`}
            >
              <Mic className="w-4 h-4 text-white" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isProcessing}
            className="bg-primary hover:bg-primary/90 w-10 h-10 p-0 rounded-full"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {isListening && (
          <div className="mt-2 text-center">
            <span className="text-sm text-red-500 animate-pulse">
              🎤 음성을 인식하고 있습니다...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferScreen;
