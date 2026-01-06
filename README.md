# AI-Trans-Hub

一个基于 Electron + React 的桌面翻译工具：中英互译、自动识别方向、四种翻译风格（通用/口语化/专业的/友好的）。翻译能力统一通过 Vercel AI SDK 的 AI Gateway 调用，用户在设置中填写 `model` 与 `API Key` 即可使用。

## 功能

- 中英互译：支持自动识别（含手动切换方向）
- 四种风格：通用 / 口语化 / 专业的 / 友好的
- 体验优化：一键复制/粘贴、长文本自动调整字号
- 设置管理：本地保存（JSON），支持导入/导出（默认不包含 API Key）
- 关于页：显示版本号、检查更新/下载更新/重启安装（基于 `electron-updater`）

## 技术栈

- Electron + electron-vite
- React + TypeScript
- Tailwind CSS + shadcn/ui（Radix UI）
- Vercel AI SDK：`ai` + `@ai-sdk/gateway`

## 开始使用

### 前置要求

- Node.js >= 18（推荐 20+）

### 安装依赖

```bash
npm install
```

### 开发调试

```bash
npm run dev
```

### 构建

```bash
npm run build

# Windows 安装包
npm run build:win
```

## 配置说明（AI Gateway）

打开设置页填写：

- `baseURL`（可选）：自定义 AI Gateway 基础地址（仅在你有自建/代理网关时使用）
- `model`：AI Gateway model id（例如 `openai/gpt-5`）
- `API Key`：AI Gateway API Key

提示：不同账号/网关可用的 model 可能不同；如果出现“模型不可用或不存在（404）”，请更换为 AI Gateway 支持的 model id。

## 配置存储与导入/导出

- 配置文件存储在 Electron 的 `userData/ai-trans-hub-settings.json`
- API Key 在系统支持时会使用 `electron.safeStorage` 加密保存（否则以明文保存到本地 JSON）
- 导出默认不包含 API Key；导入时也可选择是否应用文件中的 API Key

导出的 JSON 示例（不含密钥）：

```json
{ "baseURL": "https://api.example.com/v1", "model": "openai/gpt-5" }
```

## 提示词（Prompt）

- 系统提示词：`src/prompts/translation/system.md`
- 首页“风格”会传入提示词变量 `{{tone}}`，用于驱动四种风格差异化输出

## 自动更新

关于页提供“检查更新 / 重启安装”。要让自动更新可用，需要在 `electron-builder.yml` / `dev-app-update.yml` 配置正确的 `publish` 地址。

## 开发命令

```bash
npm run typecheck
npm run lint
npm run format
```
