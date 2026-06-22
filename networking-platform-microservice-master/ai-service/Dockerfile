FROM python:3.9-slim

WORKDIR /app

RUN pip install fastapi uvicorn scikit-learn pandas requests numpy PyPDF2 python-multipart aiohttp

COPY . .


CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3030"]