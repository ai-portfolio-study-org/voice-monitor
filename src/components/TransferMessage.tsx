
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'system' | 'transfer';
  content: string;
  timestamp: Date;
  transferData?: {
    receiver: string;
    amount: number;
    status: 'processing' | 'completed' | 'failed';
  };
  isStreaming?: boolean;
}

interface TransferMessageProps {
  message: Message;
}

const TransferMessage = ({ message }: TransferMessageProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(!message.isStreaming);

  useEffect(() => {
    if (message.type === 'system' && message.isStreaming) {
      setDisplayedText('');
      setIsTypingComplete(false);

      let index = 0;
      const interval = setInterval(() => {
        if (index < message.content.length) {
          setDisplayedText(message.content.slice(0, index + 1));
          index++;
        } else {
          setIsTypingComplete(true);
          clearInterval(interval);
        }
      }, 50); // 50ms마다 한 글자씩

      return () => clearInterval(interval);
    } else {
      setDisplayedText(message.content);
      setIsTypingComplete(true);
    }
  }, [message.content, message.isStreaming, message.type]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  if (message.type === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-white rounded-2xl p-3 max-w-[80%]">
          <div className="text-sm">{message.content}</div>
          <div className="text-xs text-primary-foreground/70 mt-1">
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    );
  }

  if (message.type === 'transfer' && message.transferData) {
    const { transferData } = message;
    const statusConfig = {
      processing: {
        icon: <Clock className="w-4 h-4 text-yellow-500" />,
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700'
      },
      completed: {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700'
      },
      failed: {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700'
      }
    };

    const config = statusConfig[transferData.status];

    return (
      <div className="flex justify-start">
        <Card className={`${config.bgColor} ${config.borderColor} border-2 p-4 max-w-[80%]`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white rounded-full">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-900">송금 요청</div>
              <div className="text-sm text-slate-600">
                {transferData.receiver}님에게 {transferData.amount.toLocaleString()}원
              </div>
            </div>
            {config.icon}
          </div>
          
          <div className={`text-sm ${config.textColor} font-medium`}>
            {transferData.status === 'processing' && '송금 처리 중...'}
            {transferData.status === 'completed' && '송금이 완료되었습니다.'}
            {transferData.status === 'failed' && '송금에 실패했습니다.'}
          </div>
          
          <div className="text-xs text-slate-500 mt-2">
            {formatTime(message.timestamp)}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-slate-100 rounded-2xl p-3 max-w-[80%]">
        <div className="text-sm text-slate-700">
          {displayedText}
          {message.type === 'system' && !isTypingComplete && (
            <span className="animate-pulse">|</span>
          )}
        </div>
        {isTypingComplete && (
          <div className="text-xs text-slate-500 mt-1">
            {formatTime(message.timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferMessage;
