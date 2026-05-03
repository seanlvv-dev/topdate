# 项目信息（给 AI 读）

## 部署信息

| 项 | 值 |
|----|-----|
| 网站 | `http://111.229.36.34:3000` |
| 服务器 IP | `111.229.36.34` (腾讯云轻量 2核2G Ubuntu) |
| GitHub | `https://github.com/seanlvv-dev/topdate` |
| 发件邮箱 | `TopDate@163.com`，授权码 `MDWJD5A25hw47Cav`，`smtp.163.com:465` SSL |
| 部署命令 | `cd ~/topdate && git pull && sudo docker compose build --no-cache backend frontend && sudo docker compose up -d` |
| GitHub 备用镜像 | `https://gitclone.com/github.com/seanlvv-dev/topdate.git` (主源被墙时用) |
| 稳定版标签 | `v1.0-stable` (commit `70bdc6b`) |

## 后端关键设置

| 设置 | 值 |
|------|-----|
| 匹配时间 | 周三/周六 17:50 (config.py) |
| 匹配模式 | 一对一贪心分配，历史已匹配/已拒绝不再重复 (tasks.py) |
| 同城加分 | +20，基础分≥40%时×1.5→+30 (matching.py) |
| 问卷字段 | 全部有默认值，sldier默认中点 (schemas.py) |
| 密码加密 | bcrypt，截断至72字节 (auth.py) |
| 时区 | 统一用 `datetime.utcnow()` (无时区)，PostgreSQL TIMESTAMP |
| pip 镜像 | `mirrors.aliyun.com/pypi/simple/` (backend/Dockerfile) |
| npm 镜像 | `registry.npmmirror.com` (frontend/Dockerfile) |
| Docker 镜像 | `mirror.ccs.tencentyun.com` |

## 前端架构

- `useAuth` 已改为 React Context (`AuthProvider`)，全局共享登录状态
- `useAuth.jsx` 是 `.jsx` 扩展名（不是 `.js`，否则编译失败）
- `api.js` 401 拦截器不自动跳转（不写 `window.location.href`）
- 错误信息提取用 `getErrorMessage(err)` 处理 Pydantic 数组格式
- `Dashboard.jsx` 倒计时取最近周三或周六 18:00

## 大学邮箱域名（本次对话新增的）

| 大学 | 新增域名 |
|------|---------|
| 北大 | `stu.pku.edu.cn` |
| 上交 | `alumni.sjtu.edu.cn` |
| 哈工大 | `stu.hit.edu.cn` `hitwh.edu.cn` `hitsz.edu.cn` |
| 同济 | `mail.tongji.edu.cn` |
| 厦大 | `stu.xmu.edu.cn` |
| 华科 | `mail.hust.edu.cn` |
| 中南 | `mail.csu.edu.cn` |
| 川大 | `stu.scu.edu.cn` |

## 沟通摘要

| 日期 | 问题 | 解决方案 |
|------|------|---------|
| 05.03 | Docker pip 超时 | 阿里云 PyPI 镜像 |
| 05.03 | bcrypt 报错 >72 bytes | `auth.py` 截断密码 |
| 05.03 | PG 时区冲突 | 全用 `datetime.utcnow()` |
| 05.03 | Resend 只能发自己 | 换 Gmail→连不上→换 163，端口 465 SSL |
| 05.03 | 401 拦截器导致首页跳登录 | 删掉 `window.location.href = '/login'` |
| 05.03 | 注册流程不合理 | 改三步：邮箱+发码→填码+密码→完成 |
| 05.03 | 问卷提交 422 + React #31 白屏 | schema 全字段设默认值 + slider 预填中点 + `getErrorMessage()` |
| 05.03 | 仪表盘参照 FDU Date 重设计 | Dashboard.jsx 全新布局：倒计时/三卡片/本周一言/功能入口/FAQ |
| 05.03 | 导航栏登录状态不同步 | useAuth 改为 React Context (`AuthProvider`) |
| 05.03 | 问卷"下一步"跳过未填题 | 全部题默认必填 + 黄色高亮未填 + 滚动定位 |
| 05.03 | 匹配系统全局重构 | 一对一贪心 + 历史排除 + 周三六双日 + 17:50 提前跑 + 同城 1.5 倍 |
| 05.03 | 忘记密码/修改密码/重发验证码/账号删除/举报 | 全部新增 API + 前端页面 |
| 05.03 | 用户要求文档精简为两份 | `PROJECT_STATUS.md` 给AI读（服务器/配置/通信摘要），`OPS_MANUAL.md` 给用户读（版本记录+回退方法） |
| 05.03 | 创建20人匹配算法测试脚本 | `backend/test_matching.py`，独立脚本不修改任何代码。测试用户用假邮箱 `test_*@topdate.test`，测完需手动清理数据库 |
| 05.03 | OPS_MANUAL.md 新增待办清单+优先级分级 | 🔴清理测试用户/🟡买域名服务器/🟢换发件邮箱，带操作命令 |
| 05.03 | 注册表单新增院系字段 | 后端 models/schemas/main.py 加 `department` 字段，前端自由填写 |
| 05.03 | 首页重构参照FDU Date风格 | 渐变色Hero+倒计时、三步流程(01/02/03)、Why TopDate四卡片、引言卡片、底部CTA |
| 05.03 | 标记稳定版 v1.0 | `git tag v1.0-stable`，已在 GitHub 和 OPS_MANUAL.md 记录 |
