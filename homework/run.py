"""本地开发入口：python run.py → http://127.0.0.1:8081/homework/

静态资料馆预览仍可用 `python -m http.server 8080`（8081 留给 Flask）。
"""
from __future__ import annotations

import os

from app import create_app

app = create_app()


if __name__ == "__main__":
    port = int(os.environ.get("HOMEWORK_PORT", "8081"))
    app.run(host="127.0.0.1", port=port, debug=True)
