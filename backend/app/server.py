from fastapi import FastAPI, Request
from kafka import KafkaProducer
import json
import tritonclient.grpc
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import start_http_server, Gauge, Counter, REGISTRY
import threading
import random
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrumentator 설정
Instrumentator().instrument(app).expose(app)

# Kafka Producer를 전역 변수로 선언
producer = None

try:
    # Kafka Producer 생성 시도
    producer = KafkaProducer(
        bootstrap_servers='kafka:9092',
        value_serializer=lambda x: json.dumps(x).encode('utf-8')
    )
except Exception as e:
    print(f"Failed to connect to Kafka: {e}")

# 커스텀 메트릭
transaction_count = Counter('transaction_count', 'Total number of transactions processed')
transaction_amount = Gauge('transaction_amount', 'Transaction amount in KRW')
transaction_success = Counter('transaction_success', 'Number of successful transactions')
transaction_failure = Counter('transaction_failure', 'Number of failed transactions')
transaction_processing_time = Gauge('transaction_processing_time', 'Transaction processing time in seconds')

# 이상거래 관련 메트릭
fraud_transactions_total = Counter('fraud_transactions_total', 'Total number of fraud transactions detected')
fraud_model_accuracy = Gauge('fraud_model_accuracy', 'Model accuracy score')
fraud_model_precision = Gauge('fraud_model_precision', 'Model precision score')
fraud_model_recall = Gauge('fraud_model_recall', 'Model recall score')
fraud_model_feature_drift = Gauge('fraud_model_feature_drift', 'Feature drift PSI score')

# HTTP 요청 관련 메트릭 (FastAPI Instrumentator가 기본 제공하지만 커스텀도 추가)
http_request_duration_seconds_sum = Counter('http_request_duration_seconds_sum', 'Sum of HTTP request durations')
http_request_duration_seconds_count = Counter('http_request_duration_seconds_count', 'Count of HTTP requests')

def triton_infer(data: dict):
    # 간단한 이상거래 탐지 로직 (실제로는 ML 모델 사용)
    amount = float(data.get('amount', 0))
    is_fraud = amount > 800  # 800 이상이면 이상거래로 판단
    
    # 모델 성능 메트릭 업데이트 (시뮬레이션)
    fraud_model_accuracy.set(0.95 + random.random() * 0.04)  # 0.95-0.99
    fraud_model_precision.set(0.92 + random.random() * 0.06)  # 0.92-0.98
    fraud_model_recall.set(0.88 + random.random() * 0.08)  # 0.88-0.96
    fraud_model_feature_drift.set(random.random() * 0.3)  # 0-0.3
    
    return {"inference": "fraud" if is_fraud else "normal", "confidence": random.random()}

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/predict/")
async def predict(data: dict):
    start_time = time.time()
    try:
        # 1. 메트릭 업데이트
        transaction_count.inc()
        fraud_transactions_total.inc()  # 모든 거래를 fraud_transactions_total에도 카운트
        transaction_amount.set(float(data.get('amount', 0)))
        
        # 2. Kafka로 거래 메시지 전송 (Kafka가 사용 가능한 경우에만)
        if producer:
            producer.send("transactions", value=data)
            producer.flush()

        # 3. Triton 추론 요청
        response = triton_infer(data)

        # 4. 성공 메트릭 업데이트
        transaction_success.inc()
        
        # 5. 처리 시간 기록
        processing_time = time.time() - start_time
        transaction_processing_time.set(processing_time)
        
        # 6. HTTP 요청 메트릭 업데이트
        http_request_duration_seconds_sum.inc(processing_time)
        http_request_duration_seconds_count.inc()

        return {"status": "success", "triton_response": response, "fraud_detected": response.get("inference") == "fraud"}
    except Exception as e:
        print(f"Error in predict: {e}")
        # 실패 메트릭 업데이트
        transaction_failure.inc()
        processing_time = time.time() - start_time
        http_request_duration_seconds_sum.inc(processing_time)
        http_request_duration_seconds_count.inc()
        return {"status": "error", "error": str(e)}

@app.get("/metrics")
async def get_metrics():
    return REGISTRY.get_sample_value('transaction_count')

# Prometheus HTTP endpoint 노출
threading.Thread(target=lambda: start_http_server(9101)).start()
