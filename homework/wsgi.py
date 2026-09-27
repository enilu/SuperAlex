"""生产入口：waitress-serve --host=127.0.0.1 --port=8085 wsgi:app

systemd 单元 homework-workbench.service 使用本入口。
"""
from app import create_app

app = create_app()
