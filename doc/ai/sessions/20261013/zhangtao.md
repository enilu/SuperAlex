
## 2026-10-13 16:55:56 总览日期筛选增加本月与下月（方案待批准）

- 需求：现有今天、本周、近7天后增加本月、下月。
- 已查看共用总览模板、前端日期筛选与时间段接口；当前工作树干净。
- 方案：本月为当前自然月1日至月末；下月为下一自然月1日至月末，按浏览器本地日期计算并正确处理跨年、闰年和月末。
- 复用现有 setRange 与时间段 API；共用模板的总览、校内和校外页面同步出现按钮，更新 overview.js 缓存版本与相关现有验证。
- 根据 README 要求等待实施方案批准，尚未修改业务代码。本轮未执行测试、未发布。

## 2026-10-13 16:59:34 总览日期快捷筛选与默认今天（已完成）

- 用户补充默认选中今天，并明确确认实施方案。
- homework/templates/overview.html：增加本月、下月，五个快捷按钮复用 filter-button 高亮样式和 aria-pressed，overview.js 缓存版本更新为 20261013-p1。
- homework/static/js/overview.js：默认起止日期均为今天；本月/下月按浏览器本地日期计算完整自然月，支持跨年和闰年；切换按钮同步选中状态，手动输入日期或点击日期卡时更新选中状态。
- 共用模板的总览、校内、校外页面同步生效；复用现有时间段接口，不涉及数据库或 localStorage 变更。
- homework/tests/test_tasks.py：更新缓存版本断言，覆盖三个页面新增按钮及默认今天的可访问选中状态。
- 验证：python -m pytest tests/test_tasks.py -q，13 passed；node --check static/js/overview.js 通过；git diff --check 通过。
- 临时 Node VM 验证脚本放在聚合工作区 runtime/20261013：执行实际前端脚本，检查初始请求为今天、月末、跨年、平年/闰年2月、本月/下月按钮请求参数、日期输入值、高亮及手动输入后的状态，全部通过。
- 初次测试发现另一处旧缓存版本断言，同步更新后重跑全部相关测试通过。
- 未做浏览器视觉验证；本轮尚未提交或部署线上。

## 2026-10-13 17:02:05 总览日期筛选提交推送与部署（已完成）

- 用户授权提交、推送并发布线上；使用 common/cloud-host-deploy 技能。
- 功能提交 f906f22caadbc91ad0930df213b47010daa11477，已推送 origin/main；服务器干净并 fast-forward 到相同提交。
- 服务器站点规范与 Nginx 检查通过，dry-run 核对后运行 deploy-homework.sh，退出码 0。
- 备份目录 /root/backups/homework-20261013-170058；数据库无待应用迁移；homework-workbench 服务 active。
- 应用代码由服务器 Git 仓库更新，同步回滚静态页 index.html、assets/css、assets/js、assets/img、data/homework.json；未改 Nginx，未覆盖 files/、assets/vendor/，未写游戏站目录，保留线上额外文件。
- 公网登录页 200、homework 首页未登录 302、health status=ok/db=ok；游戏首页和 /game/ 200；公开资料 200，private 直链未登录 401。
- 服务器应用测试客户端确认总览/校内/校外页面都有本月、下月以及默认今天的 aria-pressed 状态和新脚本缓存版本。
- 公网 overview.js SHA-256 与发布仓库文件一致。前一轮13项任务测试与日期边界执行检查通过；未做浏览器视觉验收。
- 发布脚本读取二进制 PDF 时出现空字节警告，HTTP检查通过，未影响发布。
