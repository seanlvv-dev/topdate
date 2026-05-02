# TopDate - 985高校专属交友匹配平台

面向全国39所985高校学生的科学匹配交友平台。基于心理学研究的加权评分算法，结合地理位置优先策略，帮助你在同城或同省的校园里找到真正契合的人。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS + React Router |
| 后端 | Python 3.12 + FastAPI + SQLAlchemy (Async) |
| 数据库 | PostgreSQL (生产) / SQLite (开发) |
| 缓存 | Redis |
| 定时任务 | APScheduler |
| 部署 | Docker Compose + Nginx |

## 功能特性

- 🎓 **985高校专属**：仅支持39所985大学邮箱认证
- 📧 **校园邮箱验证**：edu.cn域名验证确保真实身份
- 📋 **5部分趣味问卷**：第一印象、吸引力、日常生活、情感连接、未来愿景
- 🔬 **科学匹配算法**：基于相似性吸引理论(Bryne, 1971)、加权多维度评分
- 📍 **地理位置优先**：同城+20分，同省+12分，邻省+6分
- ⏰ **每周三18:00匹配**：定时生成匹配结果
- 💕 **双向确认**：互相喜欢后才交换联系方式
- 🛡️ **隐私安全**：邮箱仅在匹配成功后显示
- 📊 **数据统计**：实时显示注册人数、成功匹配对数、成功率

## 快速开始

### 开发环境

**1. 后端**

```bash
cd backend
pip install -r requirements.txt
cp ../.env.example .env
# 编辑 .env 配置邮件服务（开发环境可跳过）
uvicorn main:app --reload --port 8000
```

**2. 前端**

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### Docker部署

```bash
# 配置环境变量
cp .env.example .env
# 编辑 .env 中的 SECRET_KEY 和 SMTP 配置

# 启动所有服务
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

### 生产环境部署建议

1. **云服务器**：推荐阿里云 ECS 或 AWS EC2（国内用户优先阿里云）
2. **域名**：配置 `topdate.cn` 及 SSL 证书（Let's Encrypt）
3. **邮件服务**：
   - 国内推荐：阿里云邮件推送(DirectMail)
   - 海外推荐：SendGrid / Resend
4. **CDN**：使用阿里云CDN或Cloudflare加速静态资源
5. **监控**：接入 Sentry / Grafana
6. **备份**：定期备份PostgreSQL数据

## 项目结构

```
topdate/
├── backend/                  # FastAPI 后端
│   ├── main.py              # 应用入口，所有API路由
│   ├── config.py            # 配置管理
│   ├── database.py          # 数据库连接
│   ├── models.py            # SQLAlchemy数据模型
│   ├── schemas.py           # Pydantic请求/响应模型
│   ├── auth.py              # JWT认证
│   ├── universities.py      # 985大学数据
│   ├── matching.py          # 匹配算法核心
│   ├── email_service.py     # 邮件服务
│   ├── tasks.py             # 定时任务（每周匹配）
│   └── requirements.txt
├── frontend/                # React前端
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── utils/           # 工具函数
│   │   ├── styles/          # 样式
│   │   ├── App.jsx          # 路由配置
│   │   └── main.jsx         # 入口
│   ├── index.html
│   └── package.json
├── database/
│   └── schema.sql           # PostgreSQL初始化脚本
├── docker-compose.yml       # Docker编排
└── README.md
```

## API 文档

启动后端后访问 http://localhost:8000/docs 查看 Swagger UI 交互式API文档。

### 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/verify-email | 邮箱验证 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户 |
| GET | /api/universities | 大学列表 |
| POST | /api/survey/submit | 提交问卷 |
| GET | /api/survey/questions | 问卷问题配置 |
| GET | /api/matches | 获取匹配列表 |
| POST | /api/matches/action | 匹配操作（喜欢/拒绝） |
| GET | /api/stats | 平台统计 |
| GET | /api/admin/users | 管理用户 |
| POST | /api/admin/users/action | 管理操作 |
| POST | /api/matching/test | 测试匹配算法 |

## 匹配算法说明

### 理论基础

1. **相似性吸引理论** (Byrne, 1971)：态度相似度越高，吸引力越强
2. **互补需求理论** (Winch, 1958)：部分特质互补（适度权重）
3. **最佳差异化理论** (Brewer, 1991)：相似与差异的最佳平衡

### 计算流程

```
总分 = 加权相似度 × 100 + 距离奖励分

加权相似度 = Σ(各部分分数 × 部分权重)

各部分权重:
  第一印象: 15%
  吸引力:   25%
  日常生活: 25%
  情感连接: 20%
  未来愿景: 15%

距离奖励:
  同城: +20分
  同省: +12分
  邻省: +6分
```

## 问卷内容

问卷共5部分45+问题：

1. **第一印象** (14题)：性别、年龄、身高、体型、穿搭风格等
2. **吸引力** (8题)：社交风格、爱的语言、重视特质等
3. **日常生活** (15题)：作息、饮食、消费、爱好、见面频率等
4. **情感连接** (9题)：沟通风格、不安全感、亲密节奏等
5. **未来愿景** (3题)：事业追求、毕业后生活方式等

### 手动操作清单

部署前需完成以下操作：

- [ ] 在 `.env` 中设置 `SECRET_KEY` 为随机字符串
- [ ] 配置邮件服务 SMTP 参数
- [ ] 创建第一个管理员账户（通过数据库插入）
- [ ] 配置域名和 SSL 证书
- [ ] 设置数据库定期备份
- [ ] 检查并更新大学邮箱域名列表（`backend/universities.py`）

## 管理员

首次部署后，通过数据库创建管理员账户：

```sql
-- 通过 API 注册普通用户后，手动提升为管理员
UPDATE users SET is_admin = TRUE WHERE email = 'your-admin@xxx.edu.cn';
```

管理员可访问 `/admin` 路径进行用户管理、查看统计和操作日志。

## License

MIT
