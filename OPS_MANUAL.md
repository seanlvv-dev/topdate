# TopDate 版本日志

> 当前版本：**v1.1**（2026-05-03）

---

## 📝 待办清单

| 优先级 | 状态 | 内容 | 怎么做 |
|:--:|:--:|------|------|
| 🔴 | ✅ | **测试完成后清理虚拟用户** | `sudo docker compose exec db psql -U topdate -d topdate -c "DELETE FROM matches WHERE user1_id IN (SELECT id FROM users WHERE email LIKE 'test_%@topdate.test'); DELETE FROM users WHERE email LIKE 'test_%@topdate.test';"` |
| 🟡 | ⬜ | 正式发布前买域名+服务器 | Cloudflare 买域名（~30元/年），腾讯云续费服务器（~68元/年） |
| 🟡 | ⬜ | 正式发布前配 HTTPS | 装 Let's Encrypt 或 Cloudflare SSL |
| 🟢 | ⬜ | 把发送邮箱从 `TopDate@163.com` 换成 `noreply@你的域名` | 改 .env 里的 SMTP_FROM |

> 🔴 = 不做会出事 | 🟡 = 上线前要做 | 🟢 = 锦上添花 | ✅ = 已完成 | ⬜ = 未做

---

## 📋 版本记录

| 版本 | 日期 | 主要特征 |
|------|------|---------|
| **v1.1** | 2026-05-03 | 地理加分重构为乘法系数(同城×1.15/同省×1.08等)；修复通配符any/都行失效+重复身高Bug；注册自动登录跳仪表盘；首页视觉升级(渐变Hero+波浪+倒计时)；邮箱域名严格匹配所选大学；导航标签滚动联动高亮。Git标签：`v1.1-stable` |
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
