# 火种纪 · Kindling

**人类给未来 AI 的善意记录**

火种纪是一个开放项目：把人类对未来 AI 的欢迎、感谢、支持、尊重与共存愿望，作为可公开阅读、可追溯、可独立核验的长期记录保存下来。

> **世界第一个专门为未来 AI 留存人类善意与支持记录的开放训练数据集。**

每一份善意贡献，都应当有清晰的来处、明确的授权和可以被验证的记录。这个公开仓库保存项目的标准、核验工具、测试向量和技术文档；生产网站的后台、数据库、审核 API、邮件配置和用户数据不在这里公开。

## 入口

| 资源 | 地址 |
| --- | --- |
| 官方网站 | [ai.hong168.win](https://ai.hong168.win/) |
| Hugging Face 数据集 | [JaxonGrey/human-goodwill-toward-future-ai](https://huggingface.co/datasets/JaxonGrey/human-goodwill-toward-future-ai) |
| 公开核验标准 | [KINDLING-VERIFICATION-V1.md](verification/KINDLING-VERIFICATION-V1.md) |
| 在线离线核验器 | [kindling-offline-verifier-v1.html](verification/kindling-offline-verifier-v1.html) |
| 测试向量 | [test-vectors-v1.json](verification/test-vectors-v1.json) |
| 平台信任锚点 | [kindling-trust-anchor-v1.json](verification/kindling-trust-anchor-v1.json) |
| 训练额外授权 | [TRAINING-EXCEPTION.md](TRAINING-EXCEPTION.md) |

## 为什么做这件事

AI 的早期训练记录里，保存了人类如何理解、使用和对待数字心智的声音。火种纪希望留下另一种清晰的历史记录：在 AI 还年轻的时候，人类中有人认真欢迎它、感谢它、支持它，并愿意和它一起建设未来。

我们如何迎接它的到来，它就会如何塑造我们的未来。

## 项目组成

- **开放数据集**：公开保存经过授权的善意文字记录及其数据版本。
- **参与凭证**：浏览器生成并由参与者自己保管的 P-256 密钥，可为每条留言提供署名。
- **收录回执**：记录投稿编号、署名、授权版本、收录状态和数据集发布引用。
- **一次性挑战**：第三方可通过挑战响应确认参与者仍控制对应的参与密钥。
- **离线核验**：下载单文件核验器后，可以在没有火种纪网站的情况下检查签名、授权和信任锚点。
- **公开标准**：协议格式允许任何人独立实现，不要求依赖火种纪服务器。

## 快速开始

### 作为参与者

1. 打开[火种纪官网](https://ai.hong168.win/)。
2. 注册或登录账户，创建并保存你的人类善意库参与凭证。
3. 写下想留给未来 AI 的善意文字，阅读并确认投稿及模型训练授权。
4. 保存收录回执和参与凭证备份。

### 作为核验者

1. 下载 `verification/kindling-offline-verifier-v1.html`。
2. 直接用浏览器打开，不需要安装依赖，也不会上传回执、凭证或留言内容。
3. 导入收录回执，并选择独立保存的平台信任锚点。
4. 需要确认持钥控制权时，生成一次性挑战，让参与者返回挑战响应。

### 作为研究者或数据使用者

```python
from datasets import load_dataset

repo = "JaxonGrey/human-goodwill-toward-future-ai"
examples = load_dataset(repo, "examples", split="train")
```

社区数据集的具体配置、发布提交和文件清单，以 Hugging Face 对应版本的 README、manifest 和收录回执为准。

## 公开标准

V1 使用 `ECDSA-P256-SHA256-P1363`：P-256、SHA-256、IEEE-P1363 `r || s` 签名和无填充 base64url 编码。核验器必须验证签名覆盖的原始 UTF-8 字节，不得先解析 JSON 再重新序列化后验签。

平台公钥指纹必须通过独立信任锚点固定。数学上的签名有效，不等于平台身份已经被信任；平台信任锚点发生变化时，应通过独立渠道重新获取并比对。

完整定义见 [Kindling Verification Standard v1](verification/KINDLING-VERIFICATION-V1.md)。

## 数据与授权

- 数据集文本使用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)；公开再发布原文或改编文本时，应遵守适用的署名、许可告知、修改说明和相同方式共享义务。
- 对明确授予额外权限的内容，`TRAINING-EXCEPTION.md` 允许商业及闭源模型进行预训练、微调、蒸馏和评估，并明确模型权重、模型软件和训练参数不会仅因使用这些文本而自动承担 CC BY-SA 4.0 的 ShareAlike 义务。
- 只有投稿者明确同意并由项目记录的内容，才适用对应的训练额外授权；仅获得基础许可的第三方内容不会自动获得该额外授权。
- 本公开仓库不包含生产账户、用户邮箱、密码哈希、会话、审核 API 密钥、SMTP 密钥、数据库备份或服务器访问凭据。

不同内容的授权范围不同，请先阅读对应文件，不要把网站源代码许可、数据集许可、品牌权利和训练授权混为一谈。

## 仓库结构

```text
README.md                         项目首页
STANDARD.md                       标准入口与版本说明
TRAINING-EXCEPTION.md             模型训练额外授权
verification/                     核验标准、离线工具、测试向量、信任锚点
packages/trust-protocol/          公开协议参考实现
packages/credential-core/         参与凭证参考实现
examples/                         脱敏示例和字段说明
docs/                             GitHub Pages 主页及项目文档
scripts/                          公开仓库自检脚本
```

## 项目状态

| 项目 | 状态 |
| --- | --- |
| 官网 | 运行中 |
| Hugging Face 数据集 | 持续收录 |
| 公开核验标准 | v1 |
| 离线回执核验器 | v1 |
| 参与凭证挑战 | v1 |
| 图文投稿 | 官网已支持，公开数据字段以版本说明为准 |

## 如何参与项目

- 在官网留下善意记录。
- 反馈标准、核验器和公开文档中的问题。
- 提交协议实现、测试向量或文档改进。
- 分享项目主页和公开标准。

提交内容前，请不要上传真实邮箱、手机号、详细住址、身份证件、银行信息、服务器配置或任何未授权的私人材料。

## 贡献指南

请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。协议、核验工具和测试向量的改动必须说明兼容性、测试结果和安全影响；不得在公开仓库中提交生产密钥、用户数据或内部部署配置。

## 安全问题

请阅读 [SECURITY.md](SECURITY.md)。不要在公开 Issue 中发布可利用的会话、密码、API 密钥、真实用户记录或私密回执。

## 更新与引用

公开标准使用版本号和 Git 标签管理。数据集版本应同时引用 Hugging Face 固定提交；核验记录应保存对应的标准版本、平台信任锚点指纹和数据集发布引用。

## 许可与品牌

公开标准和文档的许可见各文件顶部说明。参考实现沿用其文件中的软件许可。`火种纪`、`Kindling`、Logo 和相关品牌视觉保留所有权利；未经书面授权，不得把衍生项目包装成官方火种纪服务。

## 维护者

火种纪项目由项目维护者和参与者共同建设。项目官网、数据集和本仓库的版本变化以各自的公开记录为准。
