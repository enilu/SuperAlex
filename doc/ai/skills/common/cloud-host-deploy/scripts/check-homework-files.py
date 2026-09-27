#!/usr/bin/env python3
"""校验站点 homework.json 中的资料文件是否都真实存在。

在 cloud-host 上执行：
    cd /root/workspace/SuperAlex && python3 doc/ai/skills/common/cloud-host-deploy/scripts/check-homework-files.py
"""
import json
import sys
from pathlib import Path

site = Path("/opt/microapp-store/site/homework")
data = json.loads((site / "data/homework.json").read_text(encoding="utf-8"))

missing = []
for collection in data["collections"]:
    print("集合:", collection["title"], "| 条目:", len(collection["items"]))
    for item in collection["items"]:
        if not (site / item["path"]).is_file():
            missing.append(item["path"])

print("缺失文件:", len(missing))
for path in missing:
    print("  ", path)

sys.exit(1 if missing else 0)
