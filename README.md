# GetOpenInbox

GetOpenInbox 是面向海外用户的免费临时邮箱服务。用户无需注册账号，即可立即获得一次性邮箱地址，用于接收注册邮件、登录验证码及其他短期邮件，从而避免暴露真实邮箱。

## 项目文档

- [产品需求与实施计划](docs/product-requirements.md)
- [SEO Keyword Planner API](docs/seo-keyword-planner.md)
- [SEO/GEO 内容生成目的与流程](docs/seo-geo-content-workflow.md)

## 当前阶段

项目处于 MVP 规划阶段。主品牌域名为 `getopeninbox.com`，该域名用于官网和产品入口；公开临时邮箱应使用独立的收件域名池，避免影响主域名信誉。

MVP 计划部署在 Cloudflare 平台：Workers Static Assets 承载前端，Workers 提供 API，Email Routing 与 Email Workers 接收邮件，D1 保存索引数据，R2 保存邮件内容，Queues 和 Cron Triggers 负责异步处理与过期清理。

## 开发与部署

要求：Node.js 22+、Cloudflare 账户，以及已经填写完成的本地 `.env`。

```bash
npm install
npm run check
npm run cf:verify
```

首次部署按以下顺序执行：

```bash
# 创建 R2 Bucket、解析队列和死信队列
node scripts/cloudflare.mjs provision --confirm

# 对远程 D1 执行迁移
node scripts/cloudflare.mjs migrate --confirm

# 按 Consumer -> Email -> API -> Web 顺序部署
node scripts/cloudflare.mjs deploy --confirm
```

自动部署脚本默认受 `DEPLOY_CONFIRM=false` 保护。生产部署完成后，还需要在 `myopeninbox365.cloud` 的 Email Routing 中，将 Catch-all 指向 `getopeninbox-email` Worker。

当前 `.env` 默认使用 `USE_R2=false` 的 D1-only 验证模式：Email Worker 直接解析邮件，正文截断后写入 D1，不要求启用 R2，也不会部署 Queue Consumer。完成验证并启用 R2 后，将其改为 `true`，再次执行资源创建、迁移和部署即可切换到完整架构。

R2 模式的保护参数包括：单封邮件最多 2 MiB、每个邮箱最多 20 封、全站每小时最多接收 300 封。资源创建脚本还会添加 1 天自动过期的 R2 Lifecycle Rule，作为定时清理任务之外的兜底。

### 数据保留与管理后台

- `DELETE_EXPIRED_D1_DATA=false`：Cron 不删除过期 inbox 和 message 元数据；邮件正文仍由 R2 Lifecycle Rule 自动删除。若改回 `true`，Cron 会同时清理过期 D1 数据和对应 R2 对象。
- 后台地址建议使用 `https://admin.getopeninbox.com`。后台默认关闭，并且采用 fail-closed 设计：必须同时配置 `ADMIN_ENABLED=true`、`ADMIN_ACCESS_TEAM_DOMAIN`、`ADMIN_ACCESS_AUD` 和 `ADMIN_ALLOWED_EMAILS` 才能访问。
- 在 Cloudflare Zero Trust 中创建保护 `admin.getopeninbox.com` 的 Self-hosted Access Application。Allow Policy 只包含明确的管理员邮箱，并启用 Independent MFA（建议 TOTP、安全密钥或生物识别）。将 Application Audience (AUD) Tag 填入 `ADMIN_ACCESS_AUD`，Team domain 填入 `ADMIN_ACCESS_TEAM_DOMAIN`。
- Worker 会再次验证 `Cf-Access-Jwt-Assertion` 的签名、issuer、AUD 和管理员邮箱白名单。不要为后台创建 Bypass Policy。

后台目前为只读功能，可分页查看全部 inbox、邮件总数、最新邮件，并查看单封邮件元数据及仍存在于 R2/D1 的正文。R2 对象被生命周期规则删除后，后台仍保留邮件元数据，但正文显示不可用。

### Worker 组成

- `getopeninbox-web`：官网静态资源与安全响应头。
- `getopeninbox-api`：匿名邮箱、邮件读取和定时清理 API。
- `getopeninbox-email`：Email Routing 收件、有效地址校验、R2 写入和入队。
- `getopeninbox-email-consumer`：MIME 解析、验证码提取和 D1 元数据更新。
