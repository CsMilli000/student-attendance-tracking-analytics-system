# 使用指南

## 1. 项目简介

系统包含学生签到、老师端签到管理和基础出勤分析。

当前登录使用演示账号。登录后的角色和用户快照保存在浏览器 `sessionStorage`。

## 2. 在线访问

登录地址：`https://student-attendance-tracking-analyti.vercel.app/login`

## 3. 快速启动

```bash
npm install
npm run dev
```

启动后访问 `http://localhost:3000`。

## 4. 登录说明

学生示例账号：

- `s001 / student123`

老师示例账号：

- `lecturer01 / teach123`

登录后会根据身份跳转到对应页面。

## 5. 学生端功能

1. 输入签到码完成签到。
2. 查看个人出勤率、趋势图和出勤占比。
3. 出勤率低于提醒阈值时显示提示。

## 6. 老师端功能

1. 创建签到并生成签到码。
2. 按签到码加载签到记录。
3. 关闭单个进行中的签到。
4. 重置当前签到记录，并保持签到开启。
5. 清空全部签到和出勤数据。
6. 运行出勤分析并查看图表。
7. 向低出勤学生发送邮件或复制提醒内容。

## 7. 阈值规则

当前项目要求按 `40%` 作为低出勤预警的最低阈值。

老师端默认值也是 `40%`，输入范围限制为 `40-100`。

## 8. 数据说明

演示账号数据保存在代码中，用于学术测试和展示。

签到和出勤数据存储在 Firebase Firestore。Firestore 访问依赖匿名登录，规则文件是 `firestore.rules`。

客户端使用的 Firebase 配置属于公开 Web App 配置。本地运行时建议写入 `.env.local`，不要直接改源码。

## 9. 主要目录

- `app/`：页面与路由
- `app/components/`：公共 UI 组件
- `src/lib/`：Firebase 配置、演示账号和公共常量
- `docs/`：项目文档

## 10. Firestore 安全规则

规则文件：`firestore.rules`

Firebase 配置：`firebase.json`

发布命令：

```bash
firebase login
firebase use <your-project-id>
firebase deploy --only firestore:rules
```
