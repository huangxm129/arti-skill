# ARTI Skills

**让你手边的 AI Agent 具备专业级单股研究能力。**

[ARTI（artifin.ai）](https://www.artifin.ai) 的 AI 投研能力（多分析师 + 投资大师编排）打包成开放 Agent Skill——一键安装到 Codex CLI、Claude Code、ZCode 等工具，浏览器里扫码注册即用，无需粘贴任何密钥。

> 状态：**α（开发中）**——skill 资产先行，服务端能力按 [RFC-0155](https://github.com/iloveopt/arti/blob/dev/docs/rfcs/0155-arti-skills-public-skill.md) 契约渐次上线，端到端联调完成后发布 1.0。

## 能做什么

| 能力 | 说明 | 费用 |
|---|---|---|
| 🔍 单股快速诊断 | 行情快照 + 技术面（MA/RSI/MACD/布林）+ 规则信号 + 买卖判断 | 5 ARTI Credits/次 |
| 🧠 跨会话股票记忆 | 记住/召回你对某只股票的观点、仓位陈述、关注条件 | 免费 |
| 💰 账户状态 | Credits 余额、会员档位、可领取任务 | 免费 |
| 🤔 其他一切推理 | 新闻解读、指标计算、观点综合 | 宿主 Agent 自有算力 |

**计费透明**：新用户注册即赠 100 Credits（约 20 次快速诊断）；余额降到 20 以下自动一次性赠送 100 Credits；余额为 0 或不足时，skill 会直接给你「做任务赚 Credits」「购买会员」「充值 Credits」三个跳转链接。深度研报请在 [artifin.ai/app/agent](https://www.artifin.ai/app/agent) 使用。

## 30 秒上手

**Codex CLI（推荐，插件市场方式）：**

```bash
# 在 Codex 会话里执行：
/plugin marketplace add huangxm129/arti-skill
/plugin install arti-stock-research@arti-skills
```

安装后在对话里直接说「帮我分析一下 AAPL」即可触发；首次使用会引导你在浏览器完成 ARTI 注册/登录（新用户赠 100 Credits）并确认授权。

**其他客户端（Claude Code / ZCode / 通用脚本安装）：**

```bash
curl -fsSL https://raw.githubusercontent.com/huangxm129/arti-skill/main/install.sh | bash
```

安装器也可以显式指定客户端或卸载：

```bash
bash install.sh --client codex          # 只装 Codex（~/.codex/skills/）
bash install.sh --client claude,zcode   # 指定多个
bash install.sh --uninstall             # 卸载
```

## 客户端支持

| 客户端 | 支持状态 | 安装方式 |
|---|---|---|
| Codex CLI | ✅ 已上架（仓库级插件市场） | `/plugin marketplace add huangxm129/arti-skill` |
| WorkBuddy | 🚧 SkillHub 审核中 | 上架后技能市场搜索安装，对话里 @ 出即用 |
| 豆包 | 🚧 商务接洽中 | 技能·连接器市场上架后一键安装 |
| Claude Code / ZCode | ✅ 脚本安装 | `install.sh`（skills 目录约定） |

三家市场的上架进度与提交材料见 [docs/marketplace-submission.md](./marketplace-submission.md)。

## 费用与身份：三件事分清楚

1. **宿主 Agent token**——你在 Codex / Claude 等工具里的模型用量，skill 的推理部分消耗它，ARTI 不参与计费；
2. **`sk-arti-` API key**——你的 ARTI 身份凭证，授权后自动签发，存在 `~/.arti/credentials.json`（权限 600），可随时在 Web 端或 `arti logout` 吊销；
3. **ARTI Credits**——ARTI 的计费货币，只有快速诊断消耗（5/次），记忆与查询全部免费。

skill 不会读取宿主 token 用量，也不会把 Credits 混入其中；每次付费调用前都会先征求你的确认。

## 隐私与安全

- 仓库**不含任何密钥**；授权走设备码流程，API key 明文只在换取响应中出现一次；
- 记忆内容仅存于你的 ARTI 账户（`user_memory_facts`），可在 Web 端随时查看与遗忘；
- 服务端不记录对话正文；埋点仅含渠道与结果元数据。

## 本地开发

```bash
git clone https://github.com/huangxm129/arti-skill.git
bash install.sh --dir <你的 skills 目录>   # 从本地改动验证安装
# 联调期可将脚本指向本地服务端：
ARTI_API_BASE=http://127.0.0.1:54321 arti status
```

## License

[MIT](../LICENSE)
