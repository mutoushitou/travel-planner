import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripGenerateRequest {
  title: string;
  destination: string;
  departure_city: string;
  city_ids: string[];
  start_date: string;
  end_date: string;
  adults: number;
  children: number;
  budget_level: string;
  preferences: string[];
  accommodation: string;
  transport: string[];
  special_requirements: string;
}

interface AttractionItem {
  name: string;
  category: string;
  description: string;
}

interface GeneratedDayAttraction {
  name: string;
  order_index: number;
  duration: string;
  notes: string;
}

interface GeneratedMeal {
  meal_type: string;
  restaurant_name: string;
  cuisine: string;
  price: number;
  notes: string;
}

interface GeneratedTransport {
  transport_type: string;
  from_location: string;
  to_location: string;
  detail: string;
}

interface GeneratedHotel {
  hotel_name: string;
  star_rating: number;
  price_range: string;
  notes: string;
}

interface GeneratedDay {
  day_number: number;
  date: string;
  theme: string;
  attractions: GeneratedDayAttraction[];
  meals: GeneratedMeal[];
  transport: GeneratedTransport[];
  hotels: GeneratedHotel[];
}

interface GeneratedTrip {
  title: string;
  overview: string;
  days: GeneratedDay[];
  budget_summary: {
    transport: number;
    accommodation: number;
    meals: number;
    tickets: number;
    total: number;
  };
}

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

    const body: TripGenerateRequest = await req.json();

    // 创建 trip 记录，状态为 generating
    const { data: trip, error: tripError } = await supabaseClient
      .from('trips')
      .insert({
        user_id: user.id,
        title: body.title,
        destination: body.destination,
        city_ids: body.city_ids,
        start_date: body.start_date,
        end_date: body.end_date,
        adults: body.adults,
        children: body.children,
        budget_level: body.budget_level,
        preferences: body.preferences,
        accommodation: body.accommodation,
        transport: body.transport,
        special_requirements: body.special_requirements,
        status: 'generating',
      })
      .select()
      .single();

    if (tripError) {
      return new Response(JSON.stringify({ error: '创建行程失败' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 异步生成行程（Edge Function 有 60s 超时限制）
    try {
      // 获取目的地景点
      const { data: attractions } = await supabaseClient
        .from('attractions')
        .select('name, category, description')
        .in('city_id', body.city_ids)
        .order('rating_avg', { ascending: false })
        .limit(30);

      const attractionItems: AttractionItem[] = (attractions ?? []).map(
        (a: Record<string, unknown>) => ({
          name: a.name as string,
          category: a.category as string,
          description: (a.description as string) ?? '',
        })
      );

      const systemPrompt = `你是一个专业的旅游规划师。根据用户提供的出行需求，生成一份详细的每日行程方案。
请严格按照 JSON 格式输出，不要包含任何额外的文字说明。JSON 结构必须包含以下字段：
{ "title": "行程标题", "overview": "概览", "days": [{"day_number":1,"date":"YYYY-MM-DD","theme":"主题","attractions":[{"name":"景点","order_index":1,"duration":"2小时","notes":"贴士"}],"meals":[{"meal_type":"breakfast","restaurant_name":"餐厅","cuisine":"菜系","price":人均价格数字,"notes":"特色"}],"transport":[{"transport_type":"flight","from_location":"出发地","to_location":"目的地","detail":"说明"}],"hotels":[{"hotel_name":"酒店","star_rating":4,"price_range":"300-500元","notes":"推荐原因"}]}], "budget_summary": {"transport":0,"accommodation":0,"meals":0,"tickets":0,"total":0} }
方案需合理可行，景点顺序按地理邻近排列，餐饮时间合理，每天2-4个景点。所有价格以人民币元为单位。`;

      const days = Math.ceil(
        (new Date(body.end_date).getTime() - new Date(body.start_date).getTime()) / 86400000
      ) + 1;

      const attractionsText = attractionItems
        .map((a, i) => `${i + 1}. ${a.name}（${a.category}）- ${a.description || ''}`)
        .join('\n');

      const userPrompt = `请为以下出行需求生成旅游行程：
出发城市：${body.departure_city}
目的地：${body.destination}
出行日期：${body.start_date} 至 ${body.end_date}（共${days}天）
人数：${body.adults}位成人${body.children > 0 ? `，${body.children}位儿童` : ''}
预算等级：${body.budget_level === 'economy' ? '经济实惠' : body.budget_level === 'luxury' ? '豪华体验' : '舒适标准'}
兴趣偏好：${body.preferences.length > 0 ? body.preferences.join('、') : '无特殊偏好'}
住宿偏好：${body.accommodation || '无特殊要求'}
特殊需求：${body.special_requirements || '无'}
目的地景点：\n${attractionsText || '暂无景点数据'}
请生成一份完整详细的${days}天行程方案。`;

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
        }),
      });

      if (!deepseekResponse.ok) {
        throw new Error(`Deepseek API error: ${deepseekResponse.status}`);
      }

      const deepseekData = await deepseekResponse.json();
      let content = deepseekData.choices[0].message.content;

      // 提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析 AI 返回的 JSON');
      }

      const generated: GeneratedTrip = JSON.parse(jsonMatch[0]);

      // 写入 trip_days 和子表
      for (const day of generated.days) {
        const { data: tripDay, error: dayError } = await supabaseClient
          .from('trip_days')
          .insert({
            trip_id: trip.id,
            day_number: day.day_number,
            date: day.date,
          })
          .select()
          .single();

        if (dayError || !tripDay) continue;

        // 景点
        if (day.attractions?.length) {
          await supabaseClient.from('day_attractions').insert(
            day.attractions.map((a) => ({
              day_id: tripDay.id,
              attraction_id: '00000000-0000-0000-0000-000000000000', // placeholder
              order_index: a.order_index || 0,
              duration: a.duration,
              notes: a.name + (a.notes ? ` - ${a.notes}` : ''),
            }))
          );
        }

        // 餐饮
        if (day.meals?.length) {
          await supabaseClient.from('day_meals').insert(
            day.meals.map((m) => ({
              day_id: tripDay.id,
              meal_type: m.meal_type,
              restaurant_name: m.restaurant_name,
              cuisine: m.cuisine,
              price: m.price,
              notes: m.notes,
            }))
          );
        }

        // 交通
        if (day.transport?.length) {
          await supabaseClient.from('day_transport').insert(
            day.transport.map((t) => ({
              day_id: tripDay.id,
              transport_type: t.transport_type,
              from_location: t.from_location,
              to_location: t.to_location,
              detail: t.detail,
            }))
          );
        }

        // 住宿
        if (day.hotels?.length) {
          await supabaseClient.from('day_hotels').insert(
            day.hotels.map((h) => ({
              day_id: tripDay.id,
              hotel_name: h.hotel_name,
              star_rating: h.star_rating,
              price_range: h.price_range,
              notes: h.notes,
            }))
          );
        }
      }

      // 更新 trip 状态
      await supabaseClient
        .from('trips')
        .update({
          status: 'generated',
          budget_summary: generated.budget_summary as unknown as Record<string, unknown>,
        })
        .eq('id', trip.id);

      // 保存版本
      await supabaseClient.from('trip_versions').insert({
        trip_id: trip.id,
        version_number: 1,
        full_content: generated as unknown as Record<string, unknown>,
      });

      return new Response(
        JSON.stringify({ trip_id: trip.id, status: 'generated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (genError) {
      // 生成失败，重置为 draft
      await supabaseClient
        .from('trips')
        .update({ status: 'draft' })
        .eq('id', trip.id);

      return new Response(
        JSON.stringify({
          trip_id: trip.id,
          status: 'draft',
          error: '行程生成失败，请重试',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
