/**
 * @title 桃源谷净化脚本 v3.1 (Safe Deep Clean)
 * @desc 深度清洗所有 CPS 接口，严格避开核心业务（视频/人脸）
 * @version 3.1.0
 */

let body = $response.body;
if (!body) $done({});
let url = $request.url;

// 【关键安全逻辑】
// lxj.taoyuangu.com 域名下不仅有广告 (cpsApi)，还有视频门禁服务 (vdcs_hori)。
// 必须严格限制只清洗 cpsApi 接口，否则视频流地址会被误杀，导致人脸开门黑屏。
if (!url.includes("/cpsApi/")) {
    // console.log("[TyCleaner] 非 CPS 请求，跳过清洗");
    $done({});
}

try {
    let obj = JSON.parse(body);

    // 定义需要清洗的跳转协议
    const jump_schemes = ["alipays://", "weixin://", "alipay://", "openapp.alipay.com"];

    // 深度清洗函数
    function deepClean(data) {
        if (!data) return data;

        if (typeof data === 'object') {
            for (let key in data) {
                let val = data[key];
                
                // 处理嵌套的 JSON 字符串 (例如 jsonStr 字段)
                if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                    try {
                        let nested = JSON.parse(val);
                        nested = deepClean(nested);
                        data[key] = JSON.stringify(nested);
                        continue;
                    } catch (e) { /* not json */ }
                }

                data[key] = deepClean(val);
            }
            return data;
        }

        if (typeof data === 'string') {
            let lower = data.toLowerCase();
            // 检查是否包含跳转协议
            for (let s of jump_schemes) {
                if (lower.includes(s)) {
                    return ""; // 发现跳转链接，清空
                }
            }
        }
        
        return data;
    }

    obj = deepClean(obj);
    body = JSON.stringify(obj);
    // console.log("[TyCleaner] Deep clean finished for CPS API");

} catch (e) {
    console.log("[TyCleaner] Error: " + e.message);
}

$done({ body: body });
