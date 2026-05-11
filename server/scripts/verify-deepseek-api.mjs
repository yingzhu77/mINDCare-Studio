/**
 * DeepSeek API 独立验证脚本
 * 用法: DEEPSEEK_API_KEY=sk-xxx node verify-deepseek-api.mjs
 *
 * 先独立验证模型 API 能否调用成功，再接入项目。
 */

const API_KEY = process.env.DEEPSEEK_API_KEY || process.argv[2];
if (!API_KEY) {
  console.error('❌ 请提供 API Key: DEEPSEEK_API_KEY=sk-xxx node verify-deepseek-api.mjs');
  process.exit(1);
}

const BASE_URL = 'https://api.deepseek.com';
const MODELS_TO_TRY = ['deepseek-v4-flash', 'deepseek-chat'];

async function testModel(model) {
  console.log(`\n🔍 测试模型: ${model}`);
  console.log('─'.repeat(50));

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: '你是一个帮助验证 API 接入的助手。请用一句中文确认收到请求。',
      },
      {
        role: 'user',
        content: '请用一句中文确认你已成功收到这次 DeepSeek API 测试请求，并告诉我你的模型名称。',
      },
    ],
    stream: false,
  };

  const start = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`  状态码: ${response.status} (${elapsed}s)`);

    const data = await response.json();

    if (!response.ok) {
      console.log(`  ❌ 错误: ${JSON.stringify(data, null, 2)}`);
      return false;
    }

    // 输出关键字段
    console.log(`  ✅ id:             ${data.id}`);
    console.log(`  ✅ model:          ${data.model}`);
    console.log(`  ✅ finish_reason:  ${data.choices?.[0]?.finish_reason}`);
    console.log(`  ✅ content:        ${data.choices?.[0]?.message?.content?.slice(0, 100)}`);
    console.log(`  ✅ usage:          ${JSON.stringify(data.usage)}`);

    return true;
  } catch (err) {
    console.log(`  ❌ 网络错误: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(50));
  console.log('DeepSeek API 最小接入验证');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Key:  ${API_KEY.slice(0, 8)}...${API_KEY.slice(-4)}`);
  console.log('='.repeat(50));

  let anySuccess = false;
  for (const model of MODELS_TO_TRY) {
    const ok = await testModel(model);
    if (ok) anySuccess = true;
  }

  console.log('\n' + '='.repeat(50));
  if (anySuccess) {
    console.log('✅ 至少一个模型调用成功！可将验证通过的配置接入项目。');
  } else {
    console.log('❌ 所有模型调用失败，请检查 API Key / 模型名 / 网络。');
  }
  console.log('='.repeat(50));
}

main().catch(console.error);
