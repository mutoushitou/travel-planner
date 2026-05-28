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

    const { trip_id } = await req.json();
    if (!trip_id) {
      return new Response(JSON.stringify({ error: '缺少 trip_id' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 获取原行程
    const { data: originalTrip } = await supabaseClient
      .from('trips')
      .select('*')
      .eq('id', trip_id)
      .eq('user_id', user.id)
      .single();

    if (!originalTrip) {
      return new Response(JSON.stringify({ error: '行程不存在' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 创建副本
    const { data: newTrip, error: createError } = await supabaseClient
      .from('trips')
      .insert({
        user_id: user.id,
        title: `${originalTrip.title}（副本）`,
        destination: originalTrip.destination,
        city_ids: originalTrip.city_ids,
        start_date: originalTrip.start_date,
        end_date: originalTrip.end_date,
        adults: originalTrip.adults,
        children: originalTrip.children,
        budget_level: originalTrip.budget_level,
        preferences: originalTrip.preferences,
        accommodation: originalTrip.accommodation,
        transport: originalTrip.transport,
        special_requirements: originalTrip.special_requirements,
        status: 'draft',
        budget_summary: originalTrip.budget_summary,
      })
      .select()
      .single();

    if (createError || !newTrip) {
      return new Response(JSON.stringify({ error: '创建副本失败' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 复制 trip_days 和子表
    const { data: originalDays } = await supabaseClient
      .from('trip_days')
      .select('*')
      .eq('trip_id', trip_id)
      .order('day_number');

    if (originalDays) {
      for (const day of originalDays) {
        const { data: newDay } = await supabaseClient
          .from('trip_days')
          .insert({
            trip_id: newTrip.id,
            day_number: day.day_number,
            date: day.date,
          })
          .select()
          .single();

        if (!newDay) continue;

        // 复制子表
        const subTables = ['day_attractions', 'day_meals', 'day_transport', 'day_hotels'] as const;
        for (const table of subTables) {
          const { data: items } = await supabaseClient
            .from(table)
            .select('*')
            .eq('day_id', day.id);

          if (items?.length) {
            const inserts = items.map((item: Record<string, unknown>) => {
              const { id, created_at, day_id, ...rest } = item;
              return { ...rest, day_id: newDay.id };
            });
            await supabaseClient.from(table).insert(inserts);
          }
        }
      }
    }

    // 复制版本
    const { data: versions } = await supabaseClient
      .from('trip_versions')
      .select('*')
      .eq('trip_id', trip_id)
      .order('version_number');

    if (versions?.length) {
      await supabaseClient.from('trip_versions').insert(
        versions.map((v: Record<string, unknown>) => ({
          trip_id: newTrip.id,
          version_number: v.version_number,
          full_content: v.full_content,
        }))
      );
    }

    return new Response(
      JSON.stringify({ trip_id: newTrip.id, status: 'draft' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
