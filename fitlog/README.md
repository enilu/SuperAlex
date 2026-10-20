# FitLog · 健身手记

独立、零依赖的个人健身减重展示站，首页入口为 `/fitlog/`。包含健康总览、计划、饮食、运动、身体趋势和每周复盘。页面只有浏览与筛选，没有在线编辑、保存、删除、导入或导出功能。

## 定期维护

AI 协作维护先遵循 [饮食与运动记录维护规则](../doc/ai/fitlog-recording-rules.md)。用户提供饮食或运动后，默认估算热量，注明份量和强度假设；关键不确定信息主动询问，补充后修订同一记录，不重复累计。

1. 根据自己的笔记更新 `fitlog/data.js` 中的展示数据。该文件随站点发布，所有设备读取相同内容；仅放准备展示的内容，不放完整私人笔记、生日、报告原件或本机路径。
2. 更新 `updatedAt`，新增或修订对应日期记录；同一天只有一条记录，修订时替换原值，避免重复累计。
3. 数据文件改动后，将 `index.html` 中 `data.js?v=` 版本号同步更新，避免浏览器缓存旧数据。JS/CSS 修改时同样提升相应资源版本。
4. 执行下述校验，在本地打开页面检查，再按项目发布流程部署。

记录中的未知数值使用 `null`，真实零值写 `0`。缺失餐次不会当作零摄入；只有确认全天所有食物与饮料均已记录才将 `foodComplete` 设为 `true`。热量是估算，不直接与运动应用消耗相减。自报起始体重不计入晨起实测曲线和周平均。

首批展示内容根据个人健康笔记整理，包含七天记录，阶段与周运动安排为原计划摘要。尚无实测体重及正式每周复盘时显示空状态，不生成虚构进度。总览按最近记录日期及其所在周展示，不把历史记录误称为今日数据。

## 数据结构

`data.js` 使用 `window.FITLOG_DATA = { ... };`，可直接打开 HTML，无需接口、构建或服务器运行环境。

- `schemaVersion`：当前为 `1`；`updatedAt`：维护日期 `YYYY-MM-DD`；`focus`：本阶段重点。
- `profile`：`name/height/startWeight/targetWeight/startDate/calorieTarget/phases/weeklyPlan/routine`。计划文本按换行展示；实际开始日期未知时留空。
- `records`：每日记录列表，日期唯一。包括 `date/weight/waist/sleep/steps/aerobic/cycling/strengthCount/exerciseCalories/activity/notes/foodComplete/meals`。
- `meals`：四个固定键 `breakfast/lunch/dinner/snack`；各含 `min/max/text`。单值估算只填 `min`，`max` 为 `null`；区间上下限均填。`text` 保留食物、实际份量、估算来源和假设。
- `reviews`：每周复盘列表，各项包含 `date/wins/feelings/next`，日期归一为当周周一。尚无记录时使用空列表。

单位：体重公斤、身高和腰围厘米、睡眠小时、有氧分钟、骑行公里、热量千卡。晨起曲线展示最近 30 次实测，按实际日期间隔排列；周均值仅取有效实测。缺失一周时不计算“较上一周”。

## 文件与验证

`index.html` 为只读页面结构，`style.css` 为响应式布局，`data.js` 为手工维护的展示数据，`manager.js` 做数据校验与统计，`app.js` 负责展示和筛选。

```powershell
node --check fitlog/data.js
node --check fitlog/manager.js
node --check fitlog/app.js
node -e "global.window={};require('./fitlog/data.js');const m=require('./fitlog/manager.js');const d=m.validate(window.FITLOG_DATA);console.log(d.records.length+' days validated')"
```

本地可直接打开 `fitlog/index.html`，也可在仓库根目录运行 `python -m http.server 8080` 后访问 `/fitlog/`。浏览器检查至少覆盖导航、日期浏览、月份筛选、餐次与每日汇总一致、未知值与区间、手机布局。

## 存储与发布

本版本不读写 localStorage、会话存储或数据库。旧版原型的 `superalex.fitlog.v1` 数据保持原样，不读取、不覆盖，也不自动合并进展示数据。

部署沿用仓库 cloud-host-deploy 技能，`deploy-superalex.sh` 静态清单已包含 `fitlog/`。展示数据随静态文件一起发布，无后端或数据库迁移。上线后检查首页入口与 `/fitlog/`。
