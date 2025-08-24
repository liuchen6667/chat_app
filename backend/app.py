from flask import Flask, request, jsonify, Response, stream_with_context
from flask_cors import CORS
import requests
import json
import time

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# API配置
API_SECRET_KEY = "sk-zk229ba1908ca11ee556a14585c11b1725466cda8a4362dd"  # 请替换为你的实际API密钥
BASE_URL = "https://api.zhizengzeng.com/v1/"
API_ENDPOINT = f"{BASE_URL}chat/completions"

@app.route('/api/chat', methods=['POST'])
def chat():
    """聊天接口 - 支持流式输出和多轮对话"""
    data = request.json
    
    # 支持新的messages格式和旧的message格式
    if 'messages' in data:
        # 新的多轮对话格式
        messages = data.get('messages', [])
        if not messages:
            return jsonify({"error": "消息不能为空"}), 400
    else:
        # 兼容旧的单消息格式
        user_message = data.get('message', '')
        if not user_message:
            return jsonify({"error": "消息不能为空"}), 400
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": user_message}
        ]
    
    if API_SECRET_KEY == "你的API密钥":
        return jsonify({"error": "请先配置API密钥"}), 500
    
    # 检查是否需要流式输出
    stream = data.get('stream', False)
    
    try:
        # 准备请求头和数据
        headers = {
            "Authorization": f"Bearer {API_SECRET_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "gpt-3.5-turbo",
            "messages": messages,  # 使用完整的对话历史
            "stream": stream
        }
        
        if stream:
            # 流式输出处理
            return Response(
                stream_with_context(generate_response_stream(payload, headers)),
                content_type='text/event-stream'
            )
        else:
            # 普通输出处理
            response = requests.post(API_ENDPOINT, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                response_text = result['choices'][0]['message']['content']
                
                return jsonify({
                    "response": response_text,
                    "status": "success"
                })
            else:
                return jsonify({"error": f"API调用失败: {response.status_code}"}), 500
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def generate_response_stream(payload, headers):
    """生成流式响应"""
    try:
        with requests.post(API_ENDPOINT, headers=headers, json=payload, stream=True) as response:
            if response.status_code == 200:
                for line in response.iter_lines():
                    if line:
                        decoded_line = line.decode('utf-8')
                        if decoded_line.startswith('data: '):
                            yield f"{decoded_line}\n\n"
                        elif decoded_line == 'data: [DONE]':
                            yield "data: [DONE]\n\n"
            else:
                error_data = {
                    "error": f"API调用失败: {response.status_code}"
                }
                yield f"data: {json.dumps(error_data)}\n\n"
    except Exception as e:
        error_data = {
            "error": str(e)
        }
        yield f"data: {json.dumps(error_data)}\n\n"

@app.route('/api/status', methods=['GET'])
def status():
    """检查服务状态"""
    return jsonify({
        "status": "running",
        "api_configured": API_SECRET_KEY != "你的API密钥"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)