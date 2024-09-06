FROM python:3.10-slim
LABEL authors="andrew_q"

ARG DJANGO_SECRET_KEY

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install ansible-runner

COPY . /app/
COPY static /app/static

ENV DJANGO_SECRET_KEY=${DJANGO_SECRET_KEY}
ENV PYTHONUNBUFFERED 1

EXPOSE 8000

RUN python manage.py collectstatic --noinput

RUN pip install daphne

CMD ["daphne", "-u", "app/daphne.sock", "infoscreen.asgi:application"]