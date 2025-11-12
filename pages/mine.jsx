
// @ts-ignore;
import React, { useState, useEffect } from 'react';
// @ts-ignore;
import { Button, Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback, AvatarImage, useToast } from '@/components/ui';
// @ts-ignore;
import { User, Settings, LogOut, ChevronRight } from 'lucide-react';

export default function Mine(props) {
  const {
    $w
  } = props;
  const {
    toast
  } = useToast();
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 检查登录状态
  useEffect(() => {
    checkLoginStatus();
  }, []);
  const checkLoginStatus = async () => {
    try {
      // 检查当前用户是否已登录
      if ($w.auth.currentUser) {
        setUserInfo($w.auth.currentUser);
      } else {
        // 尝试从本地存储获取用户信息
        const localUserInfo = localStorage.getItem('userInfo');
        if (localUserInfo) {
          setUserInfo(JSON.parse(localUserInfo));
        }
      }
    } catch (error) {
      console.error('检查登录状态失败:', error);
    }
  };
  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // 首先尝试获取微信用户信息
      let wxUserInfo = null;

      // 在小程序环境中获取用户信息
      if (typeof wx !== 'undefined' && wx.getUserProfile) {
        try {
          const profileRes = await new Promise((resolve, reject) => {
            wx.getUserProfile({
              desc: '用于完善用户资料',
              success: resolve,
              fail: reject
            });
          });
          wxUserInfo = profileRes.userInfo;
        } catch (profileError) {
          console.log('获取用户信息失败，使用默认信息:', profileError);
        }
      }

      // 使用正确的云开发API调用方式
      const result = await $w.cloud.callFunction({
        name: 'login-function',
        data: {
          action: 'login',
          userInfo: wxUserInfo
        }
      });
      console.log('登录结果:', result);

      // 检查返回结果结构
      if (result && result.result && result.result.success) {
        const loginData = result.result.data;

        // 设置用户信息 - 使用云函数返回的完整用户信息
        const newUserInfo = {
          type: 'wechat',
          userId: loginData.openid,
          name: loginData.userInfo.nickName || '微信用户',
          nickName: loginData.userInfo.nickName || '微信用户',
          avatarUrl: loginData.userInfo.avatarUrl || ''
        };
        setUserInfo(newUserInfo);

        // 保存到本地存储
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
        toast({
          title: "登录成功",
          description: loginData.isNewUser ? "欢迎新用户！" : "欢迎回来！"
        });
      } else {
        // 更详细的错误信息
        const errorMsg = result?.result?.error || result?.error || '登录失败';
        console.error('登录返回错误:', result);
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('登录失败详细错误:', error);

      // 根据错误类型提供不同的提示
      let errorMessage = "登录验证失败，请重试";
      if (error.message) {
        if (error.message.includes('openid')) {
          errorMessage = "获取用户标识失败，请重新授权";
        } else if (error.message.includes('network')) {
          errorMessage = "网络连接失败，请检查网络";
        } else {
          errorMessage = error.message;
        }
      }
      toast({
        title: "登录失败",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleLogout = () => {
    setUserInfo(null);
    localStorage.removeItem('userInfo');
    toast({
      title: "已退出登录",
      description: "您已成功退出登录"
    });
  };
  const menuItems = [{
    icon: User,
    label: '个人资料',
    action: () => {}
  }, {
    icon: Settings,
    label: '设置',
    action: () => {}
  }];
  return <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* 头部区域 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 pb-20">
          <h1 className="text-2xl font-bold mb-2">个人中心</h1>
          <p className="text-blue-100">管理您的账户和偏好设置</p>
        </div>

        {/* 用户信息卡片 */}
        <div className="px-4 -mt-12">
          <Card className="shadow-lg">
            <CardContent className="p-6">
              {userInfo ? <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={userInfo.avatarUrl} alt={userInfo.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {userInfo.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {userInfo.nickName || userInfo.name}
                    </h2>
                    <p className="text-gray-500 text-sm">
                      {userInfo.type === 'wechat' ? '微信用户' : '普通用户'}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-1">
                    <LogOut className="w-4 h-4" />
                    <span>退出</span>
                  </Button>
                </div> : <div className="text-center py-8">
                  <Avatar className="w-20 h-20 mx-auto mb-4 bg-gray-100">
                    <AvatarFallback className="bg-gray-100 text-gray-400">
                      <User className="w-10 h-10" />
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    未登录
                  </h3>
                  <p className="text-gray-500 text-sm mb-6">
                    登录后享受更多功能和服务
                  </p>
                  <Button onClick={handleLogin} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                    {isLoading ? '登录中...' : '微信登录'}
                  </Button>
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* 菜单列表 */}
        {userInfo && <div className="px-4 mt-6">
            <Card>
              <CardContent className="p-0">
                {menuItems.map((item, index) => <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={item.action}>
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-900">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>)}
              </CardContent>
            </Card>
          </div>}

        {/* 底部信息 */}
        <div className="px-4 mt-8 pb-8">
          <div className="text-center text-gray-400 text-sm">
            <p>版本 1.0.0</p>
            <p className="mt-1">© 2025 智能制造系统</p>
          </div>
        </div>
      </div>
    </div>;
}
