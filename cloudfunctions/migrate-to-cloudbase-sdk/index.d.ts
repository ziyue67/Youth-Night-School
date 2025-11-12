
    // 微信上下文接口
    interface WXContext {
      OPENID: string;
      APPID: string;
      UNIONID?: string;
      ENV: string;
    }

    // 操作类型枚举
    type EventAction = 
      | 'getUserInfo'
      | 'databaseOperation'
      | 'modelOperation'
      | 'sqlOperation';

    // 数据库操作数据
    interface DatabaseOperationData {
      [key: string]: any;
    }

    // 模型操作数据
    interface ModelOperationData {
      [key: string]: any;
    }

    // 云函数事件接口
    interface CloudFunctionEvent {
      action: EventAction;
      data?: DatabaseOperationData | ModelOperationData;
    }

    // 云函数返回结果接口
    interface CloudFunctionResult {
      success: boolean;
      data?: any;
      error?: string;
      stack?: string;
    }

    export declare function main(event: CloudFunctionEvent, context: any): Promise<CloudFunctionResult>;
  