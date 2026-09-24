# TopDate AI 改造说明（OPC 赛道参赛版）

> 本次改造为参赛新增「AI 破冰助手」：双方匹配成功后，一键生成共同点、推荐话题与开场白。
> 改动已通过：后端 py_compile 语法检查 + 前端 vite build 构建验证（105 modules OK）。

## 一、改动清单

| 文件 | 改动 |
|---|---|
| `backend/ai_service.py` | **新增**。LLM 调用（OpenAI 兼容接口）+ 隐私字段白名单 + 破冰 prompt |
| `backend/config.py` | 新增 `LLM_API_BASE / LLM_API_KEY / LLM_MODEL / LLM_TIMEOUT` 配置 |
| `backend/models.py` | 新增 `ai_results` 表（缓存生成结果，重复请求不重复调用模型、不重复扣费） |
| `backend/schemas.py` | 新增 `IcebreakerRequest` |
| `backend/main.py` | 新增接口 `POST /api/ai/icebreaker`（校验归属/状态 → 查缓存 → 生成 → 落库） |
| `backend/rate_limiter.py` | 该接口限流 3 次/分钟（控制成本） |
| `frontend/src/pages/Matches.jsx` | 匹配成功卡片下新增「AI 破冰助手」面板（生成/复制） |
| `.env.example` | 新增 LLM 配置示例 |

说明：
- 新表由启动时的 `Base.metadata.create_all` 自动创建，**无需数据库迁移**。
- 发送给模型的数据只包含问卷白名单字段（不含邮箱、昵称、学校），符合隐私要求。

## 二、你还差两步（都能在 10 分钟内完成）

1. **申请 API Key**（推荐 DeepSeek，便宜且国内直连）：
   - 打开 https://platform.deepseek.com → 注册 → 「API Keys」→ 新建
   - 充值 10 元即可（每次生成成本约 1-2 分钱；演示阶段完全够用）
2. **填进配置**：
   - 本地：项目根目录 `.env` 增加一行 `LLM_API_KEY=sk-你的key`
   - 服务器：同样在部署用的环境变量/`.env` 里加（其余用默认值即可）

## 三、本地测试（演示前跑一遍）

```bash
# 后端（如未装依赖先 pip install -r requirements.txt）
cd backend && uvicorn main:app --reload --port 8000

# 前端
cd frontend && npm run dev
```

测试路径：用一个「已匹配成功（matched）」的账号 → 进入"我的匹配" → 点「生成破冰话题」→ 应返回共同点/话题/开场白。
若库里没有 matched 数据：可临时把某条 matches 记录的 `status` 手工改成 `matched` 用来测试。

## 四、部署到服务器

```bash
# 先在本机提交代码
git add . && git commit -m "feat: AI 破冰助手" && git push

# 服务器上（确认 .env 已加 LLM_API_KEY）
cd ~/topdate && git pull && sudo docker compose build --no-cache backend frontend && sudo docker compose up -d
```

## 五、演示视频最亮的 30 秒

「匹配成功 → AI 破冰助手生成开场白 → 一键复制去发送」——这段直接对应赛道评审关注的「智能体能力」与「实用性」，录进演示视频核心场景里。

---
*生成于 2026-09-11，由 WorkBuddy 准备；改动均在本地工作区，未提交 git。*
