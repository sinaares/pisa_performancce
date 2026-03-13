FROM python:3.11-slim

WORKDIR /app

# Install system deps for ML packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ML pipeline source
COPY ../src /app/src
COPY ../data /app/data

# Copy backend app
COPY . /app/backend

ENV PYTHONPATH=/app/src:/app/backend
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

COPY startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

CMD ["/app/startup.sh"]
