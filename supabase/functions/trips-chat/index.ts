import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: '未授权' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { trip_id, message } = await req.json();
    if (!trip_id || !message) {
      return new Response(JSON.stringify({ error: '缺少必要参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 获取 trip 数据
    const { data: trip } = await supabaseClient
      .from('trips')
      .select('*')
      .eq('id', trip_id)
      .eq('user_id', user.id)
      .single();

    if (!trip) {
      return new Response(JSON.stringify({ error: '行程不存在' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 获取 trip versions
    const { data: versions } = await supabaseClient
      .from('trip_versions')
      .select('*')
      .eq('trip_id', trip_id)
      .order('version_number', { ascending: false })
      .limit(1);

    const currentVersion = versions?.[0];
    const currentContent = currentVersion?.full_content
      ? JSON.stringify(currentVersion.full_content)
      : '{}';

    const systemPrompt = `你是一个专业的旅游规划助手。根据用户的修改意见调整行程。
当前行程的 JSON 数据已提供。请根据用户需求输出更新后的完整行程 JSON。
格式必须与原始 JSON 结构完全一致，不要包含任何额外文字。
保持行程的合理性和可行性。`;

    const userPrompt = `当前行程数据：\n${currentContent}\n\n用户修改需求：\n${message}\n\n请输出修改后的完整行程 JSON。`;

    const deepseekResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('DEEPSEEK_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        stream: true,
      }),
    });

    if (!deepseekResponse.ok) {
      return new Response(JSON.stringify({ error: 'AI 请求失败' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 创建 ReadableStream 转发 SSE
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = deepseekResponse.body!.getReader();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // 保存新版本
                const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  try {
                    const parsed = JSON.parse(jsonMatch[0]);
                    const newVersion = (currentVersion?.version_number ?? 0) + 1;
                    await supabaseClient.from('trip_versions').insert({
                      trip_id,
                      version_number: newVersion,
                      full_content: parsed,
                    });
                    await supabaseClient
                      .from('trips')
                      .update({ updated_at: new Date().toISOString() })
                      .eq('id', trip_id);
                  } catch {
                    // JSON parse failed, skip save
                  }
                }
                await writer.write(encoder.encode('data: [DONE]\n\n'));
                break;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content || '';
                fullContent += content;
                await writer.write(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              } catch {
                // skip unparseable chunks
              }
            }
          }
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
