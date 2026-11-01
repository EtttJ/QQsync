# QQ 群聊实时网页桥接系统

基于 NapCatQQ + OneBot v11 的双向群聊网页桥接。后端使用 Node.js 20、Fastify、`ws`、SQLite；前端使用 Vue 3、Vite、TypeScript、Pinia、Element Plus。

## 当前能力

- 自动接收所有群聊和私聊消息，网页左侧提供好友/群聊会话列表，网页 WebSocket 接近实时更新。
- 文本、@、图片、QQ 表情、回复和基础消息段渲染；昵称优先群名片，头像使用 QQ qlogo。
- 引用消息可点击跳转到本地保存的原消息；每个群聊或私聊最多保留 200 条消息，超出后自动清理最旧记录。
- `forward` 自动调用 `get_forward_msg`，递归解析嵌套节点、图片和表情，并以可折叠卡片展示。
- 聊天栏可自定义本地消息保留数量，未设置时默认保留 100 条，范围为 1-1000 条。
- share/json 消息中的 bilibili/b23.tv URL 可点击。
- 网页文本发送、引用回复；图片上传接口已提供，可保存为服务器表情包。
- WEB_TOKEN 保护 API、上传接口和网页 WebSocket；NapCat token 只存在后端。

## Windows 本地测试

1. 安装 Node.js 20+、Git、NapCatQQ 最新稳定版，启动 NapCat 并扫码登录测试 QQ。
2. 在 NapCat 网络配置启用正向 WebSocket（如 `ws://127.0.0.1:3001`）和 HTTP API（如 `http://127.0.0.1:3000`），设置同一个 access token。
3. 复制配置并编辑：

```powershell
Copy-Item .env.example .env
# 编辑 .env，至少填写 WEB_TOKEN、NAPCAT_TOKEN
```

4. 分别启动：

```powershell
cd backend
npm install
npm run dev

# 新开 PowerShell 窗口，在项目根目录执行
cd frontend
npm install
npm run dev
```

5. 打开 `http://localhost:5173`，输入 `WEB_TOKEN` 和群号。后端启动日志应显示监听地址，并在 NapCat 连接后显示 `NapCat WS connected`。

## Ubuntu 部署

### 1. 克隆项目并处理 `/opt` 权限

`/opt` 通常属于 root。普通用户直接在 `/opt/qq-web-bridge` 中执行 `git clone` 可能出现：

```text
fatal: could not create work tree dir 'QQsync': Permission denied
```

推荐使用下面的方式，让当前用户拥有部署目录：

```bash
sudo mkdir -p /opt/qq-web-bridge
sudo chown -R "$USER":"$USER" /opt/qq-web-bridge
cd /opt/qq-web-bridge
git clone https://github.com/EtttJ/QQsync.git
cd /opt/qq-web-bridge/QQsync
```

如果希望仓库直接位于 `/opt/qq-web-bridge`，避免多一层 `QQsync`：

```bash
sudo mkdir -p /opt/qq-web-bridge
sudo chown -R "$USER":"$USER" /opt/qq-web-bridge
git clone https://github.com/EtttJ/QQsync.git /opt/qq-web-bridge
cd /opt/qq-web-bridge
```

不要同时使用两种方式。若已经执行过：

```bash
sudo git clone https://github.com/EtttJ/QQsync.git
```

那么仓库通常位于：

```text
/opt/qq-web-bridge/QQsync
```

后续必须先进入该目录，否则会出现：

```text
cp: cannot stat '.env.example': No such file or directory
```

修复 root 所有权并进入正确目录：

```bash
sudo chown -R "$USER":"$USER" /opt/qq-web-bridge/QQsync
cd /opt/qq-web-bridge/QQsync
```

### 2. 配置环境变量

在仓库根目录执行：

```bash
cd /opt/qq-web-bridge/QQsync
cp .env.example .env
nano .env
```

如果使用“NapCat 在本地 Windows、服务器运行网页”的方案，配置示例：

