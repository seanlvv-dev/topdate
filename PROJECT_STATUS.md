# TopDate 项目状态文档

> 更新时间：2026-05-03

---

## 一、项目概况

| 项 | 值 |
|----|-----|
| 产品名 | TopDate（985高校专属交友匹配平台） |
| GitHub | `https://github.com/seanlvv-dev/topdate`（私有） |
| 服务器 IP | `111.229.36.34` |
| 访问地址 | `http://111.229.36.34:3000` |
| 服务器类型 | 腾讯云轻量应用服务器（试用期，2核2G，上海） |
| 操作系统 | Ubuntu 22.04 LTS |
| 部署方式 | Docker Compose（4 容器：backend + frontend + postgres + redis） |
| 后端框架 | Python FastAPI |
| 前端框架 | React 18 + Vite + Tailwind CSS |

---

## 二、当前功能完成度

### ✅ 已完成的

| 模块 | 说明 |
|------|------|
| 985 高校数据 | 39 所大学完整数据，包含省份、城市、邮箱域名 |
| 注册流程 | 选择大学 → 输入邮箱 → 发送验证码 → 验证 → 设昵称密码 → 完成 |
| 邮箱验证 | 163 SMTP 发验证码（授权码模式），国内网络可用 |
| 忘记密码 | 输入邮箱 → 发验证码 → 重设密码 |
| 登录系统 | JWT Token，支持未验证用户登录后跳转验证页 |
| 5 部分问卷 | 第一印象 / 吸引力 / 日常生活 / 情感连接 / 未来愿景，共 45+ 题 |
| 匹配算法 | 5 维度加权评分 + 地理近邻加分（同城 +20，同省 +12，邻省 +6） |
| 定时匹配 | APScheduler，每周三 18:00 自动运行 |
| 双向确认 | 互相"喜欢"后交换邮箱，单向不暴露 |
| 仪表盘首页 | 倒计时 + 问卷/配对卡片 + 匹配历史 + 平台数据 + FAQ |
| 统计数据 | 总用户数、匹配对数、成功率、活跃用户、高校排行 |
| 管理员面板 | 用户管理（搜索/冻结/解冻）、详细统计、操作日志 |
| 个人资料 | 昵称/简介编辑、照片上传（JPG/PNG/WebP，最多 3 张， 5MB 上限） |
| 账号删除 | 用户可自行删除（需密码确认） |
| 举报功能 | 匹配中举报对方（记录到管理员日志） |
| 移动端适配 | 响应式设计，PC 和手机均可使用 |

### ⚠️ 待完善

| 项 | 优先级 |
|----|--------|
| 提示邮件从 `TopDate@163.com` 换成正式域名邮箱（如 `noreply@topdate.cn`） | 高 |
| 注册成功后引导至调查问卷 | 中 |
| 活动公告功能 | 低 |
| 线上活动功能 | 低 |
| 图片上传后查看大图 | 低 |
| 单元测试 | 中 |

---

## 三、服务器运维

### 3.1 连接服务器

```
SSH: ubuntu@111.229.36.34（密钥登录）
或通过腾讯云控制台 → 轻量应用服务器 → WebShell 登录
```

### 3.2 项目路径

```
/home/ubuntu/topdate/
```

### 3.3 部署命令

```bash
cd ~/topdate
git pull
sudo docker compose up -d --build
```

### 3.4 查看后端日志

```bash
sudo docker compose logs backend --tail 50
```

### 3.5 重启单个服务

```bash
sudo docker compose up -d backend    # 只重启后端
sudo docker compose up -d frontend   # 只重启前端
```

### 3.6 查看数据库

```bash
sudo docker compose exec db psql -U topdate -d topdate
# 常用查询：
SELECT id, email, nickname, verification_status, survey_completed FROM users;
```

### 3.7 防火墙已开放端口

| 端口 | 用途 |
|------|------|
| 3000 | 前端（Nginx） |
| 8000 | 后端 API |

---

## 四、邮件配置

### 当前：163 邮箱 SMTP

| 配置项 | 值 |
|--------|-----|
| 邮箱 | `TopDate@163.com` |
| SMTP_HOST | `smtp.163.com` |
| SMTP_PORT | `465`（SSL 直连） |
| 授权码 | `MDWJD5A25hw47Cav` |

