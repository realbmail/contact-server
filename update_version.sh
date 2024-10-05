#!/bin/bash

# 获取最新的 Git tag 版本号，并去掉签名的 'v'
tag=$(git describe --tags --abbrev=0 | sed 's/^v//')

# 如果没有获取到版本号，退出脚本
if [ -z "$tag" ]; then
  echo "未找到 Git 标签。确保已创建 tag。"
  exit 1
fi

# 指定 manifest.json 文件路径
manifest_file="extension/manifest.json"

# 检查 manifest.json 文件是否存在
if [ ! -f "$manifest_file" ]; then
  echo "manifest.json 文件不存在，请检查路径。"
  exit 1
fi

# 使用 jq 工具更新 manifest.json 中的 version 字段
# 如果系统未安装 jq，可以通过 'sudo apt-get install jq' 或其他方式安装
jq --arg version "$tag" '.version = $version' "$manifest_file" > tmp.$$.json && mv tmp.$$.json "$manifest_file"

if [ $? -eq 0 ]; then
  echo "manifest.json 版本号已更新为 $tag"
else
  echo "更新版本号失败"
  exit 1
fi