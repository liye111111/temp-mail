# SEO Keyword Planner API

后续进行 SEO 选题、关键词扩展和内容规划时，使用下述内部 API 获取关键词建议。

## 接口

- 方法：`GET`
- 地址：`https://mcp-server.devtools.ishopastro.com/seo-agent/get-keyword-ideas`
- 查询参数：`keyword`，传入待扩展的种子关键词；必须进行 URL 编码。
- 鉴权：请求 Cookie 中的 `b-jwt`。
- Origin：`https://hepeng.admin.beta.ishopastro.com`

## 调用示例

不要把 JWT 写入代码、文档或提交到 Git。先在本地 shell 中设置临时环境变量：

```bash
export SEO_AGENT_B_JWT='<current-b-jwt>'
```

然后调用接口：

```bash
curl --location --get \
  'https://mcp-server.devtools.ishopastro.com/seo-agent/get-keyword-ideas' \
  --data-urlencode 'keyword=temporary email' \
  --header "Cookie: b-jwt=${SEO_AGENT_B_JWT}" \
  --header 'Origin: https://hepeng.admin.beta.ishopastro.com'
```

更换 `keyword` 的值即可查询其他种子关键词。优先使用 `--data-urlencode`，避免手动处理空格及特殊字符。

## 后续任务中的使用约定

1. 在制定关键词计划前，先为每个核心种子词调用该接口。
2. 保存任务所需的关键词结果或分析结论，不保存鉴权 Cookie。
3. 对返回结果按搜索意图、主题相关性和内容类型分组，再决定目标页面或文章。
4. 如果接口返回 `401` 或 `403`，更新本地 `SEO_AGENT_B_JWT` 后重试；不要将新 Token 补写进本文档。

## 安全说明

`b-jwt` 是敏感鉴权凭证。通过聊天、日志或其他渠道暴露过的 Token 应视为已泄露并及时轮换。仓库中只保留环境变量占位符。
