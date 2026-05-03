# TopDate 版本日志

> 当前版本：**v1.0**（2026-05-03）

---

## 📋 版本记录

| 版本 | 日期 | 主要特征 |
|------|------|---------|
| **v1.0** | 2026-05-03 | 完整功能：注册/登录/问卷(45题)/一对一匹配/已匹配不再重复/周三六 17:50 开跑/同城优先(基础分≥40%加分翻1.5倍)/仪表盘(倒计时/本周一言/功能卡片/FAQ)/修改密码/忘记密码/隐私协议/邮箱验证(163 SMTP)/登录状态全局同步。Git标签：`v1.0-stable` |
| | | |

---

## 🔙 如何回退到任意版本

### 回到 v1.0

**你电脑 Power Shell：**
```
cd C:\Users\伤悲猪大肠\Desktop\code\topdate
git checkout tags/v1.0-stable
git push origin main --force
```

**服务器：**
```
cd ~/topdate && git pull && sudo docker compose build --no-cache backend frontend && sudo docker compose up -d
```

### 回到更早的提交

先查提交列表：
```
git log --oneline
```

记下你要回的版本号（比如 `70bdc6b`），然后：
```
git reset --hard 70bdc6b
git push origin main --force
```
服务器再执行上面那句部署命令。
