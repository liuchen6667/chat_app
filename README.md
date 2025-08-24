# Chat App 项目说明

## 项目结构
```
chat_app/
├── frontend/          # 前端代码
└── backend/           # 后端代码
```

## 环境配置

### 安装依赖包
在项目根目录下执行以下命令安装所需依赖：

```bash
pip install -r requirements.txt
```

## 项目启动

### 1. 启动前端服务
进入 `frontend` 目录，启动 HTTP 服务器：

```bash
cd chat_app/frontend
python -m http.server 8000
```

**说明：**
- 默认端口：8000
- 访问地址：http://localhost:8000
- 前端服务将提供静态文件和用户界面

### 2. 启动后端服务
进入 `backend` 目录，运行后端应用：

```bash
cd chat_app/backend
python app.py
```

**说明：**
- 后端服务将处理 API 请求和业务逻辑
- 默认可能运行在 http://localhost:5000（具体端口取决于 app.py 配置）

## 访问应用

启动两个服务后，打开浏览器访问：
- **前端界面**：http://localhost:8000
- **后端 API**：http://localhost:5000 (或根据实际配置)

## 注意事项

1. 确保两个服务同时运行才能正常使用应用
2. 如需修改端口，请相应调整启动命令
3. 首次运行前请确保已正确安装所有依赖包
4. 建议使用虚拟环境来避免依赖冲突

## 常见问题

**Q: 端口被占用怎么办？**
A: 可以修改启动命令中的端口号，例如：
```bash
python -m http.server 8080
```
