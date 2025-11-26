#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试脚本：验证公众号文章获取系统
"""

import requests
import json
import time
from datetime import datetime

def test_wechat_articles():
    """测试公众号文章获取功能"""
    
    print("=" * 50)
    print("湖州职业技术学院公众号文章获取系统测试")
    print("=" * 50)
    
    # 测试1: 检查云函数是否可以调用
    print("\n1. 测试云函数调用...")
    try:
        # 这里需要替换为实际的云函数调用地址
        url = "https://your-cloud-function-url.cloud.tencent-func.cn/fetchWechatArticles"
        headers = {
            "Content-Type": "application/json",
            "X-WX-SERVICE": "fetchWechatArticles"
        }
        
        # 测试获取文章列表
        response = requests.post(url, json={"action": "list"}, headers=headers, timeout=30)
        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ 云函数调用成功")
                print(f"   获取到 {len(result.get('data', []))} 篇文章")
            else:
                print("❌ 云函数调用失败:", result.get("message", "未知错误"))
        else:
            print(f"❌ 云函数调用失败，状态码: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 云函数调用异常: {str(e)}")
    
    # 测试2: 测试数据库连接
    print("\n2. 测试数据库连接...")
    try:
        # 这里需要替换为实际的数据库连接信息
        import pymysql
        
        connection = pymysql.connect(
            host='your_database_host',
            user='your_username',
            password='your_password',
            database='your_database_name',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        
        with connection.cursor() as cursor:
            # 检查表是否存在
            cursor.execute("SHOW TABLES LIKE 'wechat_accounts'")
            result = cursor.fetchone()
            if result:
                print("✅ 数据库连接成功")
                print("   wechat_accounts 表存在")
                
                # 检查文章数量
                cursor.execute("SELECT COUNT(*) as count FROM wechat_accounts")
                result = cursor.fetchone()
                print(f"   当前数据库中有 {result['count']} 篇文章")
            else:
                print("❌ wechat_accounts 表不存在")
                
        connection.close()
        
    except Exception as e:
        print(f"❌ 数据库连接失败: {str(e)}")
    
    # 测试3: 测试网页爬取
    print("\n3. 测试网页爬取...")
    try:
        # 湖州职业技术学院公众号文章页面
        url = "https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzA4MTQyNTI2MQ==&scene=124#wechat_redirect"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            print("✅ 网页访问成功")
            print(f"   状态码: {response.status_code}")
            print(f"   内容长度: {len(response.text)} 字符")
            
            # 检查是否包含文章相关内容
            if 'title' in response.text and 'article' in response.text:
                print("   ✅ 页面内容包含文章信息")
            else:
                print("   ⚠️  页面内容可能不包含文章信息")
        else:
            print(f"❌ 网页访问失败，状态码: {response.status_code}")
            
    except Exception as e:
        print(f"❌ 网页爬取异常: {str(e)}")
    
    # 测试4: 检查小程序页面
    print("\n4. 检查小程序页面...")
    
    pages_to_check = [
        "pages/admin/index",
        "pages/news/index",
        "pages/mine/mine"
    ]
    
    for page in pages_to_check:
        files_to_check = [
            f"{page}.js",
            f"{page}.wxml",
            f"{page}.wxss",
            f"{page}.json"
        ]
        
        all_files_exist = True
        for file in files_to_check:
            import os
            if os.path.exists(f"D:\\weix2\\miniprogram\\{file}"):
                print(f"   ✅ {file} 存在")
            else:
                print(f"   ❌ {file} 不存在")
                all_files_exist = False
        
        if all_files_exist:
            print(f"   ✅ {page} 页面文件完整")
        else:
            print(f"   ❌ {page} 页面文件不完整")
    
    # 测试5: 检查云函数文件
    print("\n5. 检查云函数文件...")
    
    cloud_function_files = [
        "index.js",
        "package.json",
        "test.js"
    ]
    
    for file in cloud_function_files:
        import os
        if os.path.exists(f"D:\\weix2\\cloudfunctions\\fetchWechatArticles\\{file}"):
            print(f"   ✅ {file} 存在")
        else:
            print(f"   ❌ {file} 不存在")
    
    print("\n" + "=" * 50)
    print("测试完成")
    print("=" * 50)
    
    # 输出下一步建议
    print("\n下一步建议:")
    print("1. 配置云函数环境变量（数据库连接信息）")
    print("2. 部署云函数到生产环境")
    print("3. 在小程序中测试文章获取功能")
    print("4. 定期检查和维护系统")

if __name__ == "__main__":
    test_wechat_articles()