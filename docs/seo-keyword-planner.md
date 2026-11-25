# SEO Keyword Planner

后续进行 SEO 选题、关键词扩展和内容规划时，**优先使用 Google Ads API 直连**（`KeywordPlanIdeaService.GenerateKeywordIdeas`）。内部 `b-jwt` 代理仅作备用。

默认定向（GetOpenInbox 英文主站）：

- 语言：`languageConstants/1000`（英语）
- 地区：`geoTargetConstants/2840`（美国）
- 网络：Google 搜索及合作伙伴

## 1. 优先：Google Ads 直连

### 本机环境变量

凭证放在本机 env 文件（当前约定可与 GSC 共用 `~/bin/env.d/gsc.env`，或拆成 `google-ads.env`）。**禁止**写入仓库、issue 或日志。

| 变量 | 说明 |
| --- | --- |
| `GOOGLE_ADS_CUSTOMER_ID` | 10 位客户 ID（无横杠） |
| `GOOGLE_ADS_LOGIN_CUSTOMER_ID` | 可选；经 MCC 调用时填写 |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Ads API Center |
| `GOOGLE_ADS_USE_PROTO_PLUS` | 设为 `true` |
| OAuth：`GOOGLE_ADS_CLIENT_ID` / `CLIENT_SECRET` / `REFRESH_TOKEN` | 用户授权模式 |
| 或 SA：`GOOGLE_ADS_JSON_KEY_FILE_PATH` | 服务账号 JSON；须已加入 Ads 用户 |

字段说明见 [Python 客户端配置](https://developers.google.com/google-ads/api/docs/client-libs/python/configuration)。

### 探测 / 拉词

```bash
source ~/bin/env.d/gsc.env   # 或 google-ads.env
python3 -m pip install -U google-ads   # 建议独立 venv

# 仓库脚本（打印聚合结果，不回显 token）
python3 scripts/keyword-ideas.py --seed "temporary email" --limit 20
```

常用参数：`--seed`、`--language-id`（默认 1000）、`--geo-id`（默认 2840）、`--limit`。

`401` / `PERMISSION_DENIED` / token 失效时，在本机轮换 OAuth refresh token 或检查 Ads 用户权限；**不要**把新密钥写进本文档。

## 2. 备用：内部 Keyword Planner 代理

仅在 Ads 直连不可用时使用。

- 方法：`GET`
- 地址：`https://mcp-server.devtools.ishopastro.com/seo-agent/get-keyword-ideas`
- 查询参数：`keyword`（URL 编码）
- 鉴权：Cookie `b-jwt`（环境变量 `SEO_AGENT_B_JWT`）
- Origin：`https://hepeng.admin.beta.ishopastro.com`

```bash
export SEO_AGENT_B_JWT='<current-b-jwt>'

curl --location --get \
  'https://mcp-server.devtools.ishopastro.com/seo-agent/get-keyword-ideas' \
  --data-urlencode 'keyword=temporary email' \
  --header "Cookie: b-jwt=${SEO_AGENT_B_JWT}" \
  --header 'Origin: https://hepeng.admin.beta.ishopastro.com'
```

## 使用约定

1. 制定关键词计划前，为每个核心种子词拉想法与量级。
2. 只保存任务所需的关键词结论；不保存 Cookie、developer token、OAuth secret、JSON key。
3. 按搜索意图、主题相关性和内容类型分组后再定页面。
4. 与产品能力无关、或鼓励滥用/绕过平台规则的词降权或丢弃。

## 安全说明

Ads 与 `b-jwt` 凭证均敏感。在聊天、日志、issue 暴露过的 Token 应视为已泄露并轮换。仓库中只保留环境变量占位符与本说明。
