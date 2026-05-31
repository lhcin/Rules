/**
 * @title 桃源谷净化脚本 v2
 * @desc 去除首页微信/支付宝/乐园等 CPS 推广入口
 * @author User
 * @version 2.0
 */

let url = $request.url;
let body = $response.body;

// 提前记录日志
console.log(`[TyCleaner] Intercepted: ${url}`);

// 如果没有 body 或者不是 cpsApi 请求，直接原样返回
if (!body) {
    console.log("[TyCleaner] No body, passthrough");
    $done({});
}

// 只处理 cpsApi 相关请求
if (!url.includes("cpsApi")) {
    console.log("[TyCleaner] Not a cpsApi request, passthrough");
    $done({});
}

// 尝试修改响应
try {
    let obj = JSON.parse(body);

    // 1. 清除明文推广按钮 (微信/支付宝/乐园入口)
    // 接口: /cpsApi/openDoor/queryDoorBtnDataCache
    if (url.includes("queryDoorBtnDataCache")) {
        if (obj.data && obj.data.jsonStr) {
            obj.data.jsonStr = "[]";
            console.log("[TyCleaner] ✅ 已清除 queryDoorBtnDataCache");
        }
    }

    // 2. 清除加密推广按钮
    // 接口: /cpsApi/vdcs/servlet/queryDoorSort
    if (url.includes("queryDoorSort")) {
        if (obj.data) {
            obj.data = "";
            console.log("[TyCleaner] ✅ 已清除 queryDoorSort");
        }
    }

    // 3. 关闭广告开关
    // 接口: /cpsApi/vdcs/servlet/appAdOpenStatus
    if (url.includes("appAdOpenStatus")) {
        if (obj.data) {
            obj.data.openStatus = "1";
            console.log("[TyCleaner] ✅ 已修改 appAdOpenStatus");
        }
    }

    body = JSON.stringify(obj);

} catch (e) {
    console.log(`[TyCleaner] ❌ Error: ${e.message}`);
}

$done({ body: body });
