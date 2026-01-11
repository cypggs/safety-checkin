# 复刻爆款 App「死了么」，我做了这款「平安签到」Web 版

## 独居时代的安全焦虑

最近，一款叫「死了么」的 iOS 应用在 App Store 付费榜冲上榜首，售价 8 元。

它解决的需求很简单：独居人群每天点一下「签到」，如果连续 2 天没签到，系统会自动发邮件给紧急联系人。

这个看似简单的功能，击中了 1.25 亿独居中国人的安全焦虑——「孤独死」不再是遥远的概念，而是每个人都可能面对的现实。

## 从「死了么」到「平安签到」

「死了么」这个名字很有争议，有人觉得太晦气，有人觉得太直接。

我决定做一个更温和的 Web 版本，取名「平安签到」。

**设计原则：**
- 极简主义：一个按钮完成签到
- 无需注册：基于设备指纹识别
- 隐私优先：客户端加密，服务器不留痕迹
- 中英双语：支持中文和英文界面

## 技术实现

整个项目采用现代化的技术栈：

**前端架构：**
- Next.js 14 + TypeScript
- Tailwind CSS 极简风格
- next-intl 实现中英文切换
- FingerprintJS 设备指纹识别

**后端服务：**
- Supabase PostgreSQL 数据库
- Vercel Serverless API
- Resend 邮件发送服务
- Vercel Cron 每日定时检测

**核心功能流程：**

```
用户首次访问 → 填写姓名 + 紧急联系人邮箱
        ↓
每天打开网站 → 点击「签到」按钮
        ↓
系统记录签到时间
        ↓
Cron 每天检测 → 超过 2 天未签到 → 发送邮件提醒
```

## 数据库设计

为了避免与 Supabase 模板自带的表冲突，我使用了前缀命名：

```sql
safety_users        -- 用户信息表
safety_checkins     -- 签到记录表
safety_alerts       -- 预警发送记录表
```

每个表都有完善的外键约束和索引，确保数据完整性和查询性能。

## 国际化实现

使用 next-intl 实现无缝的中英文切换：

```typescript
// messages/zh.json
{
  "checkin": {
    "button": "签到",
    "reminder": "如连续2天未签到，系统将于次日自动发送邮件给您的紧急联系人"
  }
}

// messages/en.json
{
  "checkin": {
    "button": "Check In",
    "reminder": "If you don't check in for 2 consecutive days, we'll email your emergency contact"
  }
}
```

## 隐私与安全

**数据最小化原则：**
- 只收集必要信息（姓名、紧急邮箱）
- 客户端 AES-256 加密后传输
- 服务器只存储加密后的密文
- 不收集位置、设备识别符等敏感信息

**无登录设计：**
- 使用浏览器指纹识别用户
- 无需记住密码
- 数据与设备绑定

## 部署上线

项目已开源托管在 GitHub，并部署到 Vercel：

- **访问地址：** https://safety-checkin.vercel.app
- **GitHub：** https://github.com/cypggs/safety-checkin

**一键部署步骤：**
1. 在 Supabase 创建新项目
2. 执行 `database.sql` 创建数据表
3. Fork 项目到 GitHub
4. 导入 Vercel 并配置环境变量
5. 自动部署完成

## 反思与展望

做这个项目的过程中，我思考了几个问题：

1. **技术与人文关怀的结合**
   技术不只是冷冰冰的代码，可以承载对独居人群的关怀。

2. **极简设计的价值**
   好的产品应该让人「无感」地使用，不需要学习成本。

3. **开源的力量**
   从「死了么」的灵感，到自己的实现，开源让创意可以传承和演进。

**未来可能的改进：**
- SMS 短信提醒支持
- 微信消息推送
- 紧急联系人确认机制
- 多联系人轮询通知

---

**写在最后：**

独居不是孤独，而是一种选择。但选择独居的人，也值得被温柔以待。

希望「平安签到」能给独居的你，多一份安心。

---

*项目源码：https://github.com/cypggs/safety-checkin*
*在线体验：https://safety-checkin.vercel.app*
