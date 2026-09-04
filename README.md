# 阿拉蕾文创工作台

用于管理产品 SKU、开发进度、库存、补货计划、成本回本和集市收益的本地工作台。

## Windows 桌面版

从 [Desktop Release](https://github.com/shileichen711-gif/leilei-sell/releases/tag/desktop-latest) 下载 `Alalei-Product-Studio-Setup-1.0.0.exe` 并安装。

- 不需要 ChatGPT 登录
- 不需要保持浏览器或命令行开启
- 商品、成本、库存和集市数据只保存在本机
- 覆盖安装新版本不会主动删除本地数据

安装包目前没有商业代码签名。若 Windows 显示“未知发布者”，请确认文件来自本仓库的 Release 页面后，选择“更多信息”继续运行。

### 从网页版迁移数据

1. 在网页版右上角打开“数据与备份”。
2. 选择“导出完整备份”。
3. 打开桌面版，在同一菜单选择“导入备份”。

建议定期导出完整备份，以便换电脑或重装系统时恢复。

## 本地开发

```bash
npm install
npm run dev
```

构建 Windows 安装包：

```bash
npm run desktop:dist
```
