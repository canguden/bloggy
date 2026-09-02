import { z } from "zod";

export const addWebsiteSchema = z.object({
  url: z.string().min(3, "Enter a website URL").max(2048),
});

export type AddWebsiteInput = z.infer<typeof addWebsiteSchema>;
