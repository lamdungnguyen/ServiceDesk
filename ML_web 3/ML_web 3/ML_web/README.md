›# ML Web - CSKH Performance Analytics

Ung dung full-stack su dung React + Express + Node.js + MySQL + Python FastAPI de phan tich hoi thoai CSKH va danh gia hieu suat nhan vien.

## Tinh nang da trien khai

- Thu thap va luu tru du lieu hoi thoai giua khach hang va nhan vien.
- Phan tich noi dung va tom tat cuoc hoi thoai.
- Phan tich cam xuc khach hang de suy ra muc do hai long.
- Danh gia hieu suat nhan vien bang he thong scoring machine learning.
- Du doan muc do hieu qua lam viec cua nhan vien.
- Hien thi bao cao va thong ke tren dashboard React.

## Cau truc

- `client/`: React dashboard.
- `server/`: Express API + MySQL persistence.
- `ml-service/`: FastAPI cho summarize/sentiment/prediction.
- `infra/docker-compose.yml`: stack local production-like.

## Yeu cau moi truong

- Node.js 20+
- Python 3.11+
- MySQL 8+

## Cai dat

1. Tao file `.env` tu `.env.example`.
2. Cai package:
   - `npm install` (root)
   - `npm install --prefix server`
   - `npm install --prefix client`
3. Cai package Python:
   - `cd ml-service && pip install -r requirements.txt`
4. Khoi tao schema + seed du lieu mau (bao gom dataset ~1000 hoi thoai tieng Anh de phan tich):
   - `npm run db:init`

## Chay local

- Chay dong thoi ca 3 service:

```bash
npm run dev
```

- Hoac chay rieng:

```bash
npm run dev:server
npm run dev:client
npm run dev:ml
```

## Quan ly DB

- Chay migration: `npm run db:migrate`
- Chay seed: `npm run db:seed`
- Khoi tao tu dong (migrate + seed): `npm run db:init`

Migration va seed nam trong:

- `server/src/db/migrations/`
- `server/src/db/seeds/`

## Docker Compose

```bash
cd infra
docker compose up --build
```

## API chinh

- `POST /api/conversations`: ingest hoi thoai.
- `GET /api/conversations`: lay danh sach hoi thoai.
- `POST /api/evaluation/conversation/:conversationId`: tom tat + sentiment + scoring KPI.
- `POST /api/evaluation/employee/:employeeId/predict`: du doan hieu qua nhan vien.
- `GET /api/evaluation/report`: bao cao dashboard.
- `GET /api/evaluation/employee/:employeeId/history`: lich su KPI + du doan.

## Ghi chu ML

- `ml-service` dang o che do baseline heuristic de demo nhanh.
- Co the thay bang model HuggingFace/finetune model noi bo trong file:
  - `ml-service/app/pipelines/sentiment_pipeline.py`
  - `ml-service/app/pipelines/summary_pipeline.py`
  - `ml-service/app/models/performance_model.py`
