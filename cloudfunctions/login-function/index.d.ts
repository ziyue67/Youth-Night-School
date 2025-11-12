
    // 微信上下文接口
    interface WXContext {
      OPENID: string;
      APPID: string;
      UNIONID?: string;
      ENV: string;
    }

    // 操作类型枚举
    type EventAction = 
      | 'login'
      | 'getUserInfo'
      | 'updateUserInfo';

    // 用户信息接口
    interface UserInfo {
      nickName?: string;
      avatarUrl?: string;
      gender?: number;
      city?: string;
      province?: string;
      country?: string;
      language?: string;
      [key: string]: any;
    }

    // 更新用户信息数据
    interface UpdateUserInfoData {
      userInfo: UserInfo;
    }

    // 云函数事件接口
    interface CloudFunctionEvent {
      action: EventAction;
      userInfo?: UserInfo;
    }

    // 登录结果数据
    interface LoginResultData {
      openid: string;
      appid: string;
      unionid?: string;
      isNewUser: boolean;
      userInfo: any;
    }

    // 云函数返回结果接口
    interface CloudFunctionResult {
      success: boolean;
      message?: string;
      data?: LoginResultData | any;
      error?: string;
      stack?: string;
    }

    export declare function main(event: CloudFunctionEvent, context: any): Promise<CloudFunctionResult>;
  