```env
PORT=8787
HOST=127.0.0.1
PUBLIC_URL=https://example.com
NAPCAT_WS=安全隧道提供的WS地址
NAPCAT_HTTP=安全隧道提供的HTTP地址
NAPCAT_TOKEN=NapCat的access_token
WEB_TOKEN=一个长度至少20位的网页密码
HISTORY_LIMIT=100
UPLOAD_DIR=./data/uploads
DB_FILE=./data/qq-bridge.db
```

当前版本不再需要 `LISTEN_GROUPS`，会自动监听所有群聊和私聊。

### 3. 安装并构建

```bash
cd /opt/qq-web-bridge/QQsync/backend
npm install
npm run build

cd /opt/qq-web-bridge/QQsync/frontend
npm install
npm run build
```

### 4. 直接启动测试

```bash
cd /opt/qq-web-bridge/QQsync/backend
npm start
```

看到 `QQ Web Bridge listening` 后，再用另一个终端测试：

```bash
curl http://127.0.0.1:8787/health
```

确认无误后按 `Ctrl+C` 停止，再配置 systemd 和 Nginx。

### A. NapCat 在本地 Windows，服务器只跑前后端

不要直接把 NapCat 端口暴露到公网。使用 frp、Cloudflare Tunnel 或 VPN 将本地 `3000/3001` 只通过加密隧道提供给服务器，然后把 `.env` 中 `NAPCAT_WS`、`NAPCAT_HTTP` 指向隧道端点。隧道两端限制来源 IP，并继续启用 NapCat access token。另一种更简单的方案是后端也在本地运行，服务器仅通过 Nginx/Cloudflare 做 HTTPS 反代，但本地必须可被安全访问。

### B. NapCat 与桥接服务全部在 Ubuntu

在确认账号风险、图形环境和 NapCat 官方支持方式后，将 NapCat 放入同一 Docker 网络，`NAPCAT_WS` 使用服务名和容器端口，例如 `ws://napcat:3001`。当前仓库的 Compose 只包含前后端，不会自动创建 NapCat 容器；NapCat 服务需要自行加入同一 Docker 网络。随后：

```bash
cd /opt/qq-web-bridge/QQsync
cp .env.example .env
# 编辑 .env：WEB_TOKEN、NAPCAT_WS、NAPCAT_HTTP、NAPCAT_TOKEN
docker compose up -d --build
docker compose logs -f backend
```

生产环境应在 Nginx/Caddy 中反代前端，并为 `/api/`、`/uploads/` 和 `/ws` 开启 HTTPS 与 WebSocket Upgrade。域名证书可用 certbot：

```nginx
location / { proxy_pass http://127.0.0.1:5173; }
location /api/ { proxy_pass http://127.0.0.1:8787; }
location /ws { proxy_pass http://127.0.0.1:8787; proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade"; }
```

## 常见问题

- **NapCat 连不上**：确认正向 WS 是 NapCat 作为服务端、后端主动连接；检查端口、access token、Windows 防火墙和 `.env` URL。后端会每 3 秒自动重连。
- **HTTP API 失败**：确认 `NAPCAT_HTTP` 不带多余路径，token 与 NapCat 完全一致；后端日志会打印 API 错误。
- **合并转发空白**：确认 NapCat 账号有权读取转发内容，且 OneBot 实现支持 `get_forward_msg`；后端仍会保留原始 forward 段并记录展开错误。
- **头像不显示**：qlogo 可能被网络或浏览器拦截；不影响消息接收，可改为由后端调用 `get_group_member_info` 并缓存头像。
- **前端无法连接 WS**：开发模式确认后端 8787 正在运行；生产反代必须透传 Upgrade/Connection 头。
- **SQLite 权限错误**：确保 `backend/data` 可写；Docker 部署已挂载该目录以持久化数据库和图片。

## 接口

- `GET /api/conversations`
- `GET /api/messages?conversation_id=&before=&limit=`
- `POST /api/send`：`{ chat_type: "group"|"private", target_id, message, reply_to? }`
- `GET /api/stickers`
- `POST /api/stickers`：multipart 图片文件
- `GET /health`
- 前端 WebSocket：`/ws?token=...`

所有业务接口支持 `Authorization: Bearer WEB_TOKEN`；示例前端为便于本地登录使用 query/body token，NapCat 凭据不会下发到浏览器。
