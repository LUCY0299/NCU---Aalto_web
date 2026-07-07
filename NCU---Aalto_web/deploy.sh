#!/usr/bin/env sh
# 若發生錯誤則終止執行
set -e

# 移動到前端靜態資料夾
cd framer-admin/frontend

git init
git add -A
git commit -m 'deploy'

# 部署到 https://github.com/LUCY0299/NCU---Aalto_web.git 的 gh-pages 分支
git push -f https://github.com/LUCY0299/NCU---Aalto_web.git master:gh-pages

cd -
