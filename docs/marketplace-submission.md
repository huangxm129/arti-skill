# 三方市场上架手册（Codex / WorkBuddy / 豆包）

> 目标：三家平台的官方应用/技能市场上架，用户从市场一键安装后在对话里 `@` 出即用。
> 本仓库是**唯一技能源**：`plugins/arti-stock-research/skills/arti-stock-research/`（SKILL.md + scripts/arti）。
> 各市场的展示物料（名称/描述/图标/隐私政策）统一定义在 `plugins/arti-stock-research/.codex-plugin/plugin.json` 与本手册，改一处同步所有市场。

## 一、Codex（OpenAI）

**通道现状**：官方 Universal Plugin Directory（与 ChatGPT 共享）的自助发布**尚未开放**（官方标注 coming soon）。在此之前，Codex 支持两种即刻可用的分发方式：

1. **仓库级插件市场（已就绪）**——本仓库已按官方规范打包：

   ```
   .agents/plugins/marketplace.json            # 市场清单（name: arti-skills）
   plugins/arti-stock-research/
     .codex-plugin/plugin.json                 # 插件清单（含 interface 展示块）
     skills/arti-stock-research/               # 技能本体（单一事实源）
     assets/{composer-icon,logo,logo-dark}.png # 展示资产
   ```

   用户安装（在 Codex 会话内两条命令）：

   ```
   /plugin marketplace add huangxm129/arti-skill
   /plugin install arti-stock-research@arti-skills
   ```

2. **官方目录（开放后提交）**：plugin.json 的 `interface` 块已按官方校验要求备齐（displayName / 描述 / 分类 Finance / capabilities / websiteURL / privacyPolicyURL / termsOfServiceURL / defaultPrompt ≤3 条且 ≤128 字 / brandColor / 图标真实存在）。目录开放提交后：bump 严格 semver 版本 → 按官方入口提交本仓库。

**规范要点（已遵守）**：version 严格 semver；icons/screenshots 必须是插件内真实文件；privacyPolicyURL/termsOfServiceURL 必须绝对 https；清单不得包含 `hooks` 字段；提交前跑官方 `validate_plugin.py`。

**发布流**：改 `plugin.json` 的 `version` → push `main` → 用户侧 `/plugin marketplace update` 拉新。

## 二、WorkBuddy（腾讯 SkillHub）

**通道**：[SkillHub](https://skillhub.cn)（腾讯技能社区，WorkBuddy/CodeBuddy 共用技能生态）开发者入驻 → 提交 → 审核 → 上架。

**流程**：

1. **开发者入驻**：在 SkillHub 开发者中心申请入驻（需账号实名/主体信息——运营侧补充）；
2. **提交技能**：按 SKILL.md 规范上传（本仓库技能即标准 Agent Skills 格式，天然兼容）；提交前跑官方 `skill-vetter` 安全自检（核心检查 `allowed-tools` 权限声明）；
3. **三线审核**：内容合规过滤 + 科恩实验室漏洞扫描 + 云鼎实验室 AI 模型安全评估，全部通过自动上架；
4. **用户侧**：技能市场搜索 → 复制安装命令 → 粘贴进 WorkBuddy 对话完成安装 → 对话里 `@` 技能即用。

**提交物料（均已备好，直接取用）**：

| 物料 | 来源 |
|---|---|
| 技能名 / 简介 / 长描述 | `plugin.json` 的 `interface.displayName / shortDescription / longDescription` |
| 分类 / 关键词 | `Finance` / `plugin.json` keywords |
| 图标 | `plugins/arti-stock-research/assets/`（composer-icon 128 / logo 512 / logo-dark 512） |
| 默认演示 prompt | `interface.defaultPrompt`（3 条） |
| 隐私政策 | [PRIVACY.md](../PRIVACY.md) |
| 支持链接 | 本仓库 Issue + artifin.ai |

**待运营补充**：开发者账号与主体资质、客服/支持邮箱、真机截图 2-3 张、审核联系人。

**审核注意**：`skill-vetter` 关注 `allowed-tools` 权限面。本 skill 未声明 `allowed-tools`（依赖宿主默认能力运行 curl），如 SkillHub 要求显式声明，在 SKILL.md frontmatter 按其规范补 `allowed-tools: Bash(arti-stock-research/scripts/arti:*)` 一类条目后再提审。

## 三、豆包（字节跳动）

**通道现状**：豆包电脑版侧边栏「技能·连接器·伙伴」已上架 200+ 技能，但**没有公开的自助提交表单**；技能格式同样是 Markdown + YAML 元数据（Agent Skills 标准），本仓库技能包可直接复用。可选路径：

| 路径 | 说明 | 建议 |
|---|---|---|
| A. 火山引擎商务合作 | 通过火山引擎（400-034-7888 / 方舟控制台）提交合作申请，走企业资质 + 官方审核上架「技能·连接器」市场 | **推荐主路径**：市场位置最好、用户一键安装 |
| B. Find Skill 技能广场 | 字节上线的第三方开源技能展示广场，提交开源技能包 | 免费补充曝光 |
| C. 客户端自定义导入（过渡） | 引导用户用豆包「自定义新建技能」粘贴本仓库 SKILL.md | 上架前的过渡方案，写入运营话术 |

**申请材料清单（运营准备）**：企业营业执照与主体资质、技能介绍（直接用 `plugin.json` interface 文案）、技能包（仓库打包 zip）、演示视频或截图、隐私政策（[PRIVACY.md](../PRIVACY.md)）、客服联系方式、预计上架分类（金融/投资研究）。

## 四、版本与文案一致性（维护规则）

1. 任何市场文案改动**只改** `plugin.json` 的 `interface` 块 + 本手册，禁止在各渠道各写一份；
2. 版本号遵循严格 semver，与 `plugin.json version` 同步；每过一个市场的审核就 bump 一次；
3. 图标/截图改动必须同步三个市场（Codex 目录、SkillHub、豆包申请材料）。

## 五、进度看板

| 平台 | 打包 | 提交 | 上架 |
|---|---|---|---|
| Codex（仓库级市场） | ✅ | ✅（用户即可安装） | ✅ |
| Codex（官方目录） | ✅ | ⏳ 等官方开放 | — |
| WorkBuddy SkillHub | ✅ | ⏳ 运营入驻 | ⏳ 审核 |
| 豆包 技能·连接器 | ✅ | ⏳ 商务接洽 | ⏳ 审核 |
