FROM python:3.10-slim
LABEL authors="andrew_q"

ARG DJANGO_SECRET_KEY

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/
COPY static /app/static

ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
ENV PYTHONUNBUFFERED 1

EXPOSE 8000

RUN python manage.py collectstatic --noinput

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]