#!/usr/bin/env bash
# TopDate 服务器诊断脚本
# 用法：在服务器上执行 bash diagnose.sh
# 作用：一次性查清「网站 502 / 打不开」的原因，只读不改动任何东西

set +e
echo "=============================================="
echo " TopDate 服务器诊断  $(date '+%F %T')"
echo "=============================================="

echo
echo "### 1. 系统负载与内存（2核2G，最容易 OOM）"
uptime
free -h
echo "--- 内存占用 Top5 ---"
ps aux --sort=-%mem | head -6

echo
echo "### 2. 磁盘空间（满了会导致容器起不来）"
df -h / /var/lib/docker 2>/dev/null

echo
echo "### 3. Docker 状态"
docker --version
echo "--- 容器列表 ---"
sudo docker compose -f ~/topdate/docker-compose.yml ps -a 2>/dev/null || sudo docker ps -a
echo "--- 已退出的容器 ---"
sudo docker ps -a --filter "status=exited" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "### 4. 各容器最近 30 行日志"
for c in $(sudo docker ps -a --format '{{.Names}}'); do
  echo "---------- $c ----------"
  sudo docker logs --tail 30 "$c" 2>&1
done

echo
echo "### 5. 端口监听情况（3000 应该被 docker-proxy 占用）"
sudo ss -tlnp | grep -E ':(3000|8000|5432|80|443)\b' || echo "（无相关端口在监听 —— 容器没起来）"

echo
echo "### 6. 本机自测（绕开外部网络）"
curl -s -o /dev/null -w "  localhost:3000 -> HTTP %{http_code}\n" --max-time 8 http://localhost:3000
curl -s -o /dev/null -w "  localhost:8000/docs -> HTTP %{http_code}\n" --max-time 8 http://localhost:8000/docs

echo
echo "### 7. OOM 记录（有没有被系统杀过）"
sudo dmesg -T 2>/dev/null | grep -i -E "killed process|out of memory" | tail -10 || echo "（无 OOM 记录或 dmesg 无权限）"

echo
echo "=============================================="
echo " 诊断结束。把上面全部输出复制回来即可。"
echo "=============================================="
