"""Flask 应用工厂。"""
from __future__ import annotations

from pathlib import Path

from flask import Flask

from .config import Config
from . import db as db_mod


def create_app(config: dict | None = None) -> Flask:
    templates = Path(__file__).resolve().parent.parent / "templates"
    app = Flask(__name__, template_folder=str(templates))
    app.config.from_object(Config)
    if config:
        app.config.update(config)

    _check_secret_key(app)
    db_mod.init_app(app)

    prefix = app.config["URL_PREFIX"]

    from .api import bp as api_bp
    app.register_blueprint(api_bp, url_prefix=f"{prefix}/api")

    from .views import bp as views_bp
    app.register_blueprint(views_bp, url_prefix=prefix)

    return app


def _check_secret_key(app: Flask) -> None:
    key = app.config.get("SECRET_KEY") or ""
    if key:
        return
    if app.config["ENV_NAME"] == "production":
        raise RuntimeError(
            "HOMEWORK_SECRET_KEY 未设置：生产环境必须通过 secrets.env 注入会话密钥"
        )
    app.config["SECRET_KEY"] = "dev-only-insecure-secret-key"
    app.logger.warning("使用开发默认 SECRET_KEY，切勿用于生产")
