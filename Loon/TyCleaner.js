/**
 * @title 桃源谷净化脚本 v3.3 (Full Scan)
 * @desc 深度清洗所有子域名的 CPS 推广及跳转链接
 */

let body = $response.body;
if (!body) $done({});

let url = $request.url;
// 打印日志方便调试
console.log(`[TyCleaner] Scanning: ${url}`);

try {
    let obj = JSON.parse(body);

    // 递归清洗函数
    function deepClean(data) {
        if (!data) return data;
        
        // 处理对象和数组
        if (typeof data === 'object') {
            for (let key in data) {
                let val = data[key];
                
                // 1. 处理嵌套的 JSON 字符串 (e.g. jsonStr: "[...]")
                if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                    try {
                        let nested = JSON.parse(val);
                        nested = deepClean(nested); // 递归清洗内部
                        data[key] = JSON.stringify(nested); // 重新序列化回去
                        console.log(`[TyCleaner] Unpacked and cleaned nested JSON at key: ${key}`);
                        continue;
                    } catch (e) {
                        // Ignore parse errors for non-json strings
                    }
                } else {
                    // 2. 递归处理普通对象
                    data[key] = deepClean(val);
                }
            }
            return data;
        }

        // 3. 清洗字符串值 (URL Schemes)
        if (typeof data === 'string') {
            let lower = data.toLowerCase();
            // 拦截跳转协议 (alipays://, weixin://, etc.)
            // 同时也拦截包含 'scheme' 或 'link' 关键字的 http 链接
            if (lower.includes("alipay") || lower.includes("weixin") || lower.includes("scheme")) {
                // 进一步确认它是链接
                if (lower.includes("://") || lower.includes("http") || lower.includes(".com") || lower.includes(".cn")) {
                    console.log(`[TyCleaner] Blocked suspicious link: ${data.substring(0, 50)}...`);
                    return ""; // 清空该链接
                }
            }
        }
        
        return data;
    }

    // 执行全量清洗
    obj = deepClean(obj);
    body = JSON.stringify(obj);

} catch (e) {
    // JSON 解析失败，可能是非 JSON 响应或 GZIP 压缩数据
    // Loon 通常会自动解压，如果这里报错，说明数据格式不支持
    console.log(`[TyCleaner] JSON Parse Error: ${e.message}`);
}

$done({ body: body });
