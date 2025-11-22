// 微信小程序 @cloudbase/js-sdk 适配器配置
import cloudbase from '@cloudbase/js-sdk';
import adapter from '@cloudbase/adapter-wx_mp';

// 自定义事件总线（可选）
const EventBus = {
    $emit: (event, data) => {
        // 微信小程序事件处理
        if (wx && wx.triggerEvent) {
            wx.triggerEvent(event, data);
        }
    },
    $on: (event, callback) => {
        // 微信小程序事件监听
        if (wx && wx.on) {
            wx.on(event, callback);
        }
    },
    $once: (event, callback) => {
        // 微信小程序一次性事件监听
        if (wx && wx.once) {
            wx.once(event, callback);
        }
    },
    $off: (event, callback) => {
        // 微信小程序事件取消监听
        if (wx && wx.off) {
            wx.off(event, callback);
        }
    }
};

// 使用微信小程序适配器
cloudbase.useAdapters(adapter, { EventBus });

// 初始化云开发
const app = cloudbase.init({
    env: process.env.CLOUD_ENV_ID || 'cloud1-9go506hg40673425', // 使用环境变量或默认值
    region: 'ap-shanghai', // 可选：指定区域
    timeout: 5000, // 可选：超时时间
    persistence: 'local' // 可选：本地存储
});

// 导出配置好的应用实例
export default app;

// 导出常用工具
export const auth = app.auth();
export const db = app.database();
export const storage = app.storage();