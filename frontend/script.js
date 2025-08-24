class ChatApp {
    constructor() {
        this.apiUrl = 'http://localhost:5000/api';
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.clearButton = document.getElementById('clear-history');
        this.conversationCount = document.getElementById('conversation-count'); // 添加对话轮数引用
        
        // 调试信息
        console.log('DOM元素检查:', {
            chatMessages: this.chatMessages,
            messageInput: this.messageInput,
            sendButton: this.sendButton,
            clearButton: this.clearButton,
            conversationCount: this.conversationCount
        });
        
        // 添加对话历史管理
        this.conversationHistory = [
            {
                role: "system",
                content: "You are a helpful assistant."
            }
        ];
        
        // 配置marked.js
        marked.setOptions({
            breaks: true,
            gfm: true,
            highlight: function(code, lang) {
                return code;
            }
        });
        
        this.init();
    }
    
    init() {
        // 绑定事件
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // 绑定清除历史事件
        this.clearButton.addEventListener('click', () => this.clearHistory());
        
        // 绑定测试按钮事件
        const testButton = document.getElementById('test-count');
        if (testButton) {
            testButton.addEventListener('click', () => this.testConversationCount());
        }
        
        // 初始化对话轮数显示
        this.updateConversationCount();
        
        // 测试对话轮数功能
        this.testConversationCount();
        
        // 检查服务状态
        this.checkStatus();
    }
    
    // 测试对话轮数功能
    testConversationCount() {
        console.log('=== 开始测试对话轮数功能 ===');
        console.log('当前对话历史:', this.conversationHistory);
        console.log('对话轮数元素引用:', this.conversationCount);
        
        // 检查HTML元素是否存在
        const countElement = document.getElementById('conversation-count');
        console.log('通过getElementById找到的元素:', countElement);
        console.log('元素内容:', countElement ? countElement.textContent : '元素不存在');
        
        // 检查当前显示状态
        if (countElement) {
            console.log('元素样式:', window.getComputedStyle(countElement));
            console.log('元素可见性:', countElement.offsetParent !== null ? '可见' : '不可见');
        }
        
        // 模拟添加一条用户消息来测试
        console.log('模拟添加测试消息...');
        this.conversationHistory.push({
            role: "user",
            content: "测试消息"
        });
        
        console.log('添加消息后的对话历史:', this.conversationHistory);
        
        // 尝试两种更新方法
        console.log('调用updateConversationCount...');
        this.updateConversationCount();
        
        console.log('调用forceUpdateConversationCount...');
        this.forceUpdateConversationCount();
        
        // 检查更新后的状态
        setTimeout(() => {
            console.log('更新后的元素内容:', countElement ? countElement.textContent : '元素不存在');
            
            // 移除测试消息
            this.conversationHistory.pop();
            console.log('移除测试消息后的对话历史:', this.conversationHistory);
            
            this.updateConversationCount();
            this.forceUpdateConversationCount();
            
            console.log('最终元素内容:', countElement ? countElement.textContent : '元素不存在');
            console.log('=== 测试完成 ===');
        }, 500);
    }
    
    async checkStatus() {
        try {
            const response = await fetch(`${this.apiUrl}/status`);
            const data = await response.json();
            
            if (data.status === 'running') {
                console.log('服务连接成功');
            } else {
                this.addSystemMessage('服务正在启动中...');
            }
        } catch (error) {
            this.addSystemMessage('无法连接到服务，请确保后端已启动');
        }
    }
    
    // 更新对话轮数显示
    updateConversationCount() {
        const userMessages = this.conversationHistory.filter(msg => msg.role === 'user').length;
        console.log('更新对话轮数:', userMessages, '对话历史:', this.conversationHistory);
        
        if (this.conversationCount) {
            this.conversationCount.textContent = `对话轮数: ${userMessages}`;
            console.log('对话轮数已更新为:', userMessages);
        } else {
            console.error('对话轮数元素未找到');
        }
    }
    
    // 强制更新对话轮数显示
    forceUpdateConversationCount() {
        console.log('强制更新对话轮数...');
        const userMessages = this.conversationHistory.filter(msg => msg.role === 'user').length;
        
        // 直接查找元素
        const countElement = document.getElementById('conversation-count');
        if (countElement) {
            countElement.textContent = `对话轮数: ${userMessages}`;
            console.log('强制更新成功，对话轮数:', userMessages);
        } else {
            console.error('强制更新失败：找不到conversation-count元素');
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // 添加用户消息到对话历史
        this.conversationHistory.push({
            role: "user",
            content: message
        });
        
        // 更新对话轮数显示
        this.updateConversationCount();
        
        // 添加用户消息到界面
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        
        // 显示加载状态
        const loadingElement = this.addLoadingMessage();
        
        try {
            // 使用流式输出，发送完整的对话历史
            const response = await fetch(`${this.apiUrl}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    messages: this.conversationHistory, // 发送完整对话历史
                    stream: true
                })
            });
            
            // 移除加载状态
            loadingElement.remove();
            
            if (response.ok) {
                // 创建机器人回复消息框
                const botMessageDiv = document.createElement('div');
                botMessageDiv.className = 'message bot';
                botMessageDiv.innerHTML = '<div class="message-content"></div>';
                this.chatMessages.appendChild(botMessageDiv);
                const contentDiv = botMessageDiv.querySelector('.message-content');
                
                // 处理流式响应
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                let accumulatedContent = '';
                
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    
                    // 处理完整的行
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop(); // 保留不完整的行
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                // 完成，将机器人回复添加到对话历史
                                this.conversationHistory.push({
                                    role: "assistant",
                                    content: accumulatedContent
                                });
                                
                                // 限制对话历史长度，避免过长
                                this.limitConversationHistory();
                                
                                this.scrollToBottom();
                                return;
                            }
                            
                            try {
                                const jsonData = JSON.parse(data);
                                if (jsonData.choices && jsonData.choices[0]) {
                                    const delta = jsonData.choices[0].delta;
                                    if (delta && delta.content) {
                                        accumulatedContent += delta.content;
                                        // 渲染Markdown
                                        contentDiv.innerHTML = DOMPurify.sanitize(marked.parse(accumulatedContent));
                                        this.scrollToBottom();
                                    }
                                }
                            } catch (e) {
                                console.error('解析流数据失败:', e);
                            }
                        }
                    }
                }
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            // 移除加载状态
            if (loadingElement && loadingElement.parentNode) {
                loadingElement.remove();
            }
            this.addErrorMessage('网络错误，请检查服务是否运行: ' + error.message);
            console.error('发送消息失败:', error);
        }
    }
    
    addMessage(content, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        // 如果是用户消息，也支持Markdown渲染
        if (type === 'user') {
            messageDiv.innerHTML = `<div class="message-content">${DOMPurify.sanitize(marked.parse(content))}</div>`;
        } else {
            messageDiv.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
        }
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message loading';
        messageDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        return messageDiv;
    }
    
    addSystemMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.innerHTML = `<div class="message-content">${this.escapeHtml(content)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    addErrorMessage(content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        messageDiv.innerHTML = `<div class="message-content" style="color: red;">错误: ${this.escapeHtml(content)}</div>`;
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    // 限制对话历史长度，避免过长
    limitConversationHistory() {
        const maxHistoryLength = 20; // 最大保留20轮对话（40条消息）
        if (this.conversationHistory.length > maxHistoryLength) {
            // 保留系统消息和最近的对话
            const systemMessage = this.conversationHistory[0];
            const recentMessages = this.conversationHistory.slice(-maxHistoryLength + 1);
            this.conversationHistory = [systemMessage, ...recentMessages];
        }
    }

    clearHistory() {
        // 显示确认对话框
        if (confirm('确定要清除所有聊天记录吗？此操作不可恢复。')) {
            // 清除所有消息，只保留系统欢迎消息
            this.chatMessages.innerHTML = `
                <div class="message system">
                    <div class="message-content">聊天记录已清除。你好！我是AI助手，有什么可以帮助你的吗？</div>
                </div>
            `;
            
            // 重置对话历史
            this.conversationHistory = [
                {
                    role: "system",
                    content: "You are a helpful assistant."
                }
            ];
            
            // 重置对话轮数显示
            this.updateConversationCount();
            
            // 滚动到底部
            this.scrollToBottom();
            
            // 显示清除成功提示
            this.showClearSuccessMessage();
        }
    }
    
    showClearSuccessMessage() {
        // 创建临时成功提示
        const successDiv = document.createElement('div');
        successDiv.className = 'message system clear-success';
        successDiv.innerHTML = '<div class="message-content">✅ 聊天记录已成功清除</div>';
        
        this.chatMessages.appendChild(successDiv);
        this.scrollToBottom();
        
        // 3秒后自动移除成功提示
        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.remove();
            }
        }, 3000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});