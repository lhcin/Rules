/**
 * @title 桃源谷净化脚本
 * @desc 去除首页微信/支付宝/乐园等 CPS 推广入口
 * @author User
 * @date 2026-05-31
 */

let body = $response.body;
if (!body) $done({});
let url = $request.url;

// 仅处理包含 cpsApi 路径的请求，避免误伤正常开门功能
if (!url.includes("cpsApi")) {
    $done({});
}

try {
    let obj = JSON.parse(body);

    // 1. 清除明文推广按钮 (微信/支付宝/乐园入口)
    // 接口: /cpsApi/openDoor/queryDoorBtnDataCache
    // 数据结构: {"data":{"jsonStr":"[...]"}}
    if (url.includes("queryDoorBtnDataCache")) {
        if (obj.data && obj.data.jsonStr) {
            // 返回空数组，App 会认为没有推广按钮，显示空白
            obj.data.jsonStr = "[]";
            console.log("[TyCleaner] 已拦截 queryDoorBtnDataCache (Removed CPS buttons)");
        }
    }

    // 2. 清除加密推广按钮 (备用入口)
    // 接口: /cpsApi/vdcs/servlet/queryDoorSort
    // 数据结构: {"code":0,"data":"Base64..."}
    if (url.includes("queryDoorSort")) {
        if (obj.data) {
            // 清空加密数据
            obj.data = "";
            console.log("[TyCleaner] 已拦截 queryDoorSort (Removed encrypted buttons)");
        }
    }

    // 3. 强制关闭广告开关
    // 接口: /cpsApi/vdcs/servlet/appAdOpenStatus
    // 数据结构: {"data":{"openStatus":"0"}}
    if (url.includes("appAdOpenStatus")) {
        if (obj.data) {
            // 1 通常代表关闭/开启 (视 App 定义而定，尝试反转或置空)
            obj.data.openStatus = "1"; 
            console.log("[TyCleaner] 已尝试修改广告开关状态");
        }
    }

    // 重新序列化并返回修改后的响应
    body = JSON.stringify(obj);

} catch (e) {
    // JSON 解析失败或其他错误，保持原样放行，不影响 App 正常运行
    console.log("[TyCleaner] Error: " + e.message);
}

$done({ body: body });