### 开启方法

1. 登录 mail.163.com → 设置 → POP3/SMTP/IMAP
2. 开启 IMAP/SMTP 服务
3. 设置授权码

### 后续建议

- 买 `topdate.cn` 域名后，换成阿里云邮件推送（`noreply@topdate.cn`）
- 微信小程序或手机号注册场景可接入腾讯云短信

---

## 五、邮箱域名清单（部分高校）

| 大学 | 学生邮箱域名 |
|------|-------------|
| 北京大学 | `pku.edu.cn` |
| 清华大学 | `mails.tsinghua.edu.cn` / `tsinghua.edu.cn` |
| 复旦大学 | `m.fudan.edu.cn` / `fudan.edu.cn` |
| 上海交通大学 | `sjtu.edu.cn` |
| 浙江大学 | `zju.edu.cn` |
| 南京大学 | `smail.nju.edu.cn` / `nju.edu.cn` |
| 中科大 | `mail.ustc.edu.cn` / `ustc.edu.cn` |
| …等 39 所 | 完整列表见 `backend/universities.py` |

---

## 六、沟通记录摘要

| 日期 | 内容 | 决策 |
|------|------|------|
| 05.03 | Docker 构建 pip 超时 | 改用阿里云 PyPI 镜像 `-i https://mirrors.aliyun.com/pypi/simple/` |
| 05.03 | 前端 npm install 卡住 | 改用 npmmirror 镜像 `registry.npmmirror.com` |
| 05.03 | 注册 bcrypt 报错 `password > 72 bytes` | 在 `auth.py` `hash_password()` 截断密码至 72 字节 |
| 05.03 | PostgreSQL 时区冲突 `can't subtract offset-naive and offset-aware` | 统一使用 `datetime.utcnow()`（无时区） |
| 05.03 | 注册流程不合理（先注册才能验证） | 改为三步：选大学+邮箱→发码→填码+密码→完成 |
| 05.03 | Resend 邮件只能发给自己 | 先换 Gmail 失败（国内连不上），最终用 163 邮箱 |
| 05.03 | Gmail SMTP 在国内连不上 | 改用 163 邮箱，端口 465 SSL 直连 |
| 05.03 | 首页被 401 重定向到登录 | 移除 `api.js` 中 401 拦截器的 `window.location.href = '/login'` |
| 05.03 | 注册页 UI 体验不好 | 改为标准一行式（邮箱+发送验证码按钮并排） |
| 05.03 | 复旦邮箱域名显示错误 | 将 `m.fudan.edu.cn` 排到 `fudan.edu.cn` 前面 |
| 05.03 | 仪表盘首页设计 | 创建 Dashboard：倒计时 / 三卡片 / 匹配历史 / 平台数据 / FAQ |
| 05.03 | 导航栏重构 | 登录后显示：仪表盘 / 配对局势 / 活动公告 / 用户名 ▼ |

---

## 七、从零部署步骤（新服务器）

```bash
# 1. 安装 Docker（阿里云镜像）
sudo apt update && sudo apt install -y ca-certificates curl
sudo curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [signed-by=/etc/apt/keyrings/docker.asc] https://mirrors.aliyun.com/docker-ce/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt update && sudo apt install -y docker-ce docker-compose-plugin git

# 2. Docker 镜像加速（腾讯云）
sudo mkdir -p /etc/docker
echo '{"registry-mirrors":["https://mirror.ccs.tencentyun.com"]}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker

# 3. 克隆项目
git clone https://github.com/seanlvv-dev/topdate.git
cd topdate

# 4. 创建 .env 配置文件（参考上方邮件配置）
cat > .env << 'EOF'
SECRET_KEY=your-random-secret-key
DATABASE_URL=postgresql+asyncpg://topdate:topdate123@db:5432/topdate
REDIS_URL=redis://redis:6379/0
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=YourEmail@163.com
SMTP_PASSWORD=YourAuthCode
SMTP_FROM=YourEmail@163.com
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
EOF

# 5. 启动
sudo docker compose up -d --build

# 6. 开放端口（腾讯云控制台 → 防火墙）
#    添加 TCP 3000 和 TCP 8000
```
