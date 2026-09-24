#!/usr/bin/env bash
# TopDate 服务器一键恢复脚本
# 用法：在服务器上执行 bash restart.sh
# 作用：清理 → 重启全部容器 → 验证。适用于容器挂了/机器重启后服务没自启的情况

set +e
echo "=============================================="
echo " TopDate 一键恢复  $(date '+%F %T')"
echo "=============================================="

echo
echo "### 0. 磁盘清理（防止磁盘满导致起不来）"
sudo docker system prune -f --filter "until=168h" 2>&1 | tail -3

echo
echo "### 1. 重启全部容器"
cd ~/topdate || { echo "❌ 找不到 ~/topdate 目录"; exit 1; }
sudo docker compose down
sudo docker compose up -d

echo
echo "### 2. 等待服务就绪（15 秒）"
sleep 15

echo
echo "### 3. 容器状态"
sudo docker compose ps -a

echo
echo "### 4. 验证"
curl -s -o /dev/null -w "  localhost:3000 -> HTTP %{http_code}\n" --max-time 10 http://localhost:3000
curl -s -o /dev/null -w "  localhost:8000/docs -> HTTP %{http_code}\n" --max-time 10 http://localhost:8000/docs

echo
echo "=============================================="
echo " 若 3000 返回 200 即恢复成功；若仍失败，跑"
echo " bash diagnose.sh 看日志，把输出发我。"
echo "=============================================="
