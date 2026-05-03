# TopDate 傻瓜式操作手册

> 最后更新：2026-05-03  
> 当前版本：`v1.0-stable`（标签：修改密码、17:50匹配、同城1.5倍加分）

---

## 一、日常最常用的 3 个操作

### 更新网站（改完代码后）

**你电脑** Power Shell：
```
cd C:\Users\伤悲猪大肠\Desktop\code\topdate
git add .
git commit -m "描述你改了什么"
git push
```

**服务器**窗口：
```
cd ~/topdate
git pull
sudo docker compose build --no-cache backend frontend && sudo docker compose up -d
```

如果 GitHub 抽风 pull 不动，换这个：
```
git remote set-url origin https://gitclone.com/github.com/seanlvv-dev/topdate.git
git pull
git remote set-url origin https://github.com/seanlvv-dev/topdate.git
```

### 回退到 v1.0 稳定版

**你电脑**：
```
cd C:\Users\伤悲猪大肠\Desktop\code\topdate
git checkout tags/v1.0-stable
git push origin main --force
```

**服务器**：
```
cd ~/topdate
git pull
sudo docker compose build --no-cache backend frontend && sudo docker compose up -d
```

### 只看后端日志

```
sudo docker compose logs backend --tail 50
```

---

## 二、用户管理

### 查看所有注册用户

```
sudo docker compose exec db psql -U topdate -d topdate -c "SELECT email, nickname, verification_status, survey_completed FROM users ORDER BY created_at DESC;"
```

### 删除某个用户（比如测试完清数据）

```
sudo docker compose exec db psql -U topdate -d topdate -c "DELETE FROM verification_codes WHERE email = '邮箱'; DELETE FROM users WHERE email = '邮箱';"
```

### 手动帮用户重置密码

```
NEW_HASH=$(python3 -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt'], deprecated='auto').hash('新密码'))") && sudo docker compose exec db psql -U topdate -d topdate -c "UPDATE users SET hashed_password = '${NEW_HASH}' WHERE email = '用户邮箱';"
```

### 把某个用户设为管理员

```
sudo docker compose exec db psql -U topdate -d topdate -c "UPDATE users SET is_admin = true WHERE email = '你的邮箱';"
```

### 手动验证某个用户（跳过邮箱验证）

```
sudo docker compose exec db psql -U topdate -d topdate -c "UPDATE users SET verification_status = 'verified' WHERE email = '用户邮箱';"
```

### 统计人数

```
sudo docker compose exec db psql -U topdate -d topdate -c "SELECT count(*) AS 总人数 FROM users; SELECT count(*) AS 已完成问卷 FROM users WHERE survey_completed=true; SELECT count(*) AS 匹配成功对数 FROM match_history WHERE result='matched';"
```

---

## 三、服务器运维

### 重启某个服务

```
sudo docker compose up -d backend     # 只重启后端
sudo docker compose up -d frontend    # 只重启前端
sudo docker compose up -d             # 全部重启
```

### 完全停掉再开

```
sudo docker compose down
sudo docker compose up -d --build
```

### 清空 Docker 缓存（磁盘满的时候用）

```
sudo docker system prune -a -f
```

### 查看服务器剩余空间

```
df -h
```

### 查看 Docker 各容器状态

```
sudo docker compose ps
```

---

## 四、修改配置

配置都在服务器上的 `/home/ubuntu/topdate/.env` 文件里。

### 改邮件发送

```
sed -i 's/SMTP_HOST=.*/SMTP_HOST=smtp.163.com/' .env
sed -i 's/SMTP_USER=.*/SMTP_USER=新邮箱/' .env
sed -i 's/SMTP_PASSWORD=.*/SMTP_PASSWORD=新授权码/' .env
sudo docker compose up -d backend
```

### 改每周匹配时间

```
sed -i 's/MATCHING_CRON_HOUR=.*/MATCHING_CRON_HOUR=18/' .env
sed -i 's/MATCHING_CRON_MINUTE=.*/MATCHING_CRON_MINUTE=0/' .env
sudo docker compose up -d backend
```

### 改每轮推荐人数（一对一 / 一对多）

在项目代码里改 `backend/config.py` 里的 `TOP_MATCHES_PER_USER`，然后推送+部署。

---

## 五、常见问题速查

| 现象 | 解决办法 |
|------|---------|
| 打开网站白屏 | 看浏览器 F12→Console 有没有红色报错，截图发给我 |
| 注册后收不到邮件 | `sudo docker compose logs backend --tail 30` 看邮件报错 |
| GitHub pull 不动 | 换镜像：`git remote set-url origin https://gitclone.com/github.com/seanlvv-dev/topdate.git` |
| 网站报 502/504 | `sudo docker compose restart backend` 重启后端 |
| 匹配没按时运行 | `sudo docker compose logs backend \| grep "匹配"` 查匹配日志 |
| Docker 构建卡住 | `Ctrl+C` 后重试，或 `sudo docker compose build --no-cache` |

---

## 六、项目信息速查

| 项 | 值 |
|----|-----|
| 网站地址 | `http://111.229.36.34:3000` |
| 服务器 IP | `111.229.36.34` |
| 服务器类型 | 腾讯云轻量 2核2G Ubuntu |
| 发邮件邮箱 | `TopDate@163.com` |
| 发件授权码 | `MDWJD5A25hw47Cav` |
| GitHub 仓库 | `https://github.com/seanlvv-dev/topdate` |
| 稳定版标签 | `v1.0-stable` |
| 匹配时间 | 周三 / 周六 17:50 |
