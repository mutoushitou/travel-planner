import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6位"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    email: z.string().email("请输入有效的邮箱地址"),
    password: z.string().min(6, "密码至少6位"),
    confirmPassword: z.string().min(6, "密码至少6位"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  nickname: z.string().max(50, "昵称不能超过50个字符").optional(),
  default_city: z.string().max(100, "城市名过长").optional(),
  preferences: z
    .object({
      travel_style: z.string().optional(),
      budget_level: z.string().optional(),
      interests: z.array(z.string()).optional(),
    })
    .optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const tripFormSchema = z.object({
  title: z.string().min(1, "请输入行程标题").max(100),
  destination: z.string().min(1, "请输入目的地"),
  city_ids: z.array(z.string()).min(1, "请至少选择一个城市"),
  departure_city: z.string().min(1, "请输入出发城市"),
  start_date: z.string().min(1, "请选择开始日期"),
  end_date: z.string().min(1, "请选择结束日期"),
  adults: z.number().min(1, "至少1位成人"),
  children: z.number().min(0),
  budget_level: z.enum(["economy", "comfort", "luxury"]),
  preferences: z.array(z.string()).optional(),
  accommodation: z.string().optional(),
  transport: z.array(z.string()).optional(),
  special_requirements: z.string().optional(),
});

export type TripFormInput = z.infer<typeof tripFormSchema>;